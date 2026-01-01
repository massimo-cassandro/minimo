export default {
  extends: [
    'stylelint-config-standard',
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

  // Override delle regole specifiche
  rules: {
    //********************** tailwind:
    // 'at-rule-no-unknown': [
    //   true,
    //   {
    //     // Permette le direttive Tailwind come @apply, @tailwind, ecc.
    //     ignoreAtRules: [
    //       'tailwind',
    //       'apply',
    //       'variants',
    //       'responsive',
    //       'screen'
    //     ]
    //   },
    //   'value-keyword-case': null,
    //   '@stylistic/number-no-trailing-zeros': null
    // ],
    //********************** /tailwind
  }
};
