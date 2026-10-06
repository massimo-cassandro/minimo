#!/usr/bin/env node
/// <reference types="node" />

/* eslint-disable no-console */

/*
  check-unresolved-custom-props.mjs
  Analizza i file CSS nella directory configurata e segnala:
    - proprietà non risolte: riferimenti a custom properties (var(--...)) che
      non sono definite nel file dei token generato
    - proprietà non usate: custom properties definite nel file dei token
      generato ma mai referenziate tramite var() in alcun file CSS analizzato

  Utilizzo: node check-unresolved-custom-props.mjs --config ./path/to/config.mjs
*/


/* globals process */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { /* fileURLToPath,  */pathToFileURL } from 'node:url';
// import { dirname } from 'path';
import { glob } from 'node:fs/promises';
import { styleText } from 'node:util';
import StyleDictionary from 'style-dictionary';
import './build-tokens-src/transforms.mjs';
import { CSS_TRANSFORMS } from './build-tokens-src/platforms.mjs';
import { splitSourceEntries, registerSourcePrefixes } from './build-tokens-src/source-prefixes.mjs';
import { registerSourceTransforms, transformedFilesPattern, hasRegisteredTransforms } from './build-tokens-src/source-transforms.mjs';
import {
  TOKEN_RENAME_PARSER_NAME,
  registerTokenRenameParser,
  TOKEN_RENAME_PREPROCESSOR_NAME,
  registerTokenRenamePreprocessor,
} from './build-tokens-src/token-rename-parser.mjs';
import { findMediaModeBlocks } from './build-tokens-src/merge-css.mjs';
import { LEGACY_TOKENS_PARSER_NAME, registerLegacyTokensParser } from './build-tokens-src/legacy-tokens-parser.mjs';

registerLegacyTokensParser();
registerTokenRenamePreprocessor();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname  = dirname(__filename);

// ---------------------------------------------------------------------------
// 1. Parse flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const configFlagIndex = args.findIndex(arg => arg === '--config' || arg === '-c');
const configArgPath = configFlagIndex !== -1 ? args[configFlagIndex + 1] : undefined;

if (!configArgPath) {
  console.error(styleText(['red'], 'Error: you must provide the config path with --config or -c'));
  console.log('Example: node check-unresolved-custom-props.mjs --config ./config.mjs');
  process.exit(1);
}

const absoluteConfigPath = path.resolve(process.cwd(), configArgPath);
const configDir = path.dirname(absoluteConfigPath);

/*
  ---------------------------------------------------------------------------
  2. Main
  ---------------------------------------------------------------------------
*/
async function run() {
  try {
    const { default: config } = await import(pathToFileURL(absoluteConfigPath).href);

    // Percorso del file CSS generato che contiene tutte le definizioni delle custom properties
    const custom_prop_file_path = path.resolve(configDir, path.join(config.buildPath, config.destFile));

    // Directory in cui cercare i file CSS
    const checkdir = path.resolve(configDir, config.dirToCheck);

    // Pattern delle custom properties da escludere dal controllo delle non risolte
    /** @type {RegExp[]} */
    const exclude = config.excludePattern ?? [];

    /*
      Raccoglie tutti i file .css nella directory da analizzare, escludendo ogni file sotto una
      directory il cui nome inizia con "TODO" (cartelle in lavorazione).
      Il file dei token stesso (custom_prop_file_path) è volutamente incluso:
      le custom properties sono spesso composte da altre custom properties
      (ad es. `--malert-box-shadow: ... var(--malert-box-shadow-color) ...`)
      e quei riferimenti var() interni devono contare come utilizzo, altrimenti la
      proprietà referenziata viene segnalata erroneamente come non usata.
    */
    const files = [];
    for await (const entry of glob(path.join(checkdir, '/**/*.css'))) {
      const relDirSegments = path.relative(checkdir, path.dirname(entry)).split(path.sep);
      const isInTodoDir    = relDirSegments.some(segment => /^todo/i.test(segment));

      if (!isInTodoDir) {
        files.push(entry);
      }
    }

    if (!fs.existsSync(custom_prop_file_path)) {
      throw new Error(`Token CSS file not found: ${custom_prop_file_path}`);
    }

    /*
      ---------------------------------------------------------------------------
      3. Costruisce l'elenco delle custom properties definite
      ---------------------------------------------------------------------------
    */
    const definitionRegex = /--([a-z0-9-]+)(?=\s*:)/g;

    /*
      defined_props conserva anche le informazioni su file/riga, così che le proprietà non usate (sezione 6)
      possano essere segnalate con un link alla loro definizione. Con sourceModes
      (vedi build-tokens-src/config.mjs), lo stesso nome di proprietà può legittimamente
      comparire una volta per modalità con un valore diverso — `mode` indica
      di quale si tratta, così la sezione 5 risolve ognuna nel file sorgente corretto
      della propria modalità invece di confonderle (vedi findMediaModeBlocks
      in build-tokens-src/merge-css.mjs).
    */
    /** @type {{file: string, line: number, prop: string, mode: string|null}[]} */
    const defined_props = [];

    const cssContent = fs.readFileSync(custom_prop_file_path, 'utf-8');
    const custom_prop_relpath = path.relative(configDir, custom_prop_file_path);

    /*
      sourceModesBase replica la logica di risoluzione del default di
      build-tokens-src/config.mjs: il sourceModesBase configurato se è
      effettivamente una chiave di sourceModes, altrimenti la prima chiave.
    */
    const sourceModeNames = config.sourceModes ? Object.keys(config.sourceModes) : [];
    const sourceModesBase = sourceModeNames.includes(config.sourceModesBase)
      ? config.sourceModesBase
      : sourceModeNames[0];
    const mediaModeBlocks = config.sourceModes ? findMediaModeBlocks(cssContent) : [];

    /** @param {number} index @returns {string|null} */
    const modeAtIndex = (index) => {
      if (!config.sourceModes) return null;
      const block = mediaModeBlocks.find(b => index > b.start && index < b.end);
      return block ? block.mode : sourceModesBase;
    };

    [...cssContent.matchAll(definitionRegex)].forEach(m => {
      const line = cssContent.substring(0, m.index).split('\n').length;
      defined_props.push({ file: custom_prop_relpath, line, prop: `--${m[1]}`, mode: modeAtIndex(m.index) });
    });

    // Include anche gli eventuali file CSS extra dichiarati in extraCustomPropsFiles.
    // Sono file semplici (non sourceModes), quindi mode è sempre null.
    for (const extraFile of (config.extraCustomPropsFiles ?? [])) {
      const extraFilePath = path.resolve(configDir, extraFile);
      const extraContent  = fs.readFileSync(extraFilePath, 'utf-8');
      const extraRelpath  = path.relative(configDir, extraFilePath);
      [...extraContent.matchAll(definitionRegex)].forEach(m => {
        const line = extraContent.substring(0, m.index).split('\n').length;
        defined_props.push({ file: extraRelpath, line, prop: `--${m[1]}`, mode: null });
      });
    }

    const propertyNamesList = defined_props.map(item => item.prop);

    /*
      ---------------------------------------------------------------------------
      4. Analizza i file alla ricerca di riferimenti var() non risolti
      ---------------------------------------------------------------------------
    */
    const usageRegex = /var\(\s*(--[a-z0-9-]+)\s*(,.*?)?\)/g;
    /** @type {{file: string, line: number, prop: string}[]} */
    const unresolved_props = [];
    const used_props_set = new Set();

    files.forEach(file => {
      const fileContent = fs.readFileSync(file, 'utf-8');
      const filename    = path.relative(configDir, file);
      const matches     = [...fileContent.matchAll(usageRegex)];

      matches.forEach(match => {
        const cprop      = match[1];
        const isExcluded = exclude.some(exRegex => exRegex.test(cprop));
        const isDefined  = propertyNamesList.includes(cprop);
        const lineNumber = fileContent.substring(0, match.index).split('\n').length;

        used_props_set.add(cprop);

        if (!isExcluded && !isDefined) {
          unresolved_props.push({ file: filename, line: lineNumber, prop: cprop });
        }
      });
    });

    unresolved_props.sort((a, b) => a.file.localeCompare(b.file));

    /*
      Il censimento delle proprietà non usate è opt-in (config.checkUnused: true) perché
      riesegue la pipeline di trasformazione di Style Dictionary sui sorgenti dei token
      solo per risalire ai file sorgente, con un costo apprezzabile.
    */
    const checkUnused = config.checkUnused === true;

    /*
      Se true (default), le proprietà provenienti da un file token sotto
      node_modules (ad es. un pacchetto di token di terze parti) non vengono mai segnalate
      come non usate — il progetto che le usa non è tenuto a ripulirle.
    */
    const ignoreUnusedInNodeModules = config.ignoreUnusedInNodeModules !== false;

    /*
      ---------------------------------------------------------------------------
      5. Best-effort: risale al file sorgente .mjs dei token per ogni proprietà
      definita, eseguendo la stessa pipeline di trasformazione usata per generare il
      CSS (vedi build-tokens-src/formats/css.mjs) sui sorgenti dei token
      dichiarati in config.source. Le proprietà che esistono solo nel CSS generato
      (o in una voce di extraCustomPropsFiles) — ad es. aggiunte manuali conservate
      tra una build e l'altra tramite l'opzione mergeCustomProps — non hanno un
      sorgente token e vengono segnalate solo per nome.

      Con sourceModes, la risoluzione viene eseguita una volta PER MODALITÀ, indicizzata per nome
      della modalità in sourceFileByPropByMode: lo stesso nome di proprietà può essere definito da un
      file sorgente diverso in ogni modalità (vedi l'esempio `dead: {...}` in
      un file token light e in uno dark), quindi una singola mappa nome -> file
      appiattita punterebbe in silenzio alcune voci al file della modalità sbagliata.
      sourceFileByProp (mode: null) copre il caso senza sourceModes e le voci di
      extraCustomPropsFiles.
      ---------------------------------------------------------------------------
    */
    /** @type {Map<string, string>} */
    const sourceFileByProp = new Map();
    /** @type {Map<string, Map<string, string>>} */
    const sourceFileByPropByMode = new Map();

    // includeEntries: sorgenti della modalità base, passate come `include` per le
    // modalità non base così che i riferimenti tra modalità vengano risolti (come in build-source-modes.mjs).
    /** @param {Parameters<typeof splitSourceEntries>[0]} sourceEntries @param {Parameters<typeof splitSourceEntries>[0]} [includeEntries] @returns {Promise<Map<string,string>>} */
    /*
      Le voci possono essere stringhe od oggetti `{ src, prefix, transform }` (vedi
      build-tokens-src/source-prefixes.mjs): entrambi vengono registrati prima che la
      pipeline di trasformazione venga eseguita, così i nomi dei token corrispondono al CSS generato.
    */
    const resolveSourceFileMap = async (sourceEntries, includeEntries = []) => {
      /** @type {Map<string, string>} */
      const map = new Map();
      const { patterns: resolvedPaths, prefixed, transformed } = splitSourceEntries(sourceEntries, configDir);
      const { patterns: includePaths, prefixed: includePrefixed, transformed: includeTransformed } = splitSourceEntries(includeEntries, configDir);
      if (!resolvedPaths.length) return map;
      try {
        await registerSourcePrefixes([...prefixed, ...includePrefixed]);

        await registerSourceTransforms([...transformed, ...includeTransformed]);
        const tokenRenamePattern = transformedFilesPattern();
        if (tokenRenamePattern) registerTokenRenameParser(tokenRenamePattern);
        const parserNames = [LEGACY_TOKENS_PARSER_NAME, ...(hasRegisteredTransforms() ? [TOKEN_RENAME_PARSER_NAME] : [])];
        const preprocessorNames = hasRegisteredTransforms() ? [TOKEN_RENAME_PREPROCESSOR_NAME] : [];

        const sd = new StyleDictionary({
          include: includePaths,
          source: resolvedPaths,
          parsers: parserNames,
          preprocessors: preprocessorNames,
          log: { verbosity: 'silent' },
          platforms: { css: { transforms: CSS_TRANSFORMS } },
        });
        const dictionary = await sd.getPlatformTokens('css');
        for (const token of dictionary.allTokens) {
          if (token.filePath && token.isSource !== false) map.set(`--${token.name}`, token.filePath);
        }
      } catch {
        // Non bloccante: le proprietà non usate verranno segnalate solo per nome.
      }
      return map;
    };

    if (checkUnused && config.sourceModes) {
      for (const [mode, modeSource] of Object.entries(config.sourceModes)) {
        const includeEntries = mode === sourceModesBase ? [] : config.sourceModes[sourceModesBase];
        sourceFileByPropByMode.set(mode, await resolveSourceFileMap(modeSource, includeEntries));
      }
    } else if (checkUnused && Array.isArray(config.source) && config.source.length) {
      const map = await resolveSourceFileMap(config.source);
      for (const [prop, filePath] of map) sourceFileByProp.set(prop, filePath);
    }

    /** @param {{prop: string, mode: string|null}} item @returns {string|undefined} */
    const resolveSourceFilePath = (item) =>
      item.mode
        ? sourceFileByPropByMode.get(item.mode)?.get(item.prop)
        : sourceFileByProp.get(item.prop);

    /*
      ---------------------------------------------------------------------------
      6. Costruisce l'elenco delle custom properties non usate (definite ma mai
      referenziate tramite var() in alcun file CSS analizzato) — il controllo opposto
      a quello della sezione 4. Le proprietà provenienti da node_modules vengono saltate quando
      ignoreUnusedInNodeModules è true (default).
      ---------------------------------------------------------------------------
    */
    const unused_props = checkUnused
      ? defined_props
        .filter(item => !used_props_set.has(item.prop))
        .filter(item => {
          if (!ignoreUnusedInNodeModules) return true;
          const sourceFilePath = resolveSourceFilePath(item);
          if (!sourceFilePath) return true;
          return !/(^|[\\/])node_modules([\\/]|$)/.test(sourceFilePath);
        })
        .sort((a, b) => a.prop.localeCompare(b.prop))
      : [];

    /*
      ---------------------------------------------------------------------------
      7. Scrive il report
      ---------------------------------------------------------------------------
    */
    const result_file = path.resolve(configDir, 'unresolved-unused-props.md');

    const logParts = [`${unresolved_props.length} unresolved custom properties found`];
    if (checkUnused) {
      logParts.push(`${unused_props.length} unused custom properties found`);
    }
    console.log(styleText(['green'],
      `${logParts.join(', ')} -> ${path.relative(process.cwd(), result_file)}`
    ));

    const sections = [];

    if (unresolved_props.length) {
      sections.push(
        '## Unresolved custom properties\n\n'
        + unresolved_props
          .map(item =>
            `* [${path.basename(item.file, '.css')}](${item.file}#L${item.line}) -> \`${item.prop}\``
          )
          .join('\n')
      );
    }

    if (unused_props.length) {
      sections.push(
        '## Unused custom properties\n\n'
        + unused_props
          .map(item => {
            const sourceFilePath = resolveSourceFilePath(item);
            if (!sourceFilePath) return `* \`${item.prop}\``;

            const relSource = path.relative(configDir, sourceFilePath);
            return `* [${path.basename(relSource)}](${relSource}) -> \`${item.prop}\``;
          })
          .join('\n')
      );
    }

    if (sections.length) {
      fs.writeFileSync(result_file, sections.join('\n\n'), 'utf-8');
    } else {
      if (fs.existsSync(result_file)) {
        fs.unlinkSync(result_file);
      }
    }

    console.log(styleText(['green'], '**** DONE ****'));

  } catch (err) {
    console.log(styleText(['redBright'], err instanceof Error ? err.stack ?? err.message : String(err)));
    process.exit(1);
  }
}

run();
