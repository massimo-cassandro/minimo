# Da v3.4 a v3.5

Novità della v3.5: con il dev server attivo (`WEBPACK_SERVE`) i file js vengono generati senza `contenthash` (`[name].js`), come già avveniva per i css con `MiniCssExtractPlugin`. I filename restano così stabili tra una modifica e l'altra e il browser non rischia di servire dalla cache una versione stale su reload manuale. Anche i chunk js (`output.chunkFilename` non impostato, quindi derivato da `output.filename`) perdono l'hash. In build (dev senza dev server e produzione) non cambia nulla. I moduli in `webpack-config-modules/` non cambiano.

Prompt per aggiornare un progetto esistente:

Riepilogo:

1. Riga 2: `// v.3.4` → `// v.3.5`.
2. Nell'`output` attivo (non commentato), sostituisci `filename: '[name].[contenthash].js',` (o l'equivalente con un altro schema di hash) con:

```javascript
    // contenthash solo se non si usa Dev Server
    filename: process.env.WEBPACK_SERVE ? '[name].js' : '[name].[contenthash].js',
```

3. Se nel file è presente anche l'`output` commentato per Symfony (`/* SETUP symfony ... */`), applica la stessa modifica, eliminando l'eventuale riga commentata `// filename: '[name].js',`.
4. Se `output.chunkFilename` è impostato esplicitamente con `[contenthash]`, applica la stessa logica (`'[id].js'` con `WEBPACK_SERVE`).
5. Verifica che il config sia valido con e senza dev server:

```bash
for v in "" "true"; do WEBPACK_SERVE="$v" NODE_ENV=development node -e "
import('./webpack.config.mjs').then(m=>{const c=m.default;console.log(JSON.stringify(process.env.WEBPACK_SERVE),(Array.isArray(c)?c[0]:c).output.filename)}).catch(e=>console.log(e.message))"; done
```

Output atteso: `"" [name].[contenthash].js` e `"true" [name].js`.

6. Mostrami il diff prima di salvare.
