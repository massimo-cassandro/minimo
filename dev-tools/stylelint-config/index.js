/** @type {import('stylelint').Config} */

import cssModulesClassPatternPlugin from './plugins/css-modules-class-pattern.js';

const tailwindAtRules = ['tailwind', 'apply', 'layer', 'variants', 'responsive', 'screen', 'config'],
  postCSSRules = ['define-mixin', 'mixin'],
  scssAtRules = [
    'extend', 'include', 'if', 'else', 'function', 'at-root',
    'use', 'forward', 'each', 'while', 'for', 'error', 'warn', 'debug', 'return'
  ],

  // pattern dei nomi di classe
  kebabCaseClassPattern = '^[a-z][a-z0-9\\-]*[a-z0-9]$',
  cssModulesClassPattern = '^[a-z]+(_?[A-Z]?[a-z0-9]*)*$';

/**
 * Regole di @stylistic/stylelint-plugin, indicate con il nome breve.
 * Da @stylistic v6 le regole con il nome base (`@stylistic/xxx`) leggono solo il CSS:
 * per i file SCSS vanno ripetute nel namespace `@stylistic/scss/xxx`, altrimenti
 * nei file SCSS valgono le impostazioni di @stylistic/stylelint-config e non queste.
 */
const stylisticRules = {
  'at-rule-name-space-after': 'always',
  'at-rule-semicolon-space-before': 'never',
  'block-closing-brace-empty-line-before': null,
  'block-closing-brace-newline-after': null,
  'block-opening-brace-space-before': null,
  'declaration-block-semicolon-newline-before': 'never-multi-line',
  'declaration-colon-newline-after': null,
  'function-max-empty-lines': 2,
  'function-parentheses-space-inside': 'never-single-line',
  'max-empty-lines': 2,
  'max-line-length': null,
  'no-empty-first-line': null,
  'no-missing-end-of-source-newline': null,
  'number-leading-zero': 'never',
  'selector-list-comma-newline-after': 'always-multi-line',
  'selector-list-comma-newline-before': 'never-multi-line',
  'selector-list-comma-space-after': 'always-single-line',
  'selector-list-comma-space-before': 'never-single-line',
  'string-quotes': 'single',
  'unicode-bom': 'never',
  'value-list-comma-newline-after': 'always-multi-line',
  'value-list-comma-newline-before': 'never-multi-line',
  'value-list-comma-space-after': null,
  'value-list-max-empty-lines': 3
};

/**
 * Aggiunge il prefisso indicato ai nomi delle regole
 * @param {string} prefix - Prefisso (es. `@stylistic/`, `@stylistic/scss/`)
 * @param {Object<string, any>} rules - Regole con il nome breve
 * @returns {Object<string, any>}
 */
const withPrefix = (prefix, rules) =>
  Object.fromEntries(Object.entries(rules).map(([name, value]) => [prefix + name, value]));

export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    '@stylistic/stylelint-config'
  ],
  plugins: [
    '@stylistic/stylelint-plugin',
    cssModulesClassPatternPlugin
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
    'selector-class-pattern': kebabCaseClassPattern,
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

    // --- Stylistic (CSS) ---
    ...withPrefix('@stylistic/', stylisticRules)
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
          { ignoreAtRules: [...tailwindAtRules, ...postCSSRules, ...scssAtRules] }
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
        'scss/operator-no-unspaced': true,

        // --- Stylistic (SCSS) ---
        ...withPrefix('@stylistic/scss/', stylisticRules)
      }
    },

    // --- CSS modules ---
    // Regole riprese da stylelint-config-css-modules v4.6.0
    // (https://github.com/pascalduez/stylelint-config-css-modules, licenza Unlicense)
    // e incorporate per non dipendere dal pacchetto (al 18/11/2026 non supporta ancora stylelint 18).
    // Differenze rispetto all'originale:
    // - a `at-rule-no-unknown` e `scss/at-rule-no-unknown` vengono aggiunte le at-rule ignorate
    //   dalla config di base, che altrimenti verrebbero sovrascritte;
    // - omessa `at-rule-empty-line-before`, disattivata nella config di base (con il pacchetto
    //   esterno, inserito tramite `extends`, l'impostazione della config di base aveva comunque la precedenza).
    {
      files: ['**/*.module.css', '**/*.module.scss'],
      rules: {
        'selector-pseudo-class-no-unknown': [
          true,
          { ignorePseudoClasses: ['export', 'import', 'global', 'local', 'external'] }
        ],
        'selector-type-no-unknown': [
          true,
          { ignore: ['custom-elements'], ignoreTypes: ['from'] }
        ],
        'property-no-unknown': [
          true,
          {
            ignoreProperties: ['composes', 'compose-with'],
            ignoreSelectors: [':export', /^:import/]
          }
        ],
        'at-rule-no-unknown': [
          true,
          { ignoreAtRules: [...tailwindAtRules, ...postCSSRules, 'value'] }
        ]
      }
    },
    {
      files: ['**/*.module.scss'],
      rules: {
        'at-rule-no-unknown': null,
        'scss/at-rule-no-unknown': [
          true,
          { ignoreAtRules: [...tailwindAtRules, ...postCSSRules, ...scssAtRules, 'value'] }
        ]
      }
    },

    // --- CSS modules: nomi delle classi (regola minimo) ---
    // Le classi del modulo devono essere in camelCase; le classi dentro :global() / :local()
    // (o dopo :global / :local senza parentesi, fino alla fine del selettore) possono seguire
    // anche il pattern kebab-case della config di base.
    // Vedi plugins/css-modules-class-pattern.js
    {
      files: ['**/*.module.css', '**/*.module.scss'],
      rules: {
        'selector-class-pattern': null,
        'minimo/css-modules-class-pattern': [
          cssModulesClassPattern,
          { wrappedPattern: `${kebabCaseClassPattern}|${cssModulesClassPattern}` }
        ]
      }
    }
  ]
};
