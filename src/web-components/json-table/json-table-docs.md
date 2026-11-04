# <a id="indice"></a>`<json-table>` – datatable da JSON

* [Installazione](#installazione)
  * [Tipi per gli script consumer](#installazione-tipi)
* [Utilizzo da markup](#utilizzo-markup)
* [Utilizzo da script](#utilizzo-script)
  * [Con `domBuilder`](#utilizzo-dombuilder)
* [Utilizzo misto – attributi HTML + script](#utilizzo-misto)
* [Parametri del componente](#parametri)
  * [`classes`](#parametri-classes)
  * [`labels`](#parametri-labels)
* [Parametri colonne](#colonne)
  * [Ricerca e ordinamento](#colonne-ricerca)
  * [`parse`](#colonne-parse)
  * [`render`](#colonne-render)
  * [`rowspan`](#colonne-rowspan)
  * [`tfootRender`](#colonne-tfootrender)
* [DataTypes](#datatypes)
  * [Tipi personalizzati](#datatypes-tipi)
* [Input ricerca rapida](#ricerca-rapida)
* [Form di filtro collegato (`filterForm`)](#filterform)
  * [Utilizzo](#filterform-utilizzo)
  * [Cosa viene inviato](#filterform-invio)
  * [Comportamento](#filterform-comportamento)
  * [`refresh()`](#filterform-refresh)
  * [Modalità client-side](#filterform-client)
  * [Lato server](#filterform-server)
* [Ordinamento](#ordinamento)
* [Ricerca e ordinamento](#ricerca-ordinamento)
  * [Client-side](#ricerca-client)
  * [Server-side](#ricerca-server)
* [Tabelle con `rowspan`](#tabelle-rowspan)
  * [`subIdx`](#rowspan-subidx)
  * [Accorgimenti comuni](#rowspan-accorgimenti)
  * [Client-side](#rowspan-client)
  * [Server-side](#rowspan-server)
* [Default di progetto – `JsonTable.setDefaults()`](#set-defaults)
* [Server Side](#modalita-server-side)
  * [Ordinamento e ricerca](#server-side-ordinamento)
  * [Modalità jQuery DataTables](#server-side-datatables)
* [API dell'istanza](#api)
* [Backend Symfony per la modalità server-side](#backend-symfony)
  * [Il contratto in breve](#backend-contratto)
  * [Struttura dell'azione](#backend-struttura)
  * [Linee guida](#backend-linee)
  * [Helper riutilizzabile](#backend-helper)
  * [Checklist](#backend-checklist)
* [Eventi](#eventi)
* [Paginazione](#paginazione-tabella)
  * [Caption e paginazione](#paginazione-caption)
* [Template](#template)
* [Struttura generata](#struttura)
* [Custom properties CSS](#custom-properties)

---

**json-table** costruisce una tabella HTML da un array di dati JSON (inline o caricato via fetch), a partire da una definizione delle colonne (`cols`) e da un insieme di tipi di dato predefiniti ed estendibili, con ordinamento, ricerca e paginazione (lato client oppure, con `serverSide: true`, delegati al server). È un web component light DOM senza dipendenze esterne: può quindi essere stilizzato direttamente dal CSS del progetto in cui è utilizzato.

## <a id="installazione"></a>Installazione

[⬆︎ Torna all'indice](#indice)

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

### <a id="installazione-tipi"></a>Tipi per gli script consumer

Il file `types/global.d.ts` di minimo dichiara il tipo globale `JsonTable` e registra il tag `json-table` in `HTMLElementTagNameMap`: aggiungendolo all'`include` del proprio `jsconfig.json`/`tsconfig.json` (`"node_modules/@massimo-cassandro/minimo/types/global.d.ts"`) si ottiene il completamento dei metodi senza cast né import di tipo:

```javascript
const jtable = document.querySelector('json-table'); // → JsonTable
jtable.init({ ... });

/** @type {JsonTable} */
const other = document.createElement('json-table');
```

---

## <a id="utilizzo-markup"></a>Utilizzo da markup

[⬆︎ Torna all'indice](#indice)

```html
<json-table
  jsonurl="/api/rows.json"
  caption="Utenti"
  initialSort='{ "name": "asc" }'
  filterForm='jt-filter'
  tfoot="true"
  serverSide="true"
  cols='[
    { "key": "id", "dataType": "id" },
    { "key": "name", "title": "Nome", "render": "<a href=\"/users/[[id]]\">[[name]]</a>" },
    { "key": "amount", "title": "Importo", "dataType": "euro", "tfootRender": "@sum" },
    { "key": "active", "title": "Attivo", "dataType": "bool" }
  ]'
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
sintassi mustache-like `[[key]]` (vedi [`render`](#colonne-render)), per il footer gli aggregati
predefiniti (`"@sum"`, ...).

## <a id="utilizzo-script"></a>Utilizzo da script

[⬆︎ Torna all'indice](#indice)

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
  initialSort: { name: 'asc' }, // default: null
  filterForm: 'jt-filter', // oppure document.getElementById('jt-filter') (HTMLFormElement)
  tfoot: true
  cols: [
    { key: 'id', dataType: 'id' },
    { key: 'name', title: 'Nome', render: row => `<a href="${linkScheda}/${row.id}">${row.name}</a>` },
    { key: 'amount', title: 'Importo', dataType: 'euro', tfootRender: '@sum' },
    { key: 'active', title: 'Attivo', dataType: 'bool' }
  ],
});

// dati inline al posto di jsonUrl (se presenti entrambi, `data` prevale)
jtable.init({
  data: [{ name: 'Mario', city: 'Roma' }, ...],
  cols: [...]
});

// se appena creato, appendere dopo init():
document.body.appendChild(jtable);
```

### <a id="utilizzo-dombuilder"></a>Con `domBuilder`

```javascript
domBuilder([
  {
    tag: 'json-table',
    attrs: { caption: 'Utenti' },
    callback: el => el.init({ jsonUrl: '/api/rows.json', cols: [...] })
  }
], container);
```

## <a id="utilizzo-misto"></a>Utilizzo misto – attributi HTML + script

[⬆︎ Torna all'indice](#indice)

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

## <a id="parametri"></a>Parametri del componente

[⬆︎ Torna all'indice](#indice)

Tutti i parametri sono impostabili sia da attributo HTML che come oggetto in `init({...})`. I valori di tipo funzione solo da `init()`.

| Parametro | Tipo / default | Descrizione |
|---|---|---|
| `boolFalseIcon` | icona, vedi nota (icona `x-bold`) | Icona per i valori `false` |
| `boolTrueIcon` | icona, vedi nota (icona `check-bold` di minimo (Phosphor)) | Icona per i valori `true` (tipo bool) |
| `caption` | string o Function (`null`) | Caption della tabella (testo o HTML), oppure funzione che restituisce stringa o Node. Mostrata sotto la tabella (vedi "Caption e paginazione") |
| `classes` | Object | Classi consumer (vedi sotto), unite ai default |
| `cols` | ColDefinition[] | **OBBLIGATORIO**: definizione delle colonne (vedi sotto). Se assente o vuoto la tabella non viene generata e viene segnalato un errore in console. Senza `init()` l'errore compare al termine del caricamento della pagina, così `cols` può essere passato anche da uno script separato; un `init()` chiamato dopo il caricamento della pagina (ad es. dopo un `await`) funziona, ma l'errore può comparire comunque |
| `currency` | string (`'EUR'`) | Codice ISO 4217 usato dal tipo `currency` |
| `currPercLocaleOpts` | Intl.NumberFormatOptions (`{ minimumFractionDigits: 2, maximumFractionDigits: 2 }`) | Tipi currency/euro/perc/percDecimal |
| `data` | Array&lt;Object&gt; (`null`) | Righe inline; prevale su `jsonUrl`. Da attributo va passato come stringa JSON ed è sempre inteso come array delle righe (`jsonDataField` ignorato) |
| `dataTypes` | Object (`{}`) | Tipi di dato personalizzati, uniti a quelli predefiniti (vedi [dataTypes](#datatypes)) |
| `datesLocaleOpts` | Intl.DateTimeFormatOptions (`{ year: 'numeric', month: 'short', day: 'numeric' }`) | Parte data dei tipi date/datetime |
| `debug` | boolean (`false`) | Log in console di parametri, colonne, dati, stato ed elementi generati |
| `filterForm` | string o HTMLFormElement (`null`) | Id del form di filtro collegato (da `init()` anche l'elemento): i suoi valori vengono aggiunti alla query string di `jsonUrl` e al submit/reset la tabella viene aggiornata. Richiede `jsonUrl`. Vedi [Form di filtro collegato](#filterform) |
| `filteredRecField` | string (`'filteredRec'`) | Solo server-side: chiave del JSON con il numero di record che soddisfano la ricerca corrente; se assente vale `totRecField` |
| `infoText` | string, Function o null (`null`) | Contenuto dell'area info: stringa mustache-like con i segnaposto `{start}`, `{end}`, `{totRec}`, `{filteredRec}`, `{page}`, `{totPages}`, oppure funzione `(start, end, totRec, filteredRec, page, totPages) => string\|Node`. `null` = viene usato `labels.info` |
| `initialSort` | oggetto { chiave: 'asc'\|'desc' } o null (`null`) | Ordinamento applicato al caricamento: uno o più criteri in ordine di priorità, es. `{ city: 'asc', name: 'desc' }` |
| `jqDatatableMode` | boolean (`false`) | Se `true` imposta come default i valori compatibili con il formato server-side di jQuery DataTables: `jsonDataField: 'data'`, `totRecField: 'recordsTotal'`, `filteredRecField: 'recordsFiltered'`, `serverSide: true` e i `serverParams` indicati in "Modalità jQuery DataTables". Ogni valore resta sovrascrivibile |
| `jsonDataField` | string o null (`'data'`) | Chiave del JSON che contiene l'array delle righe (es. `'data'` per `{ data: [...] }`); `null` o `''` = la root del JSON è l'array stesso |
| `jsonUrl` | string (`null`) | URL del JSON da caricare. Ignorato se `data` è presente |
| `labels` | Object | Testi (vedi sotto), uniti ai default |
| `locale` | string (`'it-IT'`) | Locale per numeri, date e confronto stringhe nell'ordinamento |
| `numbersLocaleOpts` | Intl.NumberFormatOptions (`{ maximumFractionDigits: 2 }`) | Tipo `num` |
| `paginationDelta` | number (`2`) | Pulsanti pagina mostrati a ciascun lato della pagina corrente |
| `paginationNextIcon` | icona, vedi nota (icona `caret-right`) | Icona del pulsante "pagina successiva" |
| `paginationPrevIcon` | icona, vedi nota (icona `caret-left`) | Icona del pulsante "pagina precedente" |
| `perPage` | number (`25`) | Righe per pagina; `0` = nessuna paginazione (tutte le righe, nessuna navigazione) |
| `renderNaNAs` | string o null (`'—'`) | Contenuto per i valori non numerici nei tipi numerici |
| `renderNullAs` | string o null (`'—'`) | Contenuto per i valori null/undefined |
| `renderZeroAs` | string o null (`null`) | Se non null, contenuto per i valori numerici pari a zero |
| `search` | boolean (`true`) | Genera l'input di ricerca |
| `searchDebounce` | number (`300`) | Millisecondi di attesa dopo l'ultimo tasto prima di eseguire la ricerca |
| `searchFields` | string[] o null (`null`) | Solo server-side: campi su cui cercare oltre a quelli delle colonne ricercabili, anche nella forma `tabella.campo`. Vedi [Ricerca e ordinamento](#searchfields) |
| `serverParams` | Object | Nomi dei parametri di query string in modalità server-side, uniti ai default (vedi sotto) |
| `serverSide` | boolean (`false`) | Paginazione, ordinamento e ricerca delegati al server (vedi "Modalità server-side"). Richiede `jsonUrl` |
| `sortAscArrowIcon` | icona, vedi nota (icona `arrow-up`) | Icona del pulsante di ordinamento, ordinamento asc attivo |
| `sortDescArrowIcon` | icona, vedi nota (icona `arrow-down`) | Icona del pulsante di ordinamento, ordinamento desc attivo |
| `sortNoneArrowIcon` | icona, vedi nota (icona `arrows-down-up`) | Icona del pulsante di ordinamento, nessun ordinamento |
| `tableId` | string (`null`) | Id del tag `<table>` |
| `template` | Array (`[{ slot: 'infoSection' }, { slot: 'table' }]`) | Layout del contenitore principale (vedi "Template") |
| `tfoot` | boolean (`false`) | Genera il tfoot (vedi `tfootRender` delle colonne). Non disponibile in modalità server-side |
| `timesLocaleOpts` | Intl.DateTimeFormatOptions (`{ hour12: false, hour: '2-digit', minute: '2-digit' }`) | Parte ora del tipo datetime |
| `totRecField` | string (`'totRec'`) | Chiave del JSON con il totale dei record (numerico); se assente o non numerico il totale è la lunghezza dell'array |
| `trCallback` | (tr, row, params, subIdx) => void (`null`) | Callback invocata dopo il rendering di ogni `<tr>` del body. `subIdx` è l'indice del `<tr>` all'interno del record (sempre 0 se nessuna colonna usa [`rowspan`](#colonne-rowspan)) |
| `updateFooterOnPageChange` | boolean (`false`) | Se `true` `tfootRender` riceve solo i record della pagina corrente (subtotali di pagina) e il footer si aggiorna a ogni cambio pagina; se `false` riceve l'intero set filtrato e si aggiorna solo al cambio filtro |

**Nota sulle icone**: ogni icona può essere una stringa SVG/HTML (es. import `?inline`), un Node, un oggetto domBuilder o una funzione che restituisce uno di questi valori.

### <a id="parametri-classes"></a>`classes`

Nomi delle classi assegnate agli elementi generati. Le classi interne di layout (CSS module) vengono **sempre** applicate in aggiunta a queste; gli eventuali valori inseriti sostituiscono quelli di default.

```javascript
{
  classes: {...}
}
```

| Parametro | Default | Descrizione |
|---|---|---|
| `boolCell` | `null` | classe aggiuntiva per tutte le celle di tipo bool |
| `boolFalse` | `null` | classe aggiuntiva per le celle bool con valore false |
| `boolTrue` | `null` | classe aggiuntiva per le celle bool con valore true |
| `caption` | `null` | contenitore della caption |
| `empty` | `null` | cella unica mostrata in assenza di righe |
| `info` | `null` | sezione info (testo + ricerca) |
| `infoOuter` | `null` | contenitore esterno della sezione info |
| `nowrap` | `'text-nowrap'` | no-wrap |
| `numeric` | `'text-numeric'` | cifre tabulari (tipi numerici) |
| `pagination` | `null` | `<nav>` della paginazione |
| `paginationBtn` | `'btn-reset'` | pulsanti della paginazione |
| `resultInfo` | `null` | contenitore del testo info |
| `search` | `null` | wrapper dell'input di ricerca |
| `searchInput` | `'form-control form-control-sm'` | input di ricerca |
| `sortBtn` | `'btn-reset'` | pulsanti di ordinamento nei `<th>` |
| `table` | `'table table-bordered'` | tag `<table>` |
| `tableFooter` | `null` | barra sotto la tabella (caption + paginazione) |
| `tableWrapper` | `'table-responsive'` | div che racchiude la tabella |
| `textCenter` | `'text-center'` | allineamento al centro |
| `textEnd` | `'text-end'` | allineamento inline-end |
| `textStart` | `null` | allineamento inline-start (con css `table` di *minimo* il default è `start`) |
| `wrapper` | `null` | contenitore principale (`<section>`: info + tabella) |

Le classi di allineamento (`textEnd`, `textCenter`, `nowrap`, `numeric`) sono quelle usate dai
tipi di dato predefiniti: modificandole si cambiano le classi di tutte le colonne di quel tipo.

### <a id="parametri-labels"></a>`labels`

```javascript
{
  labels: {...}
}
```

| Parametro | Default | Descrizione |
|---|---|---|
| `currentPage` | `'Pagina {page}, corrente'` | `title`/`aria-label` del pulsante della pagina corrente |
| `info` | `'Stai visualizzando le righe da {start} a {end}, su un totale di {filteredRec} record trovati'` | template del testo info (vedi `infoText`) |
| `loading` | `'Caricamento dati…'` | segnaposto di caricamento (visually hidden) |
| `nextPage` | `'Pagina successiva'` | `title`/`aria-label` del pulsante successivo |
| `noResults` | `'Nessun risultato per la ricerca'` | testo info e cella unica con ricerca senza risultati |
| `noRows` | `'Nessun record trovato'` | testo info e cella unica con set di dati vuoto |
| `pageTitle` | `'Vai a pagina {page}'` | `title`/`aria-label` dei pulsanti pagina |
| `paginationAriaLabel` | `'Navigazione pagine'` | `aria-label` del `<nav>` |
| `prevPage` | `'Pagina precedente'` | `title`/`aria-label` del pulsante precedente |
| `searchAriaLabel` | `'Filtra risultati'` | `aria-label` dell'input di ricerca |
| `searchPlaceholder` | `'Cerca...'` | placeholder dell'input di ricerca |
| `searchTitle` | `'Cerca nella tabella'` | attributo `title` dell'input di ricerca |
| `sortAsc` | `'Ordina questa colonna in senso ascendente (A → Z)'` | `title`/`aria-label` del pulsante di ordinamento: descrive l'azione del prossimo click |
| `sortDesc` | `'Ordina questa colonna in senso discendente (Z → A)'` | `title`/`aria-label` del pulsante di ordinamento: descrive l'azione del prossimo click |
| `sortNone` | `'Rimuovi l’ordinamento a questa colonna'` | `title`/`aria-label` del pulsante di ordinamento: descrive l'azione del prossimo click |

#### Segnaposto di `labels.info` / `infoText`:

| Segnaposto | Valore |
|---|---|
| `{end}` | indice dell'ultimo record della pagina corrente |
| `{filteredRec}` | totale dei record dopo il filtro |
| `{page}` | pagina corrente |
| `{start}` | indice (da 1) del primo record della pagina corrente, nel set filtrato |
| `{totPages}` | numero di pagine |
| `{totRec}` | totale dei record non filtrati (dal JSON, vedi `totRecField`, o lunghezza dei dati) |

I numeri vengono formattati secondo `locale`.

## <a id="colonne"></a>Parametri colonne

[⬆︎ Torna all'indice](#indice)

Parametro **obbligatorio**: array di oggetti, uno per colonna:

```javascript
cols: [
  {/* ...col1... */},
  {/* ...col...  */},
]
```

| Key | Tipo | Default | Descrizione |
|---|---|---|---|
| `cellClass` | string | `null` (classi del tipo di dato) | Classi delle celle body/tfoot, in sostituzione di quelle del tipo. Se solo una tra `headerClass` e `cellClass` è presente, l'altra assume lo stesso valore |
| `condition` | boolean o `params => boolean` | `true` | Se `false` la colonna non viene renderizzata |
| `dataType` | string | `'string'` | Tipo di dato, una delle chiavi di `dataTypes`; `type` è un alias equivalente. Vedi [dataTypes](#datatypes) |
| `headerClass` | string | `null` (classi del tipo di dato) | Classi del `<th>`, in sostituzione di quelle del tipo di dato |
| `key` | string | – | **OBBLIGATORIO**: chiave dell'oggetto riga (ammessa la notazione con punto per valori annidati, es. `'owner.name'`) |
| `parse` | `(row, subIdx) => valore` | `null` | Preelabora il valore della cella prima del tipo di dato, vedi sotto |
| `render` | `(row, tr, td, subIdx) => contenuto` o stringa mustache-like | `null` | Vedi sotto |
| `rowHeading` | boolean | `false` | Se `true` la cella è un'intestazione di riga (`th[scope=row]`) |
| `rowspan` | number o `row => number` | `null` | Numero di `<tr>` occupati dal record, vedi sotto |
| `searchable` | boolean | `true` | Abilita la ricerca sulla colonna |
| `searchKeys` | array di stringhe | `null` | Solo server-side: campi di ricerca della colonna, al posto di `key`. In genere è preferibile il parametro [`searchFields`](#searchfields) della tabella |
| `searchValue` | valore o `row => valore` | non impostato (tipo di dato / valore grezzo) | Valore usato per la ricerca; prevale su quello del tipo di dato |
| `sortable` | boolean | `true` | Abilita l'ordinamento sulla colonna |
| `sortKeys` | array di stringhe | `null` | Solo server-side: chiavi inviate in `sort` al posto di `key`, vedi [Ricerca e ordinamento](#sortkeys) |
| `sortValue` | valore o `row => valore` | non impostato (tipo di dato / valore grezzo) | Valore usato per l'ordinamento; prevale su quello del tipo di dato |
| `tfootRender` | `(rows, td) => contenuto`, aggregato `'@…'` o stringa statica | `null` | Contenuto della cella del tfoot (solo se `tfoot` è `true`). `null` = cella vuota |
| `title` | testo, HTML, Node, array domBuilder o funzione | la chiave | Contenuto del `<th>`. Nelle colonne ordinabili è il testo del pulsante |

### <a id="colonne-ricerca"></a>Ricerca e ordinamento

`sortValue` e `searchValue` agiscono solo in modalità client-side, `sortKeys` e `searchKeys` solo in modalità server-side: nella modalità sbagliata vengono ignorati con un avviso in console. Vedi [Ricerca e ordinamento](#ricerca-ordinamento).

### <a id="colonne-parse"></a>`parse`

Preelabora il valore della cella, che viene poi formattato dal tipo di dato della colonna: evita di scrivere un `render` che duplicherebbe la formattazione standard. Riceve l'oggetto dati della riga e `subIdx`, l'indice del `<tr>` all'interno del record (sempre 0 se nessuna colonna usa [`rowspan`](#colonne-rowspan)), e restituisce un valore invece del contenuto della cella.

```javascript
// data di scadenza calcolata, formattata dal tipo `date`
{
  key: 'dueDate',
  dataType: 'date',
  parse: row => {
    const date = new Date(row.issueDate);
    date.setDate(date.getDate() + row.paymentDays);
    return date.toISOString();
  }
}
```

- `key` può indicare un campo non presente nei dati: resta l'identificatore della colonna
- `undefined` (nessun `return`) lascia il valore grezzo, mentre `null` viene trattato come un valore nullo (`nullContent` del tipo di dato o `renderNullAs`)
- il valore restituito viene usato anche per ordinamento, ricerca, classi interne del tipo di dato e aggregati del `tfoot`. `sortValue` e `searchValue` della colonna, se definiti, continuano ad avere la precedenza
- la funzione può essere invocata più volte per la stessa cella e non deve quindi avere effetti collaterali; per decorare la cella va usato [`render`](#colonne-render)
- `row` non viene modificato: un `render` che restituisce un contenuto prevale su `parse` e riceve i dati originali, così come le stringhe mustache-like
- con [`rowspan`](#colonne-rowspan), nelle colonne senza `rowspan` il valore grezzo non viene passato alla funzione: l'elemento corrispondente si ottiene con `subIdx`, ad es. `(row, subIdx) => row.prices[subIdx] * 2`. Ricerca e aggregati invocano la funzione per ogni elemento solo se il campo `key` contiene un array
- in modalità server-side agisce solo sulla visualizzazione: ordinamento e ricerca restano a carico del server, che non conosce il valore calcolato. Con `debug` attivo, una colonna ordinabile con `parse` e senza `sortKeys` genera un avviso in console: vedi [Valori calcolati o condizionali](#valori-calcolati-o-condizionali)
- non è utilizzabile da attributo HTML, che non può contenere funzioni: un valore diverso da una funzione genera un errore

### <a id="colonne-render"></a>`render`

Funzione con argomenti posizionali, tutti facoltativi:

```javascript
render: (row, tr, td, subIdx) => contenuto
```

- `row` – l'oggetto dati della riga
- `tr` – l'elemento `<tr>` della riga
- `td` – l'elemento della cella (`<td>` o `<th scope="row">`)
- `subIdx` – l'indice del `<tr>` all'interno del record (sempre 0 se nessuna colonna usa [`rowspan`](#colonne-rowspan))

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

### <a id="colonne-rowspan"></a>`rowspan`

Permette di distribuire un record su più `<tr>`: le colonne con `rowspan` generano una sola cella con l'attributo `rowspan`, nel primo `<tr>` del record, mentre le altre generano una cella per ogni `<tr>`.

```javascript
data: [{ key1: 'aaa', key2: 'bbb', key3: ['riga1', 'riga2', 'riga3'] }],
cols: [
  { key: 'key1', rowspan: row => row.key3.length },
  { key: 'key2', rowspan: row => row.key3.length },
  { key: 'key3' }
]
```

```html
<tr data-jt-idx="0"><td rowspan="3" data-key="key1">aaa</td><td rowspan="3" data-key="key2">bbb</td><td data-key="key3">riga1</td></tr>
<tr data-jt-idx="0"><td data-key="key3">riga2</td></tr>
<tr data-jt-idx="0"><td data-key="key3">riga3</td></tr>
```

Per gli accorgimenti su `subIdx`, ordinamento e ricerca, lato client e server, vedi [Tabelle con `rowspan`](#tabelle-rowspan).

Regole:

- almeno una delle colonne visibili deve essere priva di `rowspan`, altrimenti viene lanciato un errore
- il numero di `<tr>` è il valore più alto restituito dalle colonne del record: tutte le celle con `rowspan` assumono questo valore. I valori non numerici o minori di 1 contano come 1
- nelle colonne senza `rowspan`, un valore array fornisce un elemento per ogni `<tr>` (gli elementi mancanti vengono resi come i valori `null`), mentre un valore non array viene ripetuto su ogni `<tr>`
- nelle colonne senza `rowspan` non sono ammesse le stringhe mustache-like per `render`: viene lanciato un errore, perché non possono selezionare l'elemento corrispondente al `<tr>`. Restano ammesse nelle colonne con `rowspan`, che hanno una sola cella
- con gli array di oggetti le chiavi annidate (`items.name`) non selezionano l'elemento: va usata una funzione `render`, dove `subIdx` indica l'elemento del `<tr>` corrente, ad es. `(row, tr, td, subIdx) => row.items[subIdx].name`
- la configurazione da attributo è sconsigliata: non può contenere funzioni, quindi `rowspan` può essere solo un numero fisso, uguale per tutti i record
- ordinamento, paginazione e conteggi operano sui record, non sui `<tr>`. Le colonne con valore array vengono ordinate in base al primo elemento, mentre la ricerca e gli aggregati del `tfoot` li considerano tutti

### <a id="colonne-tfootrender"></a>`tfootRender`

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
| `'@avg'` | media aritmetica |
| `'@count'` | numero di valori numerici (formattato con `locale`, senza il tipo di dato) |
| `'@max'` | massimo |
| `'@min'` | minimo |
| `'@sum'` | somma |

Un aggregato non riconosciuto viene segnalato in console e produce una cella vuota. Le celle del
footer ricevono le stesse classi (`cellClass`) delle celle del body.

Il `tfoot` non è disponibile in modalità server-side (il componente riceve solo la pagina
corrente, gli aggregati sarebbero parziali): se richiesto viene ignorato con un avviso in console.

## <a id="datatypes"></a>DataTypes

[⬆︎ Torna all'indice](#indice)

```javascript
cols: [
  {
    //...
    dataType: ...  
  },
  {
    //...
    type: ... // alias di dataType
  },
  // ...
]
```

Ogni colonna ha un tipo di dato (`dataType`, default `string`) che ne definisce classi, rendering
e valori di ordinamento/ricerca. Tipi predefiniti:

| Tipo | Descrizione | Classi di default  delle celle |
|---|---|---|
| `bool` | icone `boolTrueIcon`/`boolFalseIcon` (accetta anche `1`/`0`, `'true'`/`'false'`); `null` → `renderNullAs`; ordinabile, non ricercabile | stili interni delle icone |
| `boolTrueOnly` | come `bool`, ma mostra solo `boolTrueIcon`: le celle con valore `false` o `null` restano vuote | stili interni delle icone |
| `currency` | formato valuta `Intl` con `currency` | `textEnd numeric nowrap` |
| `date` | elemento `<time>`, `datesLocaleOpts`; accetta stringhe ISO, timestamp, `Date` e oggetti data Symfony | `textEnd nowrap` |
| `datetime` | come `date`, con la parte ora (`timesLocaleOpts`): `<time><span class="[nowrap]">data</span> <small>ora</small></time>` | `textEnd nowrap` |
| `email` | andate a capo facoltative attorno alla `@` | – |
| `euro` | come `currency`, EUR forzato | `textEnd numeric nowrap` |
| `id` | id numerico: valore grezzo, allineato a destra, non ricercabile | `textEnd numeric` |
| `num` | numero formattato con `numbersLocaleOpts` | `textEnd numeric nowrap` |
| `perc` | percentuale in scala 0–100, `currPercLocaleOpts` + `%` | `textEnd numeric nowrap` |
| `percDecimal` | percentuale in scala 0–1 (moltiplicata per 100) | `textEnd numeric nowrap` |
| `string` | valore così com'è | – |

I tipi numerici applicano `renderNaNAs` ai valori non numerici e `renderZeroAs` (se impostato)
agli zeri. I valori `null`/`undefined` vengono resi come `renderNullAs`, salvo i tipi che definiscono
`nullContent` (tra i predefiniti, `boolTrueOnly`).

### <a id="datatypes-tipi"></a>Tipi personalizzati

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
  nullContent,        // string – contenuto delle celle con valore null, al posto di `renderNullAs`
                      // (usato dal tipo `boolTrueOnly` per lasciarle vuote)
  sortValue,          // (value, row, params) => valore per l'ordinamento
  searchValue,        // (value, row, params) => stringa per la ricerca
  colDefaults,        // Object – default forzati per le colonne di questo tipo
                      // (es. { sortable: false }), comunque sovrascrivibili nella colonna
  inheritsFrom        // string – solo tipi nuovi: tipo predefinito da estendere
}
```

A differenza del `render` di colonna (`(row, tr, td)`), il `render` del tipo di dato riceve per
primo il **valore** della cella, perché il tipo è generico rispetto al campo.

## <a id="ricerca-rapida"></a>Input ricerca rapida

[⬆︎ Torna all'indice](#indice)

L'input di ricerca (`search: true`) filtra le righe dopo `searchDebounce` ms dall'ultimo tasto:
ogni parola del termine (separatore: spazi) deve essere contenuta nel testo di ricerca della riga,
composto dai valori delle colonne `searchable` (`searchValue` di colonna, poi del tipo di dato,
poi il valore grezzo), senza distinzione tra maiuscole e minuscole. La ricerca riporta alla prima
pagina; `setSearch(term)` la imposta via script.

## <a id="filterform"></a>Form di filtro collegato (`filterForm`)

[⬆︎ Torna all'indice](#indice)

Il parametro `filterForm` collega alla tabella un form costruito liberamente nella pagina: al submit il form non viene inviato, i suoi valori vengono aggiunti alla query string di `jsonUrl`, il server restituisce un nuovo JSON già filtrato e la tabella viene ridisegnata.

I campi del form sono indipendenti dalle colonne della tabella: possono filtrare su qualsiasi dato che il server sappia gestire (date, stati, categorie, intervalli di importo…). La tabella non interpreta i valori, si limita a inoltrarli: il filtro vero e proprio avviene **sempre lato server** (vedi [Lato server](#filterform-server)).

### <a id="filterform-utilizzo"></a>Utilizzo

Il valore è l'`id` del form; con `init()` si può passare anche l'elemento stesso. Il form può trovarsi in qualsiasi punto della pagina, anche dopo la tabella.

```html
<form id="jt-filter" method="post" data-disable-submit="false" data-no-was-validated class="d-print-none">
    <fieldset class="fset">
      <legend>Filtri</legend>

      <div class="grid grid-5">
        
        <!-- campi ricerca -->

      </div>

      <div class="form-group mbs">
        <button id="submitButton" type="submit" name="Submit" class="btn btn-primary">Avvia ricerca</button>
      </div>

    </fieldset>
 </form>   

<json-table
  jsonurl="/clienti-json"
  serverside="true"
  filterform="jt-filter"
  cols='[...]'
></json-table>
```

```javascript
jtable.init({
  jsonUrl: '/clienti-json',
  serverSide: true,
  filterForm: 'jt-filter', // oppure document.getElementById('jt-filter')
  cols: [...]
});
```

Funziona sia in modalità server-side sia in modalità client-side (vedi [Modalità client-side](#filterform-client)). Richiede `jsonUrl`: con `data` inline il parametro viene ignorato con un avviso in console.

### <a id="filterform-invio"></a>Cosa viene inviato

A ogni richiesta (compresa la prima) i valori del form vengono letti con `FormData` e aggiunti alla query string di `jsonUrl`:

- i campi con valore vuoto (select senza scelta, input vuoti) non vengono inviati: per il server un parametro assente significa "nessun filtro";
- i campi con lo stesso nome (checkbox, `<select multiple>`) vengono inviati come parametri ripetuti; per riceverli come array in PHP il nome deve terminare con `[]` (es. `zone[]`);
- i campi `file` vengono ignorati;
- al submit viene incluso anche il pulsante che ha inviato il form, se ha un attributo `name` (es. `<button name="azione" value="esporta">`);
- un campo del form con lo stesso nome di un parametro già presente in `jsonUrl` lo sostituisce;
- la richiesta è sempre in GET, indipendentemente da `method` e `action` del form, che vengono ignorati.

In modalità server-side vengono aggiunti anche i parametri di paginazione, ordinamento e ricerca (`serverParams`), che **prevalgono** sui campi del form con lo stesso nome: in questo caso viene segnalato un avviso in console. I campi del form non devono quindi usare i nomi di `serverParams` (con i default: `page`, `start`, `perPage`, `sort`, `dir`, `search`, `searchFields`).

Esempio, con il form sopra compilato e la tabella ordinata per nome:

```
GET /clienti-json?stato=attivo&dal=2025-01-01&zone[]=nord&zone[]=sud&page=1&start=0&perPage=25&sort=nome&dir=asc
```

### <a id="filterform-comportamento"></a>Comportamento

**Primo caricamento.** La prima richiesta contiene già i valori presenti nel form: filtri precompilati dal server (es. un template Twig con valori di default) o ripristinati dal browser vengono applicati da subito.

**Submit.** L'invio del form viene bloccato (`preventDefault`) e la tabella:

- richiede di nuovo i dati con i nuovi valori;
- torna alla prima pagina;
- **azzera la ricerca** dell'input interno alla tabella, per evitare che un termine rimasto attivo dalla ricerca precedente restringa i nuovi risultati senza che sia evidente;
- **mantiene l'ordinamento** corrente;
- ridisegna corpo, footer, paginazione e testo informativo, senza ricostruire la struttura (niente spinner: durante l'attesa il contenitore ha `aria-busy="true"`).

La validazione nativa del form resta attiva: con campi non validi (`required`, `min`, `pattern`…) l'evento `submit` non viene emesso e la tabella non cambia.

**Reset.** Un `<button type="reset">` (o `form.reset()`) riporta i campi ai valori iniziali e aggiorna la tabella allo stesso modo del submit.

**Richieste sovrapposte.** Se si invia il form più volte prima che arrivi la risposta, viene mostrata solo l'ultima.

**Evento.** Al termine viene emesso `jt:update` con `reason: 'filter'`:

```javascript
jtable.addEventListener('jt:update', e => {
  if (e.detail.reason === 'filter') {
    contatore.textContent = e.detail.jsonTable.state.filteredRec;
  }
});
```

**`reload()` e `destroy()`.** `reload()` ricollega il form (anche con un `filterForm` diverso passato negli `overrides`) e ne rilegge i valori; `destroy()` lo scollega.

### <a id="filterform-refresh"></a>`refresh()`

Il metodo `refresh()` richiede di nuovo i dati con lo stato corrente (pagina, ordinamento, ricerca e valori **già applicati** del form) e ridisegna la tabella senza ricostruirla. È utile per aggiornare i dati dopo una modifica sul server o a intervalli regolari, ed emette `jt:update` con `reason: 'refresh'`. Le modifiche al form non ancora inviate non vengono considerate.

```javascript
await jtable.refresh();
```

### <a id="filterform-client"></a>Modalità client-side

Senza `serverSide` il form funziona allo stesso modo: a ogni submit viene richiesto l'intero insieme di dati filtrato (la query string contiene solo `jsonUrl` più i campi del form), mentre ricerca, ordinamento e paginazione restano locali. È la scelta adatta quando i record filtrati sono pochi; per insiemi grandi conviene la modalità server-side.

### <a id="filterform-server"></a>Lato server

L'endpoint riceve i campi del form come normali parametri GET, accanto a quelli della tabella. Le indicazioni per Symfony + Doctrine (lettura tipizzata dei valori, campi vuoti, array, effetto su `totRec`, sicurezza) sono nel capitolo [Filtri esterni alla tabella](#filtri-esterni-alla-tabella-filterform) del backend Symfony.

In sintesi:

- un parametro assente significa "nessun filtro" (i campi vuoti non vengono inviati);
- leggere i valori con i metodi tipizzati e validarli; i valori usati come nomi di campo o di colonna vanno tradotti con una whitelist;
- applicare i filtri **dopo** il conteggio di `totRec` se il "totale generale" non deve risentirne, prima di quello di `filteredRec` in ogni caso;
- in modalità client-side l'endpoint applica solo i filtri del form e restituisce tutte le righe, senza paginazione.

## <a id="ordinamento"></a>Ordinamento

[⬆︎ Torna all'indice](#indice)

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
initialSort: { city: 'asc', name: 'desc' }
```

```html
<json-table initialSort='{ "city": "asc", "name": "desc" }' …></json-table>
```

Ogni colonna deve esistere ed essere ordinabile: i criteri non validi vengono ignorati con un
errore in console. La priorità segue l'ordine delle chiavi nell'oggetto, con un'eccezione propria di
JavaScript: le chiavi di tipo intero (es. `'2024'`) vengono sempre enumerate per prime, in ordine
numerico. `aria-sort` e l'icona compaiono solo sulla colonna del
primo criterio. `setSort(key, dir)` imposta via script l'ordinamento per una sola colonna.

## <a id="ricerca-ordinamento"></a>Ricerca e ordinamento

[⬆︎ Torna all'indice](#indice)

I parametri da usare dipendono dalla modalità: in client-side il componente elabora tutti i dati in locale, in server-side riceve solo la pagina corrente e ricerca e ordinamento spettano al server.

| Parametro | Livello | Client-side | Server-side |
|---|---|---|---|
| `searchable` | colonna | sì | sì |
| `sortable` | colonna | sì | sì |
| `searchValue` | colonna | sì | ignorato, con avviso |
| `sortValue` | colonna | sì | ignorato, con avviso |
| `searchFields` | tabella | ignorato, con avviso | sì |
| `searchKeys` | colonna | ignorato, con avviso | sì |
| `sortKeys` | colonna | ignorato, con avviso | sì |

La [modalità jQuery DataTables](#server-side-datatables) è mantenuta solo per compatibilità: `searchFields`, `searchKeys` e `sortKeys` non sono disponibili e vengono ignorati con un avviso.

### <a id="ricerca-client"></a>Client-side

#### Ricerca

Ogni parola del termine di ricerca, senza distinzione tra maiuscole e minuscole, deve comparire nel testo di ricerca della riga. Il testo è composto dai valori delle colonne con `searchable: true`, scelti in quest'ordine:

1. `searchValue` della colonna (valore o funzione `row => valore`)
2. `searchValue` del tipo di dato
3. valore della cella (il risultato di `parse`, se definito, altrimenti il valore grezzo)

Per cercare su un campo non visibile basta includerlo nel `searchValue` di una colonna visibile:

```javascript
{ key: 'nome', searchValue: row => `${row.nome} ${row.codiceInterno}` }
```

Una colonna con `condition: false`, invece, viene eliminata e non partecipa alla ricerca.

#### Ordinamento

Il valore di confronto di una colonna con `sortable: true` viene scelto in quest'ordine:

1. `sortValue` della colonna (valore o funzione `row => valore`)
2. `sortValue` del tipo di dato
3. valore della cella (il risultato di `parse`, se definito, altrimenti il valore grezzo)

I valori vuoti (`null`, `''`, `NaN`) vanno sempre in coda, i numeri vengono confrontati numericamente e il resto con `localeCompare`. La funzione può contenere una condizione, perché viene eseguita su tutte le righe:

```javascript
{
  key: 'nominativo',
  sortValue: row => row.personaGiuridica ? row.denominazioneSociale : row.cognome
}
```

### <a id="ricerca-server"></a>Server-side

Il server riceve solo i nomi dei campi, non i valori calcolati dal client.

#### Ricerca

A ogni ricerca vengono inviati il termine e l'elenco dei campi:

```
GET /api/clienti?…&search=rossi&searchFields=codice,citta
```

L'elenco contiene la `key` delle colonne con `searchable: true` e i campi indicati con i parametri descritti di seguito. Il nome del parametro di query si cambia con `serverParams.searchFields`, e `null` lo omette.

##### `searchFields`

È il modo preferibile per indicare i campi di ricerca: si definisce una sola volta per la tabella e aggiunge i campi indicati a quelli delle colonne ricercabili, anche se non sono visualizzati. Sono ammessi i nomi nella forma `tabella.campo`, ma le tabelle devono essere già in join nella query del server.

```javascript
jtable.init({
  serverSide: true,
  searchFields: ['clienti.denominazione_sociale', 'clienti.nome', 'clienti.cognome', 'comuni.nome'],
  cols: [
    { key: 'nominativo', title: 'Nome / Denominazione sociale', searchable: false },
    { key: 'codice' }
  ]
});
```

```
?search=rossi&searchFields=codice,clienti.denominazione_sociale,clienti.nome,clienti.cognome,comuni.nome
```

Un valore diverso da un array di stringhe non vuote viene ignorato con un avviso in console.

**Campi già presenti in `cols`.** Ogni campo viene inviato una sola volta:

| Colonne ricercabili | `searchFields` | Campi inviati | Regola |
|---|---|---|---|
| `cognome` | `['cognome']` | `cognome` | I duplicati vengono eliminati |
| `cognome` | `['clienti.cognome']` | `clienti.cognome` | Prevale il nome con la tabella |
| `nome` | `['clienti.nome', 'comuni.nome']` | `clienti.nome,comuni.nome` | Prevalgono tutti i nomi con la tabella |
| `nome` | `['comuni.nome']` | `comuni.nome` | Va indicato anche `clienti.nome`, se serve |
| nessuna (`cognome` con `searchable: false`) | `['cognome']` | `cognome` | `searchFields` vale anche per le colonne non ricercabili |

Nell'ultimo esempio `searchable: false` esclude la `key` dall'elenco, ma non il campo indicato esplicitamente.

**Quando usare `searchable: false`.** Non sempre la `key` di una colonna è un campo su cui il database può cercare. In questi casi va messo `searchable: false` sulla colonna e il campo reale in `searchFields`:

- alias calcolati, come `nominativo`, che in genere non sono utilizzabili nel `WHERE`
- nomi diversi dal database, come `denominazioneSociale` e `denominazione_sociale`

Nella `key` il punto indica un valore annidato del JSON (`owner.name`), quindi non può indicare una tabella: per i campi presenti in più tabelle si usa `searchFields`.

##### `searchKeys`

Sostituisce la `key` di una singola colonna nell'elenco dei campi, ed è comodo quando i campi dipendono da poche colonne. In genere è preferibile `searchFields`, che raccoglie tutta la configurazione in un solo punto.

```javascript
{ key: 'nominativo', searchKeys: ['denominazione_sociale', 'nome', 'cognome'] }
```

Può essere usato insieme a `searchFields`, ma non ha effetto sulle colonne con `searchable: false`.

#### Ordinamento

Al clic sull'intestazione vengono inviati la `key` della colonna e la direzione:

```
GET /api/clienti?…&sort=codice&dir=asc
```

##### `sortKeys`

Sostituisce la `key` nel parametro `sort`, separando le chiavi con una virgola; in `dir` la direzione della colonna viene ripetuta per ogni chiave. Serve quando la `key` è diversa dal campo da ordinare, oppure per ordinare su più campi in sequenza:

```javascript
{ key: 'cognome', sortKeys: ['clienti.cognome', 'clienti.nome'] }
// → sort=clienti.cognome,clienti.nome&dir=asc,asc
```

##### Più criteri con `initialSort`

Con più criteri in `initialSort` le chiavi vengono inviate in ordine di priorità, con una direzione per chiave:

```javascript
initialSort: { citta: 'asc', cognome: 'desc' }
// con sortKeys: ['clienti.cognome', 'clienti.nome'] sulla colonna cognome
// → sort=citta,clienti.cognome,clienti.nome&dir=asc,desc,desc
```

##### Valori calcolati o condizionali

Il client non può esprimere una condizione da valutare riga per riga, perché ha solo la pagina corrente: la condizione va scritta sul server, esponendo un campo con un nome dedicato.

```javascript
{
  key: 'nominativo', // campo del JSON: denominazione sociale oppure cognome e nome
  title: 'Nome / Denominazione sociale',
  searchable: false
}
```

```php
$sortMap = ['nominativo' => "COALESCE(NULLIF(denominazione_sociale, ''), cognome)"];
```

Più chiavi in `sortKeys` non equivalgono a un valore condizionale: `ORDER BY denominazione_sociale, cognome` tiene separati i record con e senza denominazione.

Lo stesso vale per [`parse`](#colonne-parse): il valore viene calcolato dopo la risposta del server, che ordina in base alla `key` e può ignorarla se non corrisponde a un campo previsto. Il componente non può sapere se il server gestisce la `key`: con `debug` attivo, le colonne ordinabili con `parse` generano quindi un avviso in console, a meno che `sortKeys` non indichi il campo da usare (anche la `key` stessa, se il server la gestisce):

```javascript
{
  key: 'dueDate',
  dataType: 'date',
  parse: row => calcDueDate(row),
  sortKeys: ['due_date'] // oppure sortable: false, se il server non può ordinare questo valore
}
```

#### Cosa deve fare il server

**Accettare solo campi previsti.** `sort` e `searchFields` arrivano dal client e possono essere modificati da chiunque, quindi il server deve confrontarli con una whitelist. I nomi di campo non si possono passare come parametri di un prepared statement e finirebbero direttamente nell'SQL. Anche controllandone il formato, una richiesta come `search=abc&searchFields=utenti.password` permetterebbe di dedurre il contenuto di un campo riservato dal valore di `filteredRec`.

La whitelist può essere unica per l'intera query, mentre il client sceglie quali campi usare per ogni tabella:

```php
$allowed = ['clienti.nome', 'clienti.cognome', 'clienti.denominazione_sociale', 'comuni.nome', 'codice'];
$fields = array_intersect(explode(',', $_GET['searchFields'] ?? ''), $allowed);
```

**Cercare ogni parola su tutti i campi.** Per ottenere lo stesso risultato della modalità client-side il server deve dividere il termine di ricerca e cercare ogni parola su tutti i campi: `LIKE '%mario rossi%'` non trova nulla se nome e cognome sono in campi separati.

## <a id="tabelle-rowspan"></a>Tabelle con `rowspan`

[⬆︎ Torna all'indice](#indice)

Con `rowspan` un record occupa più `<tr>`: è il caso tipico di un record con un subarray, come un ordine con i suoi articoli. Le regole del parametro sono in [Parametri colonne](#colonne-rowspan), questa pagina raccoglie gli accorgimenti da adottare in fase di configurazione.

Tutti gli esempi usano questi dati:

```javascript
{
  id: 70,
  cliente: 'Rossi',
  articoli: [
    { codice: 'B20', prezzo: 40 },
    { codice: 'A10', prezzo: 15 }
  ]
}
```

### <a id="rowspan-subidx"></a>`subIdx`

`subIdx` è l'indice del `<tr>` all'interno del record, quindi anche dell'elemento del subarray da mostrare in quel `<tr>`.

| Dove | Firma |
|---|---|
| `parse` | `(row, subIdx) => valore` |
| `render` | `(row, tr, td, subIdx) => contenuto` |
| `trCallback` | `(tr, row, params, subIdx) => void` |

Non è disponibile in `rowspan`, `sortValue`, `searchValue`, `sortKeys`, `searchKeys` e `tfootRender`, perché riguardano l'intero record e non un singolo `<tr>`. Nelle colonne con `rowspan` vale sempre 0, perché la cella è una sola.

```javascript
const span = row => row.articoli.length;

cols: [
  { key: 'id', dataType: 'id', rowspan: span },
  { key: 'cliente', rowspan: span },
  { key: 'articoli.codice', title: 'Codice', parse: (row, subIdx) => row.articoli[subIdx]?.codice ?? null },
  { key: 'articoli.prezzo', title: 'Prezzo', dataType: 'euro', parse: (row, subIdx) => row.articoli[subIdx]?.prezzo ?? null }
]
```

Le chiavi annidate non selezionano da sole l'elemento di un array di oggetti: senza `parse` o `render`, `articoli.codice` non produce alcun valore.

### <a id="rowspan-accorgimenti"></a>Accorgimenti comuni

- **Subarray vuoti:** un record senza elementi occupa comunque un `<tr>`, con `subIdx` 0. Senza `?.`, `row.articoli[subIdx].codice` lancia un `TypeError`
- **`key` univoche:** due colonne con la stessa `key` si sovrascrivono i valori di ordinamento. Per questo, con più colonne sullo stesso subarray, si usano chiavi distinte come `articoli.codice` e `articoli.prezzo`
- **Paginazione e conteggi:** `perPage`, `totRec` e `filteredRec` contano i record, non i `<tr>`, quindi l'altezza delle pagine può variare
- **Identificare il record:** tutti i `<tr>` di un record hanno lo stesso `data-jt-idx`

### <a id="rowspan-client"></a>Client-side

Ordinamento, ricerca e aggregati del `tfoot` considerano il subarray solo in parte. Il risultato dipende dalla `key` della colonna:

| `key` della colonna | Ordinamento | Ricerca e aggregati |
|---|---|---|
| Campo array, ad es. `articoli` con `parse` | Primo elemento | Tutti gli elementi |
| Chiave annidata, ad es. `articoli.codice` con `parse` | Primo elemento | **Solo il primo elemento** |

Una chiave annidata non è un array, quindi `parse` viene invocata una sola volta, con `subIdx` 0. Per considerare tutti gli elementi vanno indicati `sortValue` e `searchValue`, che ricevono l'intero record:

```javascript
{
  key: 'articoli.codice',
  parse: (row, subIdx) => row.articoli[subIdx]?.codice ?? null,
  sortValue: row => row.articoli.map(a => a.codice).sort()[0] ?? null, // codice più basso
  searchValue: row => row.articoli.map(a => a.codice).join(' ')
}
```

`sortValue` è unico per entrambe le direzioni: a differenza dell'esempio server-side qui sotto, in ordine decrescente il confronto usa lo stesso valore.

Allo stesso modo, gli aggregati su una chiave annidata vanno calcolati con una funzione `tfootRender`:

```javascript
{
  key: 'articoli.prezzo',
  dataType: 'euro',
  parse: (row, subIdx) => row.articoli[subIdx]?.prezzo ?? null,
  tfootRender: rows => rows.flatMap(row => row.articoli).reduce((tot, a) => tot + a.prezzo, 0)
}
```

### <a id="rowspan-server"></a>Server-side

Il server ordina e pagina i record prima che il client calcoli i `<tr>`, quindi deve conoscere da solo il criterio da applicare a ogni colonna del subarray.

#### Ordinamento

Il client invia `sort=articoli.codice&dir=asc`. Se il server non gestisce quella chiave, l'ordinamento non ha effetto e, in genere, senza alcun errore.

`sortKeys` non può selezionare un elemento del subarray: indica solo il nome del campo inviato al server. Il criterio va quindi scritto sul server. In genere ogni record si ordina in base al suo primo elemento nella direzione richiesta, cioè il minimo in ordine crescente e il massimo in decrescente:

```php
// esempio con Doctrine: `a` è un articolo, `o` l'ordine
$sortFields = array(
  'articoli.codice' => 'a.codice',
  'articoli.prezzo' => 'a.prezzo',
);

if (isset($sortFields[$sort])) {
  $qb
    ->addSelect(sprintf(
      '(SELECT %s(%s) FROM %s a WHERE a.ordine = o) AS HIDDEN articoliSort',
      $direction === 'DESC' ? 'MAX' : 'MIN',
      $sortFields[$sort],
      Articolo::class
    ))
    ->addOrderBy('articoliSort', $direction);
}
```

Va considerato che:

- **La colonna può sembrare fuori sequenza:** l'ordine riguarda i record, e gli elementi di un record restano nell'ordine in cui li restituisce il server. Un ordine con `100` e `900` precede uno con `200`
- **I campi di testo si confrontano in ordine alfabetico:** se contengono numeri, `9` viene dopo `12504126`
- **Le subquery non possono riutilizzare gli alias:** con Doctrine, gli alias devono essere diversi da quelli usati per ricerca e filtri nella stessa query
- **Se il server non può ordinare un campo:** va impostato `sortable: false`

Con `debug` attivo, le colonne ordinabili con `parse` e senza `sortKeys` generano un avviso in console. Se il server gestisce già la `key`, l'avviso si elimina indicandola in `sortKeys`:

```javascript
{ key: 'articoli.codice', parse: (row, subIdx) => row.articoli[subIdx]?.codice ?? null, sortKeys: ['articoli.codice'] }
```

L'avviso riguarda solo `parse`: una colonna che usa soltanto `render` non lo genera, ma ha lo stesso problema.

#### Ricerca e filtri

Anche `searchFields` contiene solo nomi di campo. Per i campi del subarray conviene una condizione `EXISTS`, che seleziona il record senza moltiplicarne le righe:

```sql
WHERE EXISTS (SELECT 1 FROM articoli a WHERE a.ordine_id = o.id AND a.codice LIKE :search)
```

Il record trovato viene restituito con tutti i suoi elementi, non solo con quelli che corrispondono alla ricerca: se serve il contrario, va ridotto anche il subarray nella risposta.

#### Recupero dei dati

Il subarray non va recuperato con una `JOIN` nella query paginata: ogni elemento diventerebbe una riga, falsando `LIMIT` e conteggi. Conviene paginare i record e recuperare gli elementi con una seconda query, filtrando sugli id della pagina:

```php
$ordini = $qb->setFirstResult($start)->setMaxResults($perPage)->getQuery()->getArrayResult();
$articoli = $this->getArticoli(array_column($ordini, 'id')); // WHERE a.ordine IN (:ids), raggruppati per ordine
```

L'ordine degli elementi nel JSON determina il `subIdx`, quindi va definito esplicitamente nella seconda query.

Il `tfoot` non è disponibile in questa modalità: vedi [Modalità server-side](#modalita-server-side).

## <a id="set-defaults"></a>Default di progetto – `JsonTable.setDefaults()`

[⬆︎ Torna all'indice](#indice)

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

## <a id="modalita-server-side"></a>Server Side

[⬆︎ Torna all'indice](#indice)

Con `serverSide: true` il componente non elabora i dati in locale: a ogni cambio pagina,
ordinamento o ricerca invia una nuova richiesta GET a `jsonUrl`, aggiungendo alla query string i
parametri definiti in `serverParams` (quelli già presenti in `jsonUrl` vengono conservati):

```javascript
serverParams: {
  page: 'page',        // pagina richiesta (da 1)
  start: 'start',      // indice (da 0) del primo record richiesto = (page - 1) * perPage,
                       // comodo per `LIMIT start, perPage`
  perPage: 'perPage',  // record per pagina
  sort: 'sort',        // chiavi delle colonne ordinate, o i loro `sortKeys`, unite da virgola (omesso senza ordinamento)
  dir: 'dir',          // 'asc' | 'desc', una per ogni chiave di `sort`, unite da virgola (omesso senza ordinamento)
  search: 'search',    // termine di ricerca (omesso se vuoto)
  searchFields: 'searchFields' // campi su cui cercare (omesso senza termine di ricerca)
}
```

Un valore `null` omette il parametro (es. `serverParams: { start: null }` per inviare solo `page`).

Ai parametri della tabella si aggiungono gli eventuali campi del form collegato con `filterForm` (vedi [Form di filtro collegato](#filterform)), che non devono usare gli stessi nomi.
Richiesta di esempio, seconda pagina ordinata per nome con ricerca attiva:

```
GET /api/rows.json?page=2&start=25&perPage=25&sort=name&dir=desc&search=mar&searchFields=name,city
```

Con più criteri di ordinamento (vedi `initialSort`) `sort` e `dir` contengono liste della stessa lunghezza, da leggere in parallelo:

```
?sort=city,name&dir=asc,desc
```

Se il nome di `sort` o `dir` contiene `{i}` (es. `serverParams: { sort: 'order[{i}][key]', dir: 'order[{i}][dir]' }`) viene inviato invece un parametro per ogni criterio, con `{i}` sostituito dall'indice (da 0).

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

### <a id="server-side-ordinamento"></a>Ordinamento e ricerca

`sortValue` e `searchValue` non hanno effetto in questa modalità. Per indicare al server i campi da usare sono disponibili `searchFields`, `searchKeys` e `sortKeys`: vedi [Ricerca e ordinamento](#ricerca-ordinamento).

### <a id="server-side-datatables"></a>Modalità jQuery DataTables

Con `jqDatatableMode: true` (o l'attributo `jqdatatablemode="true"`) i default dei parametri server-side diventano quelli del formato di jQuery DataTables, utile per riutilizzare endpoint già esistenti:

| Parametro | Default con `jqDatatableMode` |
|---|---|
| `filteredRecField` | `'recordsFiltered'` |
| `jsonDataField` | `'data'` |
| `serverParams` | `{ page: null, start: 'start', perPage: 'length', sort: 'order[{i}][column]', dir: 'order[{i}][dir]', search: 'search[value]' }` |
| `serverSide` | `true` |
| `totRecField` | `'recordsTotal'` |

Precedenza: `init()` > attributo HTML > `JsonTable.setDefaults()` > modalità jQuery DataTables > default predefiniti. Ogni parametro può quindi essere sovrascritto singolarmente, e `serverParams` viene unito chiave per chiave.

Oltre ai `serverParams`, in questa modalità vengono inviati anche `draw=1` e, per ogni colonna visualizzata, `columns[i][name]` (la `key`), `columns[i][searchable]` e `columns[i][orderable]`. `order[i][column]` riceve l'**indice** della colonna ordinata (tra quelle visualizzate), non la chiave, con un `order[i]` per ogni criterio di ordinamento.

Questa modalità è mantenuta solo per compatibilità: `sortKeys`, `searchKeys` e `searchFields` non sono disponibili e vengono ignorati con un avviso in console.

```html
<json-table jsonurl="/api/rows" jqdatatablemode="true" cols='[{"key":"id"},{"key":"name"}]'></json-table>
```

```
GET /api/rows?draw=1&columns[0][name]=id&columns[0][searchable]=true&columns[0][orderable]=true&columns[1][name]=name&…&start=25&length=25&order[0][column]=1&order[0][dir]=desc&search[value]=mar
```

## <a id="api"></a>API dell'istanza

[⬆︎ Torna all'indice](#indice)

| Metodo | Descrizione |
|---|---|
| `destroy()` | Svuota il componente; `init()` può essere richiamato in seguito |
| `goToPage(page)` | Mostra la pagina indicata (limitata all'intervallo disponibile) |
| `init(config)` | Avvia il componente (prima o dopo l'inserimento nel DOM) |
| `refresh()` | Richiede di nuovo i dati con lo stato corrente (pagina, ordinamento, ricerca, valori applicati di [`filterForm`](#filterform)) e ridisegna la tabella senza ricostruirla (`Promise`) |
| `reload(overrides)` | Ricarica i dati e ricostruisce la struttura, con eventuali parametri sovrascritti (`Promise`); ricerca, ordinamento e pagina vengono azzerati |
| `setSearch(term)` | Filtra le righe con il termine indicato (stringa vuota = nessun filtro) e torna alla prima pagina; l'input di ricerca viene aggiornato |
| `setSort(key, dir)` | Ordina per la colonna `key` (`'asc'`, `'desc'`, oppure `null` per rimuovere l'ordinamento) e torna alla prima pagina |

In modalità server-side `goToPage`, `setSort` e `setSearch` generano una nuova richiesta; `refresh()` la genera in entrambe le modalità.

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

## <a id="backend-symfony"></a>Backend Symfony per la modalità server-side

[⬆︎ Torna all'indice](#indice)

Linee guida per costruire, in Symfony + Doctrine, l'endpoint JSON di una `<json-table>` con
`serverSide: true`. Il protocollo (parametri inviati e formato della risposta) è descritto in
[Modalità server-side](#modalita-server-side) e [Ricerca e ordinamento](#ricerca-ordinamento); qui si
assumono i nomi di default di `serverParams` e dei campi di risposta.

### <a id="backend-contratto"></a>Il contratto in breve

Richiesta (GET, tutti i parametri sono facoltativi):

| Parametro | Contenuto |
|---|---|
| `page` | pagina richiesta, da 1 |
| `start` | indice del primo record, da 0 (`(page - 1) * perPage`) |
| `perPage` | record per pagina |
| `sort` | chiavi di ordinamento separate da virgola (`key` delle colonne o loro `sortKeys`) |
| `dir` | `asc`/`desc` separati da virgola, uno per ogni chiave di `sort` |
| `search` | termine di ricerca |
| `searchFields` | campi su cui cercare, separati da virgola |
| altri | campi del form di filtro (`filterForm`) e parametri già presenti in `jsonUrl`, vedi [Filtri esterni alla tabella](#filtri-esterni-alla-tabella-filterform) |

Risposta:

```json
{ "data": [ ...righe della pagina... ], "totRec": 1500, "filteredRec": 40 }
```

### <a id="backend-struttura"></a>Struttura dell'azione

Le fasi sono sempre le stesse, nell'ordine:

1. **controllo accessi**
2. **query base** – condizioni sempre valide (record non cancellati, visibilità per l'utente…)
3. **`totRec`** – conteggio della query base
4. **filtri di pagina** – campi del form collegato con `filterForm` e parametri aggiuntivi di `jsonUrl`
5. **ricerca** – `search` + `searchFields`
6. **`filteredRec`** – conteggio dopo filtri e ricerca
7. **select** – solo i campi necessari, più eventuali campi `HIDDEN` per l'ordinamento
8. **ordinamento** – `sort` + `dir`, con chiave finale univoca
9. **paginazione** – `start` + `perPage`, con un massimo
10. **dati collegati** (relazioni *to-many*) caricati a parte per gli id della pagina
11. **normalizzazione** delle righe e `JsonResponse`

```php
#[Route(path: '/clienti-json', name: 'clienti_elenco_json', methods: ['GET'])]
public function elencoJson(Request $request, JsonTableHelper $jt): JsonResponse
{
  $this->denyAccessUnlessGranted('ROLE_CLIENTI');

  $qb = $this->em->getRepository(Cliente::class)
    ->createQueryBuilder('c')
    ->leftJoin('c.comune', 'com')
    ->andWhere('c.cancellato = 0');

  $totRec = $jt->count($qb, 'c.id');

  $this->applyFilters($qb, $request);

  $jt->applySearch($qb, $request, [
    'codice'                         => 'c.codice',
    'clienti.cognome'                => 'c.cognome',
    'clienti.nome'                   => 'c.nome',
    'clienti.denominazione_sociale'  => 'c.denominazioneSociale',
    'comuni.nome'                    => 'com.nome',
  ]);

  $filteredRec = $jt->count($qb, 'c.id');

  $qb
    ->select('c.id, c.codice, c.personaGiuridica, com.nome AS comune')
    ->addSelect("CASE WHEN c.personaGiuridica = 1 THEN c.denominazioneSociale
                 ELSE TRIM(CONCAT(COALESCE(c.cognome, ''), ' ', COALESCE(c.nome, ''))) END AS nominativo")
    ->addSelect("CASE WHEN c.personaGiuridica = 1 THEN c.denominazioneSociale
                 ELSE c.cognome END AS HIDDEN nominativoSort");

  $jt->applySort($qb, $request, [
    'codice'     => ['c.codice'],
    'nominativo' => ['nominativoSort', 'c.nome'],
    'comune'     => ['com.nome'],
  ], tieBreaker: 'c.id', default: ['nominativoSort' => 'ASC']);

  $rows = $jt->paginate($qb, $request)->getQuery()->getArrayResult();

  return new JsonResponse([
    'totRec'      => $totRec,
    'filteredRec' => $filteredRec,
    'data'        => array_map($this->normalizeRow(...), $rows),
  ]);
}
```

### <a id="backend-linee"></a>Linee guida

#### Sicurezza

- **Whitelist obbligatoria** per `sort` e `searchFields`: arrivano dal client e i nomi di campo
  non possono essere parametri di un prepared statement, quindi finirebbero direttamente nel
  DQL/SQL. Ogni chiave va tradotta tramite una mappa `chiave client → espressione DQL`; le chiavi
  sconosciute vengono ignorate, mai usate così come sono. Escludere dalla mappa i campi riservati:
  anche senza mostrarli, `filteredRec` permetterebbe di dedurne il contenuto per tentativi.
- **Valori sempre come parametri** (`setParameter`), compreso il termine di ricerca.
- **Escape dei caratteri jolly di `LIKE`**: `addcslashes($term, '%_\\')`, altrimenti `%` o `_`
  nel termine diventano jolly.
- **`dir` normalizzato**: solo `ASC` o `DESC`, qualsiasi altro valore diventa `ASC`.
- **`perPage` limitato** (es. `min($perPage, 500)`): un client può chiedere qualsiasi valore.
- **Controllo accessi con risposta JSON**: il componente si aspetta JSON; un redirect alla pagina
  di login o alla dashboard produce un errore di parsing poco chiaro. Usare
  `denyAccessUnlessGranted()` / `#[IsGranted]` (403) oppure restituire una `JsonResponse` con
  lo status appropriato.

#### Conteggi

- `totRec` si calcola sulla query base **prima** di filtri e ricerca, `filteredRec` **dopo**, in
  entrambi i casi **prima** di select, ordinamento e paginazione.
- Usare un clone del QueryBuilder con `select('COUNT(...)')` e `getSingleScalarResult()`; azzerare
  l'eventuale `orderBy` (`resetDQLPart('orderBy')`), inutile e talvolta non valido in un `COUNT`.
- Con join verso relazioni *to-many* nella query principale usare `COUNT(DISTINCT x.id)`; meglio
  ancora evitare questi join (vedi [Relazioni to-many](#relazioni-to-many)).
- Se i filtri di pagina non devono incidere su `totRec` (il "totale generale" mostrato nell'info),
  applicarli dopo il primo conteggio, come nello schema sopra; altrimenti includerli nella query base.

#### Ricerca

- Per ottenere lo stesso comportamento della modalità client-side, **dividere il termine in
  parole** (separatore: spazi) e richiedere che **ogni parola** compaia in **almeno uno** dei
  campi: `AND` tra le parole, `OR` tra i campi. Un unico `LIKE '%mario rossi%'` non trova nulla
  se nome e cognome sono in campi diversi.
- Un parametro distinto per ogni parola (`:jt_s0`, `:jt_s1`, …).
- `searchFields` vuoto o senza chiavi valide: cercare su un insieme di campi di default (in genere
  tutti quelli della mappa), non restituire zero righe.
- Le chiavi della mappa sono quelle inviate dal client (`key` delle colonne, `searchKeys`,
  `searchFields`): conviene usare nomi `tabella.campo` per i campi presenti in più entità e
  tenere la mappa unica per l'intera query, lasciando al client la scelta dei campi.
- Le espressioni calcolate (`CONCAT`, `CASE`…) non possono essere usate tramite il loro alias nel
  `WHERE`: nella mappa va messa l'espressione completa, oppure i singoli campi che la compongono.
- Campi data/numerici: `LIKE` su una data funziona in MySQL (cast implicito, formato
  `YYYY-MM-DD`) ma non è portabile; se la ricerca di date in formato locale è importante, conviene
  convertire il termine o usare `DATE_FORMAT` (estensioni DQL come `beberlei/doctrineextensions`).
- Condizioni su relazioni *to-many* (es. "trattative con almeno un preventivo che contiene la
  parola"): `EXISTS (SELECT … WHERE sub.parent = t AND (…))`. Gli alias delle subquery devono
  essere unici in tutto il DQL: se ricerca, filtri e ordinamento usano subquery sulla stessa
  entità, usare alias diversi in ciascuna.

#### Ordinamento

- `sort` e `dir` sono **liste parallele**: la chiave *i* usa la direzione *i*; se `dir` ha meno
  elementi, usare l'ultima direzione disponibile (o `ASC`). Con `sortKeys` il client ripete già la
  direzione per ogni chiave.
- Ogni chiave della mappa può corrispondere a **più espressioni** (es. `['i.cognome', 'i.nome']`),
  ordinate nella stessa direzione.
- **Valori calcolati o condizionali** (es. denominazione sociale per le persone giuridiche,
  cognome per le persone fisiche): selezionarli come `… AS HIDDEN aliasSort` e ordinare per
  l'alias. Doctrine accetta in `ORDER BY` gli alias della select, non le espressioni.
- **Chiave finale univoca** (in genere l'id, nella stessa direzione dell'ultimo criterio), sempre:
  senza, a parità di valore l'ordine non è garantito e la paginazione può ripetere o saltare righe.
- **Ordinamento di default** lato server quando `sort` è assente o non valido, coerente con
  l'`initialSort` della tabella (che però, se impostato, viene comunque inviato).
- Ordinamento per un campo di una relazione *to-many* (es. una colonna di un subarray): una
  subquery `MIN()`/`MAX()` (in base alla direzione) selezionata come `HIDDEN`.

#### Paginazione

- Usare `start` (`setFirstResult`) e `perPage` (`setMaxResults`); `page` è ridondante e può essere
  omesso con `serverParams: { page: null }`.
- `perPage` ≤ 0 o assente: applicare un default, non restituire l'intera tabella.
- Pagina oltre l'ultima: restituire semplicemente `data` vuoto con i conteggi corretti; il
  componente richiede da sé l'ultima pagina disponibile.
- `setFirstResult`/`setMaxResults` con join *fetch* verso relazioni *to-many* limitano le righe SQL,
  non le entità: in quel caso serve il `Paginator` di Doctrine, oppure (preferibile) l'approccio
  descritto sotto.

#### Relazioni to-many

Quando ogni riga contiene un sotto-array (es. i preventivi di una trattativa), non includere la
relazione in join nella query principale: duplicherebbe le righe, falserebbe conteggi e
paginazione. Procedere invece in due passi:

1. query principale paginata, solo sull'entità radice e sulle relazioni *to-one*;
2. una seconda query per i soli id della pagina (`WHERE sub.parent IN (:ids)`), raggruppata in PHP
   per id del padre e aggiunta alle righe.

Filtri e ricerca sui figli si esprimono con `EXISTS`; i filtri sui figli selezionano i padri ma
non riducono il sotto-array (a meno che non sia esplicitamente richiesto).

#### Formato dei dati

- Preferire `select` di campi scalari + `getArrayResult()` all'idratazione di entità: più veloce e
  senza rischi di serializzare relazioni o campi riservati.
- Normalizzare le righe prima della risposta: date in ISO (`format('Y-m-d')` o
  `DATE_ATOM`), booleani come `true`/`false`, oggetti annidati se le colonne usano chiavi con il
  punto (`cliente.id`, `cliente.nome`).
- I nomi delle proprietà del JSON sono le `key` delle colonne: mantenerli stabili e, dove possibile,
  identici alle chiavi delle mappe di ricerca e ordinamento, così le nuove colonne funzionano senza
  modifiche lato client.
- Restituire solo i campi effettivamente usati dalla tabella (render, link, condizioni).

#### Filtri esterni alla tabella (`filterForm`)

Un form di filtro costruito liberamente nella pagina si collega alla tabella con il parametro `filterForm` (vedi [Form di filtro collegato](#filterform)): a ogni richiesta i suoi campi non vuoti vengono aggiunti alla query string, accanto ai parametri di paginazione, ordinamento e ricerca. Per il server sono normali parametri GET, non previsti dal protocollo della tabella: è l'azione a decidere come interpretarli.

Esempio di richiesta, con un form che contiene `stato`, `dal`, `al` e le checkbox `zone[]`:

```
GET /clienti-json?stato=attivo&dal=2025-01-01&zone[]=nord&zone[]=sud&page=1&start=0&perPage=25&sort=nome&dir=asc
```

Il metodo `applyFilters()` richiamato nell'azione di esempio:

```php
private function applyFilters(QueryBuilder $qb, Request $request): void
{
  $q = $request->query;

  // valore singolo da un elenco chiuso
  $stato = $q->getString('stato');
  if (in_array($stato, ['attivo', 'sospeso'], true)) {
    $qb->andWhere('c.stato = :f_stato')->setParameter('f_stato', $stato);
  }

  // date: validare il formato prima di usarle
  $dal = \DateTimeImmutable::createFromFormat('!Y-m-d', $q->getString('dal'));
  if ($dal) {
    $qb->andWhere('c.dataCreazione >= :f_dal')->setParameter('f_dal', $dal);
  }
  $al = \DateTimeImmutable::createFromFormat('!Y-m-d', $q->getString('al'));
  if ($al) {
    $qb->andWhere('c.dataCreazione < :f_al')->setParameter('f_al', $al->modify('+1 day'));
  }

  // checkbox / select multiple (`zone[]`): array, filtrato con una whitelist
  $zone = array_intersect($q->all('zone'), ['nord', 'centro', 'sud']);
  if ($zone) {
    $qb->andWhere('c.zona IN (:f_zone)')->setParameter('f_zone', $zone);
  }

  // booleano facoltativo: assente = nessun filtro, '0' = false
  if ($q->has('privato')) {
    $qb->andWhere('c.personaGiuridica = :f_pg')->setParameter('f_pg', !$q->getBoolean('privato'));
  }
}
```

Linee guida:

- **parametro assente = nessun filtro**: il componente non invia i campi vuoti, quindi `has()` distingue "nessuna scelta" da `0`/`false` quando questi sono valori validi;
- leggere i valori con i metodi tipizzati (`getString()`, `getInt()`, `getBoolean()`) e validarli; un valore non valido va ignorato, non deve produrre un errore 500;
- i campi multipli arrivano come array solo se il nome termina con `[]`: leggerli con `$request->query->all('nome')` (senza `[]`); senza le parentesi PHP conserva solo l'ultimo valore;
- valori sempre come parametri (`setParameter`); i valori che diventano **nomi** di campo o di colonna (es. un select "cerca in…") vanno tradotti con una whitelist, come `sort` e `searchFields`;
- nomi dei parametri con un prefisso (es. `f_`) per non collidere con quelli della query (ricerca `jt_s0`…, eventuali subquery);
- **conteggi**: applicare i filtri dopo il calcolo di `totRec` se l'info deve mostrare il totale generale (come nello schema sopra), prima se `totRec` deve essere il totale dell'insieme filtrato; in ogni caso prima di `filteredRec`;
- i campi del form non devono usare i nomi di `serverParams` (`page`, `start`, `perPage`, `sort`, `dir`, `search`, `searchFields` con i default): la tabella li sovrascriverebbe;
- il pulsante che ha inviato il form viene incluso se ha un `name` (es. `azione=esporta`): l'endpoint deve comunque rispondere con il JSON della tabella, per un'esportazione usare un'azione separata.

**Form generati con Symfony Form.** Symfony assegna ai campi un `name` con il prefisso del form type (es. `filtro_clienti[stato]`, `filtro_clienti[zone][]`): la query string contiene quindi questi nomi, e `$request->query->get('stato')` non trova nulla, quindi il filtro viene ignorato senza errori. L'opzione `id` passata a `form_row()` modifica solo l'attributo `id`, non il `name`. Le soluzioni sono due:

- eliminare il prefisso nel form type, così i campi arrivano come `stato`, `zone[]`…:

  ```php
  class FiltroClientiType extends AbstractType
  {
    // ...

    public function getBlockPrefix(): string
    {
      return '';
    }
  }
  ```

- mantenere il prefisso e leggere i valori come array: `$f = $request->query->all('filtro_clienti');` (poi `$f['stato'] ?? null`, con la stessa validazione).

Con il form generato da Symfony la query string può contenere anche altri parametri, che l'endpoint ignora: il `_token` CSRF, se è attivo sul form (per un form di filtro in GET si può disattivare con `'csrf_protection' => false` in `configureOptions()`), e il pulsante di submit, se ha un `name`.

**Tabelle client-side.** Con `filterForm` senza `serverSide` l'endpoint riceve solo i campi del form: applica i filtri e restituisce **tutte** le righe corrispondenti (nessuna paginazione, ricerca o ordinamento lato server), con `totRec` facoltativo.

### <a id="backend-helper"></a>Helper riutilizzabile

Un servizio che raccoglie le parti generiche; le mappe restano nel controller (o nel repository),
perché dipendono dalla query.

```php
<?php

namespace App\Service;

use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\Request;

/**
 * Supporto per gli endpoint server-side di <json-table>
 * (parametri con i nomi di default di `serverParams`)
 */
final class JsonTableHelper
{
  public function __construct(
    private int $defaultPerPage = 50,
    private int $maxPerPage = 500,
  ) {}

  public function count(QueryBuilder $qb, string $idField, bool $distinct = false): int
  {
    return (int) (clone $qb)
      ->select(sprintf('COUNT(%s%s)', $distinct ? 'DISTINCT ' : '', $idField))
      ->resetDQLPart('orderBy')
      ->getQuery()
      ->getSingleScalarResult();
  }

  /**
   * Ogni parola di `search` deve comparire in almeno uno dei campi di `searchFields`
   * presenti in `$map` (chiave client => espressione DQL); senza campi validi usa tutta la mappa
   * @param array<string, string> $map
   */
  public function applySearch(QueryBuilder $qb, Request $request, array $map): void
  {
    $words = preg_split('/\s+/u', trim((string) $request->query->get('search', '')), -1, PREG_SPLIT_NO_EMPTY);
    if (!$words) {
      return;
    }

    $requested = array_flip(array_filter(explode(',', (string) $request->query->get('searchFields', ''))));
    $fields = array_intersect_key($map, $requested) ?: $map;

    foreach ($words as $i => $word) {
      $param = 'jt_s' . $i;
      $qb
        ->andWhere(implode(' OR ', array_map(fn (string $f) => "$f LIKE :$param", $fields)))
        ->setParameter($param, '%' . addcslashes($word, '%_\\') . '%');
    }
  }

  /**
   * `sort` e `dir` sono liste parallele; ogni chiave di `$map` corrisponde a una o più
   * espressioni DQL (o alias HIDDEN). `$tieBreaker` rende stabile la paginazione
   * @param array<string, string[]> $map
   * @param array<string, 'ASC'|'DESC'> $default  ordinamento senza chiavi valide
   */
  public function applySort(QueryBuilder $qb, Request $request, array $map, string $tieBreaker, array $default = []): void
  {
    $keys = array_filter(explode(',', (string) $request->query->get('sort', '')));
    $dirs = array_map(
      fn (string $d) => strtolower(trim($d)) === 'desc' ? 'DESC' : 'ASC',
      explode(',', (string) $request->query->get('dir', ''))
    );

    $lastDir = 'ASC';
    $applied = false;
    foreach ($keys as $i => $key) {
      $lastDir = $dirs[$i] ?? $lastDir;
      foreach ($map[$key] ?? [] as $expr) {
        $qb->addOrderBy($expr, $lastDir);
        $applied = true;
      }
    }

    if (!$applied) {
      foreach ($default as $expr => $dir) {
        $qb->addOrderBy($expr, $dir);
        $lastDir = $dir;
      }
    }

    $qb->addOrderBy($tieBreaker, $lastDir);
  }

  public function paginate(QueryBuilder $qb, Request $request): QueryBuilder
  {
    $perPage = $request->query->getInt('perPage', $this->defaultPerPage);

    return $qb
      ->setFirstResult(max(0, $request->query->getInt('start', 0)))
      ->setMaxResults($perPage > 0 ? min($perPage, $this->maxPerPage) : $this->defaultPerPage);
  }
}
```

Se il progetto usa nomi diversi per i parametri (`serverParams`) o la
[modalità jQuery DataTables](#server-side-datatables), adattare la lettura dei
parametri nell'helper, lasciando invariato il resto.

### <a id="backend-checklist"></a>Checklist

- [ ] accesso negato → risposta JSON con status 401/403, non redirect
- [ ] `sort` e `searchFields` filtrati con una whitelist; nessun nome di campo dal client nel DQL
- [ ] termine di ricerca diviso in parole, con escape di `%` e `_`, passato come parametro
- [ ] `totRec` prima di filtri e ricerca, `filteredRec` dopo; nessun `ORDER BY` nei conteggi
- [ ] `sort`/`dir` letti come liste parallele; valori calcolati come `HIDDEN`; chiave finale univoca
- [ ] `perPage` con default e massimo
- [ ] nessun join *to-many* nella query paginata; sotto-array caricati per gli id della pagina
- [ ] righe normalizzate (date ISO, booleani, oggetti annidati) con le `key` delle colonne
- [ ] filtri di pagina (`filterForm`): parametro assente = nessun filtro, valori tipizzati e validati, campi multipli con `[]`, nomi che non collidono con `serverParams`
- [ ] form di filtro generato con Symfony Form: `getBlockPrefix()` restituisce `''`, oppure i valori vengono letti con `$request->query->all('<prefisso>')`

## <a id="eventi"></a>Eventi

[⬆︎ Torna all'indice](#indice)

Entrambi vengono emessi sull'elemento con `bubbles: true`; `event.detail.jsonTable` è l'istanza.

| Evento | Quando | `event.detail` |
|---|---|---|
| `jt:ready` | al termine della costruzione e del primo rendering (nel microtask successivo, quindi un listener registrato subito dopo `init()` lo intercetta comunque) | `{ jsonTable }` |
| `jt:update` | dopo ogni cambio pagina, ordinamento o ricerca (anche via API), dopo il submit/reset del form di filtro e dopo `refresh()` | `{ jsonTable, reason }` con `reason` = `'page'`, `'sort'`, `'search'`, `'filter'` o `'refresh'` |

```javascript
jtable.addEventListener('jt:ready', e => console.log(e.detail.jsonTable.data));
jtable.addEventListener('jt:update', e => console.log(e.detail.reason, e.detail.jsonTable.state.page));
jtable.init({ jsonUrl: '/api/rows.json', cols: [...] });
```

## <a id="paginazione-tabella"></a>Paginazione

[⬆︎ Torna all'indice](#indice)

Con `perPage` > 0 (default 25) le righe vengono suddivise in pagine e sotto la tabella compare la
navigazione: pulsanti precedente/successivo (icone `paginationPrevIcon`/`paginationNextIcon`),
la prima e l'ultima pagina e `paginationDelta` pagine per lato della corrente, con puntini di
sospensione per le pagine omesse. La navigazione è nascosta quando c'è una sola pagina.
`perPage: 0` disattiva la paginazione (tutte le righe in un'unica pagina).

`goToPage(page)` cambia pagina via script; `state.page`/`state.totPages` riportano lo stato.

### <a id="paginazione-caption"></a>Caption e paginazione

La caption è mostrata **sotto la tabella**, nella barra `tableFooter`, allineata a sinistra; a
destra, nella stessa barra, la navigazione delle pagine. La caption non è un elemento
`<caption>` (che dovrebbe stare dentro la tabella e non potrebbe ospitare la navigazione senza
farla leggere come nome della tabella) ma un contenitore con id, collegato alla tabella tramite
`aria-labelledby`: il nome accessibile della tabella è quindi lo stesso di una `<caption>`.
Posizioni diverse si ottengono con gli slot `caption` e `pagination` del [template](#template).

## <a id="template"></a>Template

[⬆︎ Torna all'indice](#indice)

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
in [Struttura generata](#struttura). Esempio con ricerca e paginazione sopra la tabella
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

## <a id="struttura"></a>Struttura generata

[⬆︎ Torna all'indice](#indice)

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

## <a id="custom-properties"></a>Custom properties CSS

[⬆︎ Torna all'indice](#indice)

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
