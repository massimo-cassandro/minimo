#!/bin/zsh


# Configurazione variabili
BASE_URL="https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}...package.json${NC}"
curl -s "$BASE_URL/snippets/package-tpl.json" > package.json


echo -e "\n${GREEN}...config files & utilities${NC}"
curl -s "$BASE_URL/boilerplate/_browserslistrc" > .browserslistrc
curl -s "$BASE_URL/boilerplate/_editorconfig" > .editorconfig
curl -s "$BASE_URL/boilerplate/_prettierrc" > .prettierrc
curl -s "$BASE_URL/boilerplate/jsconfig.json" > jsconfig.json

npm i -D @massimo-cassandro/dev-updater

echo -e "\n${GREEN}...eslint${NC}"
npm i -D eslint@^9 @eslint/js globals && npm i -D @massimo-cassandro/eslint-config@^2
curl -s "$BASE_URL/boilerplate/eslint.config.mjs" > eslint.config.mjs

echo -e "\n${GREEN}...stylelint${NC}"
npm i -D @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap stylelint && npm i -D @massimo-cassandro/stylelint-config
curl -s "$BASE_URL/boilerplate/stylelint.config.mjs" > stylelint.config.mjs


echo -e "\n${GREEN}...webpack${NC}"
npm i -D @babel/core @babel/preset-env babel-loader copy-webpack-plugin css-loader css-minimizer-webpack-plugin dotenv-webpack html-loader html-webpack-plugin mini-css-extract-plugin mini-svg-data-uri postcss-preset-env style-loader terser-webpack-plugin
npm i -D webpack-cli webpack-dev-server webpack-manifest-plugin webpack
npm i -D postcss autoprefixer postcss-custom-media @csstools/postcss-global-data postcss-loader
npm i -D responsive-loader
npm i -D webpack-remove-empty-scripts
npm i -D svgo svg-url-loader svgo-loader svgo-add-viewbox

curl -s "$BASE_URL/boilerplate/frontend/webpack.config.mjs" > webpack.config.mjs
curl -s "$BASE_URL/boilerplate/frontend/postcss.config.cjs" > postcss.config.cjs


# cartella webpack
WEBPACK_LOCAL_DIR="./webpack"
WEBPACK_REMOTE_URL="$BASE_URL/boilerplate/frontend/webpack"
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

echo -e "n\n${GREEN}*** END ***${NC}"
