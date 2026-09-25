#!/bin/zsh

# IMPORTANTE: questo script è idempotente e deve restare tale.
# Può essere rilanciato più volte sullo stesso progetto (anche via `npx starter-kit`
# per aggiornare un setup esistente) senza sovrascrivere nulla né creare duplicati.
# Per i singoli file installati sulla root del progetto e dentro
# ./webpack-config-modules: se il contenuto esistente è identico al sorgente la
# copia viene saltata; se è diverso e non esiste ancora un OLD- corrispondente,
# il file esistente viene rinominato con prefisso OLD- (preservato da quel
# momento in poi, non viene più toccato nelle esecuzioni successive) e il nuovo
# file prende il nome originale; se l'OLD- corrispondente esiste già, viene
# invece sovrascritto direttamente il file "nuovo", senza aggiungere ulteriori
# prefissi. Stessa logica, a livello di intera cartella (senza diff sui
# singoli file contenuti al suo interno prima della prima installazione), per
# ./webpack-config-modules.
# ./app segue invece una logica più semplice: viene rinominata per intero in
# OLD-app solo la prima volta che esiste già (preservata da quel momento in
# poi, mai più toccata); i file al suo interno vengono sempre sovrascritti
# senza controllo né backup individuale (force_cat), dato che l'intera
# cartella precedente resta comunque disponibile in OLD-app.
# Ogni modifica futura deve conservare questa proprietà.

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
DIM='\033[2m' # Dim
NC='\033[0m' # No Color

DEBUG=FALSE
for arg in "$@"; do
  case "$arg" in
    --debug) DEBUG=TRUE ;;
  esac
done

# Questo script richiede zsh: se lanciato con sh/bash blocca l'esecuzione
if [ -z "$ZSH_VERSION" ]; then
  printf "${RED}Errore: lanciare con 'zsh starter-install.sh', non con sh/bash.${NC}\n" >&2
  exit 1
fi

# Porta da utilizzare: l'utente inserisce un numero da 0 a 99 (default 0), che
# viene normalizzato a due cifre e usato come suffisso delle porte 80xx e 57xx.
# I valori sostituiscono i segnaposto [[port8000]] e [[port5700]] presenti in
# package-tpl.json, webpack.config.mjs e altri (vedi safe_cat_with_ports).
read "PORT_INPUT?Porta da utilizzare (0-99) [0]: "
PORT_INPUT=${PORT_INPUT:-0}
if [[ ! "$PORT_INPUT" =~ '^[0-9]{1,2}$' ]]; then
  printf "${RED}Errore: inserire un numero intero tra 0 e 99.${NC}\n" >&2
  exit 1
fi
PORT_SUFFIX=${(l:2::0:)PORT_INPUT}
PORT_8000="80${PORT_SUFFIX}"
PORT_5700="57${PORT_SUFFIX}"
echo -e "${DIM}Porte: ${PORT_8000} (server), ${PORT_5700} (webpack dev server)${NC}"

# Pacchetti opzionali: installati solo su conferma esplicita dell'utente
# (vedi ciclo di domande più sotto). Include sia devDependency "pure" del
# progetto, sia i peer dependencies opzionali di @massimo-cassandro/minimo
# (vedi package.json di minimo, campi peerDependencies/peerDependenciesMeta:
# elenco mantenuto a mano, non letto dinamicamente da minimo — se cambiano va
# aggiornato manualmente anche qui).
# Ogni voce è "<pacchetto> | <dev> | <descrizione>" (pacchetto e colonna <dev>
# allineati a colonna fissa solo per leggibilità, non richiesto dal parsing).
# La colonna <pacchetto> può contenere più pacchetti separati da spazio: in tal
# caso vengono proposti con un'unica domanda e, se confermati, installati tutti
# (uno per uno) con la stessa modalità indicata dalla colonna <dev>.
# La colonna <dev> vale "dev" se il pacchetto va installato con `npm i -D`
# (devDependency), stringa vuota se va installato con `npm i -S` (dependency
# vera, es. peer dependency di minimo usata a runtime).
optionalPackages=(
  "dotenv-webpack                                    | dev | gestione variabili d'ambiente (.env) nel bundle webpack"
  "@principalstudio/html-webpack-inject-preload      | dev | injection dei tag <link rel=preload> nell'html generato"
  "postcss-jit-props                                 | dev | include nel CSS compilato solo le custom properties effettivamente usate"
  "@svgdotjs/svg.js                                  |     | richiesto da charts/"
  "blurhash                                          |     | richiesto da unsplash-page (create-blurhash-canvas)"
  "simple-datatables                                 |     | richiesto da s-datatable-component"
  "style-dictionary                                  | dev | richiesto da dev-tools/design-tokens-builder (build-tokens)"
  "@cybozu/eslint-config                             | dev | utilizzato da eslint per il check dei file css"
  "sass                                              | dev | per email (scss)"
  "postcss postcss-cli postcss-import postcss-nested postcss-custom-properties autoprefixer cssnano | dev | per email (postcss)"
)

# Rimuove spazi iniziali/finali da una stringa (usata per i campi estratti
# da optionalPackages, allineati a colonna fissa con spazi di padding).
trim() {
  echo "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

# Chiede conferma per un singolo pacchetto opzionale (default: No).
ask_optional_pkg() {
  local pkg="$1"
  local desc="$2"
  local reply
  echo -e "\n${YELLOW}${pkg}${NC}"
  echo -e "${DIM}${desc}${NC}"
  read "reply?Installare questo pacchetto opzionale? [y/N]: "
  [[ "$reply" =~ ^[Yy]$ ]]
}

selectedOptionalDevPkgs=()
selectedOptionalDepPkgs=()

if [ "$DEBUG" != "TRUE" ]; then
  echo -e "\n${GREEN}...PACCHETTI OPZIONALI${NC}"
  for entry in "${optionalPackages[@]}"; do
    IFS='|' read -r pkg devFlag desc <<< "$entry"
    pkg="$(trim "$pkg")"
    devFlag="$(trim "$devFlag")"
    desc="$(trim "$desc")"
    if ask_optional_pkg "$pkg" "$desc"; then
      # ${=pkg}: word splitting di zsh, per le voci con più pacchetti
      if [ "$devFlag" = "dev" ]; then
        selectedOptionalDevPkgs+=(${=pkg})
      else
        selectedOptionalDepPkgs+=(${=pkg})
      fi
    fi
  done
fi

BASE_URL=${0:A:h}

echo "BASE_URL: ${BASE_URL}"

SOURCE_FILES_DIR="${BASE_URL}/source_files"

# webpack
WEBPACK_MODULES_INSTALL_PATH="./webpack-config-modules"

# protezione contro la sovrascrittura
set -C


# Wrapper: copia il file. Se dest esiste con contenuto identico al sorgente,
# la copia viene saltata. Se il contenuto è diverso: la prima volta il file
# esistente viene rinominato con prefisso OLD- (preservato da quel momento in
# poi, mai più toccato) e il nuovo file prende il nome originale; se l'OLD-
# corrispondente esiste già, viene invece sovrascritto direttamente il file
# "nuovo", senza aggiungere ulteriori prefissi.
safe_cat() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$src" ]; then
    echo -e "${RED}Sorgente mancante: $src${NC}"
    return 1
  fi
  if [ -e "$dest" ]; then
    if cmp -s "$src" "$dest"; then
      return 0
    fi
    local old_dest="$(dirname "$dest")/OLD-$(basename "$dest")"
    if [ ! -e "$old_dest" ]; then
      mv "$dest" "$old_dest"
    fi
  fi
  cat "$src" >| "$dest"
}

# Come safe_cat, ma sostituisce i segnaposto [[port8000]] e [[port5700]] con
# le porte scelte all'avvio. La sostituzione viene fatta su un file temporaneo
# che è poi passato a safe_cat: il confronto per l'idempotenza avviene quindi
# sul contenuto già sostituito (stessa porta => copia saltata).
safe_cat_with_ports() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$src" ]; then
    echo -e "${RED}Sorgente mancante: $src${NC}"
    return 1
  fi
  local tmp="$(mktemp)"
  sed -e "s/\[\[port8000\]\]/${PORT_8000}/g" \
      -e "s/\[\[port5700\]\]/${PORT_5700}/g" \
      "$src" >| "$tmp"
  safe_cat "$tmp" "$dest"
  local rc=$?
  rm -f "$tmp"
  return $rc
}

# A differenza di safe_cat, sovrascrive sempre senza confrontare né
# backuppare (nessun OLD- a livello di singolo file). Usata per i file
# installati dentro FRONTEND_INSTALL_PATH (./app), la cui idempotenza è già
# garantita a livello di intera cartella (OLD-app, vedi più sotto): non ha
# senso ripetere il controllo su ogni singolo file al suo interno.
force_cat() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$src" ]; then
    echo -e "${RED}Sorgente mancante: $src${NC}"
    return 1
  fi
  cat "$src" >| "$dest"
}

# Copia ricorsivamente tutti i file di una struttura sorgente (source_files/root
# o source_files/app) in una destinazione, preservando la struttura delle
# sotto-cartelle così com'è in source_files: aggiungere, spostare o rinominare
# file lì non richiede modifiche a questo script.
# Il terzo argomento (opzionale) è il nome di una funzione di rename invocata
# su ogni singolo basename, per i casi in cui il nome del file sorgente non
# coincide con quello di destinazione (vedi rename_root_file).
# Il quarto argomento (opzionale, default: safe_cat_with_ports) è la funzione
# di copia da usare per ogni file: safe_cat_with_ports confronta e backuppa
# il singolo file (sostituzione porte no-op se non contiene placeholder);
# force_cat sovrascrive sempre senza controlli (vedi sopra, usata per ./app).
# Il quinto argomento (opzionale) è una lista di basename (separati da spazio,
# riferiti al nome del file sorgente, prima di un eventuale rename_fn) da
# saltare: usato per escludere package-tpl.json, già copiato a parte prima
# dell'installazione dei pacchetti npm (vedi più sotto).
# I file .DS_Store (macOS) vengono sempre ignorati: sono binari e farebbero
# fallire il sed di safe_cat_with_ports ("illegal byte sequence").
install_tree() {
  local src_root="$1"
  local dest_root="$2"
  local rename_fn="$3"
  local copy_fn="${4:-safe_cat_with_ports}"
  local exclude="$5"
  local file rel dir base new_base dest
  while IFS= read -r file; do
    rel="${file#"$src_root"/}"
    dir="$(dirname "$rel")"
    base="$(basename "$rel")"
    if [ -n "$exclude" ] && [[ " $exclude " == *" $base "* ]]; then
      continue
    fi
    if [ -n "$rename_fn" ]; then
      new_base="$("$rename_fn" "$base")"
    else
      new_base="$base"
    fi
    if [ "$dir" = "." ]; then
      dest="${dest_root}/${new_base}"
    else
      mkdir -p "${dest_root}/${dir}"
      dest="${dest_root}/${dir}/${new_base}"
    fi
    "$copy_fn" "$file" "$dest"
  done < <(find "$src_root" -type f ! -name .DS_Store)
}

# Rename applicato ai file di source_files/root/ in fase di copia:
# - prefisso singolo underscore -> dotfile (es. _gitignore -> .gitignore);
#   il doppio underscore (__project__.code-workspace) non viene toccato,
#   il nome resta invariato
# - suffisso -tpl prima dell'estensione -> rimosso (es. package-tpl.json ->
#   package.json), usato per i file template che altrimenti confliggerebbero
#   con l'omonimo file dello starter-kit stesso
rename_root_file() {
  local name="$1"
  if [[ "$name" == _* && "$name" != __* ]]; then
    echo ".${name#_}"
    return
  fi
  if [[ "$name" == *-tpl.* ]]; then
    echo "${name/-tpl./.}"
    return
  fi
  echo "$name"
}

FRONTEND_INSTALL_PATH="./app"
# se la cartella esiste già: la prima volta viene rinominata per intero in
# OLD-app (preservata, mai più toccata); se OLD-app esiste già, la cartella
# esistente non viene rinominata. In entrambi i casi i file al suo interno
# vengono poi sempre sovrascritti senza controlli individuali (force_cat):
# l'idempotenza è garantita a livello di intera cartella, non di singolo file.
if [ -d "$FRONTEND_INSTALL_PATH" ]; then
  OLD_FRONTEND_INSTALL_PATH="$(dirname "$FRONTEND_INSTALL_PATH")/OLD-$(basename "$FRONTEND_INSTALL_PATH")"
  if [ ! -e "$OLD_FRONTEND_INSTALL_PATH" ]; then
    mv "$FRONTEND_INSTALL_PATH" "$OLD_FRONTEND_INSTALL_PATH"
  fi
fi

echo -e "${GREEN}Files will be installed in: '${FRONTEND_INSTALL_PATH}'${NC}"


# package.json va creato dal template PRIMA di installare qualunque pacchetto:
# se non esistesse ancora, i comandi `npm i` più sotto ne genererebbero uno
# "al volo" privo di scripts/metadati del template, e le dipendenze verrebbero
# registrate lì; alla successiva install_tree su source_files/root (più sotto)
# quel package.json risulterebbe diverso dal template e verrebbe spostato in
# OLD-package.json, perdendo le dipendenze appena installate. Per questo qui
# si usa safe_cat_with_ports (idempotente, con backup OLD- se il file esiste
# già con contenuto diverso) e poi si esclude package-tpl.json dalla
# install_tree sulla root, per non ripetere la copia dopo che npm l'ha
# già modificato.
echo -e "\n${GREEN}...package.json${NC}"
safe_cat_with_ports "${SOURCE_FILES_DIR}/root/package-tpl.json" "package.json"

echo -e "\n${GREEN}...NODE MODULES${NC}"

dependencies=(
  @massimo-cassandro/minimo
)

devDependencies=(
  @massimo-cassandro/eslint-config

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
)

# pacchetti opzionali selezionati dall'utente (vedi ciclo di domande a inizio
# script), instradati in devDependencies o dependencies in base alla colonna
# <dev> di optionalPackages (vedi sopra)
devDependencies+=("${selectedOptionalDevPkgs[@]}")
dependencies+=("${selectedOptionalDepPkgs[@]}")

if [ "$DEBUG" = "TRUE" ]; then
  dependencies=( @massimo-cassandro/minimo )
  devDependencies=()
fi

for pkg in "${devDependencies[@]}"; do
  echo -e "${DIM}...installing "$pkg"${NC}"
  npm i -D "$pkg"
done

for pkg in "${dependencies[@]}"; do
  echo -e "${DIM}...installing "$pkg"${NC}"
  npm i -S "$pkg"
done


echo -e "\n${GREEN}...creating default folders${NC}"
mkdir -p \
  "_private" \
  "${FRONTEND_INSTALL_PATH}" \
  "${FRONTEND_INSTALL_PATH}/assets" \
  "${FRONTEND_INSTALL_PATH}/src" \
  "${FRONTEND_INSTALL_PATH}/css" \
  "${FRONTEND_INSTALL_PATH}/tpl" \
  "${FRONTEND_INSTALL_PATH}/icons" \
  "${FRONTEND_INSTALL_PATH}/imgs" \
  "${FRONTEND_INSTALL_PATH}/favicons" \
  "${FRONTEND_INSTALL_PATH}/error-pages"




echo -e "${GREEN}...FILES${NC}"

echo -e "${DIM}...webpack config modules${NC}"
# se la cartella esiste già: la prima volta viene rinominata per intero in
# OLD-webpack-config-modules (preservata, mai più toccata); se l'OLD-
# corrispondente esiste già, la cartella esistente non viene rinominata e i
# file al suo interno vengono gestiti singolarmente dalla stessa logica di
# safe_cat (via install_tree, più sotto).
if [ -d "$WEBPACK_MODULES_INSTALL_PATH" ]; then
  OLD_WEBPACK_MODULES_INSTALL_PATH="$(dirname "$WEBPACK_MODULES_INSTALL_PATH")/OLD-$(basename "$WEBPACK_MODULES_INSTALL_PATH")"
  if [ ! -e "$OLD_WEBPACK_MODULES_INSTALL_PATH" ]; then
    mv "$WEBPACK_MODULES_INSTALL_PATH" "$OLD_WEBPACK_MODULES_INSTALL_PATH"
  fi
fi

mkdir -p "$WEBPACK_MODULES_INSTALL_PATH"

# copia tutti i file di source_files/root/ nella root del progetto (inclusa
# webpack-config-modules/, gestita sopra a livello di cartella) e tutti i
# file di source_files/app/ dentro FRONTEND_INSTALL_PATH: struttura e nomi
# di destinazione sono già quelli definiti in source_files (per root/ con
# l'unica eccezione del rename dei dotfile e dei template "-tpl", vedi
# rename_root_file), quindi aggiungere/spostare/rinominare file lì non
# richiede modifiche a questo script. Per app/ si usa force_cat (nessun
# controllo/backup per singolo file, vedi commento su FRONTEND_INSTALL_PATH).
# package-tpl.json è escluso: già copiato a parte prima dell'installazione
# dei pacchetti npm (vedi sezione NODE MODULES più sopra).
echo -e "${DIM}...root${NC}"
install_tree "${SOURCE_FILES_DIR}/root" "." rename_root_file "" "package-tpl.json"
echo -e "${DIM}...app${NC}"
install_tree "${SOURCE_FILES_DIR}/app" "${FRONTEND_INSTALL_PATH}" "" force_cat

# copia tutti i file presenti in ${SOURCE_FILES_DIR}/_private,
echo -e "${DIM}..._private${NC}"
for FILE in "${SOURCE_FILES_DIR}/_private"/*; do
  [ -f "$FILE" ] || continue
  safe_cat_with_ports "$FILE" "_private/$(basename "$FILE")"
done

#----------------------------------------------
# copia altri file dai sorgenti minimo
#----------------------------------------------
# Sorgenti di minimo da copiare nel progetto: si usa il pacchetto appena
# installato in node_modules (stessa versione che userà il progetto)
MINIMO_PKG_DIR=./node_modules/@massimo-cassandro/minimo

force_cat "${MINIMO_PKG_DIR}/src/custom-properties.css" "${FRONTEND_INSTALL_PATH}/css/custom-properties.css"
force_cat "${MINIMO_PKG_DIR}/src/custom-media.css" "${FRONTEND_INSTALL_PATH}/css/custom-media.css"

# entry css principale del progetto: copia diretta di minimo.css, rinominato
force_cat "${MINIMO_PKG_DIR}/src/minimo.css" "${FRONTEND_INSTALL_PATH}/css/index.css"

# config di build-tokens: collocato accanto al css generato (custom-properties.css).
force_cat "${MINIMO_PKG_DIR}/dev-tools/design-tokens-builder/tokens-config-sample.mjs" "${FRONTEND_INSTALL_PATH}/css/tokens-config.mjs"



# favicons: config di default per `npx create-favicons`
force_cat "${MINIMO_PKG_DIR}/dev-tools/create-favicons/src/default-params.mjs" "${FRONTEND_INSTALL_PATH}/favicons/create-favicons-cfg.mjs"


if [ ${#selectedOptionalDevPkgs[@]} -gt 0 ] || [ ${#selectedOptionalDepPkgs[@]} -gt 0 ]; then
  echo -e "\n${YELLOW}Pacchetti opzionali installati:${NC}"
  for pkg in "${selectedOptionalDevPkgs[@]}" "${selectedOptionalDepPkgs[@]}"; do
    echo -e "${YELLOW}  - $pkg${NC}"
  done
  echo -e "${YELLOW}Potrebbe essere necessaria una modifica alla configurazione webpack e/o postcss per utilizzare questi pacchetti.${NC}"
fi

set +C
echo -e "\n\n${GREEN}*** END ***${NC}"
