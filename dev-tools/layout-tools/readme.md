# Layout tools

Mostra un piccolo indicatore del breakpoint corrente.

Con il framework `minimo` (default) l'indicatore mostra il nome abbreviato del breakpoint e la larghezza del viewport in pixel (es. `XL / 1234`), aggiornati al resize. Le etichette (`XXL`, `XL`, `LG`, `MD`, `SM` e `XS` per il viewport inferiore a `small`) sono definite in `mediaLabels` di `src/custom-media.js`.

Di default vengono usati breakpoint ed etichette di `src/custom-media.js` di minimo. Per usare quelli del progetto (di default `app/css/custom-media.js`) il file va importato e passato con l'opzione `customMedia`: l'import deve essere eseguito dallo script del progetto, perché viene risolto da webpack in fase di build. Le eventuali proprietà mancanti nel file (es. `mediaLabels` in copie meno recenti) vengono prese da minimo.

## Uso

In uno script condiviso da tutto il progetto:

```javascript
/* global process */
if (process.env.NODE_ENV === 'development') {
  // framework di default (minimo), con le custom media del progetto
  // (`@css` è l'alias di `app/css` definito in jsconfig.json)
  Promise.all([
    import('@massimo-cassandro/minimo/layout-tools'),
    import('@css/custom-media.js'),
  ]).then(([{ layoutTools }, customMedia]) => layoutTools({ customMedia }));
}
```

Con i breakpoint di minimo:

```javascript
/* global process */
if (process.env.NODE_ENV === 'development') {
  import('@massimo-cassandro/minimo/layout-tools')
    .then(({ layoutTools }) => layoutTools());
}
```

Con Bootstrap 5:

```javascript
/* global process */
if (process.env.NODE_ENV === 'development') {
  import('@massimo-cassandro/minimo/layout-tools')
    .then(({ layoutTools }) => layoutTools({ framework: 'bs5' })); 
}
```
