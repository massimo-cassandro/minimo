# Aggiornamento della configurazione webpack

La versione della configurazione in uso è indicata dal commento `// v.N` alla riga 2 di `webpack.config.mjs` e di ogni file in `webpack-config-modules/`.

Le versioni precedenti sono conservate in `archived/webpack-config-v2/` del repository di minimo.

> **Alternativa rapida:** rilanciare `starter-install.sh` (è idempotente): i file diversi dai sorgenti vengono rinominati `OLD-<nome>` e sostituiti dalla nuova versione. Poi si riportano nel nuovo `webpack.config.mjs` le personalizzazioni del progetto (entry, glob dei contenuti, safelist, template html, regole custom) copiandole da `OLD-webpack.config.mjs`. Le istruzioni seguenti servono per aggiornare a mano un progetto già esistente.

---

## Da v2 a v3

Novità della v3: le definizioni delle custom properties non sono più gestite da PurgeCSS (`variables`) né da postcss-jit-props, ma da un plugin webpack dedicato, `custom-props-purgecss-plugin.mjs`, che opera sugli asset CSS finali (dopo la minificazione) e inietta solo le custom properties effettivamente usate (dipendenze transitive incluse), partendo dal file master `app/css/custom-properties.css`. Il plugin è attivabile con un flag, indipendente da `usePurgeCss`.

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
8. **Aggiungere in fondo all'array `plugins`** (dopo PurgeCSS, che deve restare prima):

   ```js
   ...(runCustomPropsPlugin
     ? [new CustomPropsPurgeCssPlugin({
       definitionsFile: customPropsFile,
       sets: [
         // il critical css è inline nei template: deve restare autosufficiente
         { sources: ['layout.critical.*.css'] },
         { sources: ['index.*.css'] },
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

   I `sets` vanno adattati alle entry del progetto: `sources` è l'elenco dei nomi degli asset CSS compilati (con l'hash nel nome, si usa `*`, oppure una RegExp) e `target` (opzionale) l'asset in cui iniettare le definizioni; se omesso è il primo asset del set. Ogni entry con un proprio css deve comparire in un set, altrimenti quel css resta senza definizioni di custom properties.
9. **`cssRules`**: passare `inlineCssInDevMode: inlineCssInDev` (non più `inlineCssInDevMode`).
10. Aggiornare, se presenti, i commenti che citano `variables: true`, `safelist.variables` o `purgecss-variables-safelist.mjs`.

### 3. File CSS del progetto

- Verificare che `app/css/custom-properties.css` esista (è il master, copiato da `starter-install.sh` da minimo). Non importarlo nelle entry CSS (in `app/css/index.css` l'`@import` deve restare commentato o assente): i css compilati devono contenere solo usi `var(--nome)`, altrimenti le definizioni sarebbero duplicate.
- Se `postcss.config.mjs` usa `postcss-jit-props`, eliminarlo (o lasciarlo commentato): non deve essere usato insieme al plugin.

### 4. Cambiamenti di comportamento

- **Dev:** con `purgeCssInDev: false` (default) né PurgeCSS né il plugin girano in dev, e il css resta iniettato con style-loader. In v2 il purge era sempre attivo anche in dev. Per verificare il purge o il plugin in dev impostare `purgeCssInDev = true`: `inlineCssInDevMode` viene forzato a `false` e `realContentHash` attivato.
- **Prod:** PurgeCSS non rimuove più le custom properties (`variables` è sempre `false`); le definizioni sono iniettate all'inizio del css target di ogni set, dopo il banner webpack, in ordine di dichiarazione del master. Le props con prefisso `--_` sono considerate locali e ignorate.
- Se un target non corrisponde ad alcun asset viene emesso un warning di webpack. Un target con nome letterale (senza `*`) che non corrisponde ad alcun asset viene invece emesso come nuovo asset, che va poi linkato nei template.

### 5. Verifica dopo l'aggiornamento

1. `NODE_ENV=production npx webpack --config ./webpack.config.mjs --stats minimal`: nessun errore o warning del plugin.
2. Nei css di output (`build/`) le custom properties usate sono definite nell'asset target del set (dopo il banner), quelle non usate sono assenti, e non compaiono duplicazioni tra critical e css principale.
3. `NODE_ENV=development` (con `webpack serve`): le pagine mostrano stili e colori corretti; il master viene caricato per intero come primo modulo delle entry.
4. Se qualche componente perde stili solo in produzione, provare `useCustomPropsPlugin = false` per isolare il problema.
