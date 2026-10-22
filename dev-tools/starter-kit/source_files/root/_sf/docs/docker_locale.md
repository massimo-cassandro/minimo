# Sviluppo locale con Docker (Mac)

Docker sostituisce MAMP/`symfony serve` per PHP, il worker launchd e MailHog. MySQL e webpack restano sul Mac:

| Cosa                       | Dove                                                          |
|----------------------------|---------------------------------------------------------------|
| PHP 8.3 + Apache           | container `app`, su <http://localhost:8005>                   |
| Worker `async`             | container `worker`                                            |
| Worker `chiarimenti_indexing` | container `worker-indexing`                                |
| MySQL                      | Mac (`/usr/local/mysql`, porta 3306)                          |
| Mailpit (cattura email)    | container `mailpit`, interfaccia <http://localhost:8026>      |
| Webpack dev server         | Mac (`npm run "webpack DEV"`, porta 5705)                     |

La cartella del progetto è montata nei container: le modifiche al codice si vedono subito, senza ricostruire nulla. `vendor/`, `var/`, `.env.local` e `config/oauth-credentials.json` sono quelli del Mac.

## 1. Installare Docker Desktop

Scaricarlo da <https://www.docker.com/products/docker-desktop/> (versione Apple Silicon), avviarlo e verificare:

```sh
docker compose version
```

## 2. Variabili per i container

Dentro un container, `127.0.0.1` è il container stesso, non il Mac. Il file `.env.docker.local` (non versionato) ridefinisce:

- `DATABASE_URL`, con `host.docker.internal` al posto di `127.0.0.1` (MySQL del Mac);
- `MAILER_DSN=smtp://mailpit:1025`, il container Mailpit.

Tutte le altre variabili arrivano da `.env` e `.env.local` come sempre.

Se cambia la password del database in `.env.local`, aggiornarla anche in `.env.docker.local`. Nei valori di questo file un eventuale `$` va scritto `$$`.

## 3. Indirizzo: localhost e porta, niente domini

L'app si apre su `localhost` con una porta dedicata, senza voci in `/etc/hosts` né certificati: per i browser `localhost` è già un contesto sicuro anche in HTTP.

| Indirizzo                  | Quando                                                        |
|----------------------------|---------------------------------------------------------------|
| <http://localhost:5705>    | sviluppo con webpack (`npm run "webpack DEV"`)                |
| <http://localhost:8005>    | senza webpack, direttamente sul container                     |

Se in futuro altri progetti passano a Docker, ognuno avrà una sua porta: le due porte qui sopra sono riservate ad Assicorporate.

### Sessione

I cookie di `localhost` sono condivisi tra tutte le porte. Per non sovrascrivere la sessione di altre app aperte su `localhost`, Assicorporate usa un nome di cookie dedicato (`ASSICORPORATE_SESSID`, in `config/packages/framework.yaml`). Ogni altro progetto deve averne uno diverso.

### Google Drive

Il redirect OAuth viene costruito dall'indirizzo con cui si apre l'app (`/admin/oauth-callback`). Google accetta `http://localhost` con qualunque porta, ma ogni porta va registrata. Nella Google Cloud Console, nel client OAuth del progetto, aggiungere entrambi i redirect URI:

```text
http://localhost:5705/admin/oauth-callback
http://localhost:8005/admin/oauth-callback
```

## 4. Fermare quello che Docker sostituisce

Il worker launchd consuma la stessa coda dei container: va fermato, altrimenti i messaggi vengono presi a caso da uno o dall'altro.

```sh
launchctl bootout gui/$(id -u)/com.assicorporate.messenger-worker
```

Fermare anche `symfony serve`, se attivo, perché usa la stessa porta 8005:

```sh
symfony server:stop
```

## 5. Avvio

La prima volta (oppure dopo modifiche a `Dockerfile` o `docker/`):

```sh
docker compose build
```

Poi, ogni giorno:

```sh
docker compose up -d
npm run "webpack DEV"
```

Il browser si apre su <http://localhost:5705> (webpack dev server, che inoltra a Symfony sulla 8005). Senza webpack l'app risponde anche direttamente su <http://localhost:8005>.

Per fermare tutto:

```sh
docker compose down
```

I container hanno `restart: unless-stopped`: se non vengono fermati con `down`, ripartono da soli all'avvio di Docker Desktop.

## 6. Personalizzazioni locali (facoltativo)

Per cambiare qualcosa solo sulla propria macchina (una porta occupata, un ini PHP in più, un worker da non avviare) non si modifica `compose.yaml`: si copia il modello e si aggiungono lì le modifiche. `docker compose` carica `compose.override.yaml` da solo e il file è escluso da git.

Il file `compose.override.yaml.template` è un template da copiare nella root eliminando il suffisso `.template`.

Gli esempi sono nei commenti del file.

## Comandi utili

I comandi `bin/console` e `composer` vanno lanciati **dentro** il container, così usano il PHP 8.3 di Docker e non quello del Mac:

```sh
docker compose exec app php bin/console cache:clear
docker compose exec app php bin/console doctrine:migrations:migrate
docker compose exec app composer install

docker compose logs -f app                       # log Apache/PHP
docker compose logs -f worker worker-indexing    # log dei worker
docker compose restart worker worker-indexing    # dopo modifiche a handler/messaggi
docker compose ps                                # stato dei container
```

I worker caricano il codice all'avvio: dopo aver modificato un handler di Messenger, riavviarli.

## Problemi frequenti

### `Access denied for user` o `Connection refused` verso MySQL

Docker Desktop fa arrivare le connessioni da `host.docker.internal` a MySQL come se venissero da `127.0.0.1`, quindi l'utente `root@localhost` di `.env.local` dovrebbe funzionare. Se MySQL rifiuta la connessione, creare un utente dedicato all'app (da fare una volta sola):

```sh
/usr/local/mysql/bin/mysql -u root -p
```

```sql
CREATE USER 'assicorporate'@'%' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON assicorporate.* TO 'assicorporate'@'%';
GRANT PROCESS ON *.* TO 'assicorporate'@'%';
```

e usarlo in `DATABASE_URL` dentro `.env.docker.local`.

### Porta 8005 già in uso

C'è ancora `symfony serve` attivo (`symfony server:stop`), oppure un altro processo: `lsof -nP -iTCP:8005 -sTCP:LISTEN`.

### Le email non arrivano in Mailpit

Verificare che il container sia attivo (`docker compose ps mailpit`) e provare un invio:

```sh
docker compose exec app php bin/console mailer:test test@example.com --from=noreply@mail.assicorporate.com
```

L'email deve comparire su <http://localhost:8026>. Il MailHog di MAMP PRO (porta 8025) non riceve più le email di Assicorporate.

## Tornare a MAMP / symfony serve

```sh
docker compose down
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.assicorporate.messenger-worker.plist
symfony serve --port=8005 --listen-ip=0.0.0.0 -d
```

Il progetto non cambia: `.env.local` è ancora quello originale.
