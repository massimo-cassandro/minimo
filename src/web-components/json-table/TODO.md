# json-table TODO

Materiale di riferimento (piano originale, vecchia implementazione): `src/web-components/TODO json-table/`, da eliminare a fine lavoro.

## Prossimo step: `dt-legacy.js`
  * modulo on-demand per la compatibilità con il legacy jQuery DataTables / `auto-datatables-bs5` (ADA), con `mustache` come peer dep opzionale

  * prerequisiti nel core: `hidden` per le colonne (campo usato solo per la ricerca, non mostrato); `serverParams` come funzione (o evento `jt:request`)

  * export di `JsonTable` da `index.js` + `**/json-table/json-table-component.js` in `sideEffects` di `package.json`

  * `test/sideEffects-tree-shaking/webpack.config.mjs` rotto: importa `dev-tools/starter-kit/webpack-modules/css-rules.mjs`, spostato in `dev-tools/starter-kit/source_files/root/webpack-config-modules/`

## Punti aperti
  * `refs` (ripristino pagina da cookie di sessione al ritorno da pagine indicate, come in s-datatable: vedi `_isReferrer`/`_savePageCookie`)

  * `_collapseKey` di s-datatable (raggruppamento visivo valori ripetuti): da decidere

  * `reload()` azzera ricerca/ordinamento/pagina: valutare se conservarli

  * fuso orario degli oggetti data Symfony non gestito in `parseDate`; `sfTime`/`sfDatetime` da definire (TODO in `src/data-types.js`)

  * demo server-side (`/demo-api/json-table`, middleware del devServer in `demo/webpack-modules/json-table-dev-api.mjs`) e demo `jsonUrl` funzionano solo in sviluppo, non nella build GitHub Pages

  * sanitizer di `Element.setHTML`: json-table e domBuilder passano `{ sanitizer: {} }` perché la configurazione di default rimuove `class`/`id`/`style`/`data-*` (verificato in Chrome 152). Da verificare in Firefox/Safari quando supporteranno l'API

  * eventuale ottimizzazione della paginazione server-side: chunk di più pagine (`fetchSize`) se le richieste risultassero troppe
