# Stylelint config

My [stylelint](https://stylelint.io/) config,


## Use

Install package:

```bash
npm install @massimo-cassandro/minimo
```

Create a `stylelint.config.mjs` file and add:

```javascript
export default {
  extends: [
    '@massimo-cassandro/minimo/stylelint-config',
  ],

  // Files to be ignored
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
```

