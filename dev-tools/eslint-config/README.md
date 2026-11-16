# Eslint config

La mia configurazione di [eslint](https://eslint.org/).


## Utilizzo

Installare il pacchetto (`eslint` e i pacchetti richiesti dalla configurazione sono già inclusi nelle `dependencies` di minimo):

```bash
npm install @massimo-cassandro/minimo
```

Creare un file `eslint.config.mjs` (o usare qualsiasi altro nome e sintassi, seguendo le istruzioni su <https://eslint.org/docs/latest/use/configure/configuration-files>) e aggiungere:

```javascript
import eslint_config from '@massimo-cassandro/minimo/eslint-config';

// FACOLTATIVO
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
```
