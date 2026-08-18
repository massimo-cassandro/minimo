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

# --no-npm: salta le installazioni npm (utile per testare rapidamente lo script)
# --root / --frontend: posizione della configurazione frontend (salta il prompt,
#   utile per esecuzioni non interattive)
SKIP_NPM=0
FRONTEND_CHOICE=""
for ARG in "$@"; do
  case "$ARG" in
    --no-npm) SKIP_NPM=1 ;;
    --root) FRONTEND_CHOICE=1 ;;
    --frontend) FRONTEND_CHOICE=2 ;;
  esac
done

# Wrapper: esegue "npm i ..." a meno che SKIP_NPM sia attivo
npm_i() {
  if [ "$SKIP_NPM" = "1" ]; then
    echo "(--no-npm) skip: npm i $*"
  else
    npm i "$@"
  fi
}

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

if [ -n "$FRONTEND_CHOICE" ]; then
  choice="$FRONTEND_CHOICE"
else
  echo -e "\n${GREEN}Where do you want to install the frontend configuration?${NC}"
  echo "1) Root directory"
  echo "2) 'frontend' Directory"
  read "?Choose (1 or 2) [default: 1]: " choice < /dev/tty
  choice=${choice:-1}
fi

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
safe_cat "${TEMPLATES_DIR}/_root_htaccess"             _root_htaccess
safe_cat "${TEMPLATES_DIR}/_root_robots.txt"           _root_robots.txt

# jsconfig.json: va installato ACCANTO a webpack.config.mjs (che legge gli alias
# con `path.resolve(__dirname, './jsconfig.json')`), non necessariamente in root.
# Il placeholder __NODE_MODULES__ viene risolto in base alla posizione scelta.
if [ "$FRONTEND_INSTALL_PATH" = "." ]; then
  NODE_MODULES_REL="./node_modules"
else
  NODE_MODULES_REL="../node_modules"
fi
JSCONFIG_TPL="${TEMPLATES_DIR}/jsconfig.json"
if [ ! -f "$JSCONFIG_TPL" ]; then
  echo -e "${RED}Sorgente mancante: ${JSCONFIG_TPL}${NC}"
else
  JSCONFIG_TMP="$(mktemp)"
  sed "s|__NODE_MODULES__|${NODE_MODULES_REL}|g" "$JSCONFIG_TPL" >| "$JSCONFIG_TMP"
  safe_cat "$JSCONFIG_TMP" "${FRONTEND_INSTALL_PATH}/jsconfig.json" new
  rm -f "$JSCONFIG_TMP"
fi

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
  if node "${BASE_URL}/src/merge-jsonc.mjs" "$WORKSPACE_TPL" "$WORKSPACE_FILE"; then
    echo -e "${YELLOW}${WORKSPACE_FILE} esistente: chiavi del template aggiunte in fondo con prefisso '_' (da integrare o rimuovere)${NC}"
    BLOCKED_FILES+=("${WORKSPACE_FILE} → merge: chiavi template aggiunte con prefisso \`_\`")
  else
    echo -e "${RED}Merge di ${WORKSPACE_FILE} non riuscito${NC}"
  fi
fi


echo -e "\n${GREEN}...minimo${NC}"
npm_i -S @massimo-cassandro/minimo

echo -e "\n${GREEN}...eslint${NC}"
npm_i -D @massimo-cassandro/eslint-config
safe_cat "${TEMPLATES_DIR}/eslint.config.mjs" eslint.config.mjs new

echo -e "\n${GREEN}...stylelint${NC}"
npm_i -D @massimo-cassandro/stylelint-config
safe_cat "${TEMPLATES_DIR}/stylelint.config.mjs" stylelint.config.mjs new

echo -e "\n${GREEN}...webpack${NC}"
npm_i -D webpack-cli webpack-dev-server webpack-manifest-plugin webpack
npm_i -D @babel/core @babel/preset-env babel-loader terser-webpack-plugin
npm_i -D webpack-remove-empty-scripts copy-webpack-plugin html-loader html-webpack-plugin
# npm_i -D @principalstudio/html-webpack-inject-preload file-loader # da installare solo se necessario
npm_i -D postcss autoprefixer postcss-custom-media @csstools/postcss-global-data postcss-loader postcss-preset-env
# NB: niente cssnano: la minificazione è di css-minimizer-webpack-plugin e cssnano
# nel loader postcss eliminerebbe i commenti `purgecss ignore` prima di PurgeCSS
npm_i -D mini-css-extract-plugin style-loader css-loader css-minimizer-webpack-plugin
npm_i -D responsive-loader
npm_i -D process dotenv-webpack
npm_i -D svgo svg-url-loader svgo-loader svgo-add-viewbox mini-svg-data-uri
npm_i -D ejs-loader
npm_i -D purgecss-webpack-plugin glob

npm_i -D style-dictionary

safe_cat "${WEBPACK_SOURCE_DIR}/webpack.config.mjs"   "${FRONTEND_INSTALL_PATH}/webpack.config.mjs"

# cartella webpack
WEBPACK_LOCAL_DIR="${FRONTEND_INSTALL_PATH}/webpack-modules"
WEBPACK_MODULES_REMOTE_URL="${WEBPACK_SOURCE_DIR}/webpack-modules"

# se la cartella esiste già, i moduli vengono copiati in NEW-webpack-modules
# (da integrare manualmente o rimuovere)
if [ -d "$WEBPACK_LOCAL_DIR" ]; then
  NEW_WEBPACK_LOCAL_DIR="$(dirname "$WEBPACK_LOCAL_DIR")/NEW-$(basename "$WEBPACK_LOCAL_DIR")"
  BLOCKED_FILES+=("$WEBPACK_LOCAL_DIR → copiata come $NEW_WEBPACK_LOCAL_DIR")
  WEBPACK_LOCAL_DIR="$NEW_WEBPACK_LOCAL_DIR"
fi

mkdir -p "$WEBPACK_LOCAL_DIR"

# copia tutti i file presenti in webpack-modules,
for FILE in "${WEBPACK_MODULES_REMOTE_URL}"/*; do
  [ -f "$FILE" ] || continue
  safe_cat "$FILE" "${WEBPACK_LOCAL_DIR}/$(basename "$FILE")"
done

echo -e "\n${GREEN}Creating your frontend application's folder structure${NC}"

# La struttura viene creata nella posizione scelta a inizio script, coerente con
# i percorsi attesi da webpack.config.mjs (`./src/...`, `./favicons/output`,
# `./error-pages/...`), da jsconfig.json (@css, @src, @icons, @imgs) e da
# postcss.config.mjs (`../src/css/custom-media.css`)
mkdir -p \
  "${FRONTEND_INSTALL_PATH}/src/css" \
  "${FRONTEND_INSTALL_PATH}/src/tpl" \
  "${FRONTEND_INSTALL_PATH}/icons" \
  "${FRONTEND_INSTALL_PATH}/imgs" \
  "${FRONTEND_INSTALL_PATH}/favicons" \
  "${FRONTEND_INSTALL_PATH}/error-pages"

# template html di webpack (HtmlWebpackPlugin: `./src/tpl/index.ejs`)
safe_cat "${WEBPACK_SOURCE_DIR}/webpack-template.ejs" "${FRONTEND_INSTALL_PATH}/src/tpl/index.ejs"

# css di partenza del progetto: solo i file destinati a essere personalizzati.
# minimo.css NON viene copiato: i moduli css del framework vanno importati dal
# pacchetto (`@import '@minimo/css/...'`, vedi entry-tpl.css)
MINIMO_ROOT_CSS_DIR="${BASE_URL}/../../src"
for FILE in custom-properties.css custom-media.css fonts.css; do
  safe_cat "${MINIMO_ROOT_CSS_DIR}/${FILE}" "${FRONTEND_INSTALL_PATH}/src/css/${FILE}"
done

# config di build-tokens: collocato accanto al css generato (custom-properties.css).
# NB: i percorsi relativi nel file vanno adattati alla sua posizione effettiva
safe_cat "${BASE_URL}/../../design-tokens/tokens-config-sample.mjs" "${FRONTEND_INSTALL_PATH}/src/css/tokens-config.mjs"

# template delle entry css (globale/di pagina e critical): ogni entry deve
# importare direttamente custom-properties.css (vedi commenti nei file stessi)
safe_cat "${TEMPLATES_DIR}/entry-tpl.css"          "${FRONTEND_INSTALL_PATH}/src/entry-tpl.css"
safe_cat "${TEMPLATES_DIR}/entry-tpl.critical.css" "${FRONTEND_INSTALL_PATH}/src/entry-tpl.critical.css"

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
