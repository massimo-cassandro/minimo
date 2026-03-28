// import path from 'path';

const build_tokens_config = {
  stylelintConfigPath: '../../stylelint.config.mjs',
  buildPath: '../../src',
  destFile: 'custom-properties-default.css',
  source: [
    '../../src/tokens/*.jsonc',
  ]

};

export default build_tokens_config;
