# Aggiornamento della configurazione webpack

La versione della configurazione in uso è indicata dal commento `// v.N` alla riga 2 di `webpack.config.mjs` e di ogni file in `webpack-config-modules/`.

Le versioni precedenti sono conservate in `archived/webpack-config-v2/` del repository di minimo.

> **Alternativa rapida:** rilanciare `starter-install.sh` (è idempotente): i file diversi dai sorgenti vengono rinominati `OLD-<nome>` e sostituiti dalla nuova versione. Poi si riportano nel nuovo `webpack.config.mjs` le personalizzazioni del progetto (entry, glob dei contenuti, safelist, template html, regole custom) copiandole da `OLD-webpack.config.mjs`. Le istruzioni seguenti servono per aggiornare a mano un progetto già esistente.

---

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

3. **Aggiungere** i nuovi flag e le costanti derivate (dopo `purgeCSSOptions`):

   ```js
   ,useCustomPropsPlugin = true // false: il plugin non viene caricato, le custom properties restano a carico del progetto
   ,customPropsFile = path.resolve(__dirname, './app/css/custom-properties.css')
   ,purgeCssInDev = false // true (solo per test): purge e plugin attivi anche in dev
   ,inlineCssInDev = inlineCssInDevMode && !purgeCssInDev
   ,runPurgeCss = usePurgeCss && (!isDevelopment || purgeCssInDev)
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
7. **PurgeCSS**: la condizione `...(usePurgeCss ? createPurgeCSSPlugins({...}) : [])` diventa `...(runPurgeCss ? ... : [])`, e nella chiamata a `createPurgeCSSPlugins` va **rimosso** il blocco `variablesSafelist: { declarationGlobs, shadowGlobs, seeds }`. I glob `shadowGlobs` e `seeds` si spostano nel plugin (punto seguente, come `extraUsageGlobs` e `seeds`).
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
10. **`cssRules`**: passare `inlineCssInDevMode: inlineCssInDev` (non più `inlineCssInDevMode`).
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
