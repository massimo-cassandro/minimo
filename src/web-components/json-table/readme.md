# `<json-table>` – datatable da JSON

**json-table** costruisce una tabella HTML da un array di dati JSON (inline o caricato via
fetch), a partire da una definizione delle colonne (`cols`) e da un insieme di tipi di dato
predefiniti ed estendibili. È un web component light DOM senza dipendenze esterne: può quindi
essere stilizzato direttamente dal CSS del progetto in cui è utilizzato.

> **Work in progress (step 2).** Sono implementati: struttura esterna e `template` di layout,
> `cols`, tipi di dato, rendering delle righe, `tfoot`, testo info. I pulsanti di ordinamento
> vengono generati ma non sono attivi: ordinamento, ricerca e paginazione arriveranno negli step
> successivi (vedi [In sviluppo](#in-sviluppo)).

## Installazione

È sufficiente importare il file del componente (registra il custom element):

```javascript
import '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';

// oppure, se necessario eseguire metodi della classe (es. `setDefaults`):
import { JsonTable } from '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';
```

Il CSS (`json-table-component.module.css`) è importato dal componente stesso; le custom
properties `--jt-*` sono definite in `json-table.minimo.tokens.mjs` e compilate in
`custom-properties.css` da `build-tokens`. Le icone di default (booleani e ordinamento) sono
SVG di minimo importati con il suffisso `?inline` (gestito dalla configurazione webpack dello
starter-kit).

## Utilizzo da markup

```html
<!-- tramite url json -->
<json-table
  jsonurl="/api/rows.json"
  caption="Utenti"
  cols='[
    { "key": "id", "dataType": "id" },
    { "key": "name", "title": "Nome", "render": "<a href=\"/users/[[id]]\">[[name]]</a>" },
    { "key": "amount", "title": "Importo", "dataType": "euro", "tfootRender": "@sum" },
    { "key": "active", "title": "Attivo", "dataType": "bool" }
  ]'
  tfoot="true"
></json-table>

<!-- tramite dati inline (JSON serializzato), senza `cols`: una colonna per ogni chiave del primo record -->
<json-table
  data='[{"name":"Mario","city":"Roma"}, ...]'
  search="false"
></json-table>
```

I nomi degli attributi sono case-insensitive (`jsonurl` e `jsonUrl` sono equivalenti).
Gli attributi booleani accettano i formati HTML idiomatici: `search` (presente senza valore),
`search="true"`, `search="1"` → true; `search="false"`, `search="0"` → false.
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
  data: [{ name: 'Mario', city: 'Roma' }, ...]
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

I parametri oggetto `classes`, `labels` e `dataTypes` vengono **uniti** ai default (merge a un
livello), quindi ogni sorgente deve indicare solo le chiavi da sovrascrivere:

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
| `reload(overrides)` | Ricarica i dati e ricostruisce la struttura, con eventuali parametri sovrascritti (`Promise`) |
| `destroy()` | Svuota il componente; `init()` può essere richiamato in seguito |

Proprietà disponibili dopo il caricamento:

| Proprietà | Descrizione |
|---|---|
| `params` | parametri risolti |
| `data` | righe grezze (array di oggetti) |
| `cols` | colonne dopo il parsing (solo quelle visibili, con classi e tipo di dato risolti) |
| `dataTypes` | mappa dei tipi di dato (predefiniti + personalizzati) |
| `state` | stato del rendering: `totRec`, `rows`, `filtered`, `pageRows`, `searchTerm` |
| `elements` | elementi generati: `wrapper`, `infoOuter`, `info`, `resultInfo`, `searchInput`, `tableWrapper`, `table`, `thead`, `tbody`, `tfoot` |

```javascript
await el.reload({ jsonUrl: '/api/rows.json?anno=2025' });
await el.reload({ data: [...] });
```

## Evento `jt:ready`

Emesso sull'elemento (con `bubbles`) al termine della costruzione; `event.detail.jsonTable`
è l'istanza. Viene emesso nel microtask successivo, quindi un listener registrato subito dopo
`init()` lo intercetta comunque.

```javascript
el.addEventListener('jt:ready', e => {
  console.log(e.detail.jsonTable.data);
});
el.init({ jsonUrl: '/api/rows.json' });
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
  totRecField,            // string – chiave del JSON con il totale dei record (numerico), per
                          // sorgenti paginate; se assente o non numerico il totale è la
                          // lunghezza dell'array. Default: 'totRec'
  data,                   // Array<Object> – righe inline; prevale su `jsonUrl`. Da attributo va
                          // passato come stringa JSON ed è sempre inteso come array delle righe
                          // (`jsonDataField` ignorato). Default: null

  cols,                   // ColDefinition[] – definizione delle colonne (vedi sotto). Se vuoto
                          // viene generata una colonna `string` per ogni chiave del primo record.
                          // Default: []
  dataTypes,              // Object – tipi di dato personalizzati, uniti a quelli predefiniti
                          // (vedi sotto). Default: {}

  caption,                // string|Function – caption della tabella (testo o HTML), oppure
                          // funzione che restituisce stringa o Node. Default: null
  search,                 // boolean – genera l'input di ricerca. Default: true
  tfoot,                  // boolean – genera il tfoot (vedi `tfootRender` delle colonne).
                          // Default: false
  updateFooterOnPageChange, // boolean – se true `tfootRender` riceve solo i record della pagina
                          // corrente (subtotali di pagina) e il footer si aggiorna a ogni cambio
                          // pagina; se false riceve l'intero set filtrato e si aggiorna solo al
                          // cambio filtro. Default: false
  infoText,               // string|Function|null – contenuto dell'area info: stringa mustache-like
                          // con i segnaposto {start}, {end}, {totRec}, {filteredRec}, oppure
                          // funzione (start, end, totRec, filteredRec) => string|Node.
                          // null = viene usato `labels.info`. Default: null
  template,               // Array – layout del contenitore principale (vedi "Template").
                          // Default: [{ slot: 'infoSection' }, { slot: 'table' }]

  locale,                 // string – locale per numeri e date. Default: 'it-IT'
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

  boolTrueIcon,           // icona per i valori true (tipo bool). Default: check-bold di minimo
  boolFalseIcon,          // icona per i valori false. Default: x-bold di minimo
  sortAscArrowIcon,       // icona del pulsante di ordinamento, ordinamento asc attivo.
                          // Default: arrow-up di minimo
  sortDescArrowIcon,      // idem, ordinamento desc attivo. Default: arrow-down di minimo
  sortNoneArrowIcon,      // idem, nessun ordinamento. Default: arrows-down-up di minimo
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
  sortNone: 'Rimuovi l’ordinamento a questa colonna'              // descrivono l'azione del
                                                                  // prossimo click
}
```

I segnaposto di `labels.info` / `infoText`:

| Segnaposto | Valore |
|---|---|
| `{start}` | indice (da 1) del primo record visualizzato |
| `{end}` | indice dell'ultimo record visualizzato |
| `{totRec}` | totale dei record non filtrati (dal JSON, vedi `totRecField`, o lunghezza dei dati) |
| `{filteredRec}` | totale dei record dopo il filtro |

I numeri vengono formattati secondo `locale`.

## Colonne – `cols`

Array di oggetti, uno per colonna:

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
    tfootRender,  // (rows, td) => contenuto | '@sum' | '@avg' | '@min' | '@max' | '@count' |
                  // stringa statica – contenuto della cella del tfoot (solo se `tfoot` è true).
                  // null = cella vuota. Default: null
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

Se `cols` è vuoto viene generata una colonna di tipo `string` per ogni chiave del primo record
(titolo = chiave).

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

### `tfootRender`

Con `tfoot: true` ogni colonna produce una cella nel footer, il cui contenuto è dato da
`tfootRender`:

- funzione `(rows, td) => contenuto`, dove `rows` è l'intero set filtrato (oppure i soli record
  della pagina corrente se `updateFooterOnPageChange` è true)
- aggregato predefinito `'@sum'`, `'@avg'`, `'@min'`, `'@max'`, calcolato sui valori numerici
  della colonna e formattato dal tipo di dato della colonna (es. come valuta per `euro`), oppure
  `'@count'` (numero di valori numerici)
- qualsiasi altra stringa: contenuto statico (es. l'etichetta `'Totale'`)
- `null`: cella vuota

Le celle del footer ricevono le stesse classi (`cellClass`) delle celle del body.

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
| `datetime` | come `date`, con la parte ora (`timesLocaleOpts`) | `textEnd nowrap` |
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

## Template

`template` definisce il contenuto del contenitore principale come array domBuilder, in cui gli
elementi `{ slot: 'nome' }` vengono sostituiti dalle parti predefinite:

| Slot | Contenuto |
|---|---|
| `infoSection` | sezione info completa (testo info + input di ricerca, in riga) |
| `resultInfo` | solo il testo info |
| `search` | solo l'input di ricerca (se `search` è true) |
| `table` | wrapper + tabella (caption, thead, tbody, tfoot) |

Il default `[{ slot: 'infoSection' }, { slot: 'table' }]` corrisponde alla struttura descritta
in [Struttura generata](#struttura-generata). Esempio con ricerca e info sotto la tabella:

```javascript
template: [
  { slot: 'table' },
  { className: 'flex gap-2 mbs-sm', children: [{ slot: 'search' }, { slot: 'resultInfo' }] }
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
    <div class="[tableWrapper] table-responsive">          <!-- classes.tableWrapper -->
      <table class="[table] table table-bordered">         <!-- classes.table -->
        <caption>...</caption>                             <!-- solo se caption -->
        <thead>
          <tr>
            <th scope="col" data-key="name" data-sortable="true" class="[sortable] ...">
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
        <tfoot>                                            <!-- solo se tfoot: true -->
          <tr><td data-key="id"></td><td data-key="name">Totale</td>...</tr>
        </tfoot>
      </table>
    </div>
  </section>
</json-table>
```

Le classi tra parentesi quadre sono quelle interne del CSS module. Nei `<th>` ordinabili
l'attributo `aria-sort` (`ascending`/`descending`) verrà impostato quando un ordinamento è
attivo; `title` e `aria-label` del pulsante descrivono l'azione del click successivo.

## Custom properties CSS

Definite in `json-table.minimo.tokens.mjs` (namespace `--jt-*`):

| Proprietà | Default (token minimo) |
|---|---|
| `--jt-wrapper-margin-block` | `{size.md}` |
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
| `--jt-bool-icon-size` | `1.1em` |
| `--jt-bool-true-color` | `{status.success.color}` |
| `--jt-bool-false-color` | `{status.danger.color}` |
| `--jt-empty-color` | `{text.muted}` |
| `--jt-empty-padding-block` | `{size.sm}` |

## In sviluppo

- ordinamento (listener sui pulsanti già generati, `setSortState()` in `src/table-thead.js`),
  ricerca (listener sull'input, `state.rows[].searchText` già calcolato), paginazione statica e
  acquisizione JSON paginata (`jsonMaxLength`/`jsonPaginationParams`), `refs`
- il parametro `parse` delle vecchie versioni non è stato riportato: è un duplicato di `render`
- `hidden`/`show: false` (campo usato solo per la ricerca, non mostrato): da valutare
- fuso orario degli oggetti data Symfony (`timezone`) non gestito
