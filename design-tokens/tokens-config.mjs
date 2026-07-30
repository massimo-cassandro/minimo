// alla paths relative to this file

// TODO commenti e spiegaziono

const config = {
  stylelintConfigPath: '../stylelint.config.mjs',
  buildPath: '../src',
  destFile: 'custom-properties.css',
  source: [
    './_src/**/*.tokens.mjs',
    '../src/**/*.tokens.mjs',

    // to use in your project, delete the previous entries and uncomment the following ones
    // 'path/to/node_modules/@massimo-cassandro/minimo/design-tokens/_src/**/*.tokens.mjs',
    // 'path/to/node_modules/@massimo-cassandro/minimo/src/**/*.tokens.mjs',
    // 'path/to/your/project/tokens/*.{jsonc,json,mjs}'
  ],

  // if true, custom properties already present in destFile are merged with the generated ones.
  // Custom properties already present in destFile take priority over the ones generated
  // by this build (manual overrides/additions are preserved across rebuilds)
  // Comments at end of custom properties are preserved, while full line ones will be lost.
  mergeCustomProps: false,

  // --------------------------------------
  // SETTINGS FOR PENPOT EXPORT
  // --------------------------------------
  penpotExpressions: 'resolve', // or 'calc' or 'keep'
  penpotFormat: 'jsonc',
  penpotBuildPath: './tokens',
  penpotDestFile: null,


  // --------------------------------------
  // SETTINGS FOR `CHECK-UNRESOLVED-PROPS`
  // --------------------------------------
  checkUnused: true,
  ignoreUnusedInNodeModules: true,

  // dir to check to get the list of used custom properties
  dirToCheck: '../src',

  // patterns of custom props to be exclued from check
  excludePattern: [
    /^--_/,
  ]
};

export default config;


