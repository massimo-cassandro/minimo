# Minimo

Il mio framework leggero + utilità

## Installazione

```bash
npm i @massimo-cassandro/minimo

# opzionale:
npm i -D @massimo-cassandro/eslint-config
```

> Nota: una configurazione stylelint è inclusa in minimo (non serve un'installazione separata) — vedi [dev-tools/stylelint-config/README.md](dev-tools/stylelint-config/README.md).

> Nota: **minimo** è pensato per essere usato con webpack, con la configurazione disponibile nella [cartella starter-kit](./dev-tools/starter-kit/) di questo repository. Se vengono apportate modifiche (ad esempio al modo in cui vengono importati i file SVG), il funzionamento potrebbe non essere quello atteso.
>

Per installare tutti i moduli webpack necessari, usare lo script `./dev-tools/starter-kit/starter-install.sh`, eseguendo:

```bash
zsh ./node_modules/@massimo-cassandro/minimo/dev-tools/starter-kit/starter-install.sh
```

Per avviare un progetto **prima** di installare l'intero pacchetto, scaricare solo la cartella `starter-kit` dal tarball npm ed eseguire lo script da lì:

```bash
curl -sL "$(npm view @massimo-cassandro/minimo dist.tarball)" | tar xz package/dev-tools/starter-kit
zsh package/dev-tools/starter-kit/starter-install.sh
rm -rf package
```

---

## Design tokens

Minimo include un insieme di design token e alcune utilità per gestirli. Vedi il [readme dei Design Tokens](design-tokens/README.md).

## Dev Tools

La cartella [`dev-tools`](./dev-tools/README.md) contiene un insieme di utilità CLI Node.js indipendenti per la gestione di un progetto web: aggiornamento delle dipendenze, incremento della versione e del changelog, generazione e ottimizzazione di icone SVG e favicon. Sono pubblicate insieme al pacchetto `minimo` ed esposte tramite le voci `bin` di `package.json` (`update-version`, `upd@m`, `svgIconsTools`, `create-favicons`); vedi il [README di Dev Tools](./dev-tools/README.md) per l'elenco completo e le istruzioni d'uso.


## Documentazione e demo

[Documentazione](docs/README.md)

[Demo](https://massimo-cassandro.github.io/minimo/) (in lavorazione)

