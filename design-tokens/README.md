# Using Design Tokens

<!-- TODO intro -->


## tokens config template

<!-- TODO indicare che volendo ridurre il numero dei tokens si può sostituire 
alla seconda riga di source solo quelli realmente utilizzati (ora tutti commentati) -->

```js
// path relativi a questo file

const pathToMinimo = '../../node_modules/@massimo-cassandro/minimo';

const config = {
  // build tokens
  stylelintConfigPath: 'path/to/stylelint.config.mjs',
  buildPath: 'path/to/build/dir',
  destFile: 'path/to/custom-properties.css',
  source: [
    `${pathToMinimo}/design-tokens/_src/**/*.tokens.{mjs,jsonc}`,
    
    `${pathToMinimo}/src/**/*.tokens.{mjs,jsonc}`,

    // `${pathToMinimo}/src/components/inner-nav/inner-nav.minimo.tokens.mjs`,
    // `${pathToMinimo}/src/components/modal-alert/modal-alert.minimo.tokens.mjs`,
    // `${pathToMinimo}/src/components/sf-macro/sf-macro.minimo.tokens.mjs`,
    // `${pathToMinimo}/src/components/slide-up-down-toggle/slide-up-down-toggle.minimo.tokens.mjs`,
    // `${pathToMinimo}/src/components/snackbar/snackbar.minimo.tokens.mjs`,
    // `${pathToMinimo}/src/components/spinner/spinner.minimo.tokens.mjs`,
    // `${pathToMinimo}/src/components/unsplash-page/unsplash-page.minimo.tokens.mjs`,
    // `${pathToMinimo}/src/web-components/s-datatable-component/simple-datatable.minimo.tokens.mjs`,

    'path/to/project-tokens/*.{jsonc,mjs}',
  ],

  colorScalePrefixes: ['primary', 'secondary', 'neutral'],

  penpotFormat: 'jsonc',
  penpotBuildPath: null,
  penpotDestFile: null,
  penpotExpressions: 'resolve',

  // ---------------------------------------------------------------------------
  // check-unresolved-custom-props.mjs settings
  // ---------------------------------------------------------------------------
  extra_custom_props_files: [],
  dir_to_check: '../src', // percorso della dir che include i css da analizzare
  exclude_pattern: [ // patterns per l'esclusione dal controllo unresolved-props
    /^--_/,
  ]
};

export default config;
```
