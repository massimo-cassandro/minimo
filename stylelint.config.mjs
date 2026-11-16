export default {
  extends: [
    './dev-tools/stylelint-config/index.js',
  ],

  // File da ignorare durante l'analisi
  ignoreFiles: [
    'node_modules/**/*.{css,scss}',
    'vendor/**/*.{css,scss}',
    'dist/**/*.css',
    'build/**/*.css',
    'public/**/*.css',
    'test/**/*.css',
    'docs/**/*.css',
    'demo/build/**/*.css',
    // cartelle/file con prefisso TODO: materiale in attesa di integrazione
    '**/TODO*/**',
    '**/TODO*',
  ],

  // Overrides
  rules: {

    // 'color-function-notation': null,

    //********************** opzionale per tailwind:
    // 'at-rule-no-unknown': [
    //   true,
    //   'value-keyword-case': null,
    //   '@stylistic/number-no-trailing-zeros': null
    // ],
    //********************** /tailwind
  }
};
