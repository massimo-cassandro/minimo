#!/usr/bin/env node
/// <reference types="node" />

/* eslint-disable no-console */

// check-unresolved-custom-props.mjs
// Scans CSS files in the configured directory and reports:
//   - unresolved properties: custom property references (var(--...)) that
//     are not defined in the generated token file
//   - unused properties: custom properties defined in the generated token
//     file but never referenced via var() in any scanned CSS file
//
// Usage: node check-unresolved-custom-props.mjs --config ./path/to/config.mjs


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
import { resolveSourcePaths } from './build-tokens-src/resolve-source-paths.mjs';
import { findMediaModeBlocks } from './build-tokens-src/merge-css.mjs';
import { LEGACY_TOKENS_PARSER_NAME, registerLegacyTokensParser } from './build-tokens-src/legacy-tokens-parser.mjs';

registerLegacyTokensParser();

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

// ---------------------------------------------------------------------------
// 2. Main
// ---------------------------------------------------------------------------
async function run() {
  try {
    const { default: config } = await import(pathToFileURL(absoluteConfigPath).href);

    // Path of the generated CSS file containing all custom property definitions
    const custom_prop_file_path = path.resolve(configDir, path.join(config.buildPath, config.destFile));
    const custom_prop_filename  = path.basename(custom_prop_file_path);

    // Directory to scan for CSS files
    const checkdir = path.resolve(configDir, config.dirToCheck);

    // Patterns for custom properties to exclude from the unresolved check
    /** @type {RegExp[]} */
    const exclude = config.excludePattern ?? [];

    // Collect all .css files in the scan directory, excluding any file under a
    // directory whose name starts with "TODO" (work-in-progress folders).
    // The token file itself (custom_prop_filename) is intentionally included:
    // custom properties are often composed from other custom properties
    // (e.g. `--malert-box-shadow: ... var(--malert-box-shadow-color) ...`)
    // and those internal var() references must count as usage, otherwise the
    // referenced property is wrongly reported as unused.
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

    // ---------------------------------------------------------------------------
    // 3. Build the list of defined custom properties
    // ---------------------------------------------------------------------------
    const definitionRegex = /--([a-z0-9-]+)(?=\s*:)/g;

    // defined_props keeps file/line info too, so unused properties (section 6)
    // can be reported with a link back to their definition. With sourceModes
    // (see build-tokens-src/config.mjs), the same prop name can legitimately
    // appear once per mode with a different value — `mode` disambiguates
    // which one a given entry is, so section 5 resolves each to the correct
    // per-mode source file instead of mixing them up (see findMediaModeBlocks
    // in build-tokens-src/merge-css.mjs).
    /** @type {{file: string, line: number, prop: string, mode: string|null}[]} */
    const defined_props = [];

    const cssContent = fs.readFileSync(custom_prop_file_path, 'utf-8');
    const custom_prop_relpath = path.relative(configDir, custom_prop_file_path);

    // sourceModesBase mirrors the default-resolution logic in
    // build-tokens-src/config.mjs: the configured sourceModesBase if it's
    // actually a key of sourceModes, otherwise the first key.
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

    // Also include any extra CSS files declared in extraCustomPropsFiles.
    // These are plain (non-sourceModes) files, so mode is always null.
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

    // ---------------------------------------------------------------------------
    // 4. Scan files for unresolved var() references
    // ---------------------------------------------------------------------------
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

    // Unused-properties census is opt-in (config.checkUnused: true) since it
    // re-runs the Style Dictionary transform pipeline over the token sources
    // just to resolve source files, which adds a noticeable cost.
    const checkUnused = config.checkUnused === true;

    // If true (default), properties sourced from a token file under
    // node_modules (e.g. a third-party token package) are never reported as
    // unused — the consuming project isn't expected to prune those.
    const ignoreUnusedInNodeModules = config.ignoreUnusedInNodeModules !== false;

    // ---------------------------------------------------------------------------
    // 5. Best-effort: resolve the .mjs token source file for each defined
    // property, by running the same transform pipeline used to generate the
    // CSS (see build-tokens-src/formats/css.mjs) over the token sources
    // declared in config.source. Properties that only exist in the generated
    // CSS (or an extraCustomPropsFiles entry) — e.g. manual additions kept
    // across rebuilds via the mergeCustomProps option — have no token source
    // and are reported by name only.
    //
    // With sourceModes, resolution runs once PER MODE, keyed by mode name in
    // sourceFileByPropByMode: the same prop name can be defined by a
    // different source file in each mode (see the `dead: {...}` example in
    // both a light and dark token file), so a single flattened name -> file
    // map would silently point some entries at the wrong mode's file.
    // sourceFileByProp (mode: null) covers the non-sourceModes case and
    // extraCustomPropsFiles entries.
    // ---------------------------------------------------------------------------
    /** @type {Map<string, string>} */
    const sourceFileByProp = new Map();
    /** @type {Map<string, Map<string, string>>} */
    const sourceFileByPropByMode = new Map();

    // includePatterns: base-mode sources, passed as `include` for non-base
    // modes so cross-mode references resolve (same as build-source-modes.mjs).
    /** @param {string[]} sourcePatterns @param {string[]} [includePatterns] @returns {Promise<Map<string,string>>} */
    const resolveSourceFileMap = async (sourcePatterns, includePatterns = []) => {
      /** @type {Map<string, string>} */
      const map = new Map();
      const resolvedPaths = resolveSourcePaths(sourcePatterns, configDir);
      if (!resolvedPaths.length) return map;
      try {
        const sd = new StyleDictionary({
          include: resolveSourcePaths(includePatterns, configDir),
          source: resolvedPaths,
          parsers: [LEGACY_TOKENS_PARSER_NAME],
          log: { verbosity: 'silent' },
          platforms: { css: { transforms: CSS_TRANSFORMS } },
        });
        const dictionary = await sd.getPlatformTokens('css');
        for (const token of dictionary.allTokens) {
          if (token.filePath && token.isSource !== false) map.set(`--${token.name}`, token.filePath);
        }
      } catch {
        // Non-fatal: unused properties will be reported by name only.
      }
      return map;
    };

    if (checkUnused && config.sourceModes) {
      for (const [mode, modeSource] of Object.entries(config.sourceModes)) {
        const includePatterns = mode === sourceModesBase ? [] : config.sourceModes[sourceModesBase];
        sourceFileByPropByMode.set(mode, await resolveSourceFileMap(modeSource, includePatterns));
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

    // ---------------------------------------------------------------------------
    // 6. Build the list of unused custom properties (defined but never
    // referenced via var() in any scanned CSS file) — the opposite check
    // of section 4. Properties sourced from node_modules are skipped when
    // ignoreUnusedInNodeModules is true (default).
    // ---------------------------------------------------------------------------
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

    // ---------------------------------------------------------------------------
    // 7. Write the report
    // ---------------------------------------------------------------------------
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
