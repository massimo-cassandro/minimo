#!/bin/zsh


# Configurazione variabili
BASE_URL="https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}...package.json${NC}"
if [ ! -f package.json ]; then
  curl -s "$BASE_URL/snippets/package-tpl.json" > package.json
else
  echo -e "${GREEN}package.json già presente${NC}"
fi

echo -e "${GREEN}...gitignore${NC}"
if [ ! -f .gitignore ]; then
  curl -s "$BASE_URL/boilerplate/_gitignore" > .gitignore
else
  echo -e "${GREEN}.gitignore già presente${NC}"
fi

echo -e "\n${GREEN}Dove desideri installare la configurazione frontend?${NC}"
echo "1) Root directory"
echo "2) Directory frontend"
read "?Scegli (1 o 2) [default: 1]: " choice
choice=${choice:-1}

if [ "$choice" = "2" ]; then
  FRONTEND_INSTALL_PATH="./frontend"
  echo -e "${GREEN}I file saranno installati in: ./frontend${NC}"
else
  FRONTEND_INSTALL_PATH="."
  echo -e "${GREEN}I file saranno installati in: root directory${NC}"
fi

if [ "$FRONTEND_INSTALL_PATH" = "./frontend" ]; then
  mkdir -p frontend
fi

echo -e "\n${GREEN}...config files & utilities${NC}"
curl -s "$BASE_URL/boilerplate/_browserslistrc" > "$FRONTEND_INSTALL_PATH/.browserslistrc"
curl -s "$BASE_URL/boilerplate/_editorconfig" > "$FRONTEND_INSTALL_PATH/.editorconfig"
curl -s "$BASE_URL/boilerplate/_prettierrc" > "$FRONTEND_INSTALL_PATH/.prettierrc"
curl -s "$BASE_URL/boilerplate/jsconfig.json" > jsconfig.json

npm i -D @massimo-cassandro/dev-updater

echo -e "\n${GREEN}...eslint${NC}"
npm i -D eslint@^9 @eslint/js globals && npm i -D @massimo-cassandro/eslint-config@^2
curl -s "$BASE_URL/boilerplate/eslint.config.mjs" > "$FRONTEND_INSTALL_PATH/eslint.config.mjs"

echo -e "\n${GREEN}...stylelint${NC}"
npm i -D stylelint @stylistic/stylelint-plugin stylelint-config-css-modules stylelint-config-twbs-bootstrap && npm i -D @massimo-cassandro/stylelint-config
curl -s "$BASE_URL/boilerplate/stylelint.config.mjs" > "$FRONTEND_INSTALL_PATH/stylelint.config.mjs"


echo -e "\n${GREEN}...webpack${NC}"
npm i -D webpack-cli webpack-dev-server webpack-manifest-plugin webpack
npm i -D @babel/core @babel/preset-env babel-loader terser-webpack-plugin
npm i -D webpack-remove-empty-scripts copy-webpack-plugin html-loader html-webpack-plugin
npm i -D postcss autoprefixer postcss-custom-media @csstools/postcss-global-data postcss-loader postcss-preset-env
npm i -D cssnano mini-css-extract-plugin style-loader css-loader css-minimizer-webpack-plugin
npm i -D responsive-loader
npm i -D process dotenv-webpack
npm i -D svgo svg-url-loader svgo-loader svgo-add-viewbox mini-svg-data-uri
npm i -D ejs-loader
npm i -D purgecss-webpack-plugin glob

curl -s "$BASE_URL/boilerplate/frontend/webpack.config.mjs" > "$FRONTEND_INSTALL_PATH/webpack.config.mjs"
curl -s "$BASE_URL/boilerplate/frontend/webpack-template.ejs" > "$FRONTEND_INSTALL_PATH/webpack-template.ejs"
curl -s "$BASE_URL/boilerplate/frontend/postcss.config.cjs" > "$FRONTEND_INSTALL_PATH/postcss.config.cjs"


# cartella webpack
WEBPACK_LOCAL_DIR="$FRONTEND_INSTALL_PATH/webpack"
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
