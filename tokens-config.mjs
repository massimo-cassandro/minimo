// path relativi a questo file

const config = {
  stylelintConfigPath: './stylelint.config.mjs',
  buildPath: './src',
  destFile: 'custom-properties.css',
  source: [
    './design-tokens-src/**/*.tokens.{mjs,jsonc}',
    '!./design-tokens-src/_cfg/**',
  ],

  penpotExpressions: 'resolve', // or 'calc' or 'keep'
  penpotFormat: 'jsonc',
  penpotBuildPath: './design-tokens',
  penpotDestFile: null,

  dir_to_check: './src',
  exclude_pattern: [
    /^--_/,
  ]
};

export default config;


