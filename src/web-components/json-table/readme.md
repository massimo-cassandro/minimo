# `<json-table>` – datatable da JSON

**json-table** costruisce una tabella HTML da un array di dati JSON (inline o caricato via
fetch), a partire da una definizione delle colonne (`cols`) e da un insieme di tipi di dato
predefiniti ed estendibili, con ordinamento, ricerca e paginazione (lato client oppure, con
`serverSide: true`, delegati al server). È un web component light DOM senza dipendenze esterne:
può quindi essere stilizzato direttamente dal CSS del progetto in cui è utilizzato.

## Installazione

È sufficiente importare il file del componente (registra il custom element):

```javascript
import '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';

// oppure, se necessario eseguire metodi della classe (es. `setDefaults`):
import { JsonTable } from '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';
```

Il CSS (`json-table-component.module.css`) è importato dal componente stesso; le custom
properties `--jt-*` sono definite in `json-table.minimo.tokens.mjs` e compilate in
`custom-properties.css` da `build-tokens`. Le icone di default (booleani, ordinamento e
paginazione) sono SVG di minimo importati con il suffisso `?inline` (gestito dalla configurazione
webpack dello starter-kit).

### Tipi per gli script consumer

Il file `types/global.d.ts` di minimo dichiara il tipo globale `JsonTable` e registra il tag
`json-table` in `HTMLElementTagNameMap`: aggiungendolo all'`include` del proprio
`jsconfig.json`/`tsconfig.json` (`"node_modules/@massimo-cassandro/minimo/types/global.d.ts"`)
si ottiene il completamento dei metodi senza cast né import di tipo:

```javascript
const el = document.querySelector('json-table'); // → JsonTable
el.init({ ... });

/** @type {JsonTable} */
const other = document.createElement('json-table');
```

## Utilizzo da markup

```html
<json-table
  jsonurl="/api/rows.json"
  caption="Utenti"
  perpage="10"
  cols='[
    { "key": "id", "dataType": "id" },
    { "key": "name", "title": "Nome", "render": "<a href=\"/users/[[id]]\">[[name]]</a>" },
    { "key": "amount", "title": "Importo", "dataType": "euro", "tfootRender": "@sum" },
    { "key": "active", "title": "Attivo", "dataType": "bool" }
  ]'
  tfoot="true"
></json-table>

<!-- dati inline (JSON serializzato) al posto di jsonurl -->
<json-table
  data='[{"name":"Mario","city":"Roma"}, ...]'
  cols='[{ "key": "name", "title": "Nome" }, { "key": "city", "title": "Città" }]'
  search="false"
></json-table>
```

I nomi degli attributi sono case-insensitive (`jsonurl` e `jsonUrl` sono equivalenti).
Gli attributi booleani accettano i formati HTML idiomatici: `search` (presente senza valore),
`search="true"`, `search="1"` → true; `search="false"`, `search="0"` → false. Gli attributi
numerici (`perpage`, `paginationdelta`, `searchdebounce`) vengono convertiti in numero.
I valori che iniziano con `[` o `{` vengono interpretati come JSON (un JSON malformato viene
segnalato in console e ignorato).

Da attributo non è possibile passare funzioni: per il rendering delle celle è disponibile la
sintassi mustache-like `[[key]]` (vedi [`render`](#render)), per il footer gli aggregati
predefiniti (`"@sum"`, ...).

## Utilizzo da script

```javascript
const el = document.querySelector('json-table');
// oppure: const el = document.createElement('json-table');

el.init({
  jsonUrl: '/api/rows.json',
  caption: 'Utenti',
  cols: [
    { key: 'id', dataType: 'id' },
    { key: 'name', title: 'Nome', render: row => `<a href="/users/${row.id}">${row.name}</a>` },
    { key: 'amount', title: 'Importo', dataType: 'euro', tfootRender: '@sum' },
    { key: 'active', title: 'Attivo', dataType: 'bool' }
  ],
  tfoot: true
});

// dati inline al posto di jsonUrl (se presenti entrambi, `data` prevale)
el.init({
  data: [{ name: 'Mario', city: 'Roma' }, ...],
  cols: [...]
});

// se appena creato, appendere dopo init():
document.body.appendChild(el);
```

### Con `domBuilder`

```javascript
domBuilder([
  {
    tag: 'json-table',
    attrs: { caption: 'Utenti' },
    callback: el => el.init({ jsonUrl: '/api/rows.json', cols: [...] })
  }
], container);
```

## Utilizzo misto – attributi HTML + script

I parametri non inclusi in `init()` vengono letti dall'attributo HTML corrispondente:

```html
<json-table caption="Utenti" search="false" cols='[...]'></json-table>
```

```javascript
el.init({ jsonUrl: '/api/rows.json' }); // jsonUrl da script, caption, search e cols da attributo
```

**Ordine di precedenza:** `init()` > attributo HTML > `JsonTable.setDefaults()` > default interno.

Per ignorare esplicitamente un attributo e utilizzare il valore di default, utilizzare `null` nel config:

```javascript
el.init({ jsonUrl: '/api/rows.json', search: null }); // search == default (true)
```

I parametri oggetto `classes`, `labels`, `dataTypes` e `serverParams` vengono **uniti** ai default
(merge a un livello), quindi ogni sorgente deve indicare solo le chiavi da sovrascrivere:

```javascript
el.init({ classes: { table: 'table' } }); // le altre classi restano quelle di default
```

## Default di progetto – `JsonTable.setDefaults()`

Imposta valori validi per tutte le istanze create successivamente, evitando di ripetere gli
stessi parametri. Da invocare una sola volta, in uno script condiviso eseguito prima degli altri.
I valori vengono uniti a quelli impostati in chiamate precedenti.

```javascript
import { JsonTable } from '.../json-table-component.js';

JsonTable.setDefaults({
  perPage: 50,
  classes: { searchInput: 'form-control', table: 'table' },
  labels: { searchPlaceholder: 'Cerca…', noRows: 'Nessun elemento' },
  infoText: (start, end, totRec, filteredRec) => `${filteredRec} di ${totRec} record`
});

JsonTable.getDefaults();   // default interni + default di progetto
JsonTable.resetDefaults(); // azzera i default di progetto
```

## API dell'istanza

| Metodo | Descrizione |
|---|---|
| `init(config)` | Avvia il componente (prima o dopo l'inserimento nel DOM) |
| `reload(overrides)` | Ricarica i dati e ricostruisce la struttura, con eventuali parametri sovrascritti (`Promise`); ricerca, ordinamento e pagina vengono azzerati |
| `destroy()` | Svuota il componente; `init()` può essere richiamato in seguito |
| `goToPage(page)` | Mostra la pagina indicata (limitata all'intervallo disponibile) |
| `setSort(key, dir)` | Ordina per la colonna `key` (`'asc'`, `'desc'`, oppure `null` per rimuovere l'ordinamento) e torna alla prima pagina |
| `setSearch(term)` | Filtra le righe con il termine indicato (stringa vuota = nessun filtro) e torna alla prima pagina; l'input di ricerca viene aggiornato |

In modalità server-side `goToPage`, `setSort` e `setSearch` generano una nuova richiesta.

Proprietà disponibili dopo il caricamento:

| Proprietà | Descrizione |
|---|---|
| `params` | parametri risolti |
| `data` | righe grezze (array di oggetti; in modalità server-side solo quelle della pagina corrente) |
| `cols` | colonne dopo il parsing (solo quelle visibili, con classi e tipo di dato risolti) |
| `dataTypes` | mappa dei tipi di dato (predefiniti + personalizzati) |
| `state` | stato del rendering: `totRec`, `filteredRec`, `rows`, `filtered`, `pageRows`, `searchTerm`, `sort` (`{ key, dir }` o `null`), `page`, `totPages` |
| `elements` | elementi generati: `wrapper`, `infoOuter`, `info`, `resultInfo`, `searchInput`, `tableWrapper`, `table`, `thead`, `tbody`, `tfoot`, `tableFooter`, `caption`, `pagination` |

```javascript
await el.reload({ jsonUrl: '/api/rows.json?anno=2025' });
await el.reload({ data: [...] });
el.setSort('name', 'desc');
el.goToPage(3);
```

## Eventi

Entrambi vengono emessi sull'elemento con `bubbles: true`; `event.detail.jsonTable` è l'istanza.

| Evento | Quando | `event.detail` |
|---|---|---|
| `jt:ready` | al termine della costruzione e del primo rendering (nel microtask successivo, quindi un listener registrato subito dopo `init()` lo intercetta comunque) | `{ jsonTable }` |
| `jt:update` | dopo ogni cambio pagina, ordinamento o ricerca (anche via API) | `{ jsonTable, reason }` con `reason` = `'page'`, `'sort'` o `'search'` |

```javascript
el.addEventListener('jt:ready', e => console.log(e.detail.jsonTable.data));
el.addEventListener('jt:update', e => console.log(e.detail.reason, e.detail.jsonTable.state.page));
el.init({ jsonUrl: '/api/rows.json', cols: [...] });
```

## Parametri

Tutti i parametri sono impostabili sia da attributo HTML che da `init()`. I valori di tipo
funzione solo da `init()`.

```javascript
{
  debug,                  // boolean – log in console di parametri, colonne, dati, stato ed
                          // elementi generati. Default: false

  jsonUrl,                // string – URL del JSON da caricare. Ignorato se `data` è presente.
                          // Default: null
  jsonDataField,          // string|null – chiave del JSON che contiene l'array delle righe
                          // (es. 'data' per { data: [...] }); null o '' = la root del JSON è
                          // l'array stesso. Default: 'data'
  totRecField,            // string – chiave del JSON con il totale dei record (numerico); se
                          // assente o non numerico il totale è la lunghezza dell'array.
                          // Default: 'totRec'
  filteredRecField,       // string – solo server-side: chiave del JSON con il numero di record
                          // che soddisfano la ricerca corrente; se assente vale `totRecField`.
                          // Default: 'filteredRec'
  data,                   // Array<Object> – righe inline; prevale su `jsonUrl`. Da attributo va
                          // passato come stringa JSON ed è sempre inteso come array delle righe
                          // (`jsonDataField` ignorato). Default: null

  cols,                   // ColDefinition[] – OBBLIGATORIO: definizione delle colonne (vedi
                          // sotto). Se assente o vuoto viene segnalato un errore in console e
                          // la tabella non viene generata
  dataTypes,              // Object – tipi di dato personalizzati, uniti a quelli predefiniti
                          // (vedi sotto). Default: {}

  caption,                // string|Function – caption della tabella (testo o HTML), oppure
                          // funzione che restituisce stringa o Node. Mostrata sotto la tabella
                          // (vedi "Caption e paginazione"). Default: null
  search,                 // boolean – genera l'input di ricerca. Default: true
  searchDebounce,         // number – ms di attesa dopo l'ultimo tasto prima di eseguire la
                          // ricerca. Default: 300

  perPage,                // number – righe per pagina; 0 = nessuna paginazione (tutte le righe,
                          // nessuna navigazione). Default: 25
  paginationDelta,        // number – pulsanti pagina mostrati a ciascun lato della pagina
                          // corrente. Default: 2
  serverSide,             // boolean – paginazione, ordinamento e ricerca delegati al server
                          // (vedi "Modalità server-side"). Richiede `jsonUrl`. Default: false
  serverParams,           // Object – nomi dei parametri di query string in modalità server-side,
                          // uniti ai default (vedi sotto)
  initialSort,            // { key, dir }|null – ordinamento applicato al caricamento, es.
                          // { key: 'name', dir: 'asc' }. Default: null

  tfoot,                  // boolean – genera il tfoot (vedi `tfootRender` delle colonne).
                          // Non disponibile in modalità server-side. Default: false
  updateFooterOnPageChange, // boolean – se true `tfootRender` riceve solo i record della pagina
                          // corrente (subtotali di pagina) e il footer si aggiorna a ogni cambio
                          // pagina; se false riceve l'intero set filtrato e si aggiorna solo al
                          // cambio filtro. Default: false
  infoText,               // string|Function|null – contenuto dell'area info: stringa mustache-like
                          // con i segnaposto {start}, {end}, {totRec}, {filteredRec}, {page},
                          // {totPages}, oppure funzione
                          // (start, end, totRec, filteredRec, page, totPages) => string|Node.
                          // null = viene usato `labels.info`. Default: null
  template,               // Array – layout del contenitore principale (vedi "Template").
                          // Default: [{ slot: 'infoSection' }, { slot: 'table' }]

  locale,                 // string – locale per numeri, date e confronto stringhe
                          // nell'ordinamento. Default: 'it-IT'
  currency,               // string – codice ISO 4217 usato dal tipo `currency`. Default: 'EUR'
  datesLocaleOpts,        // Intl.DateTimeFormatOptions – parte data dei tipi date/datetime.
                          // Default: { year: 'numeric', month: 'short', day: 'numeric' }
  timesLocaleOpts,        // Intl.DateTimeFormatOptions – parte ora del tipo datetime.
                          // Default: { hour12: false, hour: '2-digit', minute: '2-digit' }
  numbersLocaleOpts,      // Intl.NumberFormatOptions – tipo num.
                          // Default: { maximumFractionDigits: 2 }
  currPercLocaleOpts,     // Intl.NumberFormatOptions – tipi currency/euro/perc/percDecimal.
                          // Default: { minimumFractionDigits: 2, maximumFractionDigits: 2 }

  renderNullAs,           // string|null – contenuto per i valori null/undefined. Default: '—'
  renderZeroAs,           // string|null – se non null, contenuto per i valori numerici pari a
                          // zero. Default: null
  renderNaNAs,            // string|null – contenuto per i valori non numerici nei tipi numerici.
                          // Default: '—'

  boolTrueIcon,           // icona per i valori true (tipo bool).
                          // Default: icona `check-bold` di minimo (Phosphor)
  boolFalseIcon,          // icona per i valori false. Default: icona `x-bold`
  sortAscArrowIcon,       // icona del pulsante di ordinamento, ordinamento asc attivo.
                          // Default: icona `arrow-up`
  sortDescArrowIcon,      // idem, ordinamento desc attivo. Default: icona `arrow-down`
  sortNoneArrowIcon,      // idem, nessun ordinamento. Default: icona `arrows-down-up`
  paginationPrevIcon,     // icona del pulsante "pagina precedente". Default: icona `caret-left`
  paginationNextIcon,     // icona del pulsante "pagina successiva". Default: icona `caret-right`
                          // Ogni icona può essere una stringa SVG/HTML (es. import `?inline`),
                          // un Node, un oggetto domBuilder o una funzione che restituisce uno
                          // di questi valori

  trCallback,             // (tr, row, params) => void – callback invocata dopo il rendering di
                          // ogni riga del body. Default: null
  tableId,                // string – id del tag <table>. Default: null

  classes,                // Object – classi consumer (vedi sotto), unite ai default
  labels                  // Object – testi (vedi sotto), uniti ai default
}
```

### `classes`

Nomi delle classi assegnate agli elementi generati. Le classi interne di layout (CSS module)
vengono **sempre** applicate in aggiunta a queste; ogni valore sostituisce interamente il
default della stessa chiave.

```javascript
classes: {
  wrapper: null,                    // contenitore principale (<section>: info + tabella)
  infoOuter: null,                  // contenitore esterno della sezione info
  info: null,                       // sezione info (testo + ricerca)
  resultInfo: null,                 // contenitore del testo info
  search: null,                     // wrapper dell'input di ricerca
  searchInput: 'form-control form-control-sm', // input di ricerca
  tableWrapper: 'table-responsive', // div che racchiude la tabella
  table: 'table table-bordered',    // tag <table>
  tableFooter: null,                // barra sotto la tabella (caption + paginazione)
  caption: null,                    // contenitore della caption
  pagination: null,                 // <nav> della paginazione
  paginationBtn: 'btn-reset',       // pulsanti della paginazione
  sortBtn: 'btn-reset',             // pulsanti di ordinamento nei <th>
  empty: null,                      // cella unica mostrata in assenza di righe
  textStart: null,                  // allineamento inline-start (le celle minimo lo sono già)
  textCenter: 'text-center',        // allineamento al centro
  textEnd: 'text-end',              // allineamento inline-end
  nowrap: 'text-nowrap',            // no-wrap
  numeric: 'text-numeric',          // cifre tabulari (tipi numerici)
  boolCell: null,                   // classe aggiuntiva per tutte le celle di tipo bool
  boolTrue: null,                   // classe aggiuntiva per le celle bool con valore true
  boolFalse: null                   // classe aggiuntiva per le celle bool con valore false
}
```

Le classi di allineamento (`textEnd`, `textCenter`, `nowrap`, `numeric`) sono quelle usate dai
tipi di dato predefiniti: modificandole si cambiano le classi di tutte le colonne di quel tipo.

### `labels`

```javascript
labels: {
  loading: 'Caricamento dati…',            // segnaposto di caricamento (visually hidden)
  searchPlaceholder: 'Cerca...',           // placeholder dell'input di ricerca
  searchTitle: 'Cerca nella tabella',      // attributo title dell'input
  searchAriaLabel: 'Filtra risultati',     // aria-label dell'input
  info: 'Stai visualizzando le righe da {start} a {end}, su un totale di {filteredRec} record trovati',
                                           // template del testo info (vedi `infoText`)
  noRows: 'Nessun record trovato',         // testo info e cella unica con set di dati vuoto
  noResults: 'Nessun risultato per la ricerca', // idem, con ricerca senza risultati
  sortAsc: 'Ordina questa colonna in senso ascendente (A → Z)',   // title/aria-label del
  sortDesc: 'Ordina questa colonna in senso discendente (Z → A)', // pulsante di ordinamento:
  sortNone: 'Rimuovi l’ordinamento a questa colonna',             // descrivono l'azione del
                                                                  // prossimo click
  paginationAriaLabel: 'Navigazione pagine', // aria-label del <nav>
  prevPage: 'Pagina precedente',           // title/aria-label del pulsante precedente
  nextPage: 'Pagina successiva',           // idem, successivo
  pageTitle: 'Vai a pagina {page}',        // idem, pulsanti pagina
  currentPage: 'Pagina {page}, corrente'   // idem, pagina corrente
}
```

I segnaposto di `labels.info` / `infoText`:

| Segnaposto | Valore |
|---|---|
| `{start}` | indice (da 1) del primo record della pagina corrente, nel set filtrato |
| `{end}` | indice dell'ultimo record della pagina corrente |
| `{totRec}` | totale dei record non filtrati (dal JSON, vedi `totRecField`, o lunghezza dei dati) |
| `{filteredRec}` | totale dei record dopo il filtro |
| `{page}` | pagina corrente |
| `{totPages}` | numero di pagine |

I numeri vengono formattati secondo `locale`.

## Colonne – `cols`

Parametro **obbligatorio**: array di oggetti, uno per colonna:

```javascript
cols: [
  {
    key,          // string – OBBLIGATORIO: chiave dell'oggetto riga (ammessa la notazione con
                  // punto per valori annidati, es. 'owner.name')
    title,        // contenuto del <th>: testo, HTML, Node, array domBuilder o funzione.
                  // Nelle colonne ordinabili è il testo del pulsante. Default: la chiave
    dataType,     // string – tipo di dato, una delle chiavi di `dataTypes`; `type` è un alias
                  // equivalente. Default: 'string'
    render,       // (row, tr, td) => contenuto | stringa mustache-like – vedi sotto. Default: null
    tfootRender,  // (rows, td) => contenuto | aggregato '@…' | stringa statica – contenuto della
                  // cella del tfoot (solo se `tfoot` è true). null = cella vuota. Default: null
    rowHeading,   // boolean – se true la cella è un'intestazione di riga (th[scope=row]).
                  // Default: false
    searchable,   // boolean – abilita la ricerca sulla colonna. Default: true
    sortable,     // boolean – abilita l'ordinamento sulla colonna. Default: true
    sortValue,    // valore | row => valore – valore usato per l'ordinamento; prevale su quello
                  // del tipo di dato. Default: non impostato (tipo di dato / valore grezzo)
    searchValue,  // idem, per la ricerca. Default: non impostato
    condition,    // boolean | params => boolean – se false la colonna non viene renderizzata.
                  // Default: true
    headerClass,  // string – classi del <th>, in sostituzione di quelle del tipo di dato
    cellClass     // string – classi delle celle body/tfoot, in sostituzione di quelle del tipo.
                  // Se solo una tra `headerClass` e `cellClass` è presente, l'altra assume lo
                  // stesso valore. Default: null (classi del tipo di dato)
  },
  ...
]
```

### `render`

Funzione con argomenti posizionali, tutti facoltativi:

```javascript
render: (row, tr, td) => contenuto
```

- `row` – l'oggetto dati della riga
- `tr` – l'elemento `<tr>` della riga
- `td` – l'elemento della cella (`<td>` o `<th scope="row">`)

Il valore restituito è il contenuto della cella: testo, stringa HTML, numero, Node o array
domBuilder. Casi particolari:

- `undefined` (nessun `return`): la cella viene renderizzata dal tipo di dato, come se `render`
  non fosse definito. Utile per decorare soltanto `td`/`tr` (classi, attributi, `title`):

  ```javascript
  render: (row, tr, td) => { if (row.amount < 0) td.classList.add('text-danger'); }
  ```

- `null`: viene mostrato `renderNullAs`

Da attributo HTML (o da script, per i casi semplici) `render` può essere una stringa
mustache-like: ogni segnaposto `[[key]]` viene sostituito con il valore corrispondente della
riga (chiavi annidate ammesse; i valori null diventano `renderNullAs`):

```javascript
render: '<a href="/users/[[id]]">[[owner.name]]</a>'
```

Le stringhe HTML vengono inserite tramite la Sanitizer API (`Element.setHTML`, dove supportata):
script, attributi handler di eventi e URL `javascript:` vengono rimossi, mentre `class`, `id`,
`style` e `data-*` sono conservati.

### `tfootRender`

Con `tfoot: true` ogni colonna produce una cella nel footer, il cui contenuto è dato da
`tfootRender`:

- funzione `(rows, td) => contenuto`, dove `rows` è l'intero set filtrato (oppure i soli record
  della pagina corrente se `updateFooterOnPageChange` è true)
- uno degli aggregati predefiniti (vedi sotto)
- qualsiasi altra stringa: contenuto statico (es. l'etichetta `'Totale'`)
- `null`: cella vuota

Aggregati predefiniti, calcolati sui valori **numerici** della colonna (i valori non numerici
vengono ignorati) e, tranne `@count`, formattati dal tipo di dato della colonna (es. come valuta
per `euro`, con `%` per `perc`):

| Aggregato | Valore |
|---|---|
| `'@sum'` | somma |
| `'@avg'` | media aritmetica |
| `'@min'` | minimo |
| `'@max'` | massimo |
| `'@count'` | numero di valori numerici (formattato con `locale`, senza il tipo di dato) |

Un aggregato non riconosciuto viene segnalato in console e produce una cella vuota. Le celle del
footer ricevono le stesse classi (`cellClass`) delle celle del body.

Il `tfoot` non è disponibile in modalità server-side (il componente riceve solo la pagina
corrente, gli aggregati sarebbero parziali): se richiesto viene ignorato con un avviso in console.

## Tipi di dato – `dataTypes`

Ogni colonna ha un tipo di dato (`dataType`, default `string`) che ne definisce classi, rendering
e valori di ordinamento/ricerca. Tipi predefiniti:

| Tipo | Descrizione | Classi delle celle |
|---|---|---|
| `string` | valore così com'è | – |
| `num` | numero formattato con `numbersLocaleOpts` | `textEnd numeric nowrap` |
| `id` | id numerico: valore grezzo, allineato a destra, non ricercabile | `textEnd numeric` |
| `perc` | percentuale in scala 0–100, `currPercLocaleOpts` + `%` | `textEnd numeric nowrap` |
| `percDecimal` | percentuale in scala 0–1 (moltiplicata per 100) | `textEnd numeric nowrap` |
| `currency` | formato valuta `Intl` con `currency` | `textEnd numeric nowrap` |
| `euro` | come `currency`, EUR forzato | `textEnd numeric nowrap` |
| `date` | elemento `<time>`, `datesLocaleOpts`; accetta stringhe ISO, timestamp, `Date` e oggetti data Symfony | `textEnd nowrap` |
| `datetime` | come `date`, con la parte ora (`timesLocaleOpts`): `<time><span class="[nowrap]">data</span> <small>ora</small></time>` | `textEnd nowrap` |
| `bool` | icone `boolTrueIcon`/`boolFalseIcon` (accetta anche `1`/`0`, `'true'`/`'false'`); `null` → `renderNullAs`; non ordinabile né ricercabile | stili interni delle icone |
| `email` | andate a capo facoltative attorno alla `@` | – |

I tipi numerici applicano `renderNaNAs` ai valori non numerici e `renderZeroAs` (se impostato)
agli zeri. Per tutti i tipi i valori `null`/`undefined` vengono resi come `renderNullAs`.

### Tipi personalizzati

Il parametro `dataTypes` è unito ai tipi predefiniti: una chiave già esistente sovrascrive solo
le proprietà indicate, una chiave nuova può estendere un tipo esistente con `inheritsFrom`.

```javascript
dataTypes: {
  // modifica solo le classi del tipo predefinito `num`
  num: { cellClass: 'text-end fw-bold' },

  // nuovo tipo basato su `num` (stesse classi, ordinamento, ricerca e gestione NaN/zero)
  km: {
    inheritsFrom: 'num',
    render: (value, row, params) => `${value.toLocaleString(params.locale)} km`
  }
}
```

Proprietà di un tipo di dato (tutte facoltative):

```javascript
{
  headerClass,        // string – classi di default del <th>
  cellClass,          // string – classi di default delle celle
  internalCellClass,  // (value, row, params) => string – classi aggiunte sempre alle celle,
                      // indipendentemente da `cellClass` (usato dal tipo `bool` per le icone)
  render,             // (value, row, params) => contenuto – non invocato per i valori null
  sortValue,          // (value, row, params) => valore per l'ordinamento
  searchValue,        // (value, row, params) => stringa per la ricerca
  colDefaults,        // Object – default forzati per le colonne di questo tipo
                      // (es. { sortable: false }), comunque sovrascrivibili nella colonna
  inheritsFrom        // string – solo tipi nuovi: tipo predefinito da estendere
}
```

A differenza del `render` di colonna (`(row, tr, td)`), il `render` del tipo di dato riceve per
primo il **valore** della cella, perché il tipo è generico rispetto al campo.

## Ordinamento

Ogni colonna con `sortable: true` (default; i tipi `bool` lo disattivano) ha un pulsante nel
`<th>` che cicla tra nessun ordinamento → ascendente → discendente → nessuno; l'attributo
`aria-sort` del `<th>` e l'icona riflettono lo stato, `title`/`aria-label` del pulsante
descrivono l'azione del click successivo (`labels.sortAsc/sortDesc/sortNone`). È attivo un solo
ordinamento per volta; il cambio di ordinamento riporta alla prima pagina.

Lato client il confronto usa i valori precalcolati per ogni riga (`sortValue` di colonna, poi del
tipo di dato, poi il valore grezzo): i valori vuoti (`null`, `''`, `NaN`) vanno sempre in coda,
i numeri sono confrontati numericamente, il resto con `localeCompare` (`locale`, collazione
numerica, insensibile a maiuscole e accenti). L'ordinamento è stabile.

`initialSort: { key, dir }` applica un ordinamento al caricamento; `setSort(key, dir)` lo cambia
via script.

## Ricerca

L'input di ricerca (`search: true`) filtra le righe dopo `searchDebounce` ms dall'ultimo tasto:
ogni parola del termine (separatore: spazi) deve essere contenuta nel testo di ricerca della riga,
composto dai valori delle colonne `searchable` (`searchValue` di colonna, poi del tipo di dato,
poi il valore grezzo), senza distinzione tra maiuscole e minuscole. La ricerca riporta alla prima
pagina; `setSearch(term)` la imposta via script.

## Paginazione

Con `perPage` > 0 (default 25) le righe vengono suddivise in pagine e sotto la tabella compare la
navigazione: pulsanti precedente/successivo (icone `paginationPrevIcon`/`paginationNextIcon`),
la prima e l'ultima pagina e `paginationDelta` pagine per lato della corrente, con puntini di
sospensione per le pagine omesse. La navigazione è nascosta quando c'è una sola pagina.
`perPage: 0` disattiva la paginazione (tutte le righe in un'unica pagina).

`goToPage(page)` cambia pagina via script; `state.page`/`state.totPages` riportano lo stato.

### Caption e paginazione

La caption è mostrata **sotto la tabella**, nella barra `tableFooter`, allineata a sinistra; a
destra, nella stessa barra, la navigazione delle pagine. La caption non è un elemento
`<caption>` (che dovrebbe stare dentro la tabella e non potrebbe ospitare la navigazione senza
farla leggere come nome della tabella) ma un contenitore con id, collegato alla tabella tramite
`aria-labelledby`: il nome accessibile della tabella è quindi lo stesso di una `<caption>`.
Posizioni diverse si ottengono con gli slot `caption` e `pagination` del [template](#template).

## Modalità server-side

Con `serverSide: true` il componente non elabora i dati in locale: a ogni cambio pagina,
ordinamento o ricerca invia una nuova richiesta GET a `jsonUrl`, aggiungendo alla query string i
parametri definiti in `serverParams` (quelli già presenti in `jsonUrl` vengono conservati):

```javascript
serverParams: {
  page: 'page',        // pagina richiesta (da 1)
  start: 'start',      // indice (da 0) del primo record richiesto = (page - 1) * perPage,
                       // comodo per `LIMIT start, perPage`
  perPage: 'perPage',  // record per pagina
  sort: 'sort',        // chiave della colonna ordinata (omesso senza ordinamento)
  dir: 'dir',          // 'asc' | 'desc' (omesso senza ordinamento)
  search: 'search'     // termine di ricerca (omesso se vuoto)
}
```

Un valore `null` omette il parametro (es. `serverParams: { start: null }` per inviare solo `page`).
Richiesta di esempio, seconda pagina ordinata per nome con ricerca attiva:

```
GET /api/rows.json?page=2&start=25&perPage=25&sort=name&dir=desc&search=mar
```

Il JSON di risposta deve contenere le **sole righe della pagina richiesta** in `jsonDataField`,
il totale dei record in `totRecField` e il numero di record che soddisfano la ricerca in
`filteredRecField` (se assente vale il totale):

```json
{ "data": [ ...25 righe... ], "totRec": 1500, "filteredRec": 40 }
```

Durante la richiesta il contenitore principale ha `aria-busy="true"` (la tabella viene resa
semitrasparente); le risposte superate da una richiesta più recente vengono ignorate. Se la
pagina richiesta non esiste più (il set di dati si è ridotto), viene richiesta l'ultima
disponibile. In questa modalità `data`, `filtered` e `pageRows` dello stato contengono solo la
pagina corrente e il `tfoot` non è disponibile. `serverSide` richiede `jsonUrl`: con `data` inline
viene ignorato con un avviso in console.

## Template

`template` definisce il contenuto del contenitore principale come array domBuilder, in cui gli
elementi `{ slot: 'nome' }` vengono sostituiti dalle parti predefinite:

| Slot | Contenuto |
|---|---|
| `infoSection` | sezione info completa (testo info + input di ricerca, in riga) |
| `resultInfo` | solo il testo info |
| `search` | solo l'input di ricerca (se `search` è true) |
| `table` | wrapper + tabella (thead, tbody, tfoot) e barra `tableFooter` con caption e paginazione |
| `caption` | solo la caption (se `caption` è impostata) |
| `pagination` | solo la navigazione delle pagine (se `perPage` > 0) |

`caption` e `pagination` fanno parte della barra sotto la tabella dello slot `table`; se il
template li colloca esplicitamente altrove, vengono rimossi dalla barra (che sparisce se resta
vuota).

Il default `[{ slot: 'infoSection' }, { slot: 'table' }]` corrisponde alla struttura descritta
in [Struttura generata](#struttura-generata). Esempio con ricerca e paginazione sopra la tabella
e info sotto:

```javascript
template: [
  { className: 'flex gap-2 mbe-sm', children: [{ slot: 'search' }, { slot: 'pagination' }] },
  { slot: 'table' },   // barra sotto la tabella con la sola caption
  { slot: 'resultInfo' }
]
```

Da `init()` è accettata anche una funzione `(parts, params) => array`, dove `parts` contiene le
parti predefinite (oggetti domBuilder) con le stesse chiavi degli slot. Gli slot non
riconosciuti vengono segnalati in console e ignorati.

## Struttura generata

```html
<json-table>
  <section class="[wrapper] [classes.wrapper]">
    <div class="[infoOuter] [classes.infoOuter]">
      <div class="[info] [classes.info]">
        <div class="[resultInfo] [classes.resultInfo]" aria-live="polite">Stai visualizzando le righe da 1 a 25, ...</div>
        <div class="[search] [classes.search]">           <!-- solo se search: true -->
          <input type="search" class="form-control form-control-sm" ...>
        </div>
      </div>
    </div>
    <div class="[tableOuter]">
      <div class="[tableWrapper] table-responsive">        <!-- classes.tableWrapper -->
        <table class="[table] table table-bordered" aria-labelledby="jt-1-caption">  <!-- classes.table; aria-labelledby solo se caption -->
          <thead>
            <tr>
              <th scope="col" data-key="name" data-sortable="true" class="[sortable] ..." aria-sort="ascending">
                <button type="button" class="[sortBtn] btn-reset" title="Ordina ..." aria-label="Nome: Ordina ...">
                  <span class="[sortTitle]">Nome</span>
                  <span class="[sortIcon]" aria-hidden="true"><svg ...></svg></span>
                </button>
              </th>
              <th scope="col" data-key="active" class="text-center">Attivo</th>   <!-- non ordinabile -->
            </tr>
          </thead>
          <tbody>
            <tr data-jt-idx="0">
              <th scope="row" data-key="id" class="text-end text-numeric">1</th>  <!-- rowHeading -->
              <td data-key="name">Mario</td>
              <td data-key="active" class="[boolCell] [boolTrue]"><svg ...></svg></td>
            </tr>
            <!-- oppure, senza righe: -->
            <tr><td colspan="3" class="[empty] [classes.empty]">Nessun record trovato</td></tr>
          </tbody>
          <tfoot>                                          <!-- solo se tfoot: true -->
            <tr><td data-key="id"></td><td data-key="name">Totale</td>...</tr>
          </tfoot>
        </table>
      </div>
      <div class="[tableFooter] [classes.tableFooter]">    <!-- solo se caption o perPage > 0 -->
        <div class="[caption] [classes.caption]" id="jt-1-caption">Utenti</div>   <!-- solo se caption -->
        <nav class="[pagination] [classes.pagination]" aria-label="Navigazione pagine">  <!-- solo se perPage > 0; hidden con una sola pagina -->
          <ul class="[paginationList]">
            <li class="[paginationItem]"><button type="button" class="[paginationBtn] btn-reset [paginationArrow]" data-page="prev" aria-label="Pagina precedente" disabled><svg ...></svg></button></li>
            <li class="[paginationItem]"><button type="button" class="[paginationBtn] btn-reset" data-page="1" aria-current="page" aria-label="Pagina 1, corrente">1</button></li>
            <li class="[paginationItem]"><button type="button" class="[paginationBtn] btn-reset" data-page="2" aria-label="Vai a pagina 2">2</button></li>
            <li class="[paginationItem]"><span class="[paginationEllipsis]" aria-hidden="true">…</span></li>
            <li class="[paginationItem]"><button type="button" class="[paginationBtn] btn-reset" data-page="10" aria-label="Vai a pagina 10">10</button></li>
            <li class="[paginationItem]"><button type="button" class="[paginationBtn] btn-reset [paginationArrow]" data-page="next" aria-label="Pagina successiva"><svg ...></svg></button></li>
          </ul>
        </nav>
      </div>
    </div>
  </section>
</json-table>
```

Le classi tra parentesi quadre sono quelle interne del CSS module. Nei `<th>` ordinabili
l'attributo `aria-sort` (`ascending`/`descending`) è presente solo sulla colonna ordinata;
`title` e `aria-label` del pulsante descrivono l'azione del click successivo.

## Custom properties CSS

Definite in `json-table.minimo.tokens.mjs` (namespace `--jt-*`):

| Proprietà | Default (token minimo) |
|---|---|
| `--jt-wrapper-margin-block` | `{size.md}` |
| `--jt-busy-opacity` | `.5` |
| `--jt-info-gap` | `{size.sm}` |
| `--jt-info-font-size` | `{font.size.sm}` |
| `--jt-info-color` | `{text.muted}` |
| `--jt-info-outer-padding-block-end` | `{size.xs}` |
| `--jt-search-max-width` | `20rem` |
| `--jt-thead-hover-background-color` | `color-mix(in srgb, {table.thead.background.color} 90%, {accent})` |
| `--jt-sort-btn-padding-block` | `{table.cell.padding.block}` |
| `--jt-sort-btn-padding-inline` | `{table.cell.padding.inline}` |
| `--jt-sort-btn-line-height` | `{table.cell.line-height}` |
| `--jt-sort-icon-size` | `1em` |
| `--jt-sort-icon-gap` | `.4em` |
| `--jt-sort-icon-none-opacity` | `.4` |
| `--jt-table-footer-padding-block-start` | `{size.xs}` |
| `--jt-caption-font-size` | `{font.size.sm}` |
| `--jt-caption-color` | `{text.muted}` |
| `--jt-pagination-border-width` | `1px` |
| `--jt-pagination-border-color` | `{table.border.color}` |
| `--jt-pagination-radius` | `{radius.xxs}` |
| `--jt-pagination-font-size` | `{font.size.sm}` |
| `--jt-pagination-line-height` | `{table.cell.line-height}` |
| `--jt-pagination-btn-min-width` | `2.2em` |
| `--jt-pagination-btn-padding-block` | `{table.cell.padding.block}` |
| `--jt-pagination-btn-padding-inline` | `{table.cell.padding.inline}` |
| `--jt-pagination-icon-size` | `1em` |
| `--jt-pagination-current-background-color` | `{table.thead.background.color}` |
| `--jt-pagination-current-font-weight` | `{font.weight.semibold}` |
| `--jt-pagination-hover-background-color` | `{table.body.tr.hover-bg-color}` |
| `--jt-pagination-disabled-opacity` | `.5` |
| `--jt-bool-icon-size` | `1.1em` |
| `--jt-bool-true-color` | `{status.success.color}` |
| `--jt-bool-false-color` | `{status.danger.color}` |
| `--jt-empty-color` | `{text.muted}` |
| `--jt-empty-padding-block` | `{size.sm}` |
