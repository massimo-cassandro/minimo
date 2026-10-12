# Report Lighthouse / webhint

Cartella ignorata da git. Gli script sono in `package.json` di questa cartella;
`lighthouse` e `hint` sono devDependencies del progetto (root).

## Installazione

```
npm i -D lighthouse hint
```

## Step

Dalla root del progetto (o dentro `_reports`, senza `--prefix`):

1. Build di produzione: `npm run --prefix _reports "webpack PROD"`
2. Avvio PHP in prod (porta 8100): `npm run --prefix _reports "server PROD"`
   (a fine test chiudere il terminale con il pulsante cestino di VS Code, per liberare la porta)
3. In un altro terminale:
   - `npm run --prefix _reports "lighthouse mobile"` → `mobile.html`
   - `npm run --prefix _reports "lighthouse desktop"` → `desktop.html`
   - `npm run --prefix _reports webhint` → `hint-report/http-localhost-8100.html`

## Note

- Lanciare i test sempre sulla build prod, non sul dev server di webpack.
- webhint usa il connector `puppeteer` con il Chrome installato (`.hintrc` in questa cartella, `executablePath` di macOS; il finder automatico non lo trova), in modalità headless: render reale, quindi anche le regole sul layout sono attendibili. Gli avvisi iniziali su `typescript-config/*` sono normali (regole non applicabili).
- `.hintrc` va letto dalla directory corrente: lanciare webhint da `_reports` (lo script `--prefix` lo fa).
- Usare gli stessi dati nel database locale tra un run e l'altro: la home cambia con i gruppi disponibili e rende i punteggi non confrontabili.
- Lighthouse oscilla di qualche punto tra un run e l'altro: fare 3 run e prendere la mediana.
- Per i numeri definitivi (rete, compressione, CDN) ripetere su staging/produzione.


## Caratteristiche del server

Lo script prod usa il server integrato di PHP (`php -S`). Rispetto al server reale tenere presente che: 

* esegue un solo processo per volta, più richieste vanno in coda
* non esegue compressione gzip/brotli

Note:

- `APP_ENV=prod APP_DEBUG=0` sono variabili d'ambiente lette da Symfony (non dal server): con `php -S` vengono ereditate dal processo e hanno la precedenza sui file `.env` / `.env.local`.
- `php -S` usa il `php.ini` della CLI, che può differire da quello di `php-cgi`.
- Con richieste in coda i tempi di caricamento di asset e immagini possono risultare peggiori: i numeri di performance locali sono indicativi.
