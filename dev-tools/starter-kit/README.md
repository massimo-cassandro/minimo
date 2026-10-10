
# starter-kit

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
