# Da v3.2 a v3.3

Novità della v3.3: nessuna modifica di comportamento, solo riorganizzazione per rendere più agevole l'uso del config. La configurazione di HtmlWebpackPlugin è spostata in cima al file, subito dopo `entries`, in un array `htmlWebpackPluginsItems` (un oggetto di opzioni per ogni pagina html da generare); nei `plugins` ogni elemento dell'array viene trasformato in un'istanza di `HtmlWebpackPlugin`. Così anche le pagine html, come le entry, si personalizzano in cima al file, ed è più semplice generarne più di una (ad es. usando l'opzione `chunks` per associare a ogni pagina le proprie entry). Per poter usare `isDevelopment` e `__dirname` già in `htmlWebpackPluginsItems`, le relative costanti sono spostate subito dopo gli import. I moduli in `webpack-config-modules/` non cambiano.

Il blocco va rimosso, come prima, nei progetti Symfony (commento `// SETUP symfony (rimuovere)`).

In agggiunta, la definizione della variabile `CopyWebpackPluginPatterns` va spostata subito dopo `htmlWebpackPluginsItems`


Riepilogo:

1. Riga 2: `// v.3.2` → `// v.3.3`.
2. Sposta le costanti `isDevelopment`, `__filename` e `__dirname` subito dopo gli import, prima del blocco `// =>> entries`, in un'unica dichiarazione:

```javascript
const isDevelopment = process.env.NODE_ENV === 'development'
  ,__filename = fileURLToPath(import.meta.url)
  ,__dirname = path.dirname(__filename);
```
   Rimuovile dalle posizioni originali (la dichiarazione di `__filename`/`__dirname` sotto `// --- config ---` e `isDevelopment` all'inizio del blocco `const` delle opzioni, che ora inizia con `const devServerPort = ...`).
3. Solo se nel config è presente `new HtmlWebpackPlugin({...})` (progetti non Symfony): subito dopo la chiusura di `const entries = { ... };` aggiungi il blocco seguente, con una riga vuota prima e due dopo, riportando nell'oggetto le opzioni attualmente passate a `new HtmlWebpackPlugin(...)` (filename, template, inject, title, minify, base, ecc.) così come sono nel progetto. Se il config contiene più istanze di `HtmlWebpackPlugin`, aggiungi un oggetto per ciascuna, nello stesso ordine:

```javascript
// SETUP symfony (rimuovere)
const htmlWebpackPluginsItems = [
  {
    filename: 'index.html',
    template: path.resolve(__dirname, './index.ejs'),
    inject: 'body',
    title: 'xxxx',
    minify: !isDevelopment,
    // base: isDevelopment ? '/' : '/tools/',
    // chunks: ['index', 'home']
  }
];
```

4. Nei `plugins`, sotto il commento `// =>> plugins: HtmlWebpackPlugin`, sostituisci la/le istanze `new HtmlWebpackPlugin({...})` con: `...htmlWebpackPluginsItems.map( item => new HtmlWebpackPlugin(item))`
5. Verifica con `grep -n "new HtmlWebpackPlugin" webpack.config.mjs` (un solo risultato, quello nel `.map`) e con `NODE_ENV=production npx webpack --config ./webpack.config.mjs --stats minimal` (nessun errore, html generati come prima).
6. spostare il blocco `CopyWebpackPluginPatterns` va spostata subito dopo `htmlWebpackPluginsItems`:
7. Mostrami il diff prima di salvare.

```javascript
// ... parte iniziale del config

// SETUP symfony (rimuovere)
const htmlWebpackPluginsItems = [ 
  /* ... contenuto ... */ 
];

// =>> CopyWebpackPlugin patterns
// (null o array vuoto per disattivare)
// https://github.com/webpack/copy-webpack-plugin/tree/main?tab=readme-ov-file#copy-webpack-plugin
const CopyWebpackPluginPatterns = [
  /* ... contenuto ... */  
];

// ... resto del config
```
