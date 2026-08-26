
// import path from 'path';

// path relativi a questo file

const config = {
  // build tokens
  stylelintConfigPath: '../../stylelint.config.mjs',
  buildPath: '../src/css',
  destFile: 'custom-properties.css',
  source: [
    '../../node_modules/@massimo-cassandro/minimo/design-tokens/_src/**/*.tokens.{mjs,jsonc}',
    './figma-tokens-OK/*.{jsonc,mjs}',
  ],

  colorScalePrefixes: ['primary', 'secondary', 'neutral'],

  penpotFormat: 'jsonc',
  penpotBuildPath: null,
  penpotDestFile: null,
  penpotExpressions: 'resolve',

  // ---------------------------------------------------------------------------
  // check-unresolved-custom-props.mjs settings
  // ---------------------------------------------------------------------------
  extra_custom_props_files: [],
  dir_to_check: '../src', // percorso della dir che include i css da analizzare
  exclude_pattern: [ // patterns per l'esclusione dal controllo unresolved-props
    /^--_/,
  ]
};

export default config;
