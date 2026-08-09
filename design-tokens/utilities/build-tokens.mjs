#!/usr/bin/env node
/// <reference types="node" />
/* eslint-disable no-console */

// build-tokens.mjs
// Entry point: imports modules, runs the build, lints the CSS output, prints the log.
//
// Project structure:
//   build-tokens.mjs              <- this file
//   build-tokens-src/config.mjs   <- reads --config flag and resolves all paths
//   build-tokens-src/transforms.mjs  <- registers custom Style Dictionary transforms
//   build-tokens-src/formats/css.mjs    <- registers the css/variables-sorted format
//   build-tokens-src/formats/json.mjs   <- registers the json/tokens format, exports helpers
//   build-tokens-src/platforms.mjs      <- builds the platforms object (css + optional json)

import StyleDictionary from 'style-dictionary';
import * as path from 'node:path';
import { styleText } from 'node:util';
import { homedir } from 'node:os';
import stylelint from 'stylelint';
import { pathToFileURL } from 'node:url';

// ── 1. Configuration (args + resolved paths) ────────────────────────────────
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
  mergeCustomProps,
  customPropsGroups,
  pxToRem,
} from './build-tokens-src/config.mjs';

// ── 2. Custom transforms ─────────────────────────────────────────────────────
import './build-tokens-src/transforms.mjs';

// ── 3. CSS format ─────────────────────────────────────────────────────────────
// customPropsCount is updated by the format at render time
// loadExistingCustomProps supports the mergeCustomProps option (see below)
import { customPropsCount } from './build-tokens-src/formats/css.mjs';
import { loadExistingCustomProps } from './build-tokens-src/merge-css.mjs';

// ── 4. JSON format ────────────────────────────────────────────────────────────
import { buildJsonFiles, collectConcreteFilePaths } from './build-tokens-src/formats/json.mjs';

// ── 5. Platforms builder ──────────────────────────────────────────────────────
import { buildPlatforms } from './build-tokens-src/platforms.mjs';

// ── 5b. Pre-existing custom properties (mergeCustomProps option) ────────────
// Read before Style Dictionary runs, since it overwrites the destination
// file. The css/variables-sorted format (formats/css.mjs) merges these
// values in — pre-existing values take priority — right before serialising
// the final CSS output. See merge-css.mjs.
if (mergeCustomProps) {
  loadExistingCustomProps(path.join(buildPath, destFile));
}

// ── 6. Collect concrete source file paths (multi-file JSON mode only) ────────
// Source entries may be glob patterns. SD expands them internally and stores
// the concrete path in token.filePath. We need those concrete paths to build
// the per-file descriptors for the json platform.
//
// SD v5 lazy-loads sources: `await sd.hasInitialized` triggers loading;
// after that sd.allTokens is a plain synchronous array with filePath populated.
//
// In single-file mode (jsonDestFile is set) we skip this step entirely.
let concreteFilePaths = [];

if (jsonBuildPath && !jsonDestFile) {
  const sdInit = new StyleDictionary({ source, log: { verbosity: 'silent' }, platforms: {} });
  concreteFilePaths = await collectConcreteFilePaths(sdInit);
}

// ── 7. Clean json output directory ───────────────────────────────────────────
// Remove only previously generated *.json/*.jsonc files, so that tokens
// removed from the source are not left behind as stale artefacts, while any
// other file placed in jsonBuildPath by the user (e.g. a README) is left
// untouched. Files are written flat in jsonBuildPath (no subdirectories), so
// only its top level is scanned.
if (jsonBuildPath) {
  const { readdir, rm, mkdir } = await import('fs/promises');
  const existingEntries = await readdir(jsonBuildPath, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    existingEntries
      .filter((entry) => entry.isFile() && /\.jsonc?$/.test(entry.name))
      .map((entry) => rm(path.join(jsonBuildPath, entry.name)))
  );
  await mkdir(jsonBuildPath, { recursive: true });
}

// ── 8. Build ──────────────────────────────────────────────────────────────────
const sd = new StyleDictionary({
  source,
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
  }),
});

await sd.buildAllPlatforms();

// ── 9. CSS lint ───────────────────────────────────────────────────────────────
const stylelintConfig = await import(pathToFileURL(stylelintConfigPath).href).then(m => m.default);


await stylelint.lint({
  config: stylelintConfig,
  files: [path.join(buildPath, destFile)],
  fix: true,
});

// ── 10. Log ────────────────────────────────────────────────────────────────────
/** @param {string} p */
const short = (p) => p.replace(homedir(), '~');

console.log(styleText(['yellow'], `[build-tokens] config file : ${short(configAbsPath)}`));
console.log(styleText(['yellow'], `[build-tokens] source      : ${source.map(short)}`));
console.log(styleText(['yellow'], `[build-tokens] dest file   : ${short(path.join(buildPath, destFile))}`));

if (jsonBuildPath) {
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
} else {
  console.log(styleText(['yellow'],
    '[build-tokens] json        : (disabled — jsonBuildPath not set)'
  ));
}

console.log(styleText(['green'], `[build-tokens] ${customPropsCount} custom properties processed`));
console.log(styleText(['green'], '**** DONE ****'));
