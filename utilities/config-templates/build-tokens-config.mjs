import { homedir } from 'os';
import path from 'path';

// TODO spostare percorsi minimo su node modules
const minimo_path = path.resolve(homedir(), 'Sites/minimo');

const build_tokens_config = {
  stylelintConfigPath: '../../stylelint.config.mjs',
  buildPath: '../src/css',
  destFile: 'custom-properties.css',
  source: [
    path.join(minimo_path, '/src/tokens/*.jsonc'),
    './figma-tokens-OK/*.jsonc',
  ]

};

export default build_tokens_config;
