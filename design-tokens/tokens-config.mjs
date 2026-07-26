// path relativi a questo file

const config = {
  stylelintConfigPath: '../stylelint.config.mjs',
  buildPath: '../src',
  destFile: 'custom-properties.css',
  source: [
    './_src/**/*.tokens.mjs',
    '../src/**/*.tokens.mjs',
  ],

  penpotExpressions: 'resolve', // or 'calc' or 'keep'
  penpotFormat: 'jsonc',
  penpotBuildPath: './tokens',
  penpotDestFile: null,

  // if true, custom properties already present in destFile are merged with the generated ones.
  // Custom properties already present in destFile take priority over the ones generated
  // by this build (manual overrides/additions are preserved across rebuilds)
  // Comments at end of custom prpperties are preserved, while full line ones will be lost.
  mergeCustomProps: false,

  dir_to_check: '../src',
  exclude_pattern: [
    /^--_/,
  ]
};

export default config;


