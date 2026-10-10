# Dev tools

Raccolta di utilità CLI Node.js standalone o Vanilla JS che aiutano nelle attività di gestione di un progetto web (aggiornamento delle dipendenze, versionamento/changelog, generazione di icone e favicon). Ogni strumento risiede in una propria sottocartella, funziona in modo indipendente dagli altri e dal pacchetto `minimo`, ed è documentato nel proprio README.


## Aggiungere gli strumenti più usati alla sezione scripts di `package.json`:

```json
{
  "scripts": {
    "update-version": "npx update-version # optional: --config=./dev-utilities.config.mjs",
    "upd@m": "npx upd@m"
  }
}
```
