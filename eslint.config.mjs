import eslint_config from './dev-tools/eslint-config/index.js';

// https://github.com/cybozu/eslint-config
// import cybozuEslintConfigBaseline from '@cybozu/eslint-config/flat/presets/css-baseline.js';


export default [

  // ...cybozuEslintConfigBaseline.map((config) => ({
  //   ...config,
  //   files: ['**/*.css']
  // })),

  ...eslint_config,

  // cartelle/file con prefisso TODO: materiale in attesa di integrazione, escluso dal lint
  {
    ignores: ['**/TODO*/**', '**/TODO*'],
  },
  // {
  //   files: ['src/**/*.js'],
  //   ignores: [
  //     'dist/',
  //     'build/',
  //     '**/vendor/'
  //   ],
  // }
  // {
  //   languageOptions: {
  //     globals: {
  //       jQuery: 'readonly',
  //       $: 'readonly',
  //     },
  //   },
  // },
];
