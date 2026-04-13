// path relativi a questo file

const config = {
  stylelintConfigPath: './stylelint.config.mjs',
  buildPath: './src',
  destFile: 'custom-properties-default.css',
  source: [
    './design-tokens-src/**/*.tokens.{mjs,jsonc}',
    '!./design-tokens-src/_cfg/**',
  ],

  colorScalePrefixes: ['primary', 'secondary', 'neutral'],

  penpotExpressions: 'resolve', // or 'calc' or 'keep'
  penpotFormat: 'jsonc',
  penpotBuildPath: './design-tokens',
  penpotDestFile: null,

  custom_prop_file_path: './src/custom-properties-default.css',
  dir_to_check: './src', 
  exclude_pattern: [ 
    /^--_/,
  ]
};

export default config;


