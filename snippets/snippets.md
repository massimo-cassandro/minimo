# Setup snippets

## webpack full install

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/snippets/webpack-install.sh | zsh
```

## package.json scripts
```javascript
{
"launchChrome": "open -n -a 'Google Chrome' --args --profile-directory='Profile 3'",
"python server": "python3 -m http.server 8000 # --directory __dirname__ # 8000 = default port",
"php server": "php -S localhost:8000 # -t root_dir/",
"symfony local server": "symfony serve -d",
"node server": "node serve # richiede ‘npm i serve’",
}
```

## root / frontend

### .browserslistrc

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/_browserslistrc > .browserslistrc
```

### .editorconfig

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/_editorconfig > .editorconfig
```

### .gitignore

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/_gitignore > .gitignore
```

### .prettierrc

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/_prettierrc > .prettierrc
```

## open-props + postcss-jit-props

```bash
npm i -S open-props && npm i -D postcss-jit-props
```

### postcss.config.cjs

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/frontend/postcss.config.cjs > postcss.config.cjs
```

## css reset
* <https://www.joshwcomeau.com/css/custom-css-reset/#the-css-reset-1>
* <https://meyerweb.com/eric/tools/css/reset/>

## dev-updater
<https://github.com/massimo-cassandro/dev-updater>

*install:*

```bash
npm i -D @massimo-cassandro/dev-updater
```

*package.json scripts*:

```javascript
"UPD-version": "npx update-version  # --config=./dev-utilities.config.mjs",
"upd@m": "npx upd@m",
```


## eslint9 (+ uninstall)

*install*:

```bash
npm i -D eslint @eslint/js globals && npm i -D @massimo-cassandro/eslint-config
```

*@cybozu* (<https://github.com/cybozu/eslint-config>):

```bash
npm install -D @cybozu/eslint-config
```

*uninstall*:

```bash
npm uninstall eslint @eslint/js globals @massimo-cassandro/eslint-config @cybozu/eslint-config
```

*eslint.config.mjs*:

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/eslint.config.mjs > eslint.config.mjs
```


## jsconfig.json
*jsconfig.json*:

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/jsconfig.json > jsconfig.json
```

## sass cli

```bash
npm i -D sass
```

## stylelint


**install**

```bash
npm i -D @massimo-cassandro/stylelint-config
```

**stylelint.config.mjs**:

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/stylelint.config.mjs > stylelint.config.mjs
```

**uninstall**

```bash
npm uninstall @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint @massimo-cassandro/stylelint-config
```


## webhint

```bash
npm i -D hint
```

*.hintrc.cjs*:

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/_hintrc.cjs_ > .hintrc.cjs
```


## webpack

```bash
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/frontend/webpack.config.mjs > webpack.config.mjs
```

```bash
npm i -D @babel/core @babel/preset-env babel-loader copy-webpack-plugin css-loader css-minimizer-webpack-plugin dotenv-webpack process html-loader html-webpack-plugin mini-css-extract-plugin mini-svg-data-uri postcss-preset-env style-loader terser-webpack-plugin && npm i -D webpack-cli webpack-dev-server webpack-manifest-plugin webpack && npm i -D ejs-loader
```

**importazione svg come componente react**
<https://react-svgr.com/docs/webpack/>

```bash
npm install -D @svgr/webpack
```

**purgecss**

```bash
npm i -D purgecss-webpack-plugin glob
```

**package.json:**

```javascript
{
"launchChrome": "open -n -a 'Google Chrome' --args --profile-directory='Profile 3'",
"webpack DEV": "NODE_ENV=development webpack serve --config ./webpack.config.mjs #--open-app-name 'Google Chrome'",
"webpack DEV": "npm run 'launchChrome' && NODE_ENV=development webpack serve --config ./webpack.config.mjs #--open-app-name 'Google Chrome'",
"webpack DEV": "rm -rf ./public/dev && NODE_ENV=development webpack --config ./webpack.config.mjs",
"webpack PROD": "NODE_ENV=production webpack --config ./webpack.config.mjs --stats minimal"
}
```


### postcss + plugins (webpack)

```bash
npm i -D postcss autoprefixer postcss-custom-media @csstools/postcss-global-data postcss-loader cssnano
```

### responsive-loader

```bash
npm i -D responsive-loader 
```

### webpack-remove-empty-scripts
<https://github.com/webdiscus/webpack-remove-empty-scripts#readme>

```bash
npm i -D webpack-remove-empty-scripts
```

### sass per webpack

```bash
npm i -D sass-loader sass
```
### html-webpack-inject-preload
<https://github.com/principalstudio/html-webpack-inject-preload#readme>

```bash
npm i -D @principalstudio/html-webpack-inject-preload
```

### SVGO

```bash
npm install -D svgo svg-url-loader svgo-loader svgo-add-viewbox
curl -s https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate/frontend/webpack/svgo.config.js > ./svgo.config.js
```

### solid-js (webpack)

```bash
npm i -D solid-js babel-loader @babel/preset-env @babel/plugin-syntax-jsx babel-preset-solid
```

### styled-components

```bash
npm i -D babel-plugin-styled-components styled-components
```

## auto-datatables-bs5
<https://github.com/massimo-cassandro/auto-datatables-bs5>

```bash
npm i -S @massimo-cassandro/auto-datatables-bs5 datatables.net@^1,datatables.net-bs5@^1
```

## autocomplete
<https://github.com/massimo-cassandro/autocomplete>

```bash
npm i -S @massimo-cassandro/autocomplete
```

## bootstrap

```bash
npm i -S bootstrap
```

## ckeditor-utilities
<https://github.com/massimo-cassandro/ckeditor-utilities>

```bash
npm i -S @massimo-cassandro/ckeditor-utilities
```

## create-favicons
<https://github.com/massimo-cassandro/create-favicons>

```bash
npm i -D @massimo-cassandro/create-favicons
```

**init**

```bash
npx create-favicons init
```

**run**

```bash
npx create-favicons --dir=./
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

## dom-builder
* <https://github.com/massimo-cassandro/dom-builder>

```bash
npm i -S @massimo-cassandro/dom-builder
```


## json-table
* <https://github.com/massimo-cassandro/json-table>

```bash
npm i -S @massimo-cassandro/json-table
```




## modal-alert
* <https://github.com/massimo-cassandro/modal-alert>

```bash
npm i -S @massimo-cassandro/modal-alert
```



## postcss

### postcss cli
* Per creare file css di test.
* *postcss-import* è necessario per risolvere le importazioni da cli (con webpack non serve, l’operazione è svolta da *css-loader*)
* `"build css test": "npx postcss ./src/source.css -o ./test/test.css --no-map --verbose --env development --config ./ --use postcss-import --watch",`

```bash
npm i -D postcss-cli postcss-import
```

### postcss per supportare nuove funzionalità con browser meno recenti
* Per utilizzare css nesting, light-dark() ecc. con IOS <= 16 e per le email (NB light-dark disabilitata di default
* `npm i -D @csstools/postcss-light-dark-function`

```bash
npm i -D postcss-nesting
```


### postcss-banner

```bash
npm i -D postcss-banner
```


## prismjs

```bash
npm i -S prismjs
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



## zzz Archiviati

### eslint 8

```bash
npm i -D eslint@^8 && npm i -D @massimo-cassandro/eslint-config@^1
```

### gulp per icone
* `"build_icons": "cd ./path/to/icone && gulp",`

```bash
npm i -D gulp@latest gulp-concat gulp-dom gulp-flatmap gulp-inject-string gulp-rename gulp-replace gulp-svgmin gulp-svgstore gulp-wrap
```

### gulp-jsbeautifier (aggiunta per icone react)

```bash
npm i -D gulp-jsbeautifier
```

### gulp-wrap (aggiunta per icone react)

```bash
npm i -D gulp-wrap
```


### react 18 (NB: richiede eslint 8)

```bash
npm i -D @babel/preset-react babel-plugin-transform-react-remove-prop-types eslint-config-react-app && npm i -D classnames nanoid prop-types && npm i -D react-dom react
```

#### html-react-parser

```bash
npm i -D html-react-parser
```



#### React utilities

```bash
npm i -D classnames nanoid prop-types
```


#### react-html-comment

```bash
npm i -D react-html-comment
```


### rollup 
* `"rollup (config)": "npx rollup --config ./config/rollup.config.mjs --watch",`
* `"rollup (CLI)": "npx rollup --input js/source.js --file dist/dest.min.js --format iife --sourcemap --plugin 'terser={compress: {passes: 2}}' --plugin @rollup/plugin-node-resolve --watch"`

```bash
npm i -D rollup@latest @rollup/plugin-terser @rollup/plugin-node-resolve @rollup/plugin-json @rollup/plugin-image @rollup/plugin-replace @rollup/plugin-commonjs
```

#### rollup-plugin-string-html

```bash
npm i -D rollup-plugin-string-html
```


### normalize.css

```bash
npm i -S normalize.css
```

### layout-tools
* <https://github.com/massimo-cassandro/layout-tools>

```bash
npm i -D @massimo-cassandro/layout-tools
```
