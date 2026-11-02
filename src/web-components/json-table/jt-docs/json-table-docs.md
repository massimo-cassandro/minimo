# `<json-table>` – datatable da JSON

* [Parametri (include `classes` e `labels`)](./files/parametri.md)
* [Parametri colonne](./files/parametri-colonne.md)
* [DataTypes](./files/dataTypes.md)
* [Server Side](files/server-side.md)
* [Ricerca e ordinamento](files/ricerca-ordinamento.md)
* [Tabelle con `rowspan`](files/rowspan.md)


---

**json-table** costruisce una tabella HTML da un array di dati JSON (inline o caricato via fetch), a partire da una definizione delle colonne (`cols`) e da un insieme di tipi di dato predefiniti ed estendibili, con ordinamento, ricerca e paginazione (lato client oppure, con `serverSide: true`, delegati al server). È un web component light DOM senza dipendenze esterne: può quindi essere stilizzato direttamente dal CSS del progetto in cui è utilizzato.

## Installazione

È sufficiente importare il file del componente (registra il custom element):

```javascript
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
const jtable = document.querySelector('json-table'); // → JsonTable
jtable.init({ ... });

/** @type {JsonTable} */
const other = document.createElement('json-table');
```

## Utilizzo da markup

```html
<json-table
  jsonurl="/api/rows.json"
  caption="Utenti"
  initialSort='[{ "key": "name", "dir": "asc" }]'
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

```twig
{%- set linkScheda = path('xxx') -%}
<p class="inner-nav-main"><a href="{{ linkScheda }}">Nuovo xxx</a></p>
<json-table jsonUrl="{{ path('yyy') }}" data-link-scheda="{{ linkScheda }}"></json-table>
<p class="inner-nav"></p>
```

```javascript
const jtable = document.querySelector('json-table');
// oppure: const jtable = document.createElement('json-table');

jtable.init({
  // jsonUrl: '/api/rows.json', // non necessario se impostato come attributo
  perPage: 50,
  serverSide: true, // se necessaria la paginazione 
  caption: 'Utenti',
  initialSort: [{ key: 'name', dir: 'asc' }], // default: null
  cols: [
    { key: 'id', dataType: 'id' },
    { key: 'name', title: 'Nome', render: row => `<a href="${linkScheda}/${row.id}">${row.name}</a>` },
    { key: 'amount', title: 'Importo', dataType: 'euro', tfootRender: '@sum' },
    { key: 'active', title: 'Attivo', dataType: 'bool' }
  ],
  tfoot: true
});

// dati inline al posto di jsonUrl (se presenti entrambi, `data` prevale)
jtable.init({
  data: [{ name: 'Mario', city: 'Roma' }, ...],
  cols: [...]
});

// se appena creato, appendere dopo init():
document.body.appendChild(jtable);
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
jtable.init({ jsonUrl: '/api/rows.json' }); // jsonUrl da script, caption, search e cols da attributo
```

**Ordine di precedenza:** `init()` > attributo HTML > `JsonTable.setDefaults()` > default interno.

Per ignorare esplicitamente un attributo e utilizzare il valore di default, utilizzare `null` nel config:

```javascript
jtable.init({ jsonUrl: '/api/rows.json', search: null }); // search == default (true)
```

I parametri oggetto `classes`, `labels`, `dataTypes` e `serverParams` vengono **uniti** ai default
(merge a un livello), quindi ogni sorgente deve indicare solo le chiavi da sovrascrivere:

```javascript
jtable.init({ classes: { table: 'table' } }); // le altre classi restano quelle di default
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
| `destroy()` | Svuota il componente; `init()` può essere richiamato in seguito |
| `goToPage(page)` | Mostra la pagina indicata (limitata all'intervallo disponibile) |
| `init(config)` | Avvia il componente (prima o dopo l'inserimento nel DOM) |
| `reload(overrides)` | Ricarica i dati e ricostruisce la struttura, con eventuali parametri sovrascritti (`Promise`); ricerca, ordinamento e pagina vengono azzerati |
| `setSearch(term)` | Filtra le righe con il termine indicato (stringa vuota = nessun filtro) e torna alla prima pagina; l'input di ricerca viene aggiornato |
| `setSort(key, dir)` | Ordina per la colonna `key` (`'asc'`, `'desc'`, oppure `null` per rimuovere l'ordinamento) e torna alla prima pagina |

In modalità server-side `goToPage`, `setSort` e `setSearch` generano una nuova richiesta.

Proprietà disponibili dopo il caricamento:

| Proprietà | Descrizione |
|---|---|
| `cols` | colonne dopo il parsing (solo quelle visibili, con classi e tipo di dato risolti) |
| `data` | righe grezze (array di oggetti; in modalità server-side solo quelle della pagina corrente) |
| `dataTypes` | mappa dei tipi di dato (predefiniti + personalizzati) |
| `elements` | elementi generati: `wrapper`, `infoOuter`, `info`, `resultInfo`, `searchInput`, `tableWrapper`, `table`, `thead`, `tbody`, `tfoot`, `tableFooter`, `caption`, `pagination` |
| `params` | parametri risolti |
| `state` | stato del rendering: `totRec`, `filteredRec`, `rows`, `filtered`, `pageRows`, `searchTerm`, `sort` (`{ key, dir }` o `null`), `page`, `totPages` |

```javascript
await jtable.reload({ jsonUrl: '/api/rows.json?anno=2025' });
await jtable.reload({ data: [...] });
jtable.setSort('name', 'desc');
jtable.goToPage(3);
```

## Eventi

Entrambi vengono emessi sull'elemento con `bubbles: true`; `event.detail.jsonTable` è l'istanza.

| Evento | Quando | `event.detail` |
|---|---|---|
| `jt:ready` | al termine della costruzione e del primo rendering (nel microtask successivo, quindi un listener registrato subito dopo `init()` lo intercetta comunque) | `{ jsonTable }` |
| `jt:update` | dopo ogni cambio pagina, ordinamento o ricerca (anche via API) | `{ jsonTable, reason }` con `reason` = `'page'`, `'sort'` o `'search'` |

```javascript
jtable.addEventListener('jt:ready', e => console.log(e.detail.jsonTable.data));
jtable.addEventListener('jt:update', e => console.log(e.detail.reason, e.detail.jsonTable.state.page));
jtable.init({ jsonUrl: '/api/rows.json', cols: [...] });
```





## Ordinamento

Ogni colonna con `sortable: true` (default) ha un pulsante nel
`<th>` che cicla tra nessun ordinamento → ascendente → discendente → nessuno; l'attributo
`aria-sort` del `<th>` e l'icona riflettono lo stato, `title`/`aria-label` del pulsante
descrivono l'azione del click successivo (`labels.sortAsc/sortDesc/sortNone`). Il click ordina
per la sola colonna cliccata, sostituendo gli eventuali criteri multipli di `initialSort`; il cambio
di ordinamento riporta alla prima pagina.

Lato client il confronto usa i valori precalcolati per ogni riga (`sortValue` di colonna, poi del
tipo di dato, poi il valore grezzo): i valori vuoti (`null`, `''`, `NaN`) vanno sempre in coda,
i numeri sono confrontati numericamente, il resto con `localeCompare` (`locale`, collazione
numerica, insensibile a maiuscole e accenti). L'ordinamento è stabile.

`initialSort` applica al caricamento uno o più criteri, in ordine di priorità: il secondo decide
solo tra le righe uguali per il primo, e così via.

```javascript
initialSort: [{ key: 'city', dir: 'asc' }, { key: 'name', dir: 'desc' }]
```

```html
<json-table initialSort='[{ "key": "city", "dir": "asc" }, { "key": "name", "dir": "desc" }]' …></json-table>
```

Ogni colonna deve esistere, essere ordinabile e comparire una sola volta: i criteri non validi
vengono ignorati con un errore in console. `aria-sort` e l'icona compaiono solo sulla colonna del
primo criterio. `setSort(key, dir)` imposta via script l'ordinamento per una sola colonna.

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

## 
## Template

`template` definisce il contenuto del contenitore principale come array domBuilder, in cui gli
elementi `{ slot: 'nome' }` vengono sostituiti dalle parti predefinite:

| Slot | Contenuto |
|---|---|
| `caption` | solo la caption (se `caption` è impostata) |
| `infoSection` | sezione info completa (testo info + input di ricerca, in riga) |
| `pagination` | solo la navigazione delle pagine (se `perPage` > 0) |
| `resultInfo` | solo il testo info |
| `search` | solo l'input di ricerca (se `search` è true) |
| `table` | wrapper + tabella (thead, tbody, tfoot) e barra `tableFooter` con caption e paginazione |

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
| `--jt-bool-false-color` | `{status.danger.color}` |
| `--jt-bool-icon-size` | `1.1em` |
| `--jt-bool-true-color` | `{status.success.color}` |
| `--jt-busy-opacity` | `.5` |
| `--jt-caption-color` | `{text.muted}` |
| `--jt-caption-font-size` | `{font.size.sm}` |
| `--jt-empty-color` | `{text.muted}` |
| `--jt-empty-padding-block` | `{size.sm}` |
| `--jt-info-color` | `{text.muted}` |
| `--jt-info-font-size` | `{font.size.sm}` |
| `--jt-info-gap` | `{size.sm}` |
| `--jt-info-outer-padding-block-end` | `{size.xs}` |
| `--jt-pagination-border-color` | `{table.border.color}` |
| `--jt-pagination-border-width` | `1px` |
| `--jt-pagination-btn-min-width` | `2.2em` |
| `--jt-pagination-btn-padding-block` | `{table.cell.padding.block}` |
| `--jt-pagination-btn-padding-inline` | `{table.cell.padding.inline}` |
| `--jt-pagination-current-background-color` | `{table.thead.background.color}` |
| `--jt-pagination-current-font-weight` | `{font.weight.semibold}` |
| `--jt-pagination-disabled-opacity` | `.5` |
| `--jt-pagination-font-size` | `{font.size.sm}` |
| `--jt-pagination-hover-background-color` | `{table.tbody.tr.hover-bg-color}` |
| `--jt-pagination-icon-size` | `1em` |
| `--jt-pagination-line-height` | `{table.cell.line-height}` |
| `--jt-pagination-radius` | `{radius.xxs}` |
| `--jt-search-max-width` | `20rem` |
| `--jt-sort-btn-line-height` | `{table.cell.line-height}` |
| `--jt-sort-btn-padding-block` | `{table.cell.padding.block}` |
| `--jt-sort-btn-padding-inline` | `{table.cell.padding.inline}` |
| `--jt-sort-icon-gap` | `.4em` |
| `--jt-sort-icon-none-opacity` | `.4` |
| `--jt-sort-icon-size` | `1em` |
| `--jt-table-footer-padding-block-start` | `{size.xs}` |
| `--jt-thead-hover-background-color` | `color-mix(in srgb, {table.thead.background.color} 90%, {accent})` |
| `--jt-wrapper-margin-block` | `{size.md}` |
