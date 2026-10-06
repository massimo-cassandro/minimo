#!/usr/bin/env node
/// <reference types="node" />
/* eslint-disable no-console */

/*
  build-tokens.mjs
  Entry point: importa i moduli, esegue la build, esegue il lint dell'output CSS, stampa il log.

    Struttura del progetto:
      build-tokens.mjs              <- questo file
      build-tokens-src/config.mjs   <- legge il flag --config e risolve tutti i percorsi
      build-tokens-src/transforms.mjs  <- registra le transform personalizzate di Style Dictionary
      build-tokens-src/formats/css.mjs    <- registra il format css/variables-sorted
      build-tokens-src/formats/json.mjs   <- registra il format json/tokens, esporta gli helper
      build-tokens-src/platforms.mjs      <- costruisce l'oggetto platforms (css + json opzionale)
      build-tokens-src/build-source-modes.mjs  <- percorso di build alternativo usato quando sourceModes è impostato
      build-tokens-src/merge-css.mjs      <- supporta l'opzione mergeCustomProps (flat e per modalità)
      build-tokens-src/source-prefixes.mjs <- supporta le voci `{ src, prefix }` in source/sourceModes
      build-tokens-src/source-transforms.mjs <- supporta le voci `{ src, transform }` in source/sourceModes
      build-tokens-src/token-rename-parser.mjs <- parser che applica le mappe di rinomina `transform`
*/

import StyleDictionary from 'style-dictionary';
import * as path from 'node:path';
import { styleText } from 'node:util';
import { homedir } from 'node:os';
import stylelint from 'stylelint';
import { pathToFileURL } from 'node:url';

// ── 1. Configurazione (argomenti + percorsi risolti) ────────────────────────
import {
  configAbsPath,
  buildPath,
  destFile,
  stylelintConfigPath,
  jsonBuildPath,
  jsonDestFile,
  jsonFormat,
  jsonExpression,
  source,
  sourceModes,
  sourceModesBase,
  prefixedSources,
  transformedSources,
  mergeCustomProps,
  customPropsGroups,
  pxToRem,
  addLayer,
  useLightDarkFunc,
  customPropsSelector,
} from './build-tokens-src/config.mjs';

// ── 2. Transform personalizzate ──────────────────────────────────────────────
import './build-tokens-src/transforms.mjs';

// ── 2b. Bridge per la sintassi legacy dei token ──────────────────────────────
// Converte i file sorgente .json/.jsonc legacy (non DTCG, ad es. Open Props) alla
// sintassi DTCG v5 in fase di parsing — vedi build-tokens-src/legacy-tokens-parser.mjs.
import { LEGACY_TOKENS_PARSER_NAME, registerLegacyTokensParser } from './build-tokens-src/legacy-tokens-parser.mjs';
registerLegacyTokensParser();

// ── 2c. Prefissi delle custom properties per sorgente ────────────────────────
/*
  Espande le voci `{ src, prefix }` di source/sourceModes nella mappa file ->
  prefisso letta dalla transform name/kebab-prefixed (richiede il parser legacy
  qui sopra, per caricare le sorgenti .json legacy) — vedi source-prefixes.mjs.
*/
import { registerSourcePrefixes } from './build-tokens-src/source-prefixes.mjs';
await registerSourcePrefixes(prefixedSources);

// ── 2d. Mappe di rinomina dei token per sorgente ─────────────────────────────
/*
  Espande le voci `{ src, transform }` di source/sourceModes nella mappa
  file -> rinomina letta dal parser di rinomina dei token, e registra quel
  parser (solo se almeno un file ha effettivamente una transform) — vedi
  source-transforms.mjs / token-rename-parser.mjs. `parserNames` viene riutilizzato
  più sotto e passato a buildSourceModes() in modo che ogni istanza di
  Style Dictionary lo adotti in modo coerente.
*/
import { registerSourceTransforms, transformedFilesPattern, hasRegisteredTransforms } from './build-tokens-src/source-transforms.mjs';
import {
  TOKEN_RENAME_PARSER_NAME,
  registerTokenRenameParser,
  TOKEN_RENAME_PREPROCESSOR_NAME,
  registerTokenRenamePreprocessor,
} from './build-tokens-src/token-rename-parser.mjs';
await registerSourceTransforms(transformedSources);
const tokenRenamePattern = transformedFilesPattern();
if (tokenRenamePattern) registerTokenRenameParser(tokenRenamePattern);
registerTokenRenamePreprocessor();
const parserNames = [LEGACY_TOKENS_PARSER_NAME, ...(hasRegisteredTransforms() ? [TOKEN_RENAME_PARSER_NAME] : [])];
// Riscrive i {riferimenti} al VECCHIO percorso di ogni token rinominato, in tutto l'albero,
// una volta uniti tutti i file (vedi registerTokenRenamePreprocessor() qui sopra).
const preprocessorNames = hasRegisteredTransforms() ? [TOKEN_RENAME_PREPROCESSOR_NAME] : [];

// ── 3. Format CSS ─────────────────────────────────────────────────────────────
// customPropsCount viene aggiornato dal format al momento del rendering
// loadExistingCustomProps supporta l'opzione mergeCustomProps (vedi sotto)
import { customPropsCount } from './build-tokens-src/formats/css.mjs';
import { loadExistingCustomProps } from './build-tokens-src/merge-css.mjs';

// ── 4. Format JSON ────────────────────────────────────────────────────────────
import { buildJsonFiles, collectConcreteFilePaths } from './build-tokens-src/formats/json.mjs';

// ── 5. Builder delle platform ─────────────────────────────────────────────────
import { buildPlatforms } from './build-tokens-src/platforms.mjs';

// ── 5b. Builder sourceModes (alternativa alla build a sorgente singola più sotto) ──
import { buildSourceModes } from './build-tokens-src/build-source-modes.mjs';

// ── 6. Pulizia della directory di output json ────────────────────────────────
/*
  Rimuove solo i file *.json/*.jsonc generati in precedenza, in modo che i token
  rimossi dalla sorgente non restino come artefatti obsoleti, lasciando intatto
  ogni altro file inserito dall'utente in jsonBuildPath (ad es. un README). I file
  vengono scritti nella stessa cartella jsonBuildPath (senza sottocartelle), quindi
  viene analizzato solo il suo primo livello. Viene eseguito a prescindere da sourceModes.
*/
if (jsonBuildPath) {
  // Costante locale: il narrowing del binding importato `jsonBuildPath` si perde
  // dentro la callback .map() qui sotto.
  const jsonDir = jsonBuildPath;
  const { readdir, rm, mkdir } = await import('fs/promises');
  const existingEntries = await readdir(jsonDir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    existingEntries
      .filter((entry) => entry.isFile() && /\.jsonc?$/.test(entry.name))
      .map((entry) => rm(path.join(jsonDir, entry.name)))
  );
  await mkdir(jsonDir, { recursive: true });
}

// ── 7. Build ──────────────────────────────────────────────────────────────────
// concreteFilePaths / modeResult sono usati più sotto nella sezione di log (10).
/** @type {string[]} */
let concreteFilePaths = [];
/** @type {Awaited<ReturnType<typeof buildSourceModes>>|null} */
let modeResult = null;

if (sourceModes) {
  // Build con sourceModes: un'istanza di StyleDictionary per modalità, composte in
  // un unico destFile — vedi build-tokens-src/build-source-modes.mjs.
  modeResult = await buildSourceModes({
    sourceModes,
    baseMode: sourceModesBase,
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
  });

} else {
  // Build a sorgente singola (default).

  /*
    Custom properties preesistenti (opzione mergeCustomProps): lette prima
    che Style Dictionary venga eseguito, perché sovrascrive il file di destinazione. Il
    format css/variables-sorted (formats/css.mjs) vi unisce questi valori —
    i valori preesistenti hanno priorità — subito prima di serializzare l'output
    CSS finale. Vedi merge-css.mjs.
  */
  if (mergeCustomProps) {
    loadExistingCustomProps(path.join(buildPath, destFile), mergeCustomProps);
  }

  /*
    Raccoglie i percorsi dei file sorgente concreti (solo modalità JSON multi-file). Le
    voci di source possono essere pattern glob. SD li espande internamente e memorizza il
    percorso concreto in token.filePath. Servono questi percorsi concreti per costruire
    i descrittori per file per la platform json.

    SD v5 carica le sorgenti in modo lazy: `await sd.hasInitialized` attiva il caricamento;
    dopo, sd.allTokens è un normale array sincrono con filePath popolato.

    In modalità file singolo (jsonDestFile è impostato) questo passaggio viene saltato del tutto.
    source è null solo quando sourceModes è impostato (vedi config.mjs); questo
    ramo viene eseguito esclusivamente quando sourceModes non è impostato.
  */
  const singleSource = /** @type {string[]} */ (source);

  if (jsonBuildPath && !jsonDestFile) {
    const sdInit = new StyleDictionary({
      source: singleSource,
      parsers: parserNames,
      preprocessors: preprocessorNames,
      log: { verbosity: 'silent' },
      platforms: {},
    });
    concreteFilePaths = await collectConcreteFilePaths(sdInit);
  }

  const sd = new StyleDictionary({
    source: singleSource,
    parsers: parserNames,
    preprocessors: preprocessorNames,
    log: { verbosity: 'verbose' },
    platforms: buildPlatforms({
      buildPath,
      destFile,
      jsonBuildPath,
      jsonDestFile,
      jsonFormat,
      jsonExpression,
      concreteFilePaths,
      customPropsGroups,
      pxToRem,
      addLayer,
      selector: customPropsSelector,
    }),
  });

  await sd.buildAllPlatforms();
}

// ── 8. Lint CSS ───────────────────────────────────────────────────────────────
const stylelintConfig = await import(pathToFileURL(stylelintConfigPath).href).then(m => m.default);


await stylelint.lint({
  config: stylelintConfig,
  files: [path.join(buildPath, destFile)],
  fix: true,
});

// ── 9. Log ────────────────────────────────────────────────────────────────────
/** @param {string} p */
const short = (p) => p.replace(homedir(), '~');

console.log(styleText(['yellow'], `[build-tokens] config file : ${short(configAbsPath)}`));

if (sourceModes) {
  console.log(styleText(['yellow'],
    `[build-tokens] modes       : ${Object.keys(sourceModes).join(', ')} (base: ${sourceModesBase})`
  ));
} else {
  console.log(styleText(['yellow'], `[build-tokens] source      : ${(/** @type {string[]} */ (source)).map(short)}`));
}
console.log(styleText(['yellow'], `[build-tokens] dest file   : ${short(path.join(buildPath, destFile))}`));

if (jsonBuildPath) {
  if (sourceModes && modeResult) {
    const totalJsonFiles = Object.values(modeResult.jsonFilesByMode)
      .reduce((count, files) => count + files.length, 0);
    console.log(styleText(['yellow'],
      `[build-tokens] json        : ${totalJsonFiles} files in ${short(jsonBuildPath)} (${Object.keys(sourceModes).length} modes)`
    ));
  } else {
    const jsonFiles = buildJsonFiles(concreteFilePaths, jsonDestFile, jsonFormat, jsonExpression);
    if (jsonFiles.length === 1) {
      console.log(styleText(['yellow'],
        `[build-tokens] json        : ${short(path.join(jsonBuildPath, jsonFiles[0].destination))}`
      ));
    } else {
      console.log(styleText(['yellow'],
        `[build-tokens] json        : ${jsonFiles.length} files in ${short(jsonBuildPath)}`
      ));
    }
  }
} else {
  console.log(styleText(['yellow'],
    '[build-tokens] json        : (disabled — jsonBuildPath not set)'
  ));
}

console.log(styleText(['green'],
  `[build-tokens] ${sourceModes && modeResult ? modeResult.totalCustomProps : customPropsCount} custom properties processed`
));
console.log(styleText(['green'], '**** DONE ****'));
