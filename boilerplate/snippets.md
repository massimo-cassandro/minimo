# Setup snippets

## root

### .browserslistrc

```bash
echo "# https://github.com/browserslist/browserslist
# https://browsersl.ist/

last 2 major versions
since 2023
not dead

not op_mini all
not op_mob > 0
not and_uc > 0
not and_qq > 0
not baidu > 0
not kaios > 0
not android > 0
not ie > 0
not ie_mob > 0
not bb > 0

safari >= 16
ios_saf >= 16
edge >= 109
chrome >= 109
firefox esr
opera >= 95
samsung >= 20

> 3% in IT
" > .browserslistrc
```

### .editorconfig

```bash
echo "# https://editorconfig.org

# top-most EditorConfig file
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
max_line_length = off
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 4
" > .editorconfig
```

### .gitignore


```bash
echo "*~
.DS_Store
**/*.mwb.bak
**/*.mwb.beforefix

vendor

# local env
# .env
.env.dev
.env.local
.env.development
.env.test
.env.development.local
.env.test.local
.env.production.local

# frontend
node_modules
_private
public/_dev
" > .gitignore
```

### .prettierrc

```bash
echo "{
  "endOfLine": "lf",
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true
}
" > .prettierrc
```

## css reset
* <https://www.joshwcomeau.com/css/custom-css-reset/#the-css-reset-1>
* <https://meyerweb.com/eric/tools/css/reset/>

## dev-updater
* <https://github.com/massimo-cassandro/dev-updater>
* `"UPD-version": "npx update-version  # --config=./dev-utilities.config.mjs",`
* `"upd@m": "npx upd@m",`

```bash
npm i -D @massimo-cassandro/dev-updater
```

## eslint9 (+ uninstall)


```bash
npm uninstall eslint @eslint/js globals @massimo-cassandro/eslint-config
```


```bash
npm i -D eslint@^9 @eslint/js globals && npm i -D @massimo-cassandro/eslint-config@^2
```


*eslint.config.mjs*:

```bash
echo "import eslint_config from '@massimo-cassandro/eslint-config';

export default [
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
" > eslint.config.mjs
```


## jsconfig.json
*jsconfig.json*:

```bash
echo "{
  "__help": "https://code.visualstudio.com/docs/languages/jsconfig",
  "compilerOptions": {
    "target": "es2023",
    "baseUrl": ".",
    "module": "ES6",
    "allowSyntheticDefaultImports": false,
    "paths": {
      "@frontend/*": ["./frontend/*"],
      "@src/*": ["frontend/src/*"],
      "@minimo/*": ["./frontend/minimo/*"],
      "@imgs/*": ["./frontend/imgs/*"],
      "@icone/*": ["./frontend/icone/*"],
      "@backoffice/*": ["./frontend/backoffice/*"]
    }
  },
  "exclude": ["node_modules", "dist", "docs", "build", "public"]
}
" > jsconfig.json
```


## Local servers
* `"python server": "python3 -m http.server 8000 # --directory __dirname__ # 8000 = default port",`
* `"php server": "php -S localhost:8000 # -t root_dir/",`
* `"symfony local server": "symfony serve -d",`
* node serve # npm i serve

## open-props + postcss-jit-props

```bash
npm i -S open-props && npm i -D postcss-jit-props
```


*postcss.config.cjs*:

```bash
echo "/* eslint-env node */

// const path = require('path');


const isDevelopment = process.env.NODE_ENV === 'development';

const postcssConfig = {
  plugins: [

    // NB: percorsi dalla root
    require('@csstools/postcss-global-data')({
      files: [
        './node_modules/open-props/media.min.css',
        './frontend/src/config/custom-properties.css',
      ]
    }),

    // https://github.com/GoogleChromeLabs/postcss-jit-props
    // https://github.com/argyleink/open-props
    // require('postcss-jit-props')(require('open-props')),
    require('postcss-jit-props')({
      ...require('open-props'),
      custom_selector: ':where(html)'
    }),

    // per IOS < 17 (test)
    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting
    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-light-dark-function#readme
    // require('postcss-nesting')({
    //  edition: '2021',
    //  noIsPseudoSelector: true
    //}),
    // require('@csstools/postcss-light-dark-function')({preserve: false}), /* NB non funziona benissimo... */

    require('autoprefixer'),

    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-media
    require('postcss-custom-media')({
      preserve: isDevelopment
    }),

    // https://purgecss.com/configuration.html
    // require('@fullhuman/postcss-purgecss')({
    //   content: [
    //     // './node_modules/@massimo-cassandro/**/.js',
    //     './templates/**/*.html.twig',
    //     './public/**/*.html',
    //     './src/**/*.{js,jsx}',
    //   ],
    //   // css: ['./src/css/custom-properties-figma.css'],
    //   // output: ['./AppBundle/Resources/public/css/'],
    //   // variables: true,
    //   // fontFace: true,
    //   // keyframes: true,
    //   safelist: {
    //     standard: [/:focus$/],
    //     // deep: [],
    //     // greedy: [/yellow$/]
    //   }
    // }),

  ]
};

if (process.env.NODE_ENV === 'production') {
  postcssConfig.plugins.push(

    // per IOS < 17
    // require('postcss-nesting')({
    //  edition: '2021',
    //  noIsPseudoSelector: true
    //}),
    // require('@csstools/postcss-light-dark-function'), /* NB non funziona benissimo... */

    // https://github.com/cssnano/cssnano
    require('cssnano')({
      // use the safe preset so that it doesn't
      // mutate or remove code from our css
      preset: 'default',
    })
  );
}

module.exports = postcssConfig;

" > postcss.config.cjs
```


## postcss cli
* Per creare file css di test.
* *postcss-import* è necessario per risolvere le importazioni da cli (con webpack non serve, l’operazione è svolta da *css-loader*)
* `"build css test": "npx postcss ./src/source.css -o ./test/test.css --no-map --verbose --env development --config ./ --use postcss-import --watch",`

```bash
npm i -D postcss-cli postcss-import
```

## sass cli

```bash
npm i -D sass
```

## stylelint
* `## upd config file:`
* `mv -f .stylelintrc.cjs stylelint.config.cjs`


```bash
npm uninstall @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint @massimo-cassandro/stylelint-config
```

```bash
npm i -D @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint && npm i -D @massimo-cassandro/stylelint-config
```


*stylelint.config.cjs*:

```bash
echo "/* eslint-env node */\n\nmodule.exports = {\n  extends: [\n    '@massimo-cassandro/stylelint-config',\n    // 'stylelint-config-css-modules'\n  ],\n  ignoreFiles: [\n    'node_modules/**/*.{css,scss}',\n    'vendor/**/*.{css,scss}',\n    'templates/**/*.{css,scss}',\n    'dist/**/*.css',\n    'build/**/*.css',\n    'public/**/*.css',\n    'test/**/*.css'\n  ],\n\n  // tailwind\n  // 'rules': {\n  //   'value-keyword-case': null,\n  //   '@stylistic/number-no-trailing-zeros': null\n  // }\n};\n" > stylelint.config.cjs
```

*stylelint.config.mjs*:

```bash
echo "export default {
  // Estende la configurazione base e quella specifica per Tailwind
  extends: [
    '@massimo-cassandro/stylelint-config',
    'stylelint-config-standard', // Consigliato per le regole standard moderne
    'stylelint-config-tailwindcss' // Configurazione specifica per Tailwind CSS
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
    // Disabilita le regole che potrebbero entrare in conflitto con la sintassi di Tailwind
    // Queste sono spesso coperte da 'stylelint-config-tailwindcss' ma è una buona pratica
    // mantenerle se si notano falsi positivi.
    'at-rule-no-unknown': [
      true, 
      {
        // Permette le direttive Tailwind come @apply, @tailwind, ecc.
        ignoreAtRules: [
          'tailwind', 
          'apply', 
          'variants', 
          'responsive', 
          'screen'
        ]
      }
    ],

    // Regole che erano presenti nel tuo config originale (se vuoi riattivarle)
    // 'value-keyword-case': null,
    // 'number-no-trailing-zeros': null,
  }
};" > stylelint.config.cjs
```



## webhint

```bash
npm i -D hint
```


*.hintrc.cjs*:

```bash
echo "module.exports = {
  "connector": {
    "name": "local",
    "options": {
      "pattern": ["./build/**/*.html"] // Analizza i file HTML generati nella directory di build
    }
  },
  "extends": [
    "development", // Configurazione base per lo sviluppo
    "accessibility", // Regole per l'accessibilità
    "performance", // Regole per le prestazioni
    "security", // Regole per la sicurezza
    "html-checker" // Controllo della validità HTML
  ],
  "hints": {
    "axe": "error", // Controlla l'accessibilità con axe-core
    "content-type": "error", // Verifica i tipi di contenuto corretti
    "disown-opener": "warning", // Consiglia di usare `rel="noopener"`
    "http-cache": ["warning", { "maxAge": 31536000 }], // Suggerisce una cache HTTP ottimale
    "image-optimization-cloudinary": "off", // Disattiva l'ottimizzazione delle immagini
    "meta-viewport": "error", // Verifica la presenza del meta tag viewport
    "no-vulnerable-javascript-libraries": "error", // Controlla librerie JS vulnerabili
    "performance-budget": [
      "warning",
      {
        "resourceTypes": {
          "script": 250, // Limite di 250 KB per gli script
          "image": 500 // Limite di 500 KB per le immagini
        }
      }
    ],
    "strict-transport-security": "error", // Suggerisce l'uso di HSTS
    "validate-set-cookie-header": "error" // Controlla l'uso corretto dell'header Set-Cookie
  }
};
" > .hintrc.cjs
```


## webpack

```javascript
{
"webpack DEV": "NODE_ENV=development webpack serve --config ./webpack.config.cjs #--open-app-name 'Google Chrome'",
"webpack DEV": "rm -rf ./public/dev && NODE_ENV=development webpack --config ./webpack.config.cjs",
"webpack PROD": "NODE_ENV=production webpack --config ./webpack.config.cjs"
}
```

```bash
npm i -D @babel/core @babel/preset-env babel-loader copy-webpack-plugin css-loader css-minimizer-webpack-plugin dotenv-webpack html-loader html-webpack-plugin mini-css-extract-plugin mini-svg-data-uri postcss-preset-env style-loader terser-webpack-plugin && npm i -D webpack-cli webpack-dev-server webpack-manifest-plugin webpack
```

### postcss + plugins (webpack)

```bash
npm i -D postcss autoprefixer postcss-custom-media @csstools/postcss-global-data postcss-loader 
```

### responsive-loader

```bash
npm i -D responsive-loader 
```

### webpack-remove-empty-scripts
* <https://github.com/webdiscus/webpack-remove-empty-scripts#readme>

```bash
npm i -D webpack-remove-empty-scripts
```

### sass per webpack

```bash
npm i -D sass-loader sass
```
### html-webpack-inject-preload
* <https://github.com/principalstudio/html-webpack-inject-preload#readme>

```bash
npm i -D @principalstudio/html-webpack-inject-preload
```

## auto-datatables-bs5
* <https://github.com/massimo-cassandro/auto-datatables-bs5>

```bash
npm i -S @massimo-cassandro/auto-datatables-bs5 datatables.net@^1,datatables.net-bs5@^1
```

## autocomplete
* <https://github.com/massimo-cassandro/autocomplete>

```bash
npm i -S @massimo-cassandro/autocomplete
```

## bootstrap

```bash
npm i -S bootstrap
```

## ckeditor-utilities
* <https://github.com/massimo-cassandro/ckeditor-utilities>

```bash
npm i -S @massimo-cassandro/ckeditor-utilities
```

## create-favicons
* <https://github.com/massimo-cassandro/create-favicons>
* `npx create-favicons init`
* `npx create-favicons --dir=./`

```bash
npm i -D @massimo-cassandro/create-favicons
```

## eslint 8

```bash
npm i -D eslint@^8 && npm i -D @massimo-cassandro/eslint-config@^1
```

## gulp per icone
* `"build_icons": "cd ./path/to/icone && gulp",`

```bash
npm i -D gulp@latest gulp-concat gulp-dom gulp-flatmap gulp-inject-string gulp-rename gulp-replace gulp-svgmin gulp-svgstore gulp-wrap
```

## gulp-jsbeautifier (aggiunta per icone react)

```bash
npm i -D gulp-jsbeautifier
```

## gulp-wrap (aggiunta per icone react)

```bash
npm i -D gulp-wrap
```

## html-react-parser

```bash
npm i -D html-react-parser
```

## js-file-uploader
* <https://massimo-cassandro.github.io/js-file-uploader/demo/>
* <https://github.com/massimo-cassandro/js-file-uploader>

```bash
npm i -S @massimo-cassandro/js-file-uploader
```

## js-utilities
* <https://github.com/massimo-cassandro/js-utilities>

```bash
npm i -S @massimo-cassandro/js-utilities
```


## json-table
* <https://github.com/massimo-cassandro/json-table>

```bash
npm i -S @massimo-cassandro/json-table
```


## layout-tools
* <https://github.com/massimo-cassandro/layout-tools>

```bash
npm i -D @massimo-cassandro/layout-tools
```


## modal-alert
* <https://github.com/massimo-cassandro/modal-alert>

```bash
npm i -S @massimo-cassandro/modal-alert
```


## normalize.css

```bash
npm i -S normalize.css
```


## postcss per supportare nuove funzionalità con browser meno recenti
* Per utilizzare css nesting, light-dark() ecc. con IOS <= 16 e per le email (NB light-dark disabilitata di default
* `npm i -D @csstools/postcss-light-dark-function`

```bash
npm i -D postcss-nesting
```


## postcss-banner

```bash
npm i -D postcss-banner
```


## prismjs

```bash
npm i -S prismjs
```


## react (NB: richiede eslint 8)

```bash
npm i -D @babel/preset-react babel-plugin-transform-react-remove-prop-types eslint-config-react-app && npm i -D classnames nanoid prop-types && npm i -D react-dom react
```


## React utilities

```bash
npm i -D classnames nanoid prop-types
```


## react-html-comment

```bash
npm i -D react-html-comment
```


## rollup base
* `"rollup (config)": "npx rollup --config ./config/rollup.config.mjs --watch",`
* `"rollup (CLI)": "npx rollup --input js/source.js --file dist/dest.min.js --format iife --sourcemap --plugin 'terser={compress: {passes: 2}}' --plugin @rollup/plugin-node-resolve --watch"`

```bash
npm i -D rollup@latest @rollup/plugin-terser @rollup/plugin-node-resolve @rollup/plugin-json @rollup/plugin-image @rollup/plugin-replace @rollup/plugin-commonjs
```

*rollup.config.mjs*:

```bash
echo "import terser  from '@rollup/plugin-terser';\nimport fs from 'fs';\nimport node_resolve from '@rollup/plugin-node-resolve';\nimport commonjs from '@rollup/plugin-commonjs';\n\n// https://github.com/hyhappy/rollup-plugin-string-html\n// import htmlString from 'rollup-plugin-string-html';\n\n// https://github.com/exuanbo/rollup-plugin-minify-html-template-literals\n// https://github.com/asyncLiz/minify-html-literals\n// https://github.com/kangax/html-minifier#options-quick-reference\n// import minifyHTML from 'rollup-plugin-minify-html-template-literals';\n\nimport p from '../package.json'; // assert { type: 'json' };\n\nconst terserOptions = {\n    compress: {\n      passes: 2\n    }\n  },\n  anno = new Date().getFullYear(),\n  dirs = [\n    {source_dir: './front-end/js', output_dir: './AppBundle/Resources/public/js'}\n  ];\n\nlet config = [];\n\n// lettura subdir apps e aggiunta a `dirs`\nfs.readdirSync('./front-end/apps').forEach(item => {\n  let stats = fs.statSync(`./front-end/apps/${item}`); // stats.isFile() / stats.isDirectory()\n  if(stats.isDirectory()) {\n    dirs.push({\n      source_dir: `./front-end/apps/${item}`,\n      output_dir: `./AppBundle/Resources/public/apps/${item}`\n    });\n  }\n});\n\ndirs.forEach(dir => {\n\n  fs.readdirSync(dir.source_dir)\n    .filter(f => /\.js$/.test(f))\n    .filter(f => /^[^_]/.test(f)) // ignore files starting with _\n    .forEach(file => {\n\n      let format = 'iife',\n        name = null;\n\n      if(/(-umd\.js)$/.test(file)) {\n        format = 'umd';\n        name = file.replace('-umd.js', '').replace(/-/g, '_');\n      }\n\n      config.push(\n        {\n          // preserveEntrySignatures: false,\n          input: `${dir.source_dir}/${file}`,\n          plugins: [\n            // deve essere il primo\n            // minifyHTML({\n            //   options: {\n            //     minifyOptions: {\n            //       html5: true,\n            //       collapseWhitespace: true,\n            //       collapseInlineTagWhitespace: true,\n            //       conservativeCollapse: true,\n            //       decodeEntities: true\n            //     },\n            //     shouldMinify: () => true\n            //   },\n            // }),\n            node_resolve(),\n            commonjs(),\n            terser(terserOptions),\n          ],\n          output: [{\n            file: `${dir.output_dir}/${file.replace('.js', '-min.js')}`,\n            format: format,\n            sourcemap: true,\n            name: name,\n            banner: `/*! xxxx v.${p.version} - Massimo Cassandro ${anno} */`,\n            // footer: `//! Released on ${new Date().toLocaleString('it-IT', { year: 'numeric',  month: 'short', day: '2-digit', hour12: false, hour:'2-digit', minute:'2-digit' })}`\n          }]\n        }\n      );\n\n    });\n});\n\nexport default config;\n\n\n// versione statica\n\n// export default [\n//   {\n//     input: 'input.js',\n//     plugins: [\n//       node_resolve(),\n//       // commonjs(),\n//       terser({ compress: { passes: 2 } }),\n//     ],\n//     output: [\n//       {\n//         file: 'output.min.js',\n//         format: 'iife',\n//         sourcemap: true,\n\n//         banner: `/*! xxxx v.${p.version} - Massimo Cassandro ${anno} */`,\n//         // footer: `//! Released on ${new Date().toLocaleString('it-IT', { year: 'numeric',  month: 'short', day: '2-digit', hour12: false, hour:'2-digit', minute:'2-digit' })}`\n//       }\n//     ]\n//   },\n//   ...\n// ];\n" > rollup.config.mjs
```


## rollup-plugin-string-html

```bash
npm i -D rollup-plugin-string-html
```


## scss-utilities
* <https://github.com/massimo-cassandro/scss-utilities>

```bash
npm i -S @massimo-cassandro/scss-utilities
```


## sharing-links
* <https://github.com/massimo-cassandro/sharing-links>

```bash
npm i -S @massimo-cassandro/sharing-links
```


## solid-js (webpack)

```bash
npm i -D solid-js babel-loader @babel/preset-env @babel/plugin-syntax-jsx babel-preset-solid
```


## styled-components

```bash
npm i -D babel-plugin-styled-components styled-components
```


## svg-icons-tools
* <https://github.com/massimo-cassandro/svg-icons-tools?tab=readme-ov-file#svg-icons-tools>
* <https://github.com/massimo-cassandro/svg-icons-tools>

```bash
npm i -D @massimo-cassandro/svg-icons-tools
```


## twig-utilities
* <https://github.com/massimo-cassandro/twig-utilities>

```bash
npm i -S @massimo-cassandro/twig-utilities
```


## typescript per react/webpack

```bash
npm i -D @types/react-dom @types/react ts-loader typescript-plugin-css-modules typescript
```


## unsplash-page
* <https://github.com/massimo-cassandro/unsplash-page>

```bash
npm i -S @massimo-cassandro/unsplash-page
```
