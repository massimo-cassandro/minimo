import eslint_config from '@massimo-cassandro/eslint-config';

// https://github.com/cybozu/eslint-config
// import cybozuEslintConfigBaseline from '@cybozu/eslint-config/flat/presets/css-baseline.js';


export default [

  // ...cybozuEslintConfigBaseline.map((config) => ({
  //   ...config,
  //   files: ['**/*.css']
  // })),

  ...eslint_config,
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
