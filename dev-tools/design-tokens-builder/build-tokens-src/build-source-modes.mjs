/*
  build-tokens-src/build-source-modes.mjs
  Percorso di build alternativo usato quando la config del progetto imposta `sourceModes`
  (vedi config.mjs) al posto di un singolo array `source` — tipicamente per una
  suddivisione light/dark delle custom properties.

  Per ogni modalità viene costruita un'istanza separata di StyleDictionary a partire
  dall'array `source` di quella modalità. I blocchi CSS generati `<selector> { ... }`
  (selector: customPropsSelector, default ':root' — vedi config.mjs) vengono poi
  composti in un unico destFile:
    - il blocco della modalità base resta una semplice regola `<selector> { ... }`, con
      una dichiarazione `color-scheme: <tutte le modalità unite>;` anteposta (ad es.
      "light dark")
    - il blocco di ogni altra modalità viene racchiuso in
      `@media (prefers-color-scheme: <modalità>) { <selector> { ... } }`, con una
      dichiarazione `color-scheme: <modalità>;` anteposta
  customPropsGroups, mergeCustomProps e pxToRem si applicano per modalità, esattamente come
  nella build a sorgente singola. addLayer (se impostato) racchiude l'intero risultato
  composto in un unico `@layer`, anziché uno per modalità.

  Quando sourceModes definisce sia una chiave `light` sia una `dark` e
  useLightDarkFunc è true (default), le custom properties condivise da entrambe vengono
  riconciliate in un'unica dichiarazione `light-dark()` invece di essere divise
  tra il blocco base e una regola `@media (prefers-color-scheme: dark)` —
  vedi light-dark.mjs.

  I token JSON (se jsonBuildPath è impostato) vengono prodotti per modalità: un set di
  file per modalità, con `-<modalità>` aggiunto a ogni nome di file (vedi
  buildJsonFiles() in formats/json.mjs), ad es. "tokens-light.jsonc" /
  "tokens-dark.jsonc", oppure "size-light.jsonc" / "size-dark.jsonc" in
  modalità multi-file (jsonDestFile: null).
*/

import StyleDictionary from 'style-dictionary';
import * as path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { CSS_TRANSFORMS, JSON_TRANSFORMS } from './platforms.mjs';
import { customPropsCount, lastFinalProps } from './formats/css.mjs';
import { buildJsonFiles, collectConcreteFilePaths } from './formats/json.mjs';
import { loadExistingCustomPropsScoped } from './merge-css.mjs';
import { applyLightDarkFunc } from './light-dark.mjs';

/**
 * @param {object}                 opts
 * @param {Record<string,string[]>} opts.sourceModes    Percorsi sorgente risolti per modalità (vedi config.mjs)
 * @param {string}                 opts.baseMode        Modalità il cui blocco resta una regola `<selector> { ... }` di primo livello
 * @param {string}                 opts.buildPath        Percorso assoluto della directory di output CSS
 * @param {string}                 opts.destFile         Nome del file CSS di output
 * @param {string|null}            opts.jsonBuildPath    Percorso assoluto dell'output JSON (null = disattivato)
 * @param {string|null}            opts.jsonDestFile     Nome base del file JSON aggregato; null = un file per sorgente
 * @param {'json'|'jsonc'}         opts.jsonFormat        Formato di output dei file JSON
 * @param {'keep'|'calc'|'resolve'} opts.jsonExpression   Come gestire le espressioni matematiche nei token dimension
 * @param {{name:string,prefixes:string[]}[]} opts.customPropsGroups
 * @param {boolean}                opts.pxToRem
 * @param {string|null}            opts.addLayer
 * @param {boolean|(string|RegExp)[]} opts.mergeCustomProps  true = unisce tutte le sorgenti, array = solo i file token sorgente corrispondenti
 * @param {boolean}                opts.useLightDarkFunc  riconcilia le proprietà `light`/`dark` condivise in chiamate `light-dark()` (default: true — vedi config.mjs e light-dark.mjs). Ignorato a meno che sourceModes definisca sia una chiave `light` sia una `dark`.
 * @param {string}                 opts.customPropsSelector  selettore CSS che racchiude i blocchi generati (default: ':root' — vedi config.mjs)
 * @param {string[]}               opts.parserNames  nomi dei parser di Style Dictionary a cui far aderire ogni istanza (bridge legacy, più il parser di rinomina dei token quando almeno una sorgente ha un `transform` — vedi build-tokens.mjs)
 * @param {string[]}               opts.preprocessorNames  nomi dei preprocessor di Style Dictionary a cui far aderire ogni istanza (il riscrittore dei riferimenti di rinomina dei token, quando almeno una sorgente ha un `transform` — vedi build-tokens.mjs)
 * @returns {Promise<{cssDestPath: string, totalCustomProps: number, jsonFilesByMode: Record<string, object[]>}>}
 */
export const buildSourceModes = async ({
  sourceModes,
  baseMode,
  buildPath,
  destFile,
  jsonBuildPath,
  jsonDestFile,
  jsonFormat,
  jsonExpression,
  customPropsGroups,
  pxToRem,
  addLayer,
  mergeCustomProps,
  useLightDarkFunc,
  customPropsSelector,
  parserNames,
  preprocessorNames,
}) => {
  const modeNames = Object.keys(sourceModes);

  // Legge il destFile preesistente (se c'è) PRIMA che venga eseguita qualsiasi istanza
  // di Style Dictionary, dato che la prima a scrivere lo sovrascriverebbe.
  if (mergeCustomProps) {
    loadExistingCustomPropsScoped(path.join(buildPath, destFile), baseMode, mergeCustomProps, customPropsSelector);
  }

  const cssTransforms = pxToRem
    ? CSS_TRANSFORMS
    : CSS_TRANSFORMS.filter((name) => name !== 'size/pxToRem-smart');

  /** @type {Record<string,string>} */
  const modeBlocks = {};
  /*
    Conteggio delle custom props per modalità e mappa strutturata delle props (nome -> coda),
    catturati subito dopo ogni chiamata al format per modalità (customPropsCount e
    lastFinalProps sono live binding, aggiornati in modo sincrono dalla funzione
    format — vedi formats/css.mjs). Conservati per modalità (invece di sommarli
    al volo) così che applyLightDarkFunc() possa poi sovrascrivere solo le voci che
    tocca davvero (light, dark e la modalità base).
  */
  /** @type {Record<string,number>} */
  const modeCounts = {};
  /** @type {Record<string, Record<string,string>>} */
  const modeFinalProps = {};
  /** @type {Record<string, object[]>} */
  const jsonFilesByMode = {};

  for (const mode of modeNames) {
    /*
      Le modalità non base possono referenziare i token della modalità base (sempre definiti, dato che
      il blocco base è il `<selector>` di primo livello incondizionato). Le sorgenti
      base vengono passate come `include`: disponibili per la risoluzione dei riferimenti
      ma contrassegnate isSource: false, e saltate dai format css/json.
      Solo la modalità base, volutamente: un riferimento a un token che esiste solo in
      un altro blocco `@media` verrebbe compilato senza errori ma risulterebbe non definito a runtime.
    */
    const include = mode === baseMode ? [] : sourceModes[baseMode];

    const sd = new StyleDictionary({
      include,
      source: sourceModes[mode],
      parsers: parserNames,
      preprocessors: preprocessorNames,
      log: { verbosity: 'verbose' },
      platforms: {
        css: {
          transforms: cssTransforms,
          files: [
            {
              destination: destFile,
              format: 'css/variables-sorted',
              options: {
                outputReferences: true,
                selector: customPropsSelector,
                customPropsGroups,
                mode,
                colorScheme: mode === baseMode ? modeNames.join(' ') : mode,
              },
            },
          ],
        },
      },
    });

    // formatPlatform() esegue la funzione format senza scrivere su disco —
    // il file composto multi-modalità viene scritto una sola volta, alla fine, qui sotto.
    const [formatted] = await sd.formatPlatform('css');
    modeBlocks[mode] = /** @type {string} */ (formatted.output);
    // customPropsCount / lastFinalProps sono live binding, aggiornati in modo
    // sincrono dalla funzione format chiamata qui sopra (vedi formats/css.mjs).
    modeCounts[mode] = customPropsCount;
    modeFinalProps[mode] = lastFinalProps;

    if (jsonBuildPath) {
      const concreteFilePaths = jsonDestFile ? [] : await collectConcreteFilePaths(sd);
      const files = buildJsonFiles(concreteFilePaths, jsonDestFile, jsonFormat, jsonExpression, `-${mode}`);

      const jsonSd = new StyleDictionary({
        include,
        source: sourceModes[mode],
        parsers: parserNames,
        preprocessors: preprocessorNames,
        log: { verbosity: 'silent' },
        platforms: {
          json: {
            buildPath: jsonBuildPath + '/',
            transforms: JSON_TRANSFORMS,
            files,
          },
        },
      });
      await jsonSd.buildAllPlatforms();
      jsonFilesByMode[mode] = files;
    }
  }

  // ── Riconciliazione light-dark() (solo modalità light/dark) ──────────────────
  /*
    Ricostruisce solo i blocchi `light`, `dark` e della modalità base a partire dalle mappe
    di props modificate — vedi light-dark.mjs. Non fa nulla (restituisce null) a meno che sourceModes
    definisca sia una chiave `light` sia una `dark`.
  */
  if (useLightDarkFunc) {
    const reconciled = applyLightDarkFunc({
      modeFinalProps,
      modeNames,
      baseMode,
      selector: customPropsSelector,
      customPropsGroups,
    });
    if (reconciled) {
      Object.assign(modeBlocks, reconciled.blocks);
      Object.assign(modeCounts, reconciled.counts);
    }
  }

  const totalCustomProps = Object.values(modeCounts).reduce((sum, n) => sum + n, 0);

  // ── Composizione del CSS finale ────────────────────────────────────────────────
  /*
    Una modalità rimasta senza alcuna custom property — tipicamente una modalità `light`/`dark`
    completamente assorbita da applyLightDarkFunc() nelle dichiarazioni light-dark()
    della modalità base — non ottiene alcun blocco `@media`, invece di
    un blocco vuoto (ma innocuo).
  */
  const otherModes = modeNames.filter((mode) => mode !== baseMode && modeCounts[mode] > 0);

  let composed = modeBlocks[baseMode];
  for (const mode of otherModes) {
    composed += `\n@media (prefers-color-scheme: ${mode}) {\n${modeBlocks[mode]}}\n`;
  }

  /*
    addLayer racchiude l'intero risultato composto una sola volta, anziché una volta per
    modalità. L'indentazione è lasciata al passaggio di fix di stylelint (eseguito subito dopo la
    build), come nella build a sorgente singola.
  */
  const finalCss = addLayer
    ? `@layer ${addLayer} {\n\n${composed}}\n`
    : composed;

  await mkdir(buildPath, { recursive: true });
  const cssDestPath = path.join(buildPath, destFile);
  await writeFile(cssDestPath, finalCss);

  return { cssDestPath, totalCustomProps, jsonFilesByMode };
};
