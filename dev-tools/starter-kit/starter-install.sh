#!/bin/zsh

# IMPORTANTE: questo script è idempotente e deve restare tale.
# Può essere rilanciato più volte sullo stesso progetto (anche via `npx starter-kit`
# per aggiornare un setup esistente) senza sovrascrivere nulla né creare duplicati:
# i file esistenti vengono saltati o copiati con prefisso NEW-, i merge di
# package.json e *.code-workspace non duplicano le chiavi già presenti.
# Ogni modifica futura deve conservare questa proprietà.

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Questo script richiede zsh: se lanciato con sh/bash blocca l'esecuzione
if [ -z "$ZSH_VERSION" ]; then
  printf "${RED}Errore: lanciare con 'zsh starter-install.sh', non con sh/bash.${NC}\n" >&2
  exit 1
fi

# Configurazione variabili
# BASE_URL="https://raw.githubusercontent.com/massimo-cassandro/minimo/refs/heads/main"

# in locale: cat ....
# da remoto curl -s

# %:A risolve il percorso assoluto (anche con link simbolici)
# %:h estrae l'header (ovvero la directory, come 'dirname')
BASE_URL=${0:A:h}

echo "BASE_URL: ${BASE_URL}"

TEMPLATES_DIR="${BASE_URL}/templates"
# WEBPACK_SOURCE_DIR="$BASE_URL/starter-kit"
WEBPACK_SOURCE_DIR="$BASE_URL"

# protezione contro la sovrascrittura
set -C

# Array per tracciare i file già esistenti
BLOCKED_FILES=()

# Wrapper: copia solo se il file non esiste, altrimenti registra il blocco.
# Con terzo argomento "new", se la destinazione esiste già la copia viene
# comunque creata con prefisso NEW- (da integrare manualmente o rimuovere)
safe_cat() {
  local src="$1"
  local dest="$2"
  local mode="$3"
  if [ ! -f "$src" ]; then
    echo -e "${RED}Sorgente mancante: $src${NC}"
    return 1
  fi
  if [ -e "$dest" ]; then
    if [ "$mode" = "new" ]; then
      local new_dest="$(dirname "$dest")/NEW-$(basename "$dest")"
      cat "$src" >| "$new_dest"
      BLOCKED_FILES+=("$dest → copiato come $new_dest")
    else
      BLOCKED_FILES+=("$dest")
    fi
  else
    cat "$src" > "$dest"
  fi
}

echo -e "${GREEN}...package.json${NC}"
if [ ! -f package.json ]; then
  safe_cat "${TEMPLATES_DIR}/package-tpl.json" package.json
elif [ ! -f "${TEMPLATES_DIR}/package-tpl.json" ]; then
  echo -e "${RED}Sorgente mancante: ${TEMPLATES_DIR}/package-tpl.json${NC}"
else
  # package.json esistente: merge con il template, aggiungendo in fondo
  # le chiavi del template prefissate con '_' (ordine originale preservato)
  node -e '
    const fs = require("fs");
    const existing = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const tpl = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    for (const [key, value] of Object.entries(tpl)) {
      existing["_" + key] = value;
    }
    fs.writeFileSync("package.json", JSON.stringify(existing, null, 2) + "\n");
  ' "${TEMPLATES_DIR}/package-tpl.json"
  echo -e "${YELLOW}package.json esistente: chiavi del template aggiunte in fondo con prefisso '_' (da integrare o rimuovere)${NC}"
  BLOCKED_FILES+=("package.json → merge: chiavi template aggiunte con prefisso \`_\`")
fi

echo -e "${GREEN}...gitignore${NC}"
safe_cat "${TEMPLATES_DIR}/_gitignore" .gitignore new

echo -e "\n${GREEN}Where do you want to install the frontend configuration?${NC}"
echo "1) Root directory"
echo "2) 'frontend' Directory"
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

safe_cat "${TEMPLATES_DIR}/_browserslistrc"            .browserslistrc new
safe_cat "${TEMPLATES_DIR}/_editorconfig"              .editorconfig new
safe_cat "${TEMPLATES_DIR}/_prettierrc"                .prettierrc new
safe_cat "${TEMPLATES_DIR}/jsconfig.json"              jsconfig.json new
safe_cat "${TEMPLATES_DIR}/_root_htaccess"             _root_htaccess
safe_cat "${TEMPLATES_DIR}/_root_robots.txt"           _root_robots.txt

# code-workspace: se un file .code-workspace esiste già (qualunque sia il nome),
# le chiavi del template vengono aggiunte in fondo con prefisso '_'
WORKSPACE_TPL="${TEMPLATES_DIR}/__project__.code-workspace"
WORKSPACE_FILES=( *.code-workspace(N) )
if [ ${#WORKSPACE_FILES[@]} -gt 1 ]; then
  echo -e "${RED}Trovati più file .code-workspace (${WORKSPACE_FILES[*]}): merge non eseguito${NC}"
elif [ ${#WORKSPACE_FILES[@]} -eq 0 ]; then
  safe_cat "$WORKSPACE_TPL" __project__.code-workspace
elif [ ! -f "$WORKSPACE_TPL" ]; then
  echo -e "${RED}Sorgente mancante: ${WORKSPACE_TPL}${NC}"
else
  WORKSPACE_FILE="${WORKSPACE_FILES[1]}"
  if node "${BASE_URL}/merge-jsonc.cjs" "$WORKSPACE_TPL" "$WORKSPACE_FILE"; then
    echo -e "${YELLOW}${WORKSPACE_FILE} esistente: chiavi del template aggiunte in fondo con prefisso '_' (da integrare o rimuovere)${NC}"
    BLOCKED_FILES+=("${WORKSPACE_FILE} → merge: chiavi template aggiunte con prefisso \`_\`")
  else
    echo -e "${RED}Merge di ${WORKSPACE_FILE} non riuscito${NC}"
  fi
fi


echo -e "\n${GREEN}...eslint${NC}"
npm i -D @massimo-cassandro/eslint-config
safe_cat "${TEMPLATES_DIR}/eslint.config.mjs" eslint.config.mjs new

echo -e "\n${GREEN}...stylelint${NC}"
npm i -D @massimo-cassandro/stylelint-config
safe_cat "${TEMPLATES_DIR}/stylelint.config.mjs" stylelint.config.mjs new

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

safe_cat "${WEBPACK_SOURCE_DIR}/webpack.config.mjs"   "${FRONTEND_INSTALL_PATH}/webpack.config.mjs"
safe_cat "${WEBPACK_SOURCE_DIR}/webpack-template.ejs" "${FRONTEND_INSTALL_PATH}/webpack-template.ejs"

# cartella webpack
WEBPACK_LOCAL_DIR="${FRONTEND_INSTALL_PATH}/webpack-modules"
WEBPACK_MODULES_REMOTE_URL="${WEBPACK_SOURCE_DIR}/webpack-modules"
FILES=(
  'css-rules.mjs'
  'get-jsConfig-aliases.mjs'
  'mini-svg-data-uri-loader.cjs'
  'svg-rules.mjs'
  'svgo.config.mjs'
  'postcss.config.mjs'
)

# se la cartella esiste già, i moduli vengono copiati in NEW-webpack-modules
# (da integrare manualmente o rimuovere)
if [ -d "$WEBPACK_LOCAL_DIR" ]; then
  NEW_WEBPACK_LOCAL_DIR="$(dirname "$WEBPACK_LOCAL_DIR")/NEW-$(basename "$WEBPACK_LOCAL_DIR")"
  BLOCKED_FILES+=("$WEBPACK_LOCAL_DIR → copiata come $NEW_WEBPACK_LOCAL_DIR")
  WEBPACK_LOCAL_DIR="$NEW_WEBPACK_LOCAL_DIR"
fi

mkdir -p "$WEBPACK_LOCAL_DIR"

for FILE in "${FILES[@]}"; do
  safe_cat "${WEBPACK_MODULES_REMOTE_URL}/${FILE}" "${WEBPACK_LOCAL_DIR}/${FILE}"
done

echo -e "\n${GREEN}Creating a template of your frontend application's folder structured${NC}"

TEMPLATE_DIR_NAME="__frontend_app_dir_template__"
mkdir -p "$TEMPLATE_DIR_NAME"
cd "$TEMPLATE_DIR_NAME"
mkdir -p error-pages imgs icons src src/css favicons design-tokens
cd ..
set +C

# Riepilogo finale dei file già esistenti
if [ ${#BLOCKED_FILES[@]} -gt 0 ]; then
  echo -e "\n${YELLOW}*** File già esistenti (non copiati o copiati con prefisso NEW-): ***${NC}"
  for F in "${BLOCKED_FILES[@]}"; do
    echo -e "${YELLOW}  ✗ $F${NC}"
  done
else
  echo -e "\n${GREEN}Nessun file bloccato.${NC}"
fi

echo -e "\n\n${GREEN}*** END ***${NC}"
