# Update Version

Legge la versione memorizzata in `package.json`, la aggiorna e mantiene un file di log.

Ogni aggiornamento aggiunge una riga al file `changelog.md` presente nella root del progetto. Ogni riga contiene la data, la versione aggiornata e, facoltativamente, un testo descrittivo.

Il numero di versione aggiornato e il testo descrittivo vengono copiati negli appunti per velocizzare la scrittura del messaggio dei commit successivi.

Utilizzo:

```bash
npx update-version <options>
```

Opzioni:

* `--pkg`: Percorso del file `package.json` relativo alla directory corrente (default: `./package.json`)
* `--log-file`: Percorso del file di log relativo alla directory corrente (default: `./changelog.md`). Se il nome del file termina con `.txt`, si assume il formato di log della versione precedente di `update-version`, in cui ogni riga ha la forma `timestamp | version | description`
* `--log-patch`: Se presente, vengono registrate nel log anche le modifiche di tipo patch.
* `--no-log-v0`: Se `true` (default), il log non viene scritto quando la versione major è `0`, tranne per la voce iniziale creata alla prima inizializzazione del file changelog. Passare `--no-log-v0` per abilitarlo esplicitamente, oppure `--no-log-v0=false` per disabilitarlo da riga di comando.
