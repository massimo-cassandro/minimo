# Da v3.3 a v3.4

Novità della v3.4: il dev server può aprire Chrome con un profilo specifico. Il profilo si indica con la costante `chromeProfile` (nome della dir del profilo, ad es. `'Profile 1'`, non il nome visualizzato in Chrome), sovrascrivibile con la variabile d'ambiente `CHROME_PROFILE`; con `null` o `''` il comportamento resta quello precedente. Poiché macOS ignora gli argomenti passati a un'app già in esecuzione se non si usa `open -n`, e lo schema di `devServer.open` non accetta `newInstance`, con un profilo impostato `open` viene disattivato e Chrome viene lanciato in `devServer.onListening`. Di conseguenza lo script `launchChrome` di `package.json`, se presente, non serve più. I moduli in `webpack-config-modules/` non cambiano.

L'elenco dei profili (dir → nome visualizzato) si ottiene con:

```bash
python3 -c "import json,os; [print(k, '->', v.get('name')) for k,v in json.load(open(os.path.expanduser('~/Library/Application Support/Google/Chrome/Local State')))['profile']['info_cache'].items()]"
```

Prompt per aggiornare un progetto esistente:

Riepilogo:

1. Riga 2: `// v.3.3` → `// v.3.4`.
2. Subito dopo `import fs from 'fs';` aggiungi: `import { spawn } from 'child_process';`
3. Nel blocco `const` delle opzioni, subito dopo `devServerPort` (o dopo `apiPort`, se presente e non commentato), aggiungi la costante seguente, con una riga vuota prima. Se in `package.json` esiste lo script `launchChrome`, usa come default il profilo indicato in `--profile-directory`, altrimenti `null`:

```javascript

  /* profilo di Chrome aperto dal dev server: nome della dir del profilo
  ('Default', 'Profile 1', ...), non il nome visualizzato. L'elenco è in
  `~/Library/Application Support/Google/Chrome/Local State` (profile.info_cache).
  Sovrascrivibile con la variabile d'ambiente CHROME_PROFILE; null o '' = profilo predefinito */
  ,chromeProfile = process.env.CHROME_PROFILE ?? null // es. 'Profile 1'
```

4. Nel `devServer` attivo (non commentato), sostituisci l'opzione `open: { app: { name: 'Google Chrome' } }` (con eventuale commento in linea) con il blocco seguente. Se l'URL di avvio del progetto non è la root del dev server (ad es. `open.target` impostato), adatta l'URL passato a `spawn`:

```javascript
    /* apertura automatica del browser all'avvio. Con un profilo specifico Chrome
    viene lanciato in onListening con `open -n`: senza -n, se Chrome è già in
    esecuzione macOS ignora gli argomenti (e lo schema di devServer.open non
    accetta `newInstance`); il nuovo processo li passa all'istanza esistente */
    open: chromeProfile ? false : { app: { name: 'Google Chrome' } },
    onListening: chromeProfile
      ? () => spawn('open', ['-n', '-a', 'Google Chrome', '--args',
        `--profile-directory=${chromeProfile}`, `http://localhost:${devServerPort}/`
      ], { stdio: 'ignore', detached: true }).unref()
      : undefined,
```

5. Se nel file è presente anche il `devServer` commentato per Symfony, applica la stessa modifica in forma commentata.
6. Verifica che il config sia valido con e senza profilo (nessun errore e `valid` in entrambi i casi):

```bash
for v in "" "Profile 1"; do CHROME_PROFILE="$v" NODE_ENV=development node -e "
const {validate}=require('schema-utils');const s=require('./node_modules/webpack-dev-server/lib/options.json');
import('./webpack.config.mjs').then(m=>{const c=m.default;validate(s,(Array.isArray(c)?c[0]:c).devServer,{name:'DevServer'});console.log('valid',JSON.stringify(process.env.CHROME_PROFILE))}).catch(e=>console.log(e.message))"; done
```

7. Nel package.json, script, se non presenti aggiungi

```javascript
"docker up": "docker compose up -d && npm run 'docker svuota cache sf'",
"docker svuota cache sf": "docker compose exec app sh -c 'rm -rf var/cache/*' # cancella la cache Symfony, rigenerata alla prima richiesta",
```

dopo `webpack DEV (sf)`

8. Mostrami il diff prima di salvare.
