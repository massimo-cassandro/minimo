#!/bin/bash

# Configurazione variabili
BASE_URL="https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main/boilerplate"



curl -s "$BASE_URL/_browserslistrc" > .browserslistrc
curl -s "$BASE_URL/_editorconfig" > .editorconfig
curl -s "$BASE_URL/_prettierrc" > .prettierrc
curl -s "$BASE_URL/jsconfig.json" > jsconfig.json

npm i -D @massimo-cassandro/dev-updater

npm i -D eslint@^9 @eslint/js globals && npm i -D @massimo-cassandro/eslint-config@^2
curl -s "$BASE_URL/eslint.config.mjs" > eslint.config.mjs

npm i -D @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint && npm i -D @massimo-cassandro/stylelint-config
curl -s "$BASE_URL/stylelint.config.mjs" > stylelint.config.mjs


npm i -D @babel/core @babel/preset-env babel-loader copy-webpack-plugin css-loader css-minimizer-webpack-plugin dotenv-webpack html-loader html-webpack-plugin mini-css-extract-plugin mini-svg-data-uri postcss-preset-env style-loader terser-webpack-plugin
npm i -D webpack-cli webpack-dev-server webpack-manifest-plugin webpack
npm i -D postcss autoprefixer postcss-custom-media @csstools/postcss-global-data postcss-loader
npm i -D responsive-loader
npm i -D webpack-remove-empty-scripts
npm i -S svgo svg-url-loader svgo-loader svgo-add-viewbox


curl -s "$BASE_URL/frontend/webpack.config.mjs" > webpack.config.mjs

curl -s "$BASE_URL/frontend/postcss.config.cjs" > postcss.config.cjs


# cartella webpack
WEBPACK_LOCAL_DIR="./webpack"
WEBPACK_REMOTE_URL="$BASE_URL/frontend/webpack"
FILES=(
  'css-rules.mjs'
  'get-jsConfig-aliases.mjs'
  'mini-svg-data-uri-loader.cjs'
  'svg-rules.mjs'
  'svgo.config.mjs'
)

if [ ! -d "$WEBPACK_LOCAL_DIR" ]; then
  mkdir -p "$WEBPACK_LOCAL_DIR"

  for FILE in "${FILES[@]}"; do
    # echo "Scaricamento di $FILE..."
    curl -s "$WEBPACK_REMOTE_URL/$FILE" > "$WEBPACK_LOCAL_DIR/$FILE"
  done

fi

echo '*** END ***'
