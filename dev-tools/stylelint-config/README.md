# Stylelint config

La mia configurazione di [stylelint](https://stylelint.io/),


## Utilizzo

Installare il pacchetto:

```bash
npm install @massimo-cassandro/minimo
```

Creare un file `stylelint.config.mjs` e aggiungere:

```javascript
export default {
  extends: [
    '@massimo-cassandro/minimo/stylelint-config',
  ],

  // File da ignorare
  ignoreFiles: [
    'node_modules/**/*.{css,scss}',
    'vendor/**/*.{css,scss}',
    'templates/**/*.{css,scss}',
    'dist/**/*.css',
    'build/**/*.css',
    'public/**/*.css',
    'test/**/*.css'
  ],

  // Override
  rules: {
    //********************** opzionale per tailwind:
    // 'at-rule-no-unknown': [
    //   true,
    //   'value-keyword-case': null,
    //   '@stylistic/number-no-trailing-zeros': null
    // ],
    //********************** /tailwind
  }
};
```

