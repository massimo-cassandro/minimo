// build-tokens-src/platforms.mjs
// Builds and returns the `platforms` object for the Style Dictionary config.
//
// The `json` platform is included only if jsonBuildPath is set.
// Output format (json/jsonc) and file splitting are delegated to buildJsonFiles().

import { buildJsonFiles } from './formats/json.mjs';

/** @typedef {import('style-dictionary/types').PlatformConfig} PlatformConfig */

// Transforms applied to the CSS platform.
// Exported so other scripts (e.g. check-unresolved-custom-props.mjs) can
// build a Style Dictionary instance with matching transformed token names.
export const CSS_TRANSFORMS = [
  'attribute/cti',
  'name/kebab',
  'time/seconds',
  'asset/url',
  'size/pxToRem-smart',
  'color/css-modern',
  'shadow/css',
  'gradient/css',
  'composite/css',
  'typography/css',
];

// Transforms applied to the JSON platform.
// Kept minimal on purpose: consuming tools expect original values (e.g. "16px"
// not "1rem") and alias references ({...}) must be preserved to maintain
// token links.
const JSON_TRANSFORMS = [
  'attribute/cti',
  'name/kebab',
  'color/css-modern',
];

/**
 * @param {object}          opts
 * @param {string}          opts.buildPath           Absolute path for CSS output directory
 * @param {string}          opts.destFile            CSS output filename (e.g. "tokens.css")
 * @param {string|null}     opts.jsonBuildPath       Absolute path for JSON output (null = disabled)
 * @param {string|null}     opts.jsonDestFile        Base name for aggregated file; null = one file per source
 * @param {'json'|'jsonc'}  opts.jsonFormat          Output format for JSON files
 * @param {string[]}        opts.concreteFilePaths   Concrete (expanded) source file paths for multi-file mode.
 *                                                   Collected from sd.allTokens after SD initialisation.
 *                                                   Ignored when jsonDestFile is set.
 * @param {'keep'|'calc'|'resolve'} opts.jsonExpression  How to handle math expressions in dimension tokens.
 * @param {{name: string, prefixes: string[]}[]} opts.customPropsGroups  Named groups of name prefixes, moved to the top of the CSS output in list order.
 * @param {boolean}         opts.pxToRem             If false, skips the px→rem transform on the CSS platform. Default: true.
 * @returns {Record<string, PlatformConfig>} platforms object ready for Style Dictionary config
 */
export const buildPlatforms = ({
  buildPath,
  destFile,
  jsonBuildPath,
  jsonDestFile,
  jsonFormat,
  jsonExpression = 'keep',
  concreteFilePaths = [],
  customPropsGroups = [],
  pxToRem = true,
}) => {
  const cssTransforms = pxToRem
    ? CSS_TRANSFORMS
    : CSS_TRANSFORMS.filter((name) => name !== 'size/pxToRem-smart');

  /** @type {Record<string, PlatformConfig>} */
  const platforms = {
    css: {
      buildPath: buildPath + '/',
      transforms: cssTransforms,
      files: [
        {
          destination: destFile,
          format: 'css/variables-sorted',
          options: {
            outputReferences: true,
            showFileHeader: true,
            customPropsGroups,
          },
        },
      ],
    },
  };

  if (jsonBuildPath) {
    platforms.json = {
      buildPath: jsonBuildPath + '/',
      transforms: JSON_TRANSFORMS,
      files: buildJsonFiles(concreteFilePaths, jsonDestFile, jsonFormat, jsonExpression),
    };
  }

  return platforms;
};
