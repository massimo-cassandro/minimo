# Report Lighthouse / webhint

Gli script sono nel `package.json` di questa cartella; `lighthouse` e `hint` sono devDependencies del progetto (root).

## Uso

1. avviare lo script "1 webpack PROD"
2. avviare lo script "2 server PROD"
3. avviare i test desiderati


## Installazione

```
npm i -D lighthouse hint
```

## Step

Dalla root del progetto (o dentro `_reports`, senza `--prefix`):

1. Build di produzione: `npm run --prefix _reports "webpack PROD"`
2. Avvio del server in prod (porta 8100): `npm run --prefix _reports "server PROD"`
   (a fine test `Ctrl+C`, o il pulsante cestino di VS Code: il container viene rimosso e la porta liberata)
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

Lo script prod avvia con `docker compose run` un secondo container del servizio `app` (stessa immagine, stessi volumi, Apache + mod_php come in sviluppo), pubblicato su 8100 e rimosso alla chiusura (`--rm`). Può girare insieme al container di sviluppo su 8007: `run` non pubblica le porte del servizio, solo quella indicata con `-p`.

Rispetto al server reale tenere presente che:

* PHP è quello dell'immagine di sviluppo (`php-dev`, con `dev.ini` e `php.ini-development`), non la configurazione di produzione
* la compressione gzip è quella di `mod_deflate` secondo `public/.htaccess`; niente brotli né CDN

Note:

- `APP_ENV=prod APP_DEBUG=0` sono passate al container con `-e`: le variabili reali hanno la precedenza sui file `.env` / `.env.local` (`variables_order = "EGPCS"` in `dev.ini` le rende visibili anche sotto Apache).
- Lo script svuota la cache prod prima di avviare Apache: con `APP_DEBUG=0` Symfony non ricompila il container quando cambiano i sorgenti (es. un costruttore di servizio modificato), e una cache vecchia produce errori 500. La cache sta nel volume `symfony-cache` condiviso con il container di sviluppo, ma in `var/cache/prod`, separata da `var/cache/dev`; il `chown` successivo la rende scrivibile da Apache (`cache:clear` gira come root).
- `ASSETS_DIR=build` è passato esplicitamente perché `.env.local` imposta `_dev`, e altrimenti la pagina caricherebbe gli asset della build di sviluppo.
- I numeri di performance locali restano indicativi.
