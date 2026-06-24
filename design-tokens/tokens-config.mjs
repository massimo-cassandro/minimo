// path relativi a questo file

const config = {
  stylelintConfigPath: '../stylelint.config.mjs',
  buildPath: '../src',
  destFile: 'custom-properties.css',
  source: [
    './_src/**/*.tokens.mjs',
    '!./_src/_cfg/**',
  ],

  penpotExpressions: 'resolve', // or 'calc' or 'keep'
  penpotFormat: 'jsonc',
  penpotBuildPath: './tokens',
  penpotDestFile: null,

  dir_to_check: '../src',
  exclude_pattern: [
    /^--_/,
  ]
};

export default config;


