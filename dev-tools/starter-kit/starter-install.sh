#!/bin/zsh

# IMPORTANTE: questo script è idempotente e deve restare tale.
# Può essere rilanciato più volte sullo stesso progetto (anche via `npx starter-kit`
# per aggiornare un setup esistente) senza sovrascrivere nulla né creare duplicati:
# i file esistenti vengono saltati o copiati con prefisso NEW- (o _ per
# package.json e *.code-workspace).
# Ogni modifica futura deve conservare questa proprietà.

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

DEBUG=TRUE

# Questo script richiede zsh: se lanciato con sh/bash blocca l'esecuzione
if [ -z "$ZSH_VERSION" ]; then
  printf "${RED}Errore: lanciare con 'zsh starter-install.sh', non con sh/bash.${NC}\n" >&2
  exit 1
fi

BASE_URL=${0:A:h}

echo "BASE_URL: ${BASE_URL}"

SOURCE_FILES_DIR="${BASE_URL}/source_files"

# webpack
WEBPACK_CONFIG_SOURCE_PATH="$BASE_URL"
WEBPACK_MODULES_SOURCE_PATH="${BASE_URL}/webpack-config-modules"
WEBPACK_MODULES_INSTALL_PATH="./webpack-config-modules"

# protezione contro la sovrascrittura
set -C


# Wrapper: copia il file, se esiste viene copiato con prefisso NEW- (da integrare manualmente o rimuovere).
safe_cat() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$src" ]; then
    echo -e "${RED}Sorgente mancante: $src${NC}"
    return 1
  fi
  if [ -e "$dest" ]; then
    local new_dest="$(dirname "$dest")/NEW-$(basename "$dest")"
    cat "$src" >| "$new_dest"
  else
    cat "$src" > "$dest"
  fi
}

FRONTEND_INSTALL_PATH="./app"
# se la cartella esiste già, i moduli vengono copiati in NEW-webpack-modules
# (da integrare manualmente o rimuovere)
if [ -d "$FRONTEND_INSTALL_PATH" ]; then
  FRONTEND_INSTALL_PATH="./NEW-$(basename "$FRONTEND_INSTALL_PATH")"
fi

echo -e "${GREEN}Files will be installed in: '${FRONTEND_INSTALL_PATH}'${NC}"
mkdir -p "${FRONTEND_INSTALL_PATH}"



echo -e "${GREEN}...ROOT FILES${NC}"
safe_cat "${BASE_URL}/package-tpl.json"  package.json
safe_cat "${WEBPACK_CONFIG_SOURCE_PATH}/webpack.config.mjs"  webpack.config.mjs

safe_cat "${SOURCE_FILES_DIR}/_gitignore" .gitignore
safe_cat "${SOURCE_FILES_DIR}/_browserslistrc" .browserslistrc
safe_cat "${SOURCE_FILES_DIR}/_editorconfig" .editorconfig
safe_cat "${SOURCE_FILES_DIR}/_prettierrc" .prettierrc
safe_cat "${SOURCE_FILES_DIR}/jsconfig.json" jsconfig.json
safe_cat "${SOURCE_FILES_DIR}/__project__.code-workspace" __project__.code-workspace
safe_cat "${SOURCE_FILES_DIR}/eslint.config.mjs" eslint.config.mjs
safe_cat "${SOURCE_FILES_DIR}/stylelint.config.mjs" stylelint.config.mjs

echo -e "${GREEN}...APP FILES${NC}"
safe_cat "${SOURCE_FILES_DIR}/_root_htaccess"             "${FRONTEND_INSTALL_PATH}/_root_htaccess"
safe_cat "${SOURCE_FILES_DIR}/_root_robots.txt"           "${FRONTEND_INSTALL_PATH}/_root_robots.txt"
safe_cat "${SOURCE_FILES_DIR}/CLAUDE-frontend.md"         "${FRONTEND_INSTALL_PATH}/CLAUDE.md"
safe_cat "${WEBPACK_CONFIG_SOURCE_PATH}/webpack-template.ejs" "${FRONTEND_INSTALL_PATH}/tpl/index.ejs"


echo -e "${GREEN}..WEBPACK CONFIG MODULES${NC}"
# se la cartella esiste già, i moduli vengono copiati in NEW-webpack-modules
# (da integrare manualmente o rimuovere)
if [ -d "$WEBPACK_MODULES_INSTALL_PATH" ]; then
  WEBPACK_MODULES_INSTALL_PATH="./NEW-$(basename "$WEBPACK_MODULES_INSTALL_PATH")"
fi

mkdir -p "$WEBPACK_MODULES_INSTALL_PATH"

# copia tutti i file presenti in webpack-modules,
for FILE in "${WEBPACK_MODULES_SOURCE_PATH}"/*; do
  [ -f "$FILE" ] || continue
  safe_cat "$FILE" "${WEBPACK_MODULES_INSTALL_PATH}/$(basename "$FILE")"
done


echo -e "\n${GREEN}...NODE MODULES${NC}"

dependencies=(
  @massimo-cassandro/minimo
)

devDependencies=(
  @massimo-cassandro/eslint-config
  @massimo-cassandro/stylelint-config

  @babel/core
  @babel/preset-env
  @csstools/postcss-global-data
  autoprefixer
  babel-loader
  copy-webpack-plugin
  css-loader
  css-minimizer-webpack-plugin
  ejs-loader
  glob
  html-loader
  html-webpack-plugin
  mini-css-extract-plugin
  mini-svg-data-uri
  postcss
  postcss-custom-media
  postcss-loader
  postcss-preset-env
  process
  purgecss-webpack-plugin
  responsive-loader
  style-dictionary
  style-loader
  svg-url-loader
  svgo
  svgo-add-viewbox
  svgo-loader
  terser-webpack-plugin
  webpack
  webpack-cli
  webpack-dev-server
  webpack-manifest-plugin
  webpack-remove-empty-scripts

  # da installare solo se necessari
  # dotenv-webpack
  # @principalstudio/html-webpack-inject-preload file-loader
)

if [ "$DEBUG" = "TRUE" ]; then
  dependencies=( @massimo-cassandro/minimo )
  devDependencies=()
fi

for pkg in "${dependencies[@]}"; do
  npm i -S "$pkg"
done

for pkg in "${devDependencies[@]}"; do
  npm i -S "$pkg"
done

echo -e "\n${GREEN}...creating default folders${NC}"
mkdir -p \
  "${FRONTEND_INSTALL_PATH}/src" \
  "${FRONTEND_INSTALL_PATH}/css" \
  "${FRONTEND_INSTALL_PATH}/tpl" \
  "${FRONTEND_INSTALL_PATH}/icons" \
  "${FRONTEND_INSTALL_PATH}/imgs" \
  "${FRONTEND_INSTALL_PATH}/favicons" \
  "${FRONTEND_INSTALL_PATH}/error-pages"


echo -e "${GREEN}...MINIMO FILES${NC}"
# Sorgenti di minimo da copiare nel progetto: si usa il pacchetto appena
# installato in node_modules (stessa versione che userà il progetto)
MINIMO_PKG_DIR=./node_modules/@massimo-cassandro/minimo

safe_cat "${MINIMO_PKG_DIR}/src/custom-properties.css" "${FRONTEND_INSTALL_PATH}/css/custom-properties.css"
safe_cat "${MINIMO_PKG_DIR}/src/custom-media.css" "${FRONTEND_INSTALL_PATH}/css/custom-media.css"
safe_cat "${MINIMO_PKG_DIR}/src/fonts.css" "${FRONTEND_INSTALL_PATH}/css/fonts.css"

# config di build-tokens: collocato accanto al css generato (custom-properties.css).
safe_cat "${MINIMO_PKG_DIR}/design-tokens/tokens-config-sample.mjs" "${FRONTEND_INSTALL_PATH}/css/tokens-config.mjs"

# entry css principale del progetto: copia diretta di minimo.css, rinominato
# index.css e collocato sulla root di installazione (non in /src)
safe_cat "${MINIMO_PKG_DIR}/src/minimo.css" "${FRONTEND_INSTALL_PATH}/index.css"

# favicons: config di default per `npx create-favicons`
safe_cat "${MINIMO_PKG_DIR}/dev-tools/create-favicons/src/default-params.mjs" "${FRONTEND_INSTALL_PATH}/favicons/create-favicons-cfg.mjs"
# favicons: istruzioni d'uso di `npx create-favicons`
safe_cat "${SOURCE_FILES_DIR}/favicons-readme.md" "${FRONTEND_INSTALL_PATH}/favicons/readme.md"


# entry css critical (inline nei template html) e entry js, sulla root di
# installazione accanto a index.css
safe_cat "${SOURCE_FILES_DIR}/app_index.js" "${FRONTEND_INSTALL_PATH}/index.js"

# layout critical css
safe_cat "${SOURCE_FILES_DIR}/layout-critical.css" "${FRONTEND_INSTALL_PATH}/css/layout-critical.css"



set +C
echo -e "\n\n${GREEN}*** END ***${NC}"
