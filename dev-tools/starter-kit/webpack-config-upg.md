# Aggiornamento della configurazione webpack

La versione della configurazione in uso è indicata dal commento `// v.N` alla riga 2 di `webpack.config.mjs` e di ogni file in `webpack-config-modules/`.

Le versioni precedenti sono conservate in `archived/webpack-config-v2/` del repository di minimo.

> **Alternativa rapida:** rilanciare `starter-install.sh` (è idempotente): i file diversi dai sorgenti vengono rinominati `OLD-<nome>` e sostituiti dalla nuova versione. Poi si riportano nel nuovo `webpack.config.mjs` le personalizzazioni del progetto (entry, glob dei contenuti, safelist, template html, regole custom) copiandole da `OLD-webpack.config.mjs`. Le istruzioni seguenti servono per aggiornare a mano un progetto già esistente.

---

## Fix e upg da verificare e applicare a tutte le versioni
* WebpackManifestPlugin: impostare `removeKeyHash: /\?.*$/, // /([a-f0-9]{32}\.?)/gi, // /(\?as_asset)$/,`, sostituendo eventuali impostazione `removeKeyHash: true` se presente


## Da v2 a v3

Novità della v3: le definizioni delle custom properties non sono più gestite da PurgeCSS (`variables`) né da postcss-jit-props, ma da un plugin webpack dedicato, `custom-props-purgecss-plugin.mjs`, che opera sugli asset CSS finali (dopo la minificazione) e inietta solo le custom properties effettivamente usate (dipendenze transitive incluse), partendo dal file master `app/css/custom-properties.css`. Il plugin è attivabile con un flag, indipendente da `usePurgeCss`.

Conseguenza: i css non devono più restare autosufficienti (con le definizioni ripetute in ogni asset), quindi **anche i css condivisi finiscono nel chunk `shared`** (`shared.css`) invece di essere duplicati nel css di ogni entry. Le entry `.critical` restano autosufficienti. I template devono linkare `shared.css`.

Riepilogo delle modifiche:

| Cosa | Dove |
|---|---|
| Nuovo plugin custom properties (`useCustomPropsPlugin`) | `webpack-config-modules/custom-props-purgecss-plugin.mjs`, `webpack.config.mjs` |
| Flag `purgeCssInDev` (purge e plugin in dev on-demand) | `webpack.config.mjs` |
| PurgeCSS senza `variables` / `variablesSafelist` | `purgecss-setup.mjs`, `webpack.config.mjs` |
| `shared.css` generato (css condivisi non più duplicati) | `webpack.config.mjs` (cacheGroup `shared`) |
| Link a `shared.css` nei template | `_sf/templates/_main-tpl.html.twig` e template del progetto |

### 1. Moduli in `webpack-config-modules/`

- **Aggiungere** `custom-props-purgecss-plugin.mjs`.
- **Sostituire** `purgecss-setup.mjs` con la versione v3 (non gestisce più `variables` né `variablesSafelist`; la firma di `createPurgeCSSPlugins` non accetta più `variablesSafelist` e `variables`).
- **Eliminare** `purgecss-variables-safelist.mjs` (sostituito dal plugin).
- **Aggiornare** `postcss.config.mjs` (cambiano solo i commenti sulla gestione delle custom properties; il comportamento è invariato).
- Negli altri file (`css-rules.mjs`, `get-jsConfig-aliases.mjs`, `inline-critical-css.mjs`, `mini-svg-data-uri-loader.cjs`, `svg-rules.mjs`, `svgo.config.mjs`) **cambia solo** la riga `// v.2` in `// v.3`. Il contenuto è identico alla v2 e possono essere lasciati invariati.

Non servono nuovi pacchetti npm: il plugin usa `postcss` e `glob`, già presenti tra le devDependencies dello starter. Se `postcss-jit-props` non è usato per altro, può essere disinstallato.

### 2. Modifiche a `webpack.config.mjs`

1. Riga 2: `// v.2` → `// v.3`.
2. Nel blocco delle costanti di configurazione, dopo `usePurgeCss`, **rimuovere** `variables` da `purgeCSSOptions`:

   ```js
   ,purgeCSSOptions = {
     keyframes: true,
     debug: false
   }
   ```

3. **Aggiungere** i nuovi flag e la costante derivata (dopo `purgeCSSOptions`):

   ```js
   ,useCustomPropsPlugin = true // false: il plugin non viene caricato, le custom properties restano a carico del progetto
   ,customPropsFile = path.resolve(__dirname, './app/css/custom-properties.css')
   ,purgeCssInDev = false // true (solo per test): purge e plugin attivi anche in dev
   ,runCustomPropsPlugin = useCustomPropsPlugin && (!isDevelopment || purgeCssInDev)
   ```

4. **Aggiungere**, subito dopo la chiusura del blocco `const`, l'import dinamico del plugin:

   ```js
   const { CustomPropsPurgeCssPlugin } = runCustomPropsPlugin
     ? await import('./webpack-config-modules/custom-props-purgecss-plugin.mjs')
     : {};
   ```

5. **Entry**: rinominare l'oggetto `entries` in `projectEntries` e aggiungere subito sotto il nuovo `entries` derivato (in dev senza plugin, il master con tutte le custom properties viene aggiunto come primo modulo delle entry non `.critical`):

   ```js
   const entries = (useCustomPropsPlugin && isDevelopment && !purgeCssInDev)
     ? Object.fromEntries(Object.entries(projectEntries).map(([name, entry]) => [
       name,
       /\.critical/.test(name) ? entry : [customPropsFile, ...[entry].flat()]
     ]))
     : projectEntries;
   ```

6. **`optimization`**: sostituire il commento `// realContentHash: true,` con `realContentHash: !isDevelopment || purgeCssInDev,`.
7. **PurgeCSS**: la condizione `...(usePurgeCss ? createPurgeCSSPlugins({...}) : [])` diventa `...(usePurgeCss && (!isDevelopment || purgeCssInDev) ? ... : [])`, e nella chiamata a `createPurgeCSSPlugins` va **rimosso** il blocco `variablesSafelist: { declarationGlobs, shadowGlobs, seeds }`. I glob `shadowGlobs` e `seeds` si spostano nel plugin (punto seguente, come `extraUsageGlobs` e `seeds`).
8. **Chunk `shared` anche per i css** (in v2 i css restavano nel css di ogni entry, duplicati). Nel commento e nella funzione `shared_chunk_paths` **rimuovere** la riga `if (module.type === 'css/mini-extract') return false;` (e il vecchio commento/`TODO` che spiegava perché i css restavano fuori dallo `shared`), e nel cacheGroup `shared` (`optimization.splitChunks.cacheGroups`) sostituire `chunks: 'all'` con:

   ```js
   enforce: true, // shared.js e shared.css sempre generati, anche sotto la soglia minSize
   chunks: (chunk) => !/\.critical/.test(chunk.name) // le entry `.critical` restano autosufficienti
   ```

   Ora viene generato anche `shared.css`, che va linkato nei template (vedi la sezione 3, "Template") e le cui definizioni delle custom properties vengono iniettate dal plugin (punto successivo, `sets`). Il purge dei `@keyframes` lavora sul singolo asset: se un `@keyframes` definito in `shared.css` è usato solo in un altro css, va aggiunto a `safelist.keyframes` (oppure `keyframes: false` in `purgeCSSOptions`).
9. **Aggiungere in fondo all'array `plugins`** (dopo PurgeCSS, che deve restare prima):

   ```js
   ...(runCustomPropsPlugin
     ? [new CustomPropsPurgeCssPlugin({
       definitionsFile: customPropsFile,
       sets: [
         // il critical css è inline nei template: deve restare autosufficiente
         { sources: ['layout.critical.*.css'] },
         // shared.css è linkato in tutte le pagine e contiene le definizioni per tutti i css delle entry
         { sources: ['shared.*.css', 'index.*.css'], target: 'shared.*.css' },
       ],
       extraUsageGlobs: [ // ex `shadowGlobs`
         path.resolve(__dirname, './app/src/web-components/**/*.css'),
         `${minimo_path}/src/web-components/**/*.css`,
       ],
       // seeds: [/^--btn-secondary-/], // ex `seeds` di variablesSafelist, se ancora necessari
       minify: !isDevelopment
     })]
     : [])
   ```

   I `sets` vanno adattati alle entry del progetto: `sources` è l'elenco dei nomi degli asset CSS compilati (con l'hash nel nome, si usa `*`, oppure una RegExp) e `target` (opzionale) l'asset in cui iniettare le definizioni; se omesso è il primo asset del set. Ogni entry con un proprio css deve comparire in un set, altrimenti l'uso di custom properties in quel css non viene rilevato e le definizioni corrispondenti mancano.
10. **`cssRules`**: passare `inlineCssInDevMode: inlineCssInDevMode && !purgeCssInDev` (non più `inlineCssInDevMode`).
11. Aggiornare, se presenti, i commenti che citano `variables: true`, `safelist.variables` o `purgecss-variables-safelist.mjs`.

### 3. Template

Nel template di riferimento dello starter (`_sf/templates/_main-tpl.html.twig`) preload e link a `shared.css` sono già presenti. Nei template del progetto (twig/altro) che linkano gli asset a mano aggiungere preload e link a `shared.css`, **prima** di quelli del css della entry (vedi `_sf/templates/_main-tpl.html.twig`):

```twig
<link rel="preload" href="{{ asset('shared.css') }}" as="style">
<link rel="preload" href="{{ asset('index.css') }}" as="style">
<link rel="stylesheet" href="{{ asset('shared.css') }}" type="text/css" media="all">
<link rel="stylesheet" href="{{ asset('index.css') }}" type="text/css" media="all">
```

Con `HtmlWebpackPlugin` (`inject`) `shared.css` è inserito automaticamente. Se il progetto ha entry aggiuntive con un proprio css (es. `admin`), aggiungere `shared.css` anche ai loro template e il css della entry ai `sets` del plugin.

### 4. File CSS del progetto

- Verificare che `app/css/custom-properties.css` esista (è il master, copiato da `starter-install.sh` da minimo). Non importarlo nelle entry CSS (in `app/css/index.css` l'`@import` deve restare commentato o assente): i css compilati devono contenere solo usi `var(--nome)`, altrimenti le definizioni sarebbero duplicate.
- Se `postcss.config.mjs` usa `postcss-jit-props`, eliminarlo (o lasciarlo commentato): non deve essere usato insieme al plugin.

### 5. Cambiamenti di comportamento

- **`shared.css`:** con `enforce: true` viene sempre generato (se esiste almeno un modulo css in `node_modules` o nelle directory di `shared_chunk_paths`). I template devono linkarlo prima del css della entry. In v2 non esisteva e nessun template lo linkava.
- **Dev con css iniettato da style-loader** (`inlineCssInDevMode = true`, il default dello starter): non viene generato nessun asset css, quindi neanche `shared.css`, e un `link` a `shared.css` nel template darebbe 404. Per i progetti con template server-side (es. Symfony) impostare `inlineCssInDevMode = false` (già previsto nei commenti `sf:` della config); con `HtmlWebpackPlugin` il link è inserito solo se il file esiste.
- **Dev:** con `purgeCssInDev: false` (default) né PurgeCSS né il plugin girano in dev, e il css resta iniettato con style-loader. In v2 il purge era sempre attivo anche in dev. Per verificare il purge o il plugin in dev impostare `purgeCssInDev = true`: `inlineCssInDevMode` viene forzato a `false` e `realContentHash` attivato.
- **Prod:** PurgeCSS non rimuove più le custom properties (`variables` è sempre `false`); le definizioni sono iniettate all'inizio del css target di ogni set, dopo il banner webpack, in ordine di dichiarazione del master. Le props con prefisso `--_` sono considerate locali e ignorate.
- Se un target non corrisponde ad alcun asset viene emesso un warning di webpack. Un target con nome letterale (senza `*`) che non corrisponde ad alcun asset viene invece emesso come nuovo asset, che va poi linkato nei template.

### 6. Verifica dopo l'aggiornamento

1. `NODE_ENV=production npx webpack --config ./webpack.config.mjs --stats minimal`: nessun errore o warning del plugin.
2. Nei css di output (`build/`) le custom properties usate sono definite nell'asset target del set (dopo il banner), quelle non usate sono assenti, e non compaiono duplicazioni tra critical e css principale.
3. In `build/` esiste `shared.<hash>.css` (con le definizioni delle custom properties), le pagine lo linkano prima del css della entry senza 404, i css delle entry non duplicano gli stili condivisi e la entry `.critical` resta autosufficiente.
4. `NODE_ENV=development` (con `webpack serve`): le pagine mostrano stili e colori corretti; il master viene caricato per intero come primo modulo delle entry.
5. Se qualche componente perde stili solo in produzione, provare `useCustomPropsPlugin = false` per isolare il problema.


## Da v3 a v3.1

Novità della v3.1: il chunk `shared` diventa opzionale (`useSharedChunk`), i `sets` del plugin custom properties sono derivati da `projectEntries` e usano regexp al posto dei wildcard, e il plugin rileva le custom properties dei css `?raw` (web components) nei js dei chunk, per cui `extraUsageGlobs` non serve più per i web components.

Riepilogo delle modifiche:

| Cosa | Dove |
|---|---|
| Flag `useSharedChunk` (chunk `shared` opzionale), `mainEntry`, `standaloneEntries` | `webpack.config.mjs` |
| `sets` derivati da `projectEntries`, con regexp (`cssAssetRegexp`) al posto dei wildcard | `webpack.config.mjs` |
| Scansione dei js dei chunk per i css `?raw`; `extraUsageGlobs: []` | `custom-props-purgecss-plugin.mjs`, `webpack.config.mjs` |
| Riferimenti a `shared.*` / `runtime.js` commentati come opzionali | `_sf/templates/_main-tpl.html.twig`, pagina di errore e template del progetto |
| `MiniCssExtractPlugin` presente una sola volta; entry `error-pages`; commenti `NB symfony` | `webpack.config.mjs` |

### 1. Moduli in `webpack-config-modules/`

- **Sostituire** `custom-props-purgecss-plugin.mjs` con la versione v3.1 (`// v.3.1`). Gli altri moduli non cambiano.

### 2. Modifiche a `webpack.config.mjs`

1. Riga 2: `// v.3` → `// v.3.1`.
2. **Aggiungere** i flag tra le costanti di configurazione (dopo `customPropsFile`):

   ```js
   ,useSharedChunk = true // false: nessun chunk shared né runtime, per progetti con una sola pagina (più al massimo una pagina di errore)
   ,mainEntry = 'index' // entry sempre caricata: con useSharedChunk false riceve le definizioni delle custom properties
   ,standaloneEntries = [] // con useSharedChunk false: entry non `.critical` che non caricano il css di mainEntry (set proprio)
   ```

3. **`optimization`**: rendere condizionali `runtimeChunk: 'single'` e `splitChunks.cacheGroups.shared`:

   ```js
   optimization: {
     // ...
     ...(useSharedChunk
       ? {
         runtimeChunk: 'single',
         splitChunks: { cacheGroups: { shared: { /* come in v3 */ } } }
       }
       : {})
   },
   ```

4. **Sets del plugin**: prima di `const config`, definire l'helper `cssAssetRegexp` e i set `customPropsSets`, derivati da `projectEntries` (aggiungendo una entry non serve modificare altro):

   ```js
   // corrisponde a `nome.css` (dev con WEBPACK_SERVE) e `nome.<hash>.css`, NON a `nome.critical.<hash>.css`
   const cssAssetRegexp = (entryName) =>
     new RegExp(`^${entryName.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}(\\.[^./]+)?\\.css$`);

   const cssEntries = Object.keys(projectEntries).filter(name => !/\.critical/.test(name))
     ,criticalEntries = Object.keys(projectEntries).filter(name => /\.critical/.test(name))
     ,customPropsSets = [
       // i critical css sono inline nei template: restano autosufficienti
       ...criticalEntries.map(name => ({ sources: [cssAssetRegexp(name)] })),
       ...(useSharedChunk
         // shared.css è linkato in tutte le pagine e contiene le definizioni per tutti i css delle entry
         ? [{
           sources: [cssAssetRegexp('shared'), ...cssEntries.map(cssAssetRegexp)],
           target: cssAssetRegexp('shared')
         }]
         // senza shared: definizioni solo nel css di `mainEntry`; le entry che non lo caricano hanno un set proprio
         : [
           {
             sources: cssEntries.filter(name => !standaloneEntries.includes(name)).map(cssAssetRegexp),
             target: cssAssetRegexp(mainEntry)
           },
           ...standaloneEntries.map(name => ({ sources: [cssAssetRegexp(name)] }))
         ]
       )
     ];
   ```

   Nel plugin sostituire i `sets` con `sets: customPropsSets`. Si usano RegExp e non i wildcard `*`: `'index.*.css'` non corrisponde a `index.css` (dev con `WEBPACK_SERVE`) e corrisponde invece a `index.critical.<hash>.css`.
5. **`extraUsageGlobs`**: sostituire i glob dei web components con `extraUsageGlobs: []` (i glob precedenti possono restare commentati). `minimo_path` resta, perché è usato anche nei `contentGlobs` di PurgeCSS.

6. **`MiniCssExtractPlugin`**: nell'array `plugins` deve comparire **una sola volta**. Se il config ne contiene due, eliminare quello con `filename: '[name].[contenthash].css'` e tenere quello con la logica `process.env.WEBPACK_SERVE ? '[name].css' : '[name].[contenthash].css'` (e il corrispondente `chunkFilename`).
7. **Entry `error-pages`**: nel template di base `projectEntries` include `'error-pages': './app/error-pages/error-pages.js'` (pagina di errore, che carica anche il css di `index`). Nei progetti con pagina di errore va aggiunta; non serve altro per i `sets`, perché derivano da `projectEntries`.
8. **Commenti `NB symfony`** (facoltativo, solo leggibilità): le indicazioni per Symfony (`sf:`, `SYMFONY:`) sono state uniformate in commenti `NB symfony` che dicono cosa commentare, decommentare o rimuovere (import di `HtmlWebpackPlugin` / `HtmlWebpackInjectPreload`, `apiPort`, `output_dir`, `WebpackManifestPlugin`, plugin html). `apiPort` nel template è ora commentato. Nessuna modifica di comportamento.

### 3. Template

Con `useSharedChunk = false` i template **non** devono referenziare `shared.css`, `shared.js` e `runtime.js` (preload, link e script): nei template di esempio (`_main-tpl.html.twig` e pagina di errore) un commento Twig indica le righe da rimuovere. Le definizioni delle custom properties sono nel css di `mainEntry`, che deve essere linkato in ogni pagina; le entry elencate in `standaloneEntries` hanno invece le proprie definizioni nel loro css. Con `useSharedChunk = true` i template restano invariati.

### 4. Cambiamenti di comportamento

- **Scansione dei js:** per ogni set il plugin analizza, oltre ai css, i js dei chunk che li contengono (e dei chunk da essi raggiunti). I css importati con `?raw` (shadow DOM dei web components) sono stringhe nel bundle: le loro props entrano nel css solo per i componenti realmente importati. `extraUsageGlobs` va quindi lasciato vuoto salvo css caricati fuori dal bundle: un glob largo (es. `src/web-components/**/*.css` di minimo) porta nel css anche le props di componenti non importati. Una entry solo js, senza css nei `sources`, non viene scansionata.
- Anche gli usi di `var(--…)` presenti nei js (es. stili generati a runtime) contano come usati.

### 5. Verifica dopo l'aggiornamento

1. `NODE_ENV=production npx webpack --config ./webpack.config.mjs --stats minimal`: nessun errore o warning del plugin.
2. Nel css con le definizioni non compaiono props di web components non importati (es. `--jt-*`, `--sdt-*`); per un componente importato con `?raw` le sue props sono presenti.
3. Con `useSharedChunk = false`: in `build/` non esistono `shared.*` né `runtime.*` e le definizioni sono nel solo css di `mainEntry`.

### 6. Fix da applicare (solo con `useSharedChunk: true`)

* cacheGroup `shared` (solo con `useSharedChunk: true`): escludere `unsplash-page` e `blurhash` dal chunk condiviso, in modo che js e css restino nella entry che li importa. In `webpack.config.mjs`, nella funzione `shared_chunk_paths`, prima del `return` aggiungere:
  ```js
  const excluded_paths = [
    'minimo/src/components/unsplash-page',
    'node_modules/blurhash', // peer dep usata solo da unsplash-page
  ];
  const excludedRegexp = new RegExp(
    excluded_paths.map(p => `${sep}${p.replace(/\//g, sep)}${sep}`).join('|')
  );
  const modulePath = module.nameForCondition?.() ?? '';
  ```
  e sostituire il `return` con `return !excludedRegexp.test(modulePath) && pathsRegexp.test(modulePath);`. Aggiungere anche al commento sopra il cacheGroup la nota sull'esclusione.


## Da v3.1 a v3.2

Novità della v3.2: nessuna modifica di comportamento, solo riorganizzazione per rendere più agevole l'uso del config. Il blocco delle entry del progetto è spostato in cima al file (subito dopo gli import, prima di `// --- config ---`) e rinominato da `projectEntries` a `entries`; la costante `entries` che conteneva le entry elaborate per il dev (con il file master delle custom properties) è rinominata `parsedEntries`. Così le entry, che sono la parte da personalizzare in ogni progetto, si trovano subito e non vanno cercate a metà file. I moduli in `webpack-config-modules/` non cambiano.

Prompt per aggiornare un progetto esistente:

```text
Aggiorna il mio webpack.config.mjs dalla v.3.1 alla v.3.2 con queste modifiche, senza toccare altro:

1. Riga 2: `// v.3.1` → `// v.3.2`.
2. Rinomina l'attuale costante `entries` (quella con la logica `useCustomPropsPlugin && isDevelopment && !purgeCssInDev`, che aggiunge `customPropsFile` come primo modulo delle entry non `.critical`) in `parsedEntries`. Aggiorna i riferimenti: `entry: entries` → `entry: parsedEntries` nella config e i commenti che citano `entries` in questo senso (es. nel commento sopra `purgeCssInDev`: "vedi `entries`" → "vedi `parsedEntries`").
3. Rinomina `projectEntries` in `entries` in tutto il file (definizione, uso in `parsedEntries`, `cssEntries`, `criticalEntries` e commenti).
4. Sposta l'intero blocco `// =>> entries` + `const entries = { ... };` (con le entry già presenti nel progetto, che vanno mantenute così come sono) in cima al file, subito dopo gli import e prima di `// --- config ---`, lasciando due righe vuote prima del blocco e una dopo.
5. Verifica con `grep -n "projectEntries" webpack.config.mjs` (nessun risultato) e con `NODE_ENV=production npx webpack --config ./webpack.config.mjs --stats minimal` (nessun errore).

Mostrami il diff prima di salvare.
```
