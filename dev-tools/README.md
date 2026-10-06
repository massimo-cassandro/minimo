# Dev tools

Raccolta di utilità CLI Node.js standalone che aiutano nelle attività quotidiane di gestione di un progetto web (aggiornamento delle dipendenze, versionamento/changelog, generazione di icone e favicon). Ogni strumento risiede in una propria sottocartella, funziona in modo indipendente dagli altri e dal pacchetto `minimo`, ed è documentato nel proprio README — questa pagina ne dà solo una panoramica.

* [update-version](./update-version/README.md) — incrementa la versione in `package.json` e aggiunge una voce a `changelog.md`
* [Svg Icons Tools](./svg-icons-tools/README.md) — ottimizza le icone SVG e le combina/converte in symbol, JSX o variabili SCSS
* [Create favicons](./create-favicons/README.md) — genera il set completo di favicon (SVG, PNG, ICO, webmanifest, snippet HTML) a partire da un'immagine sorgente
* [upd@m](./upd@m/README.md) — aggiorna tutti i pacchetti `@massimo-cassandro/*` installati in `node_modules`
* [Design Tokens Builder](./design-tokens-builder/README.md) — genera un file di custom properties CSS (e, opzionalmente, file JSON di token) a partire dai sorgenti dei design token
* [starter-kit](#starter-kit) — script per installare l'ambiente minimo

## starter-kit

`starter-kit/starter-install.sh` avvia un nuovo progetto frontend: copia i file di configurazione starter (`package.json`, `.gitignore`, `jsconfig.json`, configurazioni eslint/stylelint, configurazione e moduli webpack, ...) nella root del progetto e i file frontend (template webpack, `CLAUDE.md`, `_root_htaccess`/`_root_robots.txt`, ...) in una cartella `./app` fissa, quindi installa tutte le dipendenze di sviluppo necessarie.

Lo script **richiede zsh** (termina con un errore se lanciato con `sh` o `bash`). I file esistenti non vengono mai sovrascritti: vengono copiati accanto con il prefisso `NEW-` (da integrare manualmente o da rimuovere). Se la cartella `./app` esiste già, l'intero set di file frontend viene copiato in `./NEW-app`.

### Se minimo è già installato

Lo script è esposto come `bin` del pacchetto:

```bash
npx starter-kit
```

Poiché l'installazione non sovrascrive mai nulla, lo script può essere anche **rieseguito in qualsiasi momento per aggiornare** una configurazione esistente (ad es. per aggiornare i moduli webpack o reinstallare le dipendenze di sviluppo): i file esistenti vengono copiati con il prefisso `NEW-`, quindi rieseguire lo script non duplica né sovrascrive mai nulla.

### Senza installare minimo

Per avviare un progetto **prima** di installare l'intero pacchetto, scaricare solo la cartella `starter-kit` dal tarball npm ed eseguire lo script da lì:

```bash
curl -sL "$(npm view @massimo-cassandro/minimo dist.tarball)" | tar xz package/dev-tools/starter-kit
zsh package/dev-tools/starter-kit/starter-install.sh
rm -rf package
```

## Strumenti per SVG e favicon

```bash
## SVG Icons Tools
npx svgIconsTools --config ./path/to/svg-icons-tools.config.mjs

# create favicons
npx create-favicons init
npx create-favicons [--dir=./path/to/dir]
```

## Aggiungere gli strumenti più usati alla sezione scripts di `package.json`:

```json
{
  "scripts": {
    "update-version": "npx update-version # optional: --config=./dev-utilities.config.mjs",
    "upd@m": "npx upd@m"
  }
}
```
