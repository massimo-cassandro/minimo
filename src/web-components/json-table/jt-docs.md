# `<json-table>` – datatable da JSON

* [Parametri (include `classes` e `labels`)](jt-docs/parametri.md)
* [Parametri colonne](jt-docs/parametri-colonne.md)

---

**json-table** costruisce una tabella HTML da un array di dati JSON (inline o caricato via fetch), a partire da una definizione delle colonne (`cols`) e da un insieme di tipi di dato predefiniti ed estendibili, con ordinamento, ricerca e paginazione (lato client oppure, con `serverSide: true`, delegati al server). È un web component light DOM senza dipendenze esterne: può quindi essere stilizzato direttamente dal CSS del progetto in cui è utilizzato.

## Installazione

È sufficiente importare il file del componente (registra il custom element):

```javascriptcacheGroup `shared` (solo con `useSharedChunk: true`): escludere `unsplash-page` e `blurhash` dal chunk condiviso, in modo che js e css restino nella entry che li importa. In `webpack.config.mjs`, nella funzione `shared_chunk_paths`, prima del `return` aggiungere:
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
// solo registrazione del tag
import '@massimo-cassandro/minimo/json-table';

// oppure, se necessario eseguire metodi della classe (es. `setDefaults`):
import { JsonTable } from '@massimo-cassandro/minimo/json-table';
```

Il CSS (`json-table-component.module.css`) è importato dal componente stesso; le custom
properties `--jt-*` sono definite in `json-table.minimo.tokens.mjs` e compilate in
`custom-properties.css` da `build-tokens`. Le icone di default (booleani, ordinamento e
paginazione) sono SVG di minimo importati con il suffisso `?inline` (gestito dalla configurazione
webpack dello starter-kit).

### Tipi per gli script consumer

Il file `types/global.d.ts` di minimo dichiara il tipo globale `JsonTable` e registra il tag `json-table` in `HTMLElementTagNameMap`: aggiungendolo all'`include` del proprio `jsconfig.json`/`tsconfig.json` (`"node_modules/@massimo-cassandro/minimo/types/global.d.ts"`) si ottiene il completamento dei metodi senza cast né import di tipo:

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
  serverSide="true"
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

### Modalità jQuery DataTables

Con `jqDatatableMode: true` (o l'attributo `jqdatatablemode="true"`) i default dei parametri server-side diventano quelli del formato di jQuery DataTables, utile per riutilizzare endpoint già esistenti:

| Parametro | Default con `jqDatatableMode` |
|---|---|
| `jsonDataField` | `'data'` |
| `totRecField` | `'recordsTotal'` |
| `filteredRecField` | `'recordsFiltered'` |
| `serverSide` | `true` |
| `serverParams` | `{ page: null, start: 'start', perPage: 'length', sort: 'order[0][column]', dir: 'order[0][dir]', search: 'search[value]' }` |

Precedenza: `init()` > attributo HTML > `JsonTable.setDefaults()` > modalità jQuery DataTables > default predefiniti. Ogni parametro può quindi essere sovrascritto singolarmente, e `serverParams` viene unito chiave per chiave.

Oltre ai `serverParams`, in questa modalità vengono inviati anche `draw=1` e, per ogni colonna visualizzata, `columns[i][name]` (la `key`), `columns[i][searchable]` e `columns[i][orderable]`. `order[0][column]` riceve l'**indice** della colonna ordinata (tra quelle visualizzate), non la chiave. È previsto un solo criterio di ordinamento (`order[0]`).

```html
<json-table jsonurl="/api/rows" jqdatatablemode="true" cols='[{"key":"id"},{"key":"name"}]'></json-table>
```

```
GET /api/rows?draw=1&columns[0][name]=id&columns[0][searchable]=true&columns[0][orderable]=true&columns[1][name]=name&…&start=25&length=25&order[0][column]=1&order[0][dir]=desc&search[value]=mar
```

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
