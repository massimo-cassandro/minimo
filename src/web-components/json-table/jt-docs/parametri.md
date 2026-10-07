# Parametri

[Torna alla pagina iniziale](../jt-docs.md)

Tutti i parametri sono impostabili sia da attributo HTML che come oggetto in `init({...})`. I valori di tipo funzione solo da `init()`.

| Parametro | Tipo / default | Descrizione |
|---|---|---|
| `debug` | boolean (`false`) | Log in console di parametri, colonne, dati, stato ed elementi generati |
| `jsonUrl` | string (`null`) | URL del JSON da caricare. Ignorato se `data` è presente |
| `jqDatatableMode` | boolean (`false`) | Se `true` imposta come default i valori compatibili con il formato server-side di jQuery DataTables: `jsonDataField: 'data'`, `totRecField: 'recordsTotal'`, `filteredRecField: 'recordsFiltered'`, `serverSide: true` e i `serverParams` indicati in "Modalità jQuery DataTables". Ogni valore resta sovrascrivibile |
| `jsonDataField` | string o null (`'data'`) | Chiave del JSON che contiene l'array delle righe (es. `'data'` per `{ data: [...] }`); `null` o `''` = la root del JSON è l'array stesso |
| `totRecField` | string (`'totRec'`) | Chiave del JSON con il totale dei record (numerico); se assente o non numerico il totale è la lunghezza dell'array |
| `filteredRecField` | string (`'filteredRec'`) | Solo server-side: chiave del JSON con il numero di record che soddisfano la ricerca corrente; se assente vale `totRecField` |
| `data` | Array&lt;Object&gt; (`null`) | Righe inline; prevale su `jsonUrl`. Da attributo va passato come stringa JSON ed è sempre inteso come array delle righe (`jsonDataField` ignorato) |
| `cols` | ColDefinition[] | **OBBLIGATORIO**: definizione delle colonne (vedi sotto). Se assente o vuoto viene segnalato un errore in console e la tabella non viene generata |
| `dataTypes` | Object (`{}`) | Tipi di dato personalizzati, uniti a quelli predefiniti (vedi sotto) |
| `caption` | string o Function (`null`) | Caption della tabella (testo o HTML), oppure funzione che restituisce stringa o Node. Mostrata sotto la tabella (vedi "Caption e paginazione") |
| `search` | boolean (`true`) | Genera l'input di ricerca |
| `searchDebounce` | number (`300`) | Millisecondi di attesa dopo l'ultimo tasto prima di eseguire la ricerca |
| `perPage` | number (`25`) | Righe per pagina; `0` = nessuna paginazione (tutte le righe, nessuna navigazione) |
| `paginationDelta` | number (`2`) | Pulsanti pagina mostrati a ciascun lato della pagina corrente |
| `serverSide` | boolean (`false`) | Paginazione, ordinamento e ricerca delegati al server (vedi "Modalità server-side"). Richiede `jsonUrl` |
| `serverParams` | Object | Nomi dei parametri di query string in modalità server-side, uniti ai default (vedi sotto) |
| `initialSort` | { key, dir } o null (`null`) | Ordinamento applicato al caricamento, es. `{ key: 'name', dir: 'asc' }` |
| `tfoot` | boolean (`false`) | Genera il tfoot (vedi `tfootRender` delle colonne). Non disponibile in modalità server-side |
| `updateFooterOnPageChange` | boolean (`false`) | Se `true` `tfootRender` riceve solo i record della pagina corrente (subtotali di pagina) e il footer si aggiorna a ogni cambio pagina; se `false` riceve l'intero set filtrato e si aggiorna solo al cambio filtro |
| `infoText` | string, Function o null (`null`) | Contenuto dell'area info: stringa mustache-like con i segnaposto `{start}`, `{end}`, `{totRec}`, `{filteredRec}`, `{page}`, `{totPages}`, oppure funzione `(start, end, totRec, filteredRec, page, totPages) => string\|Node`. `null` = viene usato `labels.info` |
| `template` | Array (`[{ slot: 'infoSection' }, { slot: 'table' }]`) | Layout del contenitore principale (vedi "Template") |
| `locale` | string (`'it-IT'`) | Locale per numeri, date e confronto stringhe nell'ordinamento |
| `currency` | string (`'EUR'`) | Codice ISO 4217 usato dal tipo `currency` |
| `datesLocaleOpts` | Intl.DateTimeFormatOptions (`{ year: 'numeric', month: 'short', day: 'numeric' }`) | Parte data dei tipi date/datetime |
| `timesLocaleOpts` | Intl.DateTimeFormatOptions (`{ hour12: false, hour: '2-digit', minute: '2-digit' }`) | Parte ora del tipo datetime |
| `numbersLocaleOpts` | Intl.NumberFormatOptions (`{ maximumFractionDigits: 2 }`) | Tipo `num` |
| `currPercLocaleOpts` | Intl.NumberFormatOptions (`{ minimumFractionDigits: 2, maximumFractionDigits: 2 }`) | Tipi currency/euro/perc/percDecimal |
| `renderNullAs` | string o null (`'—'`) | Contenuto per i valori null/undefined |
| `renderZeroAs` | string o null (`null`) | Se non null, contenuto per i valori numerici pari a zero |
| `renderNaNAs` | string o null (`'—'`) | Contenuto per i valori non numerici nei tipi numerici |
| `boolTrueIcon` | icona, vedi nota (icona `check-bold` di minimo (Phosphor)) | Icona per i valori `true` (tipo bool) |
| `boolFalseIcon` | icona, vedi nota (icona `x-bold`) | Icona per i valori `false` |
| `sortAscArrowIcon` | icona, vedi nota (icona `arrow-up`) | Icona del pulsante di ordinamento, ordinamento asc attivo |
| `sortDescArrowIcon` | icona, vedi nota (icona `arrow-down`) | Icona del pulsante di ordinamento, ordinamento desc attivo |
| `sortNoneArrowIcon` | icona, vedi nota (icona `arrows-down-up`) | Icona del pulsante di ordinamento, nessun ordinamento |
| `paginationPrevIcon` | icona, vedi nota (icona `caret-left`) | Icona del pulsante "pagina precedente" |
| `paginationNextIcon` | icona, vedi nota (icona `caret-right`) | Icona del pulsante "pagina successiva" |
| `trCallback` | (tr, row, params) => void (`null`) | Callback invocata dopo il rendering di ogni riga del body |
| `tableId` | string (`null`) | Id del tag `<table>` |
| `classes` | Object | Classi consumer (vedi sotto), unite ai default |
| `labels` | Object | Testi (vedi sotto), uniti ai default |

**Nota sulle icone**: ogni icona può essere una stringa SVG/HTML (es. import `?inline`), un Node, un oggetto domBuilder o una funzione che restituisce uno di questi valori.

## `classes`

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

## `labels`

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
