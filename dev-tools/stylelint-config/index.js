/** @type {import('stylelint').Config} */

const tailwindAtRules = ['tailwind', 'apply', 'layer', 'variants', 'responsive', 'screen', 'config'],
  postCSSRules = ['define-mixin', 'mixin'];

export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    '@stylistic/stylelint-config'
  ],
  plugins: [
    '@stylistic/stylelint-plugin'
  ],
  ignoreFiles: [
    'node_modules/**/*.*',
    'vendor/**/*.*',
    'build/**/*.*',
    'public/**/*.*',
    'templates/**/*.*',
    'dist/**/*.*'
  ],
  rules: {

    'alpha-value-notation': null,
    'at-rule-empty-line-before': null,
    'at-rule-no-vendor-prefix': true,
    'at-rule-no-unknown': [ true, { ignoreAtRules: [ ...tailwindAtRules, ...postCSSRules ] } ],
    'color-function-notation': 'modern',
    'color-named': 'never',
    'comment-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'custom-property-pattern': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'declaration-empty-line-before': null,
    'declaration-no-important': true,
    'font-family-name-quotes': 'always-where-recommended',
    'font-weight-notation': ['numeric', { ignore: ['relative'] }],
    'function-no-unknown': [true, { ignoreFunctions: ['theme'] }],
    'function-url-no-scheme-relative': true,
    'function-url-quotes': 'always',
    'hue-degree-notation': null,
    'import-notation': null,
    'max-nesting-depth': [3, {
      ignore: ['pseudo-classes', 'blockless-at-rules'],
      ignoreAtRules: [/media/, /include/],
      ignorePseudoClasses: ['before', 'after']
    }],
    'media-feature-range-notation': null,
    'media-query-no-invalid': null,
    'no-descending-specificity': null,
    'number-max-precision': null,
    'property-no-vendor-prefix': true,
    'rule-empty-line-before': null,
    'selector-attribute-quotes': 'always',
    'selector-class-pattern': ['^[a-z][a-z0-9\\-]*[a-z0-9]$', { resolveNestedSelectors: true }],
    'selector-max-attribute': 2,
    'selector-max-class': 4,
    'selector-max-combinators': 4,
    'selector-max-compound-selectors': 4,
    'selector-max-id': 0,
    'selector-max-specificity': null,
    'selector-max-type': [3, { ignore: ['child', 'compounded', 'descendant', 'next-sibling'] }],
    'selector-max-universal': 1,
    'selector-no-qualifying-type': null, // https://stylelint.io/user-guide/rules/selector-no-qualifying-type/
    'selector-no-vendor-prefix': true,
    'selector-not-notation': null,
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
    'shorthand-property-no-redundant-values': true,
    'value-keyword-case': ['lower', { ignoreKeywords: ['currentColor'] }],
    'value-no-vendor-prefix': true,

    // --- Stylistic ---
    '@stylistic/at-rule-name-space-after': 'always',
    '@stylistic/at-rule-semicolon-space-before': 'never',
    '@stylistic/block-closing-brace-empty-line-before': null,
    '@stylistic/block-closing-brace-newline-after': null,
    '@stylistic/block-opening-brace-space-before': null,
    '@stylistic/declaration-block-semicolon-newline-before': 'never-multi-line',
    '@stylistic/function-max-empty-lines': 2,
    '@stylistic/function-parentheses-space-inside': 'never-single-line',
    '@stylistic/max-empty-lines': 2,
    '@stylistic/max-line-length': null,
    '@stylistic/no-empty-first-line': null,
    '@stylistic/no-missing-end-of-source-newline': null,
    '@stylistic/number-leading-zero': 'never',
    '@stylistic/selector-list-comma-newline-after': 'always-multi-line',
    '@stylistic/selector-list-comma-newline-before': 'never-multi-line',
    '@stylistic/selector-list-comma-space-after': 'always-single-line',
    '@stylistic/selector-list-comma-space-before': 'never-single-line',
    '@stylistic/string-quotes': 'single',
    '@stylistic/unicode-bom': 'never',
    '@stylistic/value-list-comma-newline-after': 'always-multi-line',
    '@stylistic/value-list-comma-newline-before': 'never-multi-line',
    '@stylistic/value-list-comma-space-after': null,
    '@stylistic/value-list-max-empty-lines': 3
  },
  overrides: [
    {
      files: ['**/*.scss'],
      plugins: ['stylelint-scss'],
      extends: [
        'stylelint-config-standard-scss',
        'stylelint-config-recess-order'
      ],
      rules: {
        'no-invalid-position-at-import-rule': null,
        'scss/at-extend-no-missing-placeholder': null,
        'scss/at-function-named-arguments': 'never',
        'scss/at-function-parentheses-space-before': 'never',
        'scss/at-function-pattern': '^[a-z][a-z-]*$',
        'scss/at-if-closing-brace-newline-after': null,
        'scss/at-if-closing-brace-space-after': null,
        'scss/at-if-no-null': null,
        'scss/at-mixin-argumentless-call-parentheses': 'always',
        'scss/at-mixin-named-arguments': null,
        'scss/at-mixin-parentheses-space-before': 'never',
        'scss/at-mixin-pattern': null,
        'scss/at-rule-conditional-no-parentheses': null,
        'scss/load-no-partial-leading-underscore': true,
        'scss/load-partial-extension': 'never',

        'at-rule-no-unknown': null, // disabilita regola base per evitare conflitti
        'scss/at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: [
              ...tailwindAtRules,
              ...postCSSRules,
              // SCSS
              'extend', 'include', 'if', 'else', 'function', 'at-root',
              'use', 'forward', 'each', 'while', 'for', 'error', 'warn', 'debug', 'return'
            ]
          }
        ],
        'scss/comment-no-empty': null,
        'scss/dimension-no-non-numeric-values': true,
        'scss/dollar-variable-colon-space-after': 'at-least-one-space',
        'scss/dollar-variable-colon-space-before': 'never',
        'scss/dollar-variable-empty-line-before': null,
        'scss/dollar-variable-no-missing-interpolation': true,
        'scss/dollar-variable-pattern': '^[a-z][a-z-\\d]*$',
        'scss/double-slash-comment-empty-line-before': null,
        'scss/double-slash-comment-whitespace-inside': null,
        'scss/no-duplicate-dollar-variables': [
          null,
          { ignoreInsideAtRules: ['extend', 'if', 'mixin'] }
        ],
        'scss/no-duplicate-mixins': true,
        'scss/operator-no-newline-after': true,
        'scss/operator-no-newline-before': true,
        'scss/operator-no-unspaced': true
      }
    },
    {
      files: ['**/*.module.scss', '**/*.module.css'],
      extends: ['stylelint-config-css-modules'],
      rules: {
        'selector-class-pattern': [
          '^[a-z]+(_?[A-Z]?[a-z0-9]*)*$',
          {
            ignoreSelectors: [/:global/], // non funziona
            resolveNestedSelectors: true
          }
        ]
      }
    }
    // da testare
    // {
    //   files: ['**/*.module.scss', '**/*.module.css'],
    //   extends: ['stylelint-config-css-modules'],
    //   rules: {
    //     'selector-class-pattern': [
    //       '^([a-z][a-z0-9]*([A-Z][a-z0-9]*)*|[a-z][a-z0-9-]*)$',
    //       { resolveNestedSelectors: true }
    //     ],
    //     'selector-pseudo-class-no-unknown': [
    //       true,
    //       { ignorePseudoClasses: ['global', 'local'] }
    //     ]
    //   }
    // }
  ]
};
