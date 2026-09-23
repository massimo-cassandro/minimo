// build-tokens-src/build-source-modes.mjs
// Alternative build path used when the project config sets `sourceModes`
// (see config.mjs) instead of a single `source` array — typically for a
// light/dark custom-properties split.
//
// For each mode, a separate StyleDictionary instance is built from that
// mode's own `source` array. The generated `:root { ... }` CSS blocks are
// then composed into a single destFile:
//   - the base mode's block stays as a plain `:root { ... }` rule, with a
//     `color-scheme: <all modes joined>;` declaration prepended
//     (e.g. "light dark")
//   - every other mode's block is wrapped in
//     `@media (prefers-color-scheme: <mode>) { :root { ... } }`, with a
//     `color-scheme: <mode>;` declaration prepended
// customPropsGroups, mergeCustomProps and pxToRem apply per mode, exactly as
// in the single-source build. addLayer (if set) wraps the whole composed
// result in a single `@layer`, rather than one per mode.
//
// JSON tokens (if jsonBuildPath is set) are produced per mode: one set of
// files per mode, with `-<mode>` appended to each filename (see
// buildJsonFiles() in formats/json.mjs), e.g. "tokens-light.jsonc" /
// "tokens-dark.jsonc", or "size-light.jsonc" / "size-dark.jsonc" in
// multi-file mode (jsonDestFile: null).

import StyleDictionary from 'style-dictionary';
import * as path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { CSS_TRANSFORMS, JSON_TRANSFORMS } from './platforms.mjs';
import { customPropsCount } from './formats/css.mjs';
import { buildJsonFiles, collectConcreteFilePaths } from './formats/json.mjs';
import { loadExistingCustomPropsScoped } from './merge-css.mjs';
import { LEGACY_TOKENS_PARSER_NAME } from './legacy-tokens-parser.mjs';

/**
 * @param {object}                 opts
 * @param {Record<string,string[]>} opts.sourceModes    Resolved source paths per mode (see config.mjs)
 * @param {string}                 opts.baseMode        Mode whose block stays a top-level `:root { ... }` rule
 * @param {string}                 opts.buildPath        Absolute path for CSS output directory
 * @param {string}                 opts.destFile         CSS output filename
 * @param {string|null}            opts.jsonBuildPath    Absolute path for JSON output (null = disabled)
 * @param {string|null}            opts.jsonDestFile     Base name for aggregated JSON file; null = one file per source
 * @param {'json'|'jsonc'}         opts.jsonFormat        Output format for JSON files
 * @param {'keep'|'calc'|'resolve'} opts.jsonExpression   How to handle math expressions in dimension tokens
 * @param {{name:string,prefixes:string[]}[]} opts.customPropsGroups
 * @param {boolean}                opts.pxToRem
 * @param {string|null}            opts.addLayer
 * @param {boolean}                opts.mergeCustomProps
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
}) => {
  const modeNames = Object.keys(sourceModes);

  // Read the pre-existing destFile (if any) BEFORE any Style Dictionary
  // instance runs, since the first one to write would overwrite it.
  if (mergeCustomProps) {
    loadExistingCustomPropsScoped(path.join(buildPath, destFile), baseMode);
  }

  const cssTransforms = pxToRem
    ? CSS_TRANSFORMS
    : CSS_TRANSFORMS.filter((name) => name !== 'size/pxToRem-smart');

  /** @type {Record<string,string>} */
  const modeBlocks = {};
  let totalCustomProps = 0;
  /** @type {Record<string, object[]>} */
  const jsonFilesByMode = {};

  for (const mode of modeNames) {
    // Non-base modes may reference base-mode tokens (always defined, since
    // the base block is the unconditional top-level `:root`). The base
    // sources are passed as `include`: available for reference resolution
    // but flagged isSource: false, and skipped by the css/json formats.
    // Base-mode-only on purpose: a reference to a token that exists only in
    // another `@media` block would build fine but be undefined at runtime.
    const include = mode === baseMode ? [] : sourceModes[baseMode];

    const sd = new StyleDictionary({
      include,
      source: sourceModes[mode],
      parsers: [LEGACY_TOKENS_PARSER_NAME],
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
                customPropsGroups,
                mode,
                colorScheme: mode === baseMode ? modeNames.join(' ') : mode,
              },
            },
          ],
        },
      },
    });

    // formatPlatform() runs the format function without writing to disk —
    // the composed multi-mode file is written once, at the end, below.
    const [formatted] = await sd.formatPlatform('css');
    modeBlocks[mode] = /** @type {string} */ (formatted.output);
    // customPropsCount is a live binding, updated synchronously by the
    // format function called above (see formats/css.mjs).
    totalCustomProps += customPropsCount;

    if (jsonBuildPath) {
      const concreteFilePaths = jsonDestFile ? [] : await collectConcreteFilePaths(sd);
      const files = buildJsonFiles(concreteFilePaths, jsonDestFile, jsonFormat, jsonExpression, `-${mode}`);

      const jsonSd = new StyleDictionary({
        include,
        source: sourceModes[mode],
        parsers: [LEGACY_TOKENS_PARSER_NAME],
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

  // ── Compose the final CSS ────────────────────────────────────────────────
  const otherModes = modeNames.filter((mode) => mode !== baseMode);

  let composed = modeBlocks[baseMode];
  for (const mode of otherModes) {
    composed += `\n@media (prefers-color-scheme: ${mode}) {\n${modeBlocks[mode]}}\n`;
  }

  // addLayer wraps the whole composed result once, rather than once per
  // mode. Indentation is left to stylelint's fix step (run right after the
  // build), same as the single-source build.
  const finalCss = addLayer
    ? `@layer ${addLayer} {\n\n${composed}}\n`
    : composed;

  await mkdir(buildPath, { recursive: true });
  const cssDestPath = path.join(buildPath, destFile);
  await writeFile(cssDestPath, finalCss);

  return { cssDestPath, totalCustomProps, jsonFilesByMode };
};
