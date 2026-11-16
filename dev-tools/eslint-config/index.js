import eslint_js from '@eslint/js';
import globals from 'globals';


export default [
  eslint_js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.jsx'],
    name: '@massimo-cassandro/eslint-config',

    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser
      }
    },

    rules: {
      'indent': [
        'error',
        2,
        {
          'SwitchCase': 1,
          'ignoredNodes': ['TemplateLiteral *']
        }
      ],
      'linebreak-style': [
        'error',
        'unix'
      ],
      'quotes': [
        'warn',
        'single'
      ],
      'semi': [
        'error',
        'always'
      ],
      'eqeqeq': ['warn', 'always', {'null': 'ignore'}],
      'no-extra-boolean-cast': 'off',
      'no-extra-semi': 'error',
      'no-throw-literal': 'off',
      'semi-spacing': ['error', {
        'before': false,
        'after': true
      }],
      'no-console': 'warn',
      'no-unused-vars': ['error', {
        'vars': 'all',
        'args': 'after-used',
        'argsIgnorePattern': '^_',
        'ignoreRestSiblings': false
      }],
      'import/no-anonymous-default-export': 0
    }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  },

];
