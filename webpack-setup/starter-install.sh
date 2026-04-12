#!/bin/zsh


# Configurazione variabili
# BASE_URL="https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main"

# in locale: cat ....
# da remoto curl -s

# %:A risolve il percorso assoluto (anche con link simbolici)
# %:h estrae l'header (ovvero la directory, come 'dirname')
BASE_URL=${0:A:h}

FILE_TEMPLATES_DIR="$BASE_URL/templates"
# WEBPACK_SOURCE_DIR="$BASE_URL/webpack-setup"
WEBPACK_SOURCE_DIR="$BASE_URL"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}...package.json${NC}"
if [ ! -f package.json ]; then
  cat "$FILE_TEMPLATES_DIR/package-tpl.json" > package.json
else
  echo -e "${GREEN}package.json already exists${NC}"
fi

echo -e "${GREEN}...gitignore${NC}"
if [ ! -f .gitignore ]; then
  cat "$TEMPLATES_DIR/_gitignore" > .gitignore
else
  echo -e "${GREEN}.gitignore already exists${NC}"
fi

echo -e "\n${GREEN}Where do you want to install the frontend configuration?${NC}"
echo "1) Root directory"
echo "2) ‘frontend’ Directory"
read "?Choose (1 or 2) [default: 1]: " choice < /dev/tty
choice=${choice:-1}

if [ "$choice" = "2" ]; then
  FRONTEND_INSTALL_PATH="./frontend"
  echo -e "${GREEN}Files will be installed in: ./frontend${NC}"
else
  FRONTEND_INSTALL_PATH="."
  echo -e "${GREEN}Files will be installed in: root directory${NC}"
fi

if [ "$FRONTEND_INSTALL_PATH" = "./frontend" ]; then
  mkdir -p frontend
fi

echo -e "\n${GREEN}...config files & utilities${NC}"
cat "$TEMPLATES_DIR/_browserslistrc" > .browserslistrc
cat "$TEMPLATES_DIR/_editorconfig" > .editorconfig
cat "$TEMPLATES_DIR/_prettierrc" > .prettierrc
cat "$TEMPLATES_DIR/jsconfig.json" > jsconfig.json
cat "$TEMPLATES_DIR/vscode-workspace-settings.jsonc" > vscode-workspace-settings.jsonc

npm i -D @massimo-cassandro/dev-updater

echo -e "\n${GREEN}...eslint${NC}"
npm i -D @massimo-cassandro/eslint-config
cat "$TEMPLATES_DIR/eslint.config.mjs" > eslint.config.mjs

echo -e "\n${GREEN}...stylelint${NC}"
npm i -D @massimo-cassandro/stylelint-config
cat "$TEMPLATES_DIR/stylelint.config.mjs" > stylelint.config.mjs


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

npm i -D style-dictionary

cat "$WEBPACK_SOURCE_DIR/webpack.config.mjs" > "$FRONTEND_INSTALL_PATH/webpack.config.mjs"
cat "$WEBPACK_SOURCE_DIR/webpack-template.ejs" > "$FRONTEND_INSTALL_PATH/webpack-template.ejs"


# cartella webpack
WEBPACK_LOCAL_DIR="$FRONTEND_INSTALL_PATH/webpack-modules"
WEBPACK_MODULES_REMOTE_URL="$WEBPACK_SOURCE_DIR/webpack-modules"
FILES=(
  'css-rules.mjs'
  'get-jsConfig-aliases.mjs'
  'mini-svg-data-uri-loader.cjs'
  'svg-rules.mjs'
  'svgo.config.mjs'
  'postcss.config.mjs'
)

if [ ! -d "$WEBPACK_LOCAL_DIR" ]; then
  mkdir -p "$WEBPACK_LOCAL_DIR"

  for FILE in "${FILES[@]}"; do
    # echo "Scaricamento di $FILE..."
    cat "$WEBPACK_MODULES_REMOTE_URL/$FILE" > "$WEBPACK_LOCAL_DIR/$FILE"
  done

fi

echo -e "\n${GREEN}Creating a template of your frontend application's folder structured${NC}"

TEMPLATE_DIR_NAME="__frontend_app_dir_template__"
mkdir -p "$TEMPLATE_DIR_NAME"
cd "$TEMPLATE_DIR_NAME"
mkdir -p error-pages imgs icons src src/css favicons design-tokens
cd ..


echo -e "\n\n${GREEN}*** END ***${NC}"
