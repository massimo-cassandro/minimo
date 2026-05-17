// build-tokens-src/config.mjs
// Reads the --config flag from argv, imports the project config file,
// resolves all paths and exports them for build-tokens.mjs.
//
// Keeping this logic separate from the entry point makes it easier to test
// and reuse in other scripts.

/* globals process */

import path from 'path';
import { pathToFileURL } from 'url';

// ---------------------------------------------------------------------------
// Read the --config flag
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
// Import the project config
// ---------------------------------------------------------------------------
const buildConfig = (await import(pathToFileURL(configAbsPath))).default;

// Helper: resolves a path relative to the config directory.
// Leaves already-absolute paths untouched.
const resolveFromConfig = (p) => path.resolve(configDir, p);

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

// CSS output
export const buildPath = resolveFromConfig(buildConfig.buildPath);
export const destFile  = buildConfig.destFile;

// Stylelint
export const stylelintConfigPath = resolveFromConfig(buildConfig.stylelintConfigPath);

// Penpot — platform is active only if penpotBuildPath is set in the config
const penpotBuildPathRaw = buildConfig.penpotBuildPath ?? null;
export const penpotBuildPath = penpotBuildPathRaw ? resolveFromConfig(penpotBuildPathRaw) : null;

// penpotDestFile: base name (no extension) for the aggregated output file.
// null  → one file per source (mirrors the source structure)
// string → single aggregated file (e.g. 'tokens' → 'tokens.jsonc')
// The extension is added automatically based on penpotFormat.
export const penpotDestFile = buildConfig.penpotDestFile ?? null;

// penpotFormat: controls output format for Penpot token files.
// 'jsonc' → .jsonc extension + generated-file disclaimer header
// 'json'  → plain .json, no disclaimer
// Any value other than 'jsonc' is normalised to 'json'.
export const penpotFormat = buildConfig.penpotFormat === 'jsonc' ? 'jsonc' : 'json';

// penpotExpressions: controls how math expressions in dimension token values are handled.
//   'keep'    (default) — write the expression as-is
//   'calc'    — wrap in CSS calc()
//   'resolve' — evaluate numerically; unit inherited from the first referenced token
const VALID_EXPR_MODES = ['keep', 'calc', 'resolve'];
export const penpotExpressions = VALID_EXPR_MODES.includes(buildConfig.penpotExpressions)
  ? buildConfig.penpotExpressions
  : 'resolve';

// ---------------------------------------------------------------------------
// Source: resolve patterns relative to the config directory and normalise to
// forward-slash absolute paths (fast-glob, used internally by Style Dictionary,
// requires forward slashes even on Windows).
//
// Glob patterns (containing *, ?, {, [) are NOT passed through path.join,
// because path.join can normalise/collapse sequences that carry syntactic
// meaning in a glob (e.g. "**"). They are only prefixed with configDir and
// converted to forward slashes.
// Concrete paths (no glob characters) are resolved canonically with path.resolve.
//
// WARNING: in the project config file, avoid building glob patterns with
// path.join() — it may corrupt the pattern syntax. Use template literals:
//   OK:  `${minimo_path}/**/*.{json,mjs}`
//   NO:  path.join(minimo_path, '/**/*.{json,mjs}')
// ---------------------------------------------------------------------------
const GLOB_CHARS = /[*?{[]/;

const resolveSource = (s) => {
  if (path.isAbsolute(s)) {
    // Already absolute: only normalise separators (needed on Windows)
    return s.split(path.sep).join('/');
  }
  if (GLOB_CHARS.test(s)) {
    // Glob pattern: prefix with configDir without touching the pattern
    const prefix = configDir.split(path.sep).join('/');
    return `${prefix}/${s}`;
  }
  // Concrete relative path: canonical resolution
  return path.resolve(configDir, s).split(path.sep).join('/');
};

export const source = buildConfig.source.map(resolveSource);
