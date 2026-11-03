# Parametri

[↰ Indice](../json-table-docs.md)

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
| `dataTypes` | Object (`{}`) | Tipi di dato personalizzati, uniti a quelli predefiniti (vedi [dataTypes](dataTypes.md)) |
| `datesLocaleOpts` | Intl.DateTimeFormatOptions (`{ year: 'numeric', month: 'short', day: 'numeric' }`) | Parte data dei tipi date/datetime |
| `debug` | boolean (`false`) | Log in console di parametri, colonne, dati, stato ed elementi generati |
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
| `searchFields` | string[] o null (`null`) | Solo server-side: campi su cui cercare oltre a quelli delle colonne ricercabili, anche nella forma `tabella.campo`. Vedi [Ricerca e ordinamento](ricerca-ordinamento.md#searchfields) |
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
| `trCallback` | (tr, row, params, subIdx) => void (`null`) | Callback invocata dopo il rendering di ogni `<tr>` del body. `subIdx` è l'indice del `<tr>` all'interno del record (sempre 0 se nessuna colonna usa [`rowspan`](parametri-colonne.md#rowspan)) |
| `updateFooterOnPageChange` | boolean (`false`) | Se `true` `tfootRender` riceve solo i record della pagina corrente (subtotali di pagina) e il footer si aggiorna a ogni cambio pagina; se `false` riceve l'intero set filtrato e si aggiorna solo al cambio filtro |

**Nota sulle icone**: ogni icona può essere una stringa SVG/HTML (es. import `?inline`), un Node, un oggetto domBuilder o una funzione che restituisce uno di questi valori.

## `classes`

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

## `labels`

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


### Segnaposto di `labels.info` / `infoText`:

| Segnaposto | Valore |
|---|---|
| `{end}` | indice dell'ultimo record della pagina corrente |
| `{filteredRec}` | totale dei record dopo il filtro |
| `{page}` | pagina corrente |
| `{start}` | indice (da 1) del primo record della pagina corrente, nel set filtrato |
| `{totPages}` | numero di pagine |
| `{totRec}` | totale dei record non filtrati (dal JSON, vedi `totRecField`, o lunghezza dei dati) |

I numeri vengono formattati secondo `locale`.


[↰ Indice](../json-table-docs.md)
