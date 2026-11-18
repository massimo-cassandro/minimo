# json-table TODO

## Da sistemare
  * `npm run "test sideEffects tree-shaking"` ancora rotto: la build si ferma su `Can't resolve '@minimoCss/spinner-wrapper.css'` (alias `@minimoCss` non definito in `test/sideEffects-tree-shaking/webpack.config.mjs`)

## Punti aperti
  * `stateSave` (17/11/2026): da verificare nel browser e in ADA (ripristino con `filterForm`, autocomplete tramite `jt:stateload`/`jt:statesave`, navigazione indietro)

  * `_collapseKey` di s-datatable (raggruppamento visivo valori ripetuti): da decidere

  * `reload()` azzera ricerca/ordinamento/pagina: valutare se conservarli

  * fuso orario degli oggetti data Symfony non gestito in `parseDate`; `sfTime`/`sfDatetime` da definire (TODO in `src/data-types.js`)

  * demo server-side (`/demo-api/json-table`, middleware del devServer in `demo/webpack-modules/json-table-dev-api.mjs`) e demo `jsonUrl` funzionano solo in sviluppo, non nella build GitHub Pages

  * sanitizer di `Element.setHTML`: json-table e domBuilder passano `{ sanitizer: {} }` perché la configurazione di default rimuove `class`/`id`/`style`/`data-*` (verificato in Chrome 152). Da verificare in Firefox/Safari quando supporteranno l'API

  * eventuale ottimizzazione della paginazione server-side: chunk di più pagine (`fetchSize`) se le richieste risultassero troppe
