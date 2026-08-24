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

# Questo script richiede zsh: se lanciato con sh/bash blocca l'esecuzione
if [ -z "$ZSH_VERSION" ]; then
  printf "${RED}Errore: lanciare con 'zsh starter-install.sh', non con sh/bash.${NC}\n" >&2
  exit 1
fi

# --no-npm: salta le installazioni npm (utile per testare rapidamente lo script)
# --root / --frontend / --app: posizione della configurazione frontend (salta
#   il prompt, utile per esecuzioni non interattive)
SKIP_NPM=0
FRONTEND_CHOICE=""
for ARG in "$@"; do
  case "$ARG" in
    --no-npm) SKIP_NPM=1 ;;
    --root) FRONTEND_CHOICE=1 ;;
    --frontend) FRONTEND_CHOICE=2 ;;
    --app) FRONTEND_CHOICE=3 ;;
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
# comunque creata con prefisso NEW- (da integrare manualmente o rimuovere).
# Con terzo argomento "underscore", stesso comportamento ma con prefisso _
# (usato per package.json e *.code-workspace: il file esistente non viene
# toccato, il template arriva accanto con un _ davanti al nome, da integrare
# o rimuovere manualmente)
safe_cat() {
  local src="$1"
  local dest="$2"
  local mode="$3"
  if [ ! -f "$src" ]; then
    echo -e "${RED}Sorgente mancante: $src${NC}"
    return 1
  fi
  if [ -e "$dest" ]; then
    case "$mode" in
      new)
        local new_dest="$(dirname "$dest")/NEW-$(basename "$dest")"
        cat "$src" >| "$new_dest"
        BLOCKED_FILES+=("$dest → copiato come $new_dest")
        ;;
      underscore)
        local new_dest="$(dirname "$dest")/_$(basename "$dest")"
        cat "$src" >| "$new_dest"
        BLOCKED_FILES+=("$dest → copiato come $new_dest")
        ;;
      *)
        BLOCKED_FILES+=("$dest")
        ;;
    esac
  else
    cat "$src" > "$dest"
  fi
}

echo -e "${GREEN}...package.json${NC}"
safe_cat "${BASE_URL}/package-tpl.json" package.json underscore

echo -e "${GREEN}...gitignore${NC}"
safe_cat "${TEMPLATES_DIR}/_gitignore" .gitignore new

if [ -n "$FRONTEND_CHOICE" ]; then
  choice="$FRONTEND_CHOICE"
else
  echo -e "\n${GREEN}Where do you want to install the frontend configuration?${NC}"
  echo "1) Root directory"
  echo "2) 'frontend' Directory"
  echo "3) 'app' Directory"
  read "?Choose (1, 2 or 3) [default: 2]: " choice < /dev/tty
  choice=${choice:-2}
fi

if [ "$choice" = "1" ]; then
  FRONTEND_INSTALL_PATH="."
  echo -e "${GREEN}Files will be installed in: root directory${NC}"
elif [ "$choice" = "3" ]; then
  FRONTEND_INSTALL_PATH="./app"
  echo -e "${GREEN}Files will be installed in: ./app${NC}"
else
  FRONTEND_INSTALL_PATH="./frontend"
  echo -e "${GREEN}Files will be installed in: ./frontend${NC}"
fi

if [ "$FRONTEND_INSTALL_PATH" != "." ]; then
  mkdir -p "$FRONTEND_INSTALL_PATH"
fi


echo -e "\n${GREEN}...config files & utilities${NC}"

safe_cat "${TEMPLATES_DIR}/_browserslistrc"            .browserslistrc new
safe_cat "${TEMPLATES_DIR}/_editorconfig"              .editorconfig new
safe_cat "${TEMPLATES_DIR}/_prettierrc"                .prettierrc new
safe_cat "${TEMPLATES_DIR}/_root_htaccess"             "${FRONTEND_INSTALL_PATH}/_root_htaccess"
safe_cat "${TEMPLATES_DIR}/_root_robots.txt"           "${FRONTEND_INSTALL_PATH}/_root_robots.txt"

# jsconfig.json: sta SEMPRE nella root del progetto (è anche il file di
# riferimento di vscode). I suoi path sono quindi relativi alla root: il
# placeholder __FRONTEND__ viene risolto in base alla posizione scelta.
# NB: webpack.config.mjs lo cerca in root anche quando è in una sottodirectory
if [ "$FRONTEND_INSTALL_PATH" = "." ]; then
  FRONTEND_REL="./"
else
  FRONTEND_REL="${FRONTEND_INSTALL_PATH}/"
fi
JSCONFIG_TPL="${TEMPLATES_DIR}/jsconfig.json"
if [ ! -f "$JSCONFIG_TPL" ]; then
  echo -e "${RED}Sorgente mancante: ${JSCONFIG_TPL}${NC}"
else
  JSCONFIG_TMP="$(mktemp)"
  sed "s|__FRONTEND__|${FRONTEND_REL}|g" "$JSCONFIG_TPL" >| "$JSCONFIG_TMP"
  safe_cat "$JSCONFIG_TMP" jsconfig.json new
  rm -f "$JSCONFIG_TMP"
fi

# code-workspace: se un file .code-workspace esiste già (qualunque sia il nome),
# il template viene copiato accanto con un _ davanti al nome esistente
WORKSPACE_TPL="${TEMPLATES_DIR}/__project__.code-workspace"
WORKSPACE_FILES=( *.code-workspace(N) )
if [ ${#WORKSPACE_FILES[@]} -gt 1 ]; then
  echo -e "${RED}Trovati più file .code-workspace (${WORKSPACE_FILES[*]}): copia saltata${NC}"
elif [ ${#WORKSPACE_FILES[@]} -eq 0 ]; then
  safe_cat "$WORKSPACE_TPL" __project__.code-workspace
else
  safe_cat "$WORKSPACE_TPL" "${WORKSPACE_FILES[1]}" underscore
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

# Sorgenti di minimo da copiare nel progetto: si usa il pacchetto appena
# installato in node_modules (stessa versione che userà il progetto) e, in
# fallback, la dir da cui è lanciato questo script (repo o pacchetto estratto)
MINIMO_PKG_DIR=""
for CANDIDATE in "./node_modules/@massimo-cassandro/minimo" "${BASE_URL}/../.."; do
  if [ -f "${CANDIDATE}/src/custom-properties.css" ]; then
    MINIMO_PKG_DIR="$CANDIDATE"
    break
  fi
done

if [ -z "$MINIMO_PKG_DIR" ]; then
  if [ "$SKIP_NPM" = "1" ]; then
    echo -e "${YELLOW}(--no-npm) css di base, index.css, tokens-config e config favicons non copiati: npm i è stato saltato, quindi @massimo-cassandro/minimo non è ancora installato in node_modules (rilancia lo script senza --no-npm per completare la copia)${NC}"
    BLOCKED_FILES+=("css di base + index.css + tokens-config.mjs + create-favicons-cfg.mjs → saltati (--no-npm)")
  else
    echo -e "${RED}Sorgenti di minimo non trovati (né in ./node_modules/@massimo-cassandro/minimo né in ${BASE_URL}/../..): css di base, index.css, tokens-config e config favicons non copiati${NC}"
    BLOCKED_FILES+=("css di base + index.css + tokens-config.mjs + create-favicons-cfg.mjs → sorgenti minimo non trovati")
  fi
else
  echo "sorgenti minimo: ${MINIMO_PKG_DIR}"

  # css di partenza del progetto: solo i file destinati a essere personalizzati
  for FILE in custom-properties.css custom-media.css fonts.css; do
    safe_cat "${MINIMO_PKG_DIR}/src/${FILE}" "${FRONTEND_INSTALL_PATH}/src/css/${FILE}"
  done

  # config di build-tokens: collocato accanto al css generato (custom-properties.css).
  # NB: i percorsi relativi nel file vanno adattati alla sua posizione effettiva
  safe_cat "${MINIMO_PKG_DIR}/design-tokens/tokens-config-sample.mjs" "${FRONTEND_INSTALL_PATH}/src/css/tokens-config.mjs"

  # entry css principale del progetto: copia diretta di minimo.css, rinominato
  # index.css e collocato sulla root di installazione (non in /src)
  safe_cat "${MINIMO_PKG_DIR}/src/minimo.css" "${FRONTEND_INSTALL_PATH}/index.css"

  # favicons: config di default per `npx create-favicons`
  safe_cat "${MINIMO_PKG_DIR}/dev-tools/create-favicons/src/default-params.mjs" "${FRONTEND_INSTALL_PATH}/favicons/create-favicons-cfg.mjs"
fi

# entry css critical (inline nei template html) e entry js, sulla root di
# installazione accanto a index.css
safe_cat "${TEMPLATES_DIR}/layout-critical.css" "${FRONTEND_INSTALL_PATH}/src/css/layout-critical.css"
safe_cat "${TEMPLATES_DIR}/app_index.js"       "${FRONTEND_INSTALL_PATH}/index.js"

# favicons: istruzioni d'uso di `npx create-favicons`
safe_cat "${TEMPLATES_DIR}/favicons-readme.md" "${FRONTEND_INSTALL_PATH}/favicons/readme.md"

set +C

# Riepilogo finale dei file già esistenti
if [ ${#BLOCKED_FILES[@]} -gt 0 ]; then
  echo -e "\n${YELLOW}*** File già esistenti (non copiati o copiati con prefisso NEW-/_): ***${NC}"
  for F in "${BLOCKED_FILES[@]}"; do
    echo -e "${YELLOW}  ✗ $F${NC}"
  done
else
  echo -e "\n${GREEN}Nessun file bloccato.${NC}"
fi

echo -e "\n\n${GREEN}*** END ***${NC}"
