#!/usr/bin/env node
/* eslint-disable no-console */

// build-tokens.mjs
// Entry point: imports modules, runs the build, lints the CSS output, prints the log.
//
// Project structure:
//   build-tokens.mjs              <- this file
//   build-tokens-src/config.mjs   <- reads --config flag and resolves all paths
//   build-tokens-src/transforms.mjs  <- registers custom Style Dictionary transforms
//   build-tokens-src/formats/css.mjs    <- registers the css/variables-sorted format
//   build-tokens-src/formats/penpot.mjs <- registers the json/penpot format, exports helpers
//   build-tokens-src/platforms.mjs      <- builds the platforms object (css + optional penpot)

import StyleDictionary from 'style-dictionary';
import path from 'path';
import { styleText } from 'node:util';
import { homedir } from 'os';
import stylelint from 'stylelint';
import { pathToFileURL } from 'url';

// ── 1. Configuration (args + resolved paths) ────────────────────────────────
import {
  configAbsPath,
  buildPath,
  destFile,
  stylelintConfigPath,
  penpotBuildPath,
  penpotDestFile,
  penpotFormat,
  penpotExpressions,
  source,
} from './build-tokens-src/config.mjs';

// ── 2. Custom transforms ─────────────────────────────────────────────────────
import './build-tokens-src/transforms.mjs';

// ── 3. CSS format ─────────────────────────────────────────────────────────────
// customPropsCount is updated by the format at render time
import { customPropsCount } from './build-tokens-src/formats/css.mjs';

// ── 4. Penpot format ──────────────────────────────────────────────────────────
import { buildPenpotFiles, collectConcreteFilePaths } from './build-tokens-src/formats/penpot.mjs';

// ── 5. Platforms builder ──────────────────────────────────────────────────────
import { buildPlatforms } from './build-tokens-src/platforms.mjs';

// ── 6. Collect concrete source file paths (multi-file Penpot mode only) ──────
// Source entries may be glob patterns. SD expands them internally and stores
// the concrete path in token.filePath. We need those concrete paths to build
// the per-file descriptors for the penpot platform.
//
// SD v5 lazy-loads sources: `await sd.hasInitialized` triggers loading;
// after that sd.allTokens is a plain synchronous array with filePath populated.
//
// In single-file mode (penpotDestFile is set) we skip this step entirely.
let concreteFilePaths = [];

if (penpotBuildPath && !penpotDestFile) {
  const sdInit = new StyleDictionary({ source, log: { verbosity: 'silent' }, platforms: {} });
  concreteFilePaths = await collectConcreteFilePaths(sdInit);
}

// ── 7. Clean penpot output directory ─────────────────────────────────────────
// Wipe the destination folder before writing new files so that tokens removed
// from the source are not left behind as stale artefacts.
if (penpotBuildPath) {
  const { rm, mkdir } = await import('fs/promises');
  await rm(penpotBuildPath, { recursive: true, force: true });
  await mkdir(penpotBuildPath, { recursive: true });
}

// ── 8. Build ──────────────────────────────────────────────────────────────────
const sd = new StyleDictionary({
  source,
  log: { verbosity: 'verbose' },
  platforms: buildPlatforms({
    buildPath,
    destFile,
    penpotBuildPath,
    penpotDestFile,
    penpotFormat,
    penpotExpressions,
    concreteFilePaths,
  }),
});

await sd.buildAllPlatforms();

// ── 9. CSS lint ───────────────────────────────────────────────────────────────
const stylelintConfig = await import(pathToFileURL(stylelintConfigPath)).then(m => m.default);

await stylelint.lint({
  config: stylelintConfig,
  files: [path.join(buildPath, destFile)],
  fix: true,
});

// ── 10. Log ────────────────────────────────────────────────────────────────────
const short = (p) => p.replace(homedir(), '~');

console.log(styleText(['yellow'], `[build-tokens] config file : ${short(configAbsPath)}`));
console.log(styleText(['yellow'], `[build-tokens] source      : ${source.map(short)}`));
console.log(styleText(['yellow'], `[build-tokens] dest file   : ${short(path.join(buildPath, destFile))}`));

if (penpotBuildPath) {
  const penpotFiles = buildPenpotFiles(concreteFilePaths, penpotDestFile, penpotFormat, penpotExpressions);
  if (penpotFiles.length === 1) {
    console.log(styleText(['yellow'],
      `[build-tokens] penpot json : ${short(path.join(penpotBuildPath, penpotFiles[0].destination))}`
    ));
  } else {
    console.log(styleText(['yellow'],
      `[build-tokens] penpot json : ${penpotFiles.length} files in ${short(penpotBuildPath)}`
    ));
  }
} else {
  console.log(styleText(['yellow'],
    '[build-tokens] penpot json : (disabled — penpotBuildPath not set)'
  ));
}

console.log(styleText(['green'], `[build-tokens] ${customPropsCount} custom properties processed`));
console.log(styleText(['green'], '**** DONE ****'));
