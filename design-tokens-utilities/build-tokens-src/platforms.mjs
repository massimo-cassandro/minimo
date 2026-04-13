// build-tokens-src/platforms.mjs
// Builds and returns the `platforms` object for the Style Dictionary config.
//
// The `penpot` platform is included only if penpotBuildPath is set.
// Output format (json/jsonc) and file splitting are delegated to buildPenpotFiles().

import { buildPenpotFiles } from './formats/penpot.mjs';

// Transforms applied to the CSS platform
const CSS_TRANSFORMS = [
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

// Transforms applied to the Penpot platform.
// Kept minimal on purpose: Penpot expects original values (e.g. "16px" not "1rem")
// and alias references ({...}) must be preserved to maintain token links.
const PENPOT_TRANSFORMS = [
  'attribute/cti',
  'name/kebab',
  'color/css-modern',
];

/**
 * @param {object}          opts
 * @param {string}          opts.buildPath           Absolute path for CSS output directory
 * @param {string}          opts.destFile            CSS output filename (e.g. "tokens.css")
 * @param {string|null}     opts.penpotBuildPath     Absolute path for Penpot output (null = disabled)
 * @param {string|null}     opts.penpotDestFile      Base name for aggregated file; null = one file per source
 * @param {'json'|'jsonc'}  opts.penpotFormat        Output format for Penpot files
 * @param {string[]}        opts.concreteFilePaths   Concrete (expanded) source file paths for multi-file mode.
 *                                                   Collected from sd.allTokens after SD initialisation.
 *                                                   Ignored when penpotDestFile is set.
 * @param {'keep'|'calc'|'resolve'} opts.penpotExpressions  How to handle math expressions in dimension tokens.
 * @param {string[]}        opts.colorScalePrefixes  Color token prefixes for numeric scale zero-padding.
 * @returns {object} platforms object ready for Style Dictionary config
 */
export const buildPlatforms = ({
  buildPath,
  destFile,
  penpotBuildPath,
  penpotDestFile,
  penpotFormat,
  penpotExpressions = 'keep',
  colorScalePrefixes = [],
  concreteFilePaths = [],
}) => {
  const platforms = {
    css: {
      buildPath: buildPath + '/',
      transforms: CSS_TRANSFORMS,
      files: [
        {
          destination: destFile,
          format: 'css/variables-sorted',
          options: {
            outputReferences: true,
            showFileHeader: true,
            colorScalePrefixes,
          },
        },
      ],
    },
  };

  if (penpotBuildPath) {
    platforms.penpot = {
      buildPath: penpotBuildPath + '/',
      transforms: PENPOT_TRANSFORMS,
      files: buildPenpotFiles(concreteFilePaths, penpotDestFile, penpotFormat, penpotExpressions, colorScalePrefixes),
    };
  }

  return platforms;
};
