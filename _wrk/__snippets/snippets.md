# Setup snippets

[TOC]

## webpack

```bash
zsh ~/Sites/minimo/webpack-setup/starter-install.sh
```

## minimo alias

```bash
ln -s '~/Sites/minimo' _minimo-alias
```

## package.json scripts
```javascript
{
"launchChrome": "open -n -a 'Google Chrome' --args --profile-directory='Profile 3'",
"python server": "python3 -m http.server 8000 # --directory __dirname__ # 8000 = default port",
"php server": "php -S localhost:8000 # -t root_dir/",
"symfony local server": "symfony serve -d",
"node server": "node serve # richiede ‘npm i serve’",
"build tokens": "node ~/Sites/minimo/utilities/build-tokens.mjs --config ./path/to/build-tokens-config.mjs",
"check unresolved props": "node ~/Sites/minimo/utilities/check-unresolved-custom-props.mjs --config ./path/to/check-props-config.mjs"
}
```

## open-props + postcss-jit-props

```bash
npm i -S open-props && npm i -D postcss-jit-props
```


## css reset
* <https://www.joshwcomeau.com/css/custom-css-reset/#the-css-reset-1>
* <https://meyerweb.com/eric/tools/css/reset/>




## dev-updater
<https://github.com/massimo-cassandro/dev-updater>

### install:

```bash
npm i -D @massimo-cassandro/dev-updater
```
### package.json scripts:

```javascript
"UPD-version": "npx update-version  # --log-file=./frontend/changelog.md --log-patch --pkg=alt/path/to/package.json",
"upd@m": "npx upd@m",
```

### aggiorna da versione precedente:
```bash
npm i -D @massimo-cassandro/dev-updater@latest && node ./node_modules/@massimo-cassandro/dev-updater/app/update-version/convert-changelog.mjs [--include-patch]
```



## eslint

### install:

```bash
npm i -D @massimo-cassandro/eslint-config
```

### @cybozu (<https://github.com/cybozu/eslint-config>):

```bash
npm install -D @cybozu/eslint-config
```

### uninstall (versione prec.) + install:

```bash
npm uninstall eslint @eslint/js globals @massimo-cassandro/eslint-config @cybozu/eslint-config && npm i -D @massimo-cassandro/eslint-config
```

## Style-dictionary

* <https://styledictionary.com/getting-started/installation/#installation>

```bash
npm install -D style-dictionary
```

## stylelint

### install

```bash
npm i -D @massimo-cassandro/stylelint-config
```

### uninstall (versione prec.) + install

```bash
npm uninstall @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint @massimo-cassandro/stylelint-config && npm i -D @massimo-cassandro/stylelint-config
```



## webhint

```bash
npm i -D hint
```

## webpack

Vedi [webpack installer](webpack-install.sh)


### importazione svg come componente react
<https://react-svgr.com/docs/webpack/>

```bash
npm install -D @svgr/webpack
```

### purgecss

```bash
npm i -D purgecss-webpack-plugin glob
```

### html-webpack-inject-attributes-plugin

```bash
npm i -D html-webpack-inject-attributes-plugin
```

### html-inline-css-webpack-plugin (non configurato in webpack.config)

* <https://github.com/Runjuu/html-inline-css-webpack-plugin#readme>

```bash
npm i -D html-inline-css-webpack-plugin
```


### package.json:

```javascript
{
"launchChrome": "open -n -a 'Google Chrome' --args --profile-directory='Profile 3'",
"webpack DEV": "NODE_ENV=development webpack serve --config ./webpack.config.mjs #--open-app-name 'Google Chrome'",
"webpack DEV + chrome": "npm run 'launchChrome' && NODE_ENV=development webpack serve --config ./webpack.config.mjs #--open-app-name 'Google Chrome'",
"webpack DEV sf": "rm -rf ./public/_dev && NODE_ENV=development webpack --config ./webpack.config.mjs",
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

### SVGO

```bash
npm install -D svgo svg-url-loader svgo-loader svgo-add-viewbox
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

* <https://github.com/massimo-cassandro/auto-datatables-bs5>

```bash
npm i -S @massimo-cassandro/auto-datatables-bs5 datatables.net@^1,datatables.net-bs5@^1
```

## autocomplete

* <https://github.com/massimo-cassandro/autocomplete>

```bash
npm i -S @massimo-cassandro/autocomplete
```

## sass cli

```bash
npm i -D sass
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

```bash
npm i -D @massimo-cassandro/create-favicons
```

### init

```bash
npx create-favicons init
```

### run

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
