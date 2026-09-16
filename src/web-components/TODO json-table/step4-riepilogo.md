# step 4 — riepilogo (16/9/2026)

Risposta punto per punto a [step4.md](step4.md). Nessuna modifica al codice: questo step è di
chiarimento e propone un piano, da confermare prima dell'implementazione.

## 1. `/demo-api/json-table`

È un endpoint **finto**, che esiste solo nel devServer della demo. È implementato dal middleware
`demo/webpack-modules/json-table-dev-api.mjs`, registrato in `demo/webpack.config.mjs` tramite
`devServer.setupMiddlewares`. Intercetta le GET a `/demo-api/json-table`, costruisce in memoria
circa 1.000 righe replicando 35 volte `demo/demo-files/json-table/demo-data.json` (id univoci,
importi variati), applica ricerca, ordinamento e paginazione leggendo `page`/`start`, `perPage`,
`sort`, `dir`, `search` (i nomi di default di `serverParams`) e risponde con
`{ data, totRec, filteredRec }` dopo 300 ms (per rendere visibile lo stato `aria-busy`).
Serve alla demo 4 (server-side). Non esiste nella build statica per GitHub Pages: lì la demo 4
fallisce (già annotato in TODO.md). Non richiede nulla lato consumer.

## 2. Compatibilità con jQuery DataTables (legacy)

### 2a. Lato server

Verificato su `ada/src/Service/DataTable.php` (il servizio usato dai controller ADA). Dalla query
string legge solo:

| Parametro | Uso |
|---|---|
| `start`, `length` | offset/limit (`length=-1` = tutti i record) |
| `order[0][column]`, `order[0][dir]` | indice della colonna in `columns[]` e direzione; l'indice viene risolto con `columns[i][name]` e accettato solo se `columns[i][orderable]` |
| `search[value]` | LIKE su tutte le colonne con `columns[i][searchable]` true (per `name`) |
| `columns[i][name]`, `[orderable]`, `[searchable]` | elenco colonne; se `columns` manca, usa tutti i `$fields` del controller |
| `draw` | restituito com'è (opzionale) |

Ignora `columns[i][data]`, `search[regex]`, `_`. Risposta: `{ draw, recordsTotal, recordsFiltered, data }`.

Rispetto a json-table oggi:

* risposta: **compatibile senza modifiche** (`jsonDataField: 'data'`, `totRecField: 'recordsTotal'`,
  `filteredRecField: 'recordsFiltered'` sono già configurabili);
* richiesta: `serverParams` copre `start`, `perPage → length`, `search → search[value]`,
  `dir → order[0][dir]`, `page → null` (i nomi con parentesi quadre funzionano come chiavi normali).
  **Non copre** `sort`: json-table invia la chiave della colonna, DataTables vuole l'**indice** in
  `columns[]`, e il server ha bisogno dell'elenco `columns[i][name|orderable|searchable]` (altrimenti
  ordina/cerca sull'elenco `$fields` del controller, che può non coincidere con le colonne del client).
  Inoltre `perPage: 0` oggi invia `length=0` (LIMIT 0 → nessuna riga): va tradotto in `-1`.

Conclusione: **il server non va toccato**. Serve un solo punto di estensione nel core: la
possibilità di costruire la query string con una funzione (`serverParams` come funzione
`(request, cols, params) => Object`, oppure evento cancellabile `jt:request` con `detail.url`,
vedi anche `bindToForm`). Con quello, il modulo legacy compone i parametri DataTables.

### 2b. Lato client — mappatura attributi → json-table

Dati raccolti su ADA (`templates/`): 112 template con `.dt-container`; tipi `dtRender` usati:
`tpl` ~170, `id` 97, `bool_icons` ~92, `sf_date` 69, `num` 24, `euro` 20, `sf_datetime` 13,
`date`/`datetime` 1. Nei template mustache: 845 tag, di cui 47 sezioni `[[#x]]`, 23 sezioni inverse
`[[^x]]`, 13 non-escaped `[[& x]]`, 232 usi di `sf_base_url`; `filter` in ~14 colonne; `cond_tpl` 2;
`null_icon` 25, `false_icon` 26, `decimali` 27; `visible: false` 85 (colonne di sola ricerca);
`bindToForm` 23, `storageAllowedReferrers` 22; `pageLength` 23, `searching` 7, `stateSave` 4,
`paging` 3. Mai usati: `responsive`, `columnDefs`, `createdRow`/`drawCallback` da template
(`createdRow` compare in 4 script JS di `ada-frontend/apps`).

| Legacy (`data-cdt_options` / `data-dt_columns` / `data-dt_options`) | json-table |
|---|---|
| `datatable_options.ajax` (stringa o `{ url }`) | `jsonUrl` |
| `datatable_options.order: [[i, dir]]` | `initialSort: { key: cols[i].key, dir }` (solo il primo) |
| `datatable_options.pageLength` / `paging: false` | `perPage` / `perPage: 0` (+ `length=-1`) |
| `datatable_options.searching: false` | `search: false` |
| `serverSide` (default true nel legacy) | `serverSide: true` |
| `stateSave`, `dtRender.storageAllowedReferrers` | `refs` (step successivo) |
| `dtRender.bindToForm` | `jsonUrl` = `form.action` + form serializzato; `submit` → `reload({ jsonUrl })` (vedi § bindToForm) |
| colonna `title` (anche HTML) | `title` |
| colonna `data` / `name` | `key` |
| colonna `className` | `cellClass` (headerClass segue) |
| colonna `orderable` / `searchable` | `sortable` / `searchable` |
| colonna `visible: false` | **`hidden: true`** (da aggiungere al core: colonna parsata, inviata al server e usata nella ricerca client, non renderizzata). `condition: false` non basta perché elimina la colonna |
| colonna `type` (`num`, `date`, …) | ignorabile (il dataType deriva da `dtRender.type`) |
| `dtRender.type: 'id'` | `dataType: 'id'`, `title: '#'`, `hidden` se `!id_visible_default` |
| `sf_date` / `date` | `dataType: 'date'` (`parseDate` gestisce già gli oggetti Symfony) |
| `sf_datetime` / `datetime` | `dataType: 'datetime'` |
| `num` (+ `decimali`) | tipo generato al volo che eredita da `num` con `minimum/maximumFractionDigits` |
| `euro` | `dataType: 'euro'` (differenza visiva: Intl aggiunge il simbolo €; in alternativa tipo generato da `num` a 2 decimali) |
| `bool_icons` (+ `true_icon`, `false_icon`, `null_icon`) | `dataType: 'bool'`; con icone per colonna, `render` generato (serve anche per `null_icon`, perché il render del tipo non è invocato su `null`) |
| `tpl` (mustache: sezioni, `&`, `sf_base_url`, `filter`, `cond_tpl`) | `render: row => …` con la libreria **`mustache`** (peer dependency opzionale, come da policy) + porting dei `filter` legacy. Il `[[key]]` nativo di json-table non basta (niente sezioni, niente escaping) |
| `cdt_options.table_caption` / `table_class` / `table_id` | `caption` / `classes.table` / `tableId` |
| `container_header`, `extra_info` | `template` con elementi aggiuntivi |
| `icone.ok` / `icone.off` | `boolTrueIcon` / `boolFalseIcon` |
| `formats.date/time/datetime` | `datesLocaleOpts` / `timesLocaleOpts` (ADA usa anno a 2 cifre per `date`) |
| `align_right_class` | `classes.textEnd` |
| `use_sorting_arrow`, `table_footer`, `legacy`, `dom`, `responsive` | nessun equivalente (CSS/markup di json-table) |
| JS: `dt_options.createdRow(row, data)` | `trCallback(tr, row)` |
| JS: `language.*` | `labels` |
| JS: API DataTables sull'istanza (`.ajax.url().load()`, `.draw()`) | `reload()`, `goToPage()`, … (adattamento manuale nei 6 script che le usano) |

### 2c. Opzione `dt-legacy`: fattibile, con una precisazione

Fattibile. Precisazione: nell'uso legacy l'elemento è un `div.dt-container` e l'avvio è fatto da
uno script (`ada-frontend/src/ada-datatable/ada-datatable.js`) che scansiona i `.dt-container`.
La modifica front-end minima è quindi in **quel singolo script**, non nei 112 template.
Proposta: modulo `src/web-components/json-table/dt-legacy.js`, mai importato staticamente dal core,
che esporta:

1. `parseLegacyContainer(el, overrides)` → config per `init()` (conversione pura, testabile);
2. `upgradeLegacyContainer(el, overrides)` → crea `<json-table>` al posto del div, `init()` con la
   config, collega `bindToForm`; è ciò che `ada-datatable.js` chiamerebbe per ogni `.dt-container`
   (zero modifiche ai template);
3. opzione `dtLegacy: true` (attributo `dtlegacy`) su `<json-table>`, per template riscritti come
   `<json-table dtlegacy data-cdt_options=… data-dt_columns=…>`: in `_load()` un
   `await import('./dt-legacy.js')` (chunk separato generato da webpack: peso zero nel componente
   standard, resta solo l'`if`).

Prerequisiti nel core (utili comunque): `hidden` per le colonne; `serverParams` in forma di
funzione (o evento `jt:request`); `mustache` in `peerDependencies` opzionali.
Stima: 250–350 righe, caricate solo dove servono. Consigliato come step separato dopo le sessioni
di debug/CSS, perché dipende dai due prerequisiti.

## 3. `JsonTable` in `index.js`

La causa del problema con s-datatable non è il CSS in sé ma il campo `sideEffects` di
`package.json` (`["**/s-datatable-component/**/*", "**/*.css"]`): ogni file JS non elencato è
considerato privo di side effect. Un web component si registra al caricamento del modulo
(`customElements.define`) e, nell'uso da markup, viene importato **senza binding**
(`import '.../json-table-component.js'`): webpack elimina gli import "nudi" di moduli senza side
effect, quindi sparisce il componente **e** il suo CSS (importato dal JS). Il sintomo visibile era
il CSS mancante. Gli altri componenti esportano funzioni che il consumer chiama, quindi risultano
sempre "usati". La regola ad hoc era il rimedio corretto (stessa tecnica di Shoelace/Lit:
`sideEffects: ["dist/components/**/*.js"]`).

Verifica empirica (webpack 5.110, build di produzione in cartella temporanea, barrel equivalente a
`index.js` più `export { JsonTable }`, `demo/webpack-modules/css-rules.mjs`, CSS estratto):

| Consumer | file componente NON in `sideEffects` | file componente in `sideEffects` |
|---|---|---|
| `import { titleCase } from barrel` | json-table assente (252 B) | assente (252 B) |
| `import { JsonTable } from barrel; JsonTable.setDefaults()` | presente (JS + CSS) | presente |
| `import '.../json-table-component.js'` (solo markup) | **bundle vuoto (0 B)** | presente, `define` incluso |
| `import { JsonTable } from barrel` senza usarlo | assente | assente |

Conclusione: esportare `JsonTable` da `index.js` **e** segnare il file del componente in
`sideEffects` è sicuro: nessun trascinamento negli altri import, l'uso da markup funziona,
l'import inutilizzato viene scartato.

Proposta:

* `index.js`: `export { JsonTable } from './src/web-components/json-table/json-table-component.js';`
* `package.json` → `sideEffects`: `["**/s-datatable-component/s-datatable-component.js",
  "**/json-table/json-table-component.js", "**/*.css"]` (regola ristretta ai soli file che
  registrano l'elemento; alternativa: glob `**/web-components/*/*-component.js`)
* readme: `import { JsonTable } from '@massimo-cassandro/minimo'` va bene se il binding viene usato
  (es. `setDefaults`); per il solo markup resta l'import diretto del file
* `test/sideEffects-tree-shaking/webpack.config.mjs` importa
  `dev-tools/starter-kit/webpack-modules/css-rules.mjs`, che ora sta in
  `dev-tools/starter-kit/source_files/root/webpack-config-modules/`: il test è rotto, da
  correggere; si possono aggiungere i 4 scenari sopra (fixture già pronte)

## bindToForm (nota dell'utente, 16/9)

Da aggiungere al core come parametro `bindToForm` (form o id): `jsonUrl` composto da
`form.action` + dati del form; al `submit` del form (preventDefault) nuova richiesta con l'URL
aggiornato. Associato a un evento: `jt:request` cancellabile con `detail.url`/`detail.request`,
emesso prima di ogni fetch, che consente al consumer di modificare l'URL (e che coprirebbe anche
il caso dt-legacy). Per ora: commento TODO in `json-table-component.js` (vicino a `_serverRequest`).

## Piano proposto (da confermare)

1. `index.js` + `sideEffects` + nota readme + fix del test tree-shaking (con i nuovi scenari)
2. core: `hidden` per le colonne; `serverParams` come funzione (o evento `jt:request`); `perPage: 0`
   gestito dal hook
3. TODO `bindToForm` nel codice (+ voce in TODO.md)
4. `dt-legacy.js` come step separato (dopo debug/CSS), con `mustache` peer dep opzionale; decidere
   prima: resa di `euro` (con o senza simbolo), `null_icon`, e per ADA la via "div + script"
   invece della riscrittura dei template
5. `refs` (già in piano) collegato a `stateSave`/`storageAllowedReferrers`
