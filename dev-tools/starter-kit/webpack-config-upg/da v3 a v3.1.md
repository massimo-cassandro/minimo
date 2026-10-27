# Da v3 a v3.1

Novità della v3.1: il chunk `shared` diventa opzionale (`useSharedChunk`), i `sets` del plugin custom properties sono derivati da `projectEntries` e usano regexp al posto dei wildcard, e il plugin rileva le custom properties dei css `?raw` (web components) nei js dei chunk, per cui `extraUsageGlobs` non serve più per i web components.

Riepilogo delle modifiche:

| Cosa | Dove |
|---|---|
| Flag `useSharedChunk` (chunk `shared` opzionale), `mainEntry`, `standaloneEntries` | `webpack.config.mjs` |
| `sets` derivati da `projectEntries`, con regexp (`cssAssetRegexp`) al posto dei wildcard | `webpack.config.mjs` |
| Scansione dei js dei chunk per i css `?raw`; `extraUsageGlobs: []` | `custom-props-purgecss-plugin.mjs`, `webpack.config.mjs` |
| Riferimenti a `shared.*` / `runtime.js` commentati come opzionali | `_sf/templates/_main-tpl.html.twig`, pagina di errore e template del progetto |
| `MiniCssExtractPlugin` presente una sola volta; entry `error-pages`; commenti `NB symfony` | `webpack.config.mjs` |

## 1. Moduli in `webpack-config-modules/`

- **Sostituire** `custom-props-purgecss-plugin.mjs` con la versione v3.1 (`// v.3.1`). Gli altri moduli non cambiano.

## 2. Modifiche a `webpack.config.mjs`

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

## 3. Template

Con `useSharedChunk = false` i template **non** devono referenziare `shared.css`, `shared.js` e `runtime.js` (preload, link e script): nei template di esempio (`_main-tpl.html.twig` e pagina di errore) un commento Twig indica le righe da rimuovere. Le definizioni delle custom properties sono nel css di `mainEntry`, che deve essere linkato in ogni pagina; le entry elencate in `standaloneEntries` hanno invece le proprie definizioni nel loro css. Con `useSharedChunk = true` i template restano invariati.

## 4. Cambiamenti di comportamento

- **Scansione dei js:** per ogni set il plugin analizza, oltre ai css, i js dei chunk che li contengono (e dei chunk da essi raggiunti). I css importati con `?raw` (shadow DOM dei web components) sono stringhe nel bundle: le loro props entrano nel css solo per i componenti realmente importati. `extraUsageGlobs` va quindi lasciato vuoto salvo css caricati fuori dal bundle: un glob largo (es. `src/web-components/**/*.css` di minimo) porta nel css anche le props di componenti non importati. Una entry solo js, senza css nei `sources`, non viene scansionata.
- Anche gli usi di `var(--…)` presenti nei js (es. stili generati a runtime) contano come usati.

## 5. Verifica dopo l'aggiornamento

1. `NODE_ENV=production npx webpack --config ./webpack.config.mjs --stats minimal`: nessun errore o warning del plugin.
2. Nel css con le definizioni non compaiono props di web components non importati (es. `--jt-*`, `--sdt-*`); per un componente importato con `?raw` le sue props sono presenti.
3. Con `useSharedChunk = false`: in `build/` non esistono `shared.*` né `runtime.*` e le definizioni sono nel solo css di `mainEntry`.

## 6. Fix da applicare (solo con `useSharedChunk: true`)

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

