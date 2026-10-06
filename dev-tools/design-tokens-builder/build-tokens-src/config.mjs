/// <reference types="node" />
/*
  build-tokens-src/config.mjs
  Legge il flag --config da argv, importa il file di configurazione del progetto,
  risolve tutti i percorsi e li esporta per build-tokens.mjs.

  Tenere questa logica separata dal punto di ingresso ne facilita il test
  e il riutilizzo in altri script.
*/

/* globals process */

import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { splitSourceEntries } from './source-prefixes.mjs';

// ---------------------------------------------------------------------------
// Legge il flag --config
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const configFlagIndex = args.indexOf('--config');

if (configFlagIndex === -1 || !args[configFlagIndex + 1]) {
  // eslint-disable-next-line no-console
  console.error(
    'Error: you must specify the config file with --config ./path/to/config/file'
  );
  process.exit(1);
}

const configArgPath = args[configFlagIndex + 1];
export const configAbsPath = path.resolve(process.cwd(), configArgPath);
export const configDir     = path.dirname(configAbsPath);

// ---------------------------------------------------------------------------
// Importa la config del progetto
// ---------------------------------------------------------------------------
const buildConfig = (await import(pathToFileURL(configAbsPath).href)).default;

// Helper: risolve un percorso relativo alla directory della config.
// Lascia invariati i percorsi già assoluti.
/** @param {string} p */
const resolveFromConfig = (p) => path.resolve(configDir, p);

// ---------------------------------------------------------------------------
// Risoluzione dei percorsi
// ---------------------------------------------------------------------------

// Output CSS
export const buildPath = resolveFromConfig(buildConfig.buildPath);
export const destFile  = buildConfig.destFile;

// Stylelint
export const stylelintConfigPath = resolveFromConfig(buildConfig.stylelintConfigPath);

// JSON — la platform è attiva solo se jsonBuildPath è impostato nella config
const jsonBuildPathRaw = buildConfig.jsonBuildPath ?? null;
export const jsonBuildPath = jsonBuildPathRaw ? resolveFromConfig(jsonBuildPathRaw) : null;

/*
  jsonDestFile: nome base (senza estensione) del file aggregato di output.
  null  → un file per sorgente (replica la struttura dei sorgenti)
  string → singolo file aggregato (ad es. 'tokens' → 'tokens.jsonc')
  L'estensione viene aggiunta automaticamente in base a jsonFormat.
*/
export const jsonDestFile = buildConfig.jsonDestFile ?? null;

/*
  jsonFormat: controlla il formato di output dei file JSON dei token generati.
  'jsonc' → estensione .jsonc + intestazione che segnala il file generato
  'json'  → .json semplice, senza intestazione
  Qualsiasi valore diverso da 'jsonc' viene normalizzato a 'json'.
*/
export const jsonFormat = buildConfig.jsonFormat === 'jsonc' ? 'jsonc' : 'json';

/*
  jsonExpression: controlla come vengono gestite le espressioni matematiche nei valori dei token dimension.
    'keep'    (default) — scrive l'espressione così com'è
    'calc'    — la racchiude in calc() CSS
    'resolve' — la valuta numericamente; unità ereditata dal primo token referenziato
*/
const VALID_EXPR_MODES = ['keep', 'calc', 'resolve'];
export const jsonExpression = VALID_EXPR_MODES.includes(buildConfig.jsonExpression)
  ? buildConfig.jsonExpression
  : 'resolve';

/*
  pxToRem: se true (default), i valori dei token dimension espressi in px vengono
  convertiti in rem nel CSS generato (vedi la transform size/pxToRem-smart
  in build-tokens-src/transforms.mjs). I valori in altre unità
  (em, %, vh, dvw, ...) non vengono mai toccati, indipendentemente da questa opzione.
*/
export const pxToRem = buildConfig.pxToRem !== false;

/*
  mergeCustomProps: se true, le custom properties già presenti nel file CSS di
  destinazione hanno priorità su quelle generate da questa build (vedi
  build-tokens-src/merge-css.mjs). Può essere anche un array di stringhe/RegExp:
  vengono unite solo le proprietà generate dai file token sorgente che corrispondono a una
  delle sue voci. Un array vuoto o non valido equivale a false. false esplicito
  disattiva del tutto il merge (il file di destinazione viene rigenerato completamente).
  Default: true (cioè quando la chiave non è impostata).
*/
/** @type {boolean|(string|RegExp)[]} */
export const mergeCustomProps = (() => {
  const value = buildConfig.mergeCustomProps;
  if (value === undefined) return true;
  if (value === true) return true;
  if (Array.isArray(value)) {
    const entries = value.filter((entry) => typeof entry === 'string' || entry instanceof RegExp);
    return entries.length ? entries : false;
  }
  return false;
})();

/*
  addLayer: racchiude le custom properties generate in una at-rule CSS `@layer`
  (vedi formats/css.mjs), ad es. `@layer project { :root { ... } }`.
  Impostare a null, undefined o false (default) per non emettere alcun layer.
*/
export const addLayer = buildConfig.addLayer ? String(buildConfig.addLayer).trim() : null;

/*
  customPropsSelector: selettore CSS che racchiude i blocchi di custom properties
  generati (vedi formats/css.mjs buildCssBlock()), al posto del default
  `:root`. Si applica in modo uniforme a una build a sorgente singola e a una build
  con sourceModes (il blocco di primo livello della modalità base e il blocco di ogni altra modalità,
  annidato nella propria regola `@media (prefers-color-scheme: <modalità>)`, usano
  lo stesso selettore). Valori falsy o vuoti ripiegano su ':root'.
*/
export const customPropsSelector = typeof buildConfig.customPropsSelector === 'string'
  && buildConfig.customPropsSelector.trim()
  ? buildConfig.customPropsSelector.trim()
  : ':root';

/*
  useLightDarkFunc: con sourceModes impostato (vedi sotto) e che definisce sia una
  chiave `light` sia una `dark`, le custom properties presenti in entrambe vengono scritte
  una sola volta come `--name: light-dark(<light>, <dark>);` invece di essere divise
  tra il blocco della modalità base e una regola
  `@media (prefers-color-scheme: dark) { ... }` (vedi light-dark.mjs).
  Ignorata quando sourceModes non è impostato o non definisce sia una modalità light sia una
  dark. Default: true.
*/
export const useLightDarkFunc = buildConfig.useLightDarkFunc !== false;

/*
  customPropsGroups: le custom properties il cui primo segmento del nome (separato
  da trattini) corrisponde a uno dei prefissi di un gruppo vengono estratte, etichettate con
  il nome del gruppo e spostate all'inizio del file CSS generato, nell'ordine
  dell'elenco dei gruppi (vedi formats/css.mjs). Ogni voce: { name, prefixes }.
  Default: [].
*/
export const customPropsGroups = Array.isArray(buildConfig.customPropsGroups)
  ? buildConfig.customPropsGroups
  : [];

/*
  ---------------------------------------------------------------------------
  Source: risolve i pattern relativi alla directory della config e li normalizza in
  percorsi assoluti con forward slash (fast-glob, usato internamente da Style Dictionary,
  richiede i forward slash anche su Windows). Vedi resolve-source-paths.mjs.

  ATTENZIONE: nel file di configurazione del progetto, evitare di costruire i pattern glob con
  path.join() — può corrompere la sintassi del pattern. Usare i template literal:
    OK:  `${minimo_path}/**\/*.{json,mjs}`
    NO:  path.join(minimo_path, '/**\/*.{json,mjs}')

  sourceModes: alternativa a `source`, per una suddivisione light/dark (o altra) delle
  custom properties — vedi build-tokens-src/build-source-modes.mjs. Quando è impostato
  (buildConfig.sourceModes è un oggetto non null), `source` viene ignorato e
  l'array di pattern sorgente di ogni modalità viene risolto allo stesso modo.

  Le voci di `source` / di ogni modalità possono essere anche oggetti `{ src, prefix, transform }`,
  per rendere le custom properties di quei file con un prefisso
  (vedi source-prefixes.mjs) e/o per rinominare i nodi dei token al loro interno
  (vedi source-transforms.mjs). Qui vengono appiattite in semplici pattern
  per Style Dictionary; quelle con prefisso/transform vengono raccolte anche in
  `prefixedSources`/`transformedSources`, da registrare in
  build-tokens.mjs.
  ---------------------------------------------------------------------------
*/
const sourceModesRaw = buildConfig.sourceModes ?? null;

/** @type {import('./source-prefixes.mjs').PrefixedSource[]} */
export const prefixedSources = [];

/** @type {import('./source-prefixes.mjs').TransformedSource[]} */
export const transformedSources = [];

/**
 * @param {Parameters<typeof splitSourceEntries>[0]} entries
 * @returns {string[]}
 */
const parseSourceEntries = (entries) => {
  const { patterns, prefixed, transformed } = splitSourceEntries(entries, configDir);
  prefixedSources.push(...prefixed);
  transformedSources.push(...transformed);
  return patterns;
};

export const sourceModes = sourceModesRaw
  ? Object.fromEntries(
    Object.entries(sourceModesRaw).map(([mode, modeSource]) => [
      mode,
      parseSourceEntries(modeSource),
    ])
  )
  : null;

/*
  sourceModesBase: la modalità le cui dichiarazioni vengono scritte nel blocco
  `:root { ... }` di primo livello (le altre sono annidate in
  `@media (prefers-color-scheme: <modalità>) { ... }`). Default: la prima chiave
  di sourceModes (ordine di inserimento), ad es. 'light'. Ignorata quando sourceModes
  non è impostato.
*/
export const sourceModesBase = sourceModes
  ? (Object.prototype.hasOwnProperty.call(sourceModes, buildConfig.sourceModesBase)
    ? buildConfig.sourceModesBase
    : Object.keys(sourceModes)[0])
  : null;

if (sourceModes && buildConfig.sourceModesBase && sourceModesBase !== buildConfig.sourceModesBase) {
  // eslint-disable-next-line no-console
  console.warn(
    `[build-tokens] config: sourceModesBase "${buildConfig.sourceModesBase}" is not a key of sourceModes — falling back to "${sourceModesBase}"`
  );
}

export const source = sourceModes ? null : parseSourceEntries(buildConfig.source);
