# Setup snippets

## .browserslistrc
*.browserslistrc*:

```bash
echo "# https://github.com/browserslist/browserslist\n# https://browsersl.ist/\n\nlast 2 major versions\nsince 2023\nnot dead\n\nnot op_mini all\nnot op_mob > 0\nnot and_uc > 0\nnot and_qq > 0\nnot baidu > 0\nnot kaios > 0\nnot android > 0\nnot ie > 0\nnot ie_mob > 0\nnot bb > 0\n\nsafari >= 16\nios_saf >= 16\nedge >= 109\nchrome >= 109\nfirefox esr\nopera >= 95\nsamsung >= 20\n\n> 3% in IT\n" > .browserslistrc
```



## .editorconfig
*.editorconfig*:

```bash
echo "# https://editorconfig.org\n\n# top-most EditorConfig file\nroot = true\n\n[*]\ncharset = utf-8\nend_of_line = lf\nindent_size = 2\nindent_style = space\ninsert_final_newline = true\ntrim_trailing_whitespace = true\n\n[*.md]\nmax_line_length = off\ntrim_trailing_whitespace = false\n\n[*.{yml,yaml}]\nindent_size = 4\n" > .editorconfig
```



## .gitignore
*.gitignore*:

```bash
echo "*~\n.DS_Store\n**/*.mwb.bak\n**/*.mwb.beforefix\n\nvendor\n\n# local env\n# .env\n.env.dev\n.env.local\n.env.development\n.env.test\n.env.development.local\n.env.test.local\n.env.production.local\n\n# frontend\nnode_modules\n_private\npublic/_dev\n" > .gitignore
```



## .prettierrc
*.prettierrc*:

```bash
echo "{\n  \"endOfLine\": \"lf\",\n  \"tabWidth\": 2,\n  \"useTabs\": false,\n  \"semi\": true,\n  \"singleQuote\": true,\n  \"trailingComma\": \"es5\",\n  \"bracketSpacing\": true\n}\n" > .prettierrc
```



## css reset
* <https://www.joshwcomeau.com/css/custom-css-reset/#the-css-reset-1>
* <https://meyerweb.com/eric/tools/css/reset/>

## dev-updater
* <https://github.com/massimo-cassandro/dev-updater>
* `"UPD-version": "npx update-version  # --config=./dev-utilities.config.mjs",`
* `"upd@m": "npx upd@m",`

**install:**

```bash
npm i -D @massimo-cassandro/dev-updater
```



## eslint9 (+ uninstall)

**uninstall:**

```bash
npm uninstall eslint @eslint/js globals @massimo-cassandro/eslint-config
```



**install:**

```bash
npm i -D eslint@^9 @eslint/js globals && npm i -D @massimo-cassandro/eslint-config@^2
```


*eslint.config.mjs*:

```bash
echo "import eslint_config from '@massimo-cassandro/eslint-config';\n\nexport default [\n  ...eslint_config,\n  // {\n  //   files: ['src/**/*.js'],\n  //   ignores: [\n  //     'dist/',\n  //     'build/',\n  //     '**/vendor/'\n  //   ],\n  // }\n  // {\n  //   languageOptions: {\n  //     globals: {\n  //       jQuery: 'readonly',\n  //       $: 'readonly',\n  //     },\n  //   },\n  // },\n];\n" > eslint.config.mjs
```



## html-webpack-inject-preload
* <https://github.com/principalstudio/html-webpack-inject-preload#readme>

**install:**

```bash
npm i -D @principalstudio/html-webpack-inject-preload
```



## jsconfig.json
*jsconfig.json*:

```bash
echo "{\n  \"__help\": \"https://code.visualstudio.com/docs/languages/jsconfig\",\n  \"compilerOptions\": {\n    \"target\": \"es2023\",\n    \"baseUrl\": \".\",\n    \"module\": \"ES6\",\n    \"allowSyntheticDefaultImports\": false,\n    \"paths\": {\n\n      \"@apps/*\": [\"./apps/*\"],\n      \"@css/*\": [\"./frontend/css/*\"],\n      \"@src/*\": [\"./frontend/src/*\"],\n      \"@minimo/*\": [\"./frontend/minimo/*\"],\n    }\n  },\n  \"exclude\": [\"node_modules\", \"dist\", \"docs\", \"build\"]\n}\n" > jsconfig.json
```



## Local servers
* `"python server": "python3 -m http.server 8000 # --directory __dirname__ # 8000 = default port",`
* `"php server": "php -S localhost:8000 # -t root_dir/",`
* `"symfony local server": "symfony serve -d",`
* node serve # npm i serve

## open-props + postcss-jit-props

**install:**

```bash
npm i -S open-props && npm i -D postcss-jit-props
```



## postcss + plugins (webpack)

**install:**

```bash
npm i -D postcss autoprefixer postcss-custom-media @csstools/postcss-global-data
```


*postcss.config.cjs*:

```bash
echo "/* eslint-env node */\n\n// const path = require('path');\n\n\nconst isDevelopment = process.env.NODE_ENV === 'development';\n\nconst postcssConfig = {\n  plugins: [\n\n    require('@csstools/postcss-global-data')({\n      files: [\n        './node_modules/open-props/media.min.css',\n        './frontend/css/custom-properties.css',\n      ]\n    }),\n\n    // https://github.com/GoogleChromeLabs/postcss-jit-props\n    // https://github.com/argyleink/open-props\n    // require('postcss-jit-props')(require('open-props')),\n    require('postcss-jit-props')({\n      ...require('open-props'),\n      custom_selector: ':where(html)'\n    }),\n\n    // per IOS < 17 (test)\n    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting\n    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-light-dark-function#readme\n    // require('postcss-nesting')({\n    //  edition: '2021',\n    //  noIsPseudoSelector: true\n    //}),\n    // require('@csstools/postcss-light-dark-function')({preserve: false}), /* NB non funziona benissimo... */\n\n    require('autoprefixer'),\n\n    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-media\n    require('postcss-custom-media')({\n      preserve: isDevelopment\n    }),\n\n    // https://purgecss.com/configuration.html\n    // require('@fullhuman/postcss-purgecss')({\n    //   content: [\n    //     // './node_modules/@massimo-cassandro/**/.js',\n    //     './templates/**/*.html.twig',\n    //     './public/**/*.html',\n    //     './src/**/*.{js,jsx}',\n    //   ],\n    //   // css: ['./src/css/custom-properties-figma.css'],\n    //   // output: ['./AppBundle/Resources/public/css/'],\n    //   // variables: true,\n    //   // fontFace: true,\n    //   // keyframes: true,\n    //   safelist: {\n    //     standard: [/:focus$/],\n    //     // deep: [],\n    //     // greedy: [/yellow$/]\n    //   }\n    // }),\n\n  ]\n};\n\nif (process.env.NODE_ENV === 'production') {\n  postcssConfig.plugins.push(\n\n    // per IOS < 17\n    // require('postcss-nesting')({\n    //  edition: '2021',\n    //  noIsPseudoSelector: true\n    //}),\n    // require('@csstools/postcss-light-dark-function'), /* NB non funziona benissimo... */\n\n    // https://github.com/cssnano/cssnano\n    require('cssnano')({\n      // use the safe preset so that it doesn't\n      // mutate or remove code from our css\n      preset: 'default',\n    })\n  );\n}\n\nmodule.exports = postcssConfig;\n\n" > postcss.config.cjs
```



## postcss cli
* Per creare file css di test.
* *postcss-import* è necessario per risolvere le importazioni da cli (con webpack non serve, l’operazione è svolta da *css-loader*)
* `"build css test": "npx postcss ./src/source.css -o ./test/test.css --no-map --verbose --env development --config ./ --use postcss-import --watch",`

**install:**

```bash
npm i -D postcss-cli postcss-import
```



## sass cli

**install:**

```bash
npm i -D sass
```



## sass per webpack

**install:**

```bash
npm i -D sass-loader sass
```



## stylelint
* `## upd config file:`
* `mv -f .stylelintrc.cjs stylelint.config.cjs`

**uninstall:**

```bash
npm uninstall @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint @massimo-cassandro/stylelint-config
```



**install:**

```bash
npm i -D @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint && npm i -D @massimo-cassandro/stylelint-config
```


*stylelint.config.cjs*:

```bash
echo "/* eslint-env node */\n\nmodule.exports = {\n  extends: [\n    '@massimo-cassandro/stylelint-config',\n    // 'stylelint-config-css-modules'\n  ],\n  ignoreFiles: [\n    'node_modules/**/*.{css,scss}',\n    'vendor/**/*.{css,scss}',\n    'templates/**/*.{css,scss}',\n    'dist/**/*.css',\n    'build/**/*.css',\n    'public/**/*.css',\n    'test/**/*.css'\n  ],\n\n  // tailwind\n  // 'rules': {\n  //   'value-keyword-case': null,\n  //   '@stylistic/number-no-trailing-zeros': null\n  // }\n};\n" > stylelint.config.cjs
```



## webhint

**install:**

```bash
npm i -D hint
```


*.hintrc.cjs*:

```bash
echo "module.exports = {\n  \"connector\": {\n    \"name\": \"local\",\n    \"options\": {\n      \"pattern\": [\"./build/**/*.html\"] // Analizza i file HTML generati nella directory di build\n    }\n  },\n  \"extends\": [\n    \"development\", // Configurazione base per lo sviluppo\n    \"accessibility\", // Regole per l'accessibilità\n    \"performance\", // Regole per le prestazioni\n    \"security\", // Regole per la sicurezza\n    \"html-checker\" // Controllo della validità HTML\n  ],\n  \"hints\": {\n    \"axe\": \"error\", // Controlla l'accessibilità con axe-core\n    \"content-type\": \"error\", // Verifica i tipi di contenuto corretti\n    \"disown-opener\": \"warning\", // Consiglia di usare `rel=\"noopener\"`\n    \"http-cache\": [\"warning\", { \"maxAge\": 31536000 }], // Suggerisce una cache HTTP ottimale\n    \"image-optimization-cloudinary\": \"off\", // Disattiva l'ottimizzazione delle immagini\n    \"meta-viewport\": \"error\", // Verifica la presenza del meta tag viewport\n    \"no-vulnerable-javascript-libraries\": \"error\", // Controlla librerie JS vulnerabili\n    \"performance-budget\": [\n      \"warning\",\n      {\n        \"resourceTypes\": {\n          \"script\": 250, // Limite di 250 KB per gli script\n          \"image\": 500 // Limite di 500 KB per le immagini\n        }\n      }\n    ],\n    \"strict-transport-security\": \"error\", // Suggerisce l'uso di HSTS\n    \"validate-set-cookie-header\": \"error\" // Controlla l'uso corretto dell'header Set-Cookie\n  }\n};\n" > .hintrc.cjs
```



## webpack
* Non include Postcss
* `"webpack DEV": "NODE_ENV=development webpack serve --config ./webpack.config.cjs #--open-app-name 'Google Chrome'",`
* `"webpack DEV": "rm -rf ./public/dev && NODE_ENV=development webpack --config ./webpack.config.cjs",`
* `"webpack PROD": "NODE_ENV=production webpack --config ./webpack.config.cjs",`

**install:**

```bash
npm i -D @babel/core @babel/preset-env babel-loader copy-webpack-plugin css-loader css-minimizer-webpack-plugin dotenv-webpack file-loader html-loader html-webpack-plugin mini-css-extract-plugin mini-svg-data-uri postcss-loader postcss-preset-env style-loader terser-webpack-plugin && npm i -D webpack-cli webpack-dev-server webpack-manifest-plugin webpack
```



## webpack-remove-empty-scripts
* <https://github.com/webdiscus/webpack-remove-empty-scripts#readme>

**install:**

```bash
npm i -D webpack-remove-empty-scripts
```



## auto-datatables-bs5
* <https://github.com/massimo-cassandro/auto-datatables-bs5>

**install:**

```bash
npm i -S @massimo-cassandro/auto-datatables-bs5 datatables.net@^1,datatables.net-bs5@^1
```



## autocomplete
* <https://github.com/massimo-cassandro/autocomplete>

**install:**

```bash
npm i -S @massimo-cassandro/autocomplete
```



## bootstrap

**install:**

```bash
npm i -S bootstrap
```



## ckeditor-utilities
* <https://github.com/massimo-cassandro/ckeditor-utilities>

**install:**

```bash
npm i -S @massimo-cassandro/ckeditor-utilities
```



## create-favicons
* <https://github.com/massimo-cassandro/create-favicons>
* `npx create-favicons init`
* `npx create-favicons --dir=./`

**install:**

```bash
npm i -D @massimo-cassandro/create-favicons
```



## eslint 8

**install:**

```bash
npm i -D eslint@^8 && npm i -D @massimo-cassandro/eslint-config@^1
```



## gulp per icone
* `"build_icons": "cd ./path/to/icone && gulp",`

**install:**

```bash
npm i -D gulp@latest gulp-concat gulp-dom gulp-flatmap gulp-inject-string gulp-rename gulp-replace gulp-svgmin gulp-svgstore gulp-wrap
```



## gulp-jsbeautifier (aggiunta per icone react)

**install:**

```bash
npm i -D gulp-jsbeautifier
```



## gulp-wrap (aggiunta per icone react)

**install:**

```bash
npm i -D gulp-wrap
```



## html-react-parser

**install:**

```bash
npm i -D html-react-parser
```



## js-file-uploader
* <https://massimo-cassandro.github.io/js-file-uploader/demo/>
* <https://github.com/massimo-cassandro/js-file-uploader>

**install:**

```bash
npm i -S @massimo-cassandro/js-file-uploader
```



## js-utilities
* <https://github.com/massimo-cassandro/js-utilities>

**install:**

```bash
npm i -S @massimo-cassandro/js-utilities
```



## json-table
* <https://github.com/massimo-cassandro/json-table>

**install:**

```bash
npm i -S @massimo-cassandro/json-table
```



## layout-tools
* <https://github.com/massimo-cassandro/layout-tools>

**install:**

```bash
npm i -D @massimo-cassandro/layout-tools
```



## modal-alert
* <https://github.com/massimo-cassandro/modal-alert>

**install:**

```bash
npm i -S @massimo-cassandro/modal-alert
```



## normalize.css

**install:**

```bash
npm i -S normalize.css
```



## POSTCSS per supportare nuove funzionalità con browser meno recenti
* Per utilizzare css nesting, light-dark() ecc. con IOS <= 16 e per le email (NB light-dark disabilitata di default
* `npm i -D @csstools/postcss-light-dark-function`

**install:**

```bash
npm i -D postcss-nesting
```



## postcss-banner

**install:**

```bash
npm i -D postcss-banner
```



## prismjs

**install:**

```bash
npm i -S prismjs
```



## react (NB: richiede eslint 8)

**install:**

```bash
npm i -D @babel/preset-react babel-plugin-transform-react-remove-prop-types eslint-config-react-app && npm i -D classnames nanoid prop-types && npm i -D react-dom react
```



## React utilities

**install:**

```bash
npm i -D classnames nanoid prop-types
```



## react-html-comment

**install:**

```bash
npm i -D react-html-comment
```



## rollup base
* `"rollup (config)": "npx rollup --config ./config/rollup.config.mjs --watch",`
* `"rollup (CLI)": "npx rollup --input js/source.js --file dist/dest.min.js --format iife --sourcemap --plugin 'terser={compress: {passes: 2}}' --plugin @rollup/plugin-node-resolve --watch"`

**install:**

```bash
npm i -D rollup@latest @rollup/plugin-terser @rollup/plugin-node-resolve @rollup/plugin-json @rollup/plugin-image @rollup/plugin-replace @rollup/plugin-commonjs
```


*rollup.config.mjs*:

```bash
echo "import terser  from '@rollup/plugin-terser';\nimport fs from 'fs';\nimport node_resolve from '@rollup/plugin-node-resolve';\nimport commonjs from '@rollup/plugin-commonjs';\n\n// https://github.com/hyhappy/rollup-plugin-string-html\n// import htmlString from 'rollup-plugin-string-html';\n\n// https://github.com/exuanbo/rollup-plugin-minify-html-template-literals\n// https://github.com/asyncLiz/minify-html-literals\n// https://github.com/kangax/html-minifier#options-quick-reference\n// import minifyHTML from 'rollup-plugin-minify-html-template-literals';\n\nimport p from '../package.json'; // assert { type: 'json' };\n\nconst terserOptions = {\n    compress: {\n      passes: 2\n    }\n  },\n  anno = new Date().getFullYear(),\n  dirs = [\n    {source_dir: './front-end/js', output_dir: './AppBundle/Resources/public/js'}\n  ];\n\nlet config = [];\n\n// lettura subdir apps e aggiunta a `dirs`\nfs.readdirSync('./front-end/apps').forEach(item => {\n  let stats = fs.statSync(`./front-end/apps/${item}`); // stats.isFile() / stats.isDirectory()\n  if(stats.isDirectory()) {\n    dirs.push({\n      source_dir: `./front-end/apps/${item}`,\n      output_dir: `./AppBundle/Resources/public/apps/${item}`\n    });\n  }\n});\n\ndirs.forEach(dir => {\n\n  fs.readdirSync(dir.source_dir)\n    .filter(f => /\.js$/.test(f))\n    .filter(f => /^[^_]/.test(f)) // ignore files starting with _\n    .forEach(file => {\n\n      let format = 'iife',\n        name = null;\n\n      if(/(-umd\.js)$/.test(file)) {\n        format = 'umd';\n        name = file.replace('-umd.js', '').replace(/-/g, '_');\n      }\n\n      config.push(\n        {\n          // preserveEntrySignatures: false,\n          input: `${dir.source_dir}/${file}`,\n          plugins: [\n            // deve essere il primo\n            // minifyHTML({\n            //   options: {\n            //     minifyOptions: {\n            //       html5: true,\n            //       collapseWhitespace: true,\n            //       collapseInlineTagWhitespace: true,\n            //       conservativeCollapse: true,\n            //       decodeEntities: true\n            //     },\n            //     shouldMinify: () => true\n            //   },\n            // }),\n            node_resolve(),\n            commonjs(),\n            terser(terserOptions),\n          ],\n          output: [{\n            file: `${dir.output_dir}/${file.replace('.js', '-min.js')}`,\n            format: format,\n            sourcemap: true,\n            name: name,\n            banner: `/*! xxxx v.${p.version} - Massimo Cassandro ${anno} */`,\n            // footer: `//! Released on ${new Date().toLocaleString('it-IT', { year: 'numeric',  month: 'short', day: '2-digit', hour12: false, hour:'2-digit', minute:'2-digit' })}`\n          }]\n        }\n      );\n\n    });\n});\n\nexport default config;\n\n\n// versione statica\n\n// export default [\n//   {\n//     input: 'input.js',\n//     plugins: [\n//       node_resolve(),\n//       // commonjs(),\n//       terser({ compress: { passes: 2 } }),\n//     ],\n//     output: [\n//       {\n//         file: 'output.min.js',\n//         format: 'iife',\n//         sourcemap: true,\n\n//         banner: `/*! xxxx v.${p.version} - Massimo Cassandro ${anno} */`,\n//         // footer: `//! Released on ${new Date().toLocaleString('it-IT', { year: 'numeric',  month: 'short', day: '2-digit', hour12: false, hour:'2-digit', minute:'2-digit' })}`\n//       }\n//     ]\n//   },\n//   ...\n// ];\n" > rollup.config.mjs
```



## rollup-plugin-string-html

**install:**

```bash
npm i -D rollup-plugin-string-html
```



## scss-utilities
* <https://github.com/massimo-cassandro/scss-utilities>

**install:**

```bash
npm i -S @massimo-cassandro/scss-utilities
```



## sharing-links
* <https://github.com/massimo-cassandro/sharing-links>

**install:**

```bash
npm i -S @massimo-cassandro/sharing-links
```



## solid-js (webpack)

**install:**

```bash
npm i -D solid-js babel-loader @babel/preset-env @babel/plugin-syntax-jsx babel-preset-solid
```



## styled-components

**install:**

```bash
npm i -D babel-plugin-styled-components styled-components
```



## svg-icons-tools
* <https://github.com/massimo-cassandro/svg-icons-tools?tab=readme-ov-file#svg-icons-tools>
* <https://github.com/massimo-cassandro/svg-icons-tools>

**install:**

```bash
npm i -D @massimo-cassandro/svg-icons-tools
```



## twig-utilities
* <https://github.com/massimo-cassandro/twig-utilities>

**install:**

```bash
npm i -S @massimo-cassandro/twig-utilities
```



## typescript per react/webpack

**install:**

```bash
npm i -D @types/react-dom @types/react ts-loader typescript-plugin-css-modules typescript
```



## unsplash-page
* <https://github.com/massimo-cassandro/unsplash-page>

**install:**

```bash
npm i -S @massimo-cassandro/unsplash-page
```

