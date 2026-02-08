export default {
  extends: [
    '@massimo-cassandro/stylelint-config',
  ],

  // File da ignorare durante l'analisi
  ignoreFiles: [
    'node_modules/**/*.{css,scss}',
    'vendor/**/*.{css,scss}',
    'templates/**/*.{css,scss}',
    'dist/**/*.css',
    'build/**/*.css',
    'public/**/*.css',
    'test/**/*.css'
  ],

  // Overrides
  rules: {
    //********************** optionally for tailwind:
    // 'at-rule-no-unknown': [
    //   true,
    //   'value-keyword-case': null,
    //   '@stylistic/number-no-trailing-zeros': null
    // ],
    //********************** /tailwind
  }
};
