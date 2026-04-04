
import { homedir } from 'os';
import path from 'path';

// TODO spostare percorsi minimo su node modules
const minimo_path = path.resolve(homedir(), 'Sites/minimo');

// path relativi a questo file

const config = {
  // build tokens
  stylelintConfigPath: '../../stylelint.config.mjs',
  buildPath: '../src/css', // dir in cui salvare il file generato da style dictionary
  destFile: 'custom-properties.css', // nome del file generato da style dictionary
  // tokens files
  source: [
    // '../../node_modules/open-props/open-props.style-dictionary-tokens.json',
    path.join(minimo_path, '/design-tokens/*.jsonc'),
    './figma-tokens-OK/*.jsonc',
  ],

  // eventuali file aggiuntivi con custim props utilizzate nel progetto
  extra_custom_props_files: [
    // '../../node_modules/open-props/open-props.min.css'
  ],
  dir_to_check: '../../src', // percorso della dir che include i css da analizzare
  exclude_pattern: [ // patterns per l'esclusione dal controllo di alcune custom props
    /^--_/,
  ]
};

export default config;
