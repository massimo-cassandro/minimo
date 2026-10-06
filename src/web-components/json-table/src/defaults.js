/*! minimo - json-table: defaults */

import {
  boolTrueIcon, boolFalseIcon, sortAscArrowIcon, sortDescArrowIcon, sortNoneArrowIcon,
  paginationPrevIcon, paginationNextIcon
} from './icons.js';

/**
 * Contenuto accettato da ogni cella / intestazione / area informativa: testo semplice, stringa HTML, numero,
 * nodo DOM o array domBuilder. `null` viene reso come `renderNullAs`, `undefined` lascia proseguire la
 * pipeline di rendering predefinita (vedi `cell-content.js`).
 * @typedef {string|number|Node|DomBuilderItem[]|null|undefined} CellContent
 */

/**
 * Icona / markup usato per i booleani e per i pulsanti di ordinamento e paginazione: una stringa SVG/HTML (ad es. un
 * import `.svg?inline`), un nodo DOM, un elemento domBuilder o una funzione che ne restituisce uno.
 * @typedef {string|Node|DomBuilderItem|(() => string|Node|DomBuilderItem)} IconDef
 */

/**
 * Renderer delle celle di una colonna. Gli argomenti sono posizionali (tutti opzionali) per tenere il caso
 * più semplice (`row => row.name`) il più breve possibile.
 * @callback ColRender
 * @param {Object} row - L'oggetto dati della riga corrente
 * @param {HTMLTableRowElement} [tr] - L'elemento `<tr>` della riga corrente
 * @param {HTMLTableCellElement} [td] - L'elemento cella (`<td>` o `<th scope="row">`)
 * @returns {CellContent|void} Contenuto della cella; `undefined` (nessun `return`) ripiega sul rendering del data type,
 *   `null` su `renderNullAs`
 */

/**
 * Renderer delle celle del footer.
 * @callback TfootRender
 * @param {Object[]} rows - L'intero insieme di dati filtrato, oppure solo la pagina corrente quando `updateFooterOnPageChange` è true
 * @param {HTMLTableCellElement} [td] - L'elemento cella del footer
 * @returns {CellContent}
 */

/**
 * Definizione di una colonna (elementi di `cols`).
 *
 * @typedef {Object} ColDefinition
 * @property {string} key - OBBLIGATORIO: chiave dell'oggetto riga (notazione con punto ammessa per i valori annidati, es. `owner.name`)
 * @property {CellContent|(() => CellContent)} [title] - Contenuto dell'intestazione (testo, HTML, Node, array domBuilder o funzione).
 *   Quando la colonna è ordinabile è il testo del pulsante di ordinamento (default: la chiave stessa)
 * @property {string} [dataType] - Data type, una delle chiavi di `dataTypes`. `type` è accettato come alias (default: 'string')
 * @property {string} [type] - Alias di `dataType`
 * @property {ColRender|string|null} [render] - Renderer della cella: una funzione `(row, tr, td) => content` oppure,
 *   anche tramite attributo HTML, una stringa in stile mustache in cui i segnaposto `[[key]]` vengono sostituiti con i valori
 *   della riga (chiavi annidate ammesse). Sovrascrive il rendering del data type (default: null)
 * @property {TfootRender|string|null} [tfootRender] - Contenuto della cella del footer (solo quando `tfoot` è true): una funzione
 *   `(rows, td) => content`, una stringa statica o uno degli aggregati predefiniti `'@sum'`, `'@avg'`, `'@min'`,
 *   `'@max'`, `'@count'` calcolati sui valori della colonna e formattati dal data type della colonna.
 *   `null` rende una cella vuota (default: null)
 * @property {boolean} [rowHeading] - Se true la cella è un'intestazione di riga (`<th scope="row">`) (default: false)
 * @property {boolean} [searchable] - Abilita la ricerca su questa colonna (default: true)
 * @property {boolean} [sortable] - Abilita l'ordinamento su questa colonna (default: true)
 * @property {*|((row: Object) => *)} [sortValue] - Valore usato per l'ordinamento, oppure funzione `row => value`.
 *   Sovrascrive il `sortValue` del data type (default: undefined = data type / valore grezzo)
 * @property {*|((row: Object) => *)} [searchValue] - Come `sortValue`, per la ricerca (default: undefined)
 * @property {boolean|((params: JsonTableParams) => boolean)} [condition] - Se false (o una funzione che restituisce
 *   false) la colonna non viene renderizzata affatto (default: true)
 * @property {string|null} [headerClass] - Classe/i del `<th>`, che sostituiscono quelle del data type. Quando è impostato solo uno tra
 *   `headerClass`/`cellClass`, l'altro assume lo stesso valore (default: null)
 * @property {string|null} [cellClass] - Classe/i delle celle del body/footer, che sostituiscono quelle del data type (default: null)
 */

/**
 * Definizione di un data type (valori di `dataTypes`). Ogni funzione è opzionale.
 *
 * @typedef {Object} DataTypeDefinition
 * @property {string|null} [headerClass] - Classe/i predefinite del `<th>` (sovrascrivibili tramite `ColDefinition.headerClass`)
 * @property {string|null} [cellClass] - Classe/i predefinite delle celle (sovrascrivibili tramite `ColDefinition.cellClass`)
 * @property {((value: *, row: Object, params: JsonTableParams) => string|null)} [internalCellClass] - Classe/i sempre
 *   aggiunte alle celle, indipendentemente da `cellClass` (usata dal tipo `bool` predefinito per gli stili delle icone)
 * @property {(value: *, row: Object|null, params: JsonTableParams) => CellContent} [render] - Renderer della cella; non invocato
 *   per i valori `null`/`undefined`, che vengono resi come `renderNullAs`. `row` è null quando la funzione è
 *   usata per formattare un aggregato del footer (`tfootRender: '@sum'`, ...)
 * @property {(value: *, row: Object, params: JsonTableParams) => *} [sortValue] - Valore usato per l'ordinamento (default: valore grezzo)
 * @property {(value: *, row: Object, params: JsonTableParams) => string} [searchValue] - Valore usato per la ricerca (default: `String(value)`)
 * @property {Partial<ColDefinition>} [colDefaults] - Default delle colonne imposti da questo tipo (es. `{ sortable: false }`),
 *   comunque sovrascrivibili nella definizione della colonna
 * @property {string} [inheritsFrom] - Solo per i tipi personalizzati: chiave del tipo predefinito da estendere
 */

/**
 * Nomi di classe del consumer usati dalla struttura generata. Le classi interne di layout (CSS module)
 * vengono sempre applicate in aggiunta a queste.
 *
 * @typedef {Object} JsonTableClasses
 * @property {string|null} [wrapper] - Wrapper principale (`<section>`: sezione info + tabella) (default: null)
 * @property {string|null} [infoOuter] - Contenitore esterno delle info (default: null)
 * @property {string|null} [info] - Contenitore delle info (testo informativo + ricerca) (default: null)
 * @property {string|null} [resultInfo] - Contenitore del testo informativo (default: null)
 * @property {string|null} [search] - Wrapper dell'input di ricerca (default: null)
 * @property {string|null} [searchInput] - Input di ricerca (default: 'form-control form-control-sm')
 * @property {string|null} [tableWrapper] - Div che racchiude la tabella (default: 'table-responsive')
 * @property {string|null} [table] - Elemento `<table>` (default: 'table table-bordered')
 * @property {string|null} [tableFooter] - Barra sotto la tabella che contiene caption e paginazione (default: null)
 * @property {string|null} [caption] - Contenitore della caption dentro la barra del footer della tabella (default: null)
 * @property {string|null} [pagination] - `<nav>` della paginazione (default: null)
 * @property {string|null} [paginationBtn] - Pulsanti di paginazione (default: 'btn-reset')
 * @property {string|null} [sortBtn] - Pulsanti di ordinamento dentro il `<th>` (default: 'btn-reset')
 * @property {string|null} [empty] - L'unica cella mostrata quando non ci sono righe (default: null)
 * @property {string|null} [textStart] - Classe di allineamento inline-start (default: null, le celle di minimo sono allineate all'inizio di default)
 * @property {string|null} [textCenter] - Classe di allineamento al centro (default: 'text-center')
 * @property {string|null} [textEnd] - Classe di allineamento inline-end (default: 'text-end')
 * @property {string|null} [nowrap] - Classe no-wrap (default: 'text-nowrap')
 * @property {string|null} [numeric] - Classe per le cifre tabulari, usata dai tipi numerici (default: 'text-numeric')
 * @property {string|null} [boolCell] - Classe extra di ogni cella `bool` (default: null)
 * @property {string|null} [boolTrue] - Classe extra delle celle `bool` il cui valore è `true` (default: null)
 * @property {string|null} [boolFalse] - Classe extra delle celle `bool` il cui valore è `false` (default: null)
 */

/**
 * Testi usati dal componente. Il segnaposto `{page}` delle label di paginazione viene sostituito
 * con il numero di pagina.
 *
 * @typedef {Object} JsonTableLabels
 * @property {string} [loading] - Placeholder di caricamento (nascosto visivamente) (default: 'Caricamento dati…')
 * @property {string} [searchPlaceholder] - Placeholder dell'input di ricerca (default: 'Cerca...')
 * @property {string} [searchTitle] - `title` dell'input di ricerca (default: 'Cerca nella tabella')
 * @property {string} [searchAriaLabel] - `aria-label` dell'input di ricerca (default: 'Filtra risultati')
 * @property {string} [info] - Template del testo informativo, segnaposto: `{start}`, `{end}`, `{totRec}`, `{filteredRec}`,
 *   `{page}`, `{totPages}` (default: 'Stai visualizzando le righe da {start} a {end}, su un totale di {filteredRec} record trovati')
 * @property {string} [noRows] - Testo informativo e contenuto della cella vuota quando l'insieme di dati è vuoto (default: 'Nessun record trovato')
 * @property {string} [noResults] - Come `noRows`, quando una ricerca non restituisce nulla (default: 'Nessun risultato per la ricerca')
 * @property {string} [sortAsc] - `aria-label`/`title` del pulsante di ordinamento quando il prossimo click ordina in modo crescente
 *   (default: 'Ordina questa colonna in senso ascendente (A → Z)')
 * @property {string} [sortDesc] - Come sopra, decrescente (default: 'Ordina questa colonna in senso discendente (Z → A)')
 * @property {string} [sortNone] - Come sopra, rimozione dell'ordinamento (default: 'Rimuovi l’ordinamento a questa colonna')
 * @property {string} [paginationAriaLabel] - `aria-label` del `<nav>` della paginazione (default: 'Navigazione pagine')
 * @property {string} [prevPage] - `aria-label`/`title` del pulsante pagina precedente (default: 'Pagina precedente')
 * @property {string} [nextPage] - Come sopra, pulsante pagina successiva (default: 'Pagina successiva')
 * @property {string} [pageTitle] - `aria-label`/`title` dei pulsanti di pagina (default: 'Vai a pagina {page}')
 * @property {string} [currentPage] - `aria-label`/`title` del pulsante della pagina corrente (default: 'Pagina {page}, corrente')
 */

/**
 * Funzione del testo informativo.
 * @callback InfoTextFn
 * @param {number} start - Indice (da 1) della prima riga visualizzata
 * @param {number} end - Indice dell'ultima riga visualizzata
 * @param {number} totRec - Numero totale di record (non filtrati)
 * @param {number} filteredRec - Numero di record dopo il filtro
 * @param {number} page - Pagina corrente (da 1)
 * @param {number} totPages - Numero totale di pagine
 * @returns {CellContent}
 */

/**
 * Nomi delle parti predefinite del template.
 * @typedef {'infoSection'|'resultInfo'|'search'|'table'|'caption'|'pagination'} TemplateSlot
 */

/**
 * Elemento del template: un elemento domBuilder (i cui `children`/`content` possono contenere altri elementi del template)
 * oppure un segnaposto di slot `{ slot: 'name' }` sostituito da una delle parti predefinite.
 * @typedef {(Omit<DomBuilderItem, 'children'|'content'> & {
 *   children?: Array<TemplateItem|string|Node>,
 *   content?: DomBuilderItem['content']|TemplateItem[]
 * }) | { slot: TemplateSlot }} TemplateItem
 */

/**
 * Stato di ordinamento / definizione dell'ordinamento iniziale.
 * @typedef {Object} SortDef
 * @property {string} key - Chiave della colonna
 * @property {'asc'|'desc'} dir - Direzione
 */

/**
 * Nomi dei parametri della query string inviati a `jsonUrl` in modalità server-side (`serverSide: true`).
 * Un valore `null` omette il parametro.
 *
 * @typedef {Object} ServerParams
 * @property {string|null} [page] - Pagina richiesta, da 1 (default: 'page')
 * @property {string|null} [start] - Indice (da 0) del primo record richiesto, cioè `(page - 1) * perPage`,
 *   comodo per le query `LIMIT start, perPage` (default: 'start')
 * @property {string|null} [perPage] - Numero di record per pagina (default: 'perPage')
 * @property {string|null} [sort] - Chiave della colonna ordinata; omesso quando non c'è un ordinamento attivo (default: 'sort')
 * @property {string|null} [dir] - Direzione di ordinamento, `asc`/`desc`; omesso quando non c'è un ordinamento attivo (default: 'dir')
 * @property {string|null} [search] - Termine di ricerca; omesso quando vuoto (default: 'search')
 */

/**
 * Parametri di `<json-table>` (risolti: ogni chiave ha un valore, vedi `defaults`).
 *
 * Ogni parametro può essere impostato come attributo HTML dell'elemento `<json-table>`
 * (i nomi degli attributi non distinguono maiuscole e minuscole, quindi `jsonurl="…"` e `jsonUrl="…"` sono equivalenti)
 * oppure come proprietà dell'oggetto passato a `init()`. I valori che sono funzioni si possono
 * impostare solo tramite `init()`. I parametri oggetto (`classes`, `labels`, `dataTypes`, `serverParams`) vengono
 * uniti ai default, quindi basta passare solo le chiavi da sovrascrivere.
 *
 * Precedenza: `init()` > attributo HTML > `JsonTable.setDefaults()` > default predefinito.
 *
 * @typedef {Object} JsonTableParams
 * @property {boolean} debug - Scrive in console i parametri risolti, le colonne, i dati e gli elementi generati (default: false)
 * @property {string|null} jsonUrl - URL del JSON da recuperare. Ignorato quando `data` è impostato (default: null)
 * @property {string|null} jsonDataField - Chiave del JSON recuperato che contiene l'array delle righe (es. `{ data: [...] }`);
 *   `null` o una stringa vuota significa che la radice del JSON è l'array delle righe stesso (default: 'data')
 * @property {string} totRecField - Chiave del JSON recuperato che contiene il numero totale di record (numerico);
 *   se mancante o non numerica il totale è la lunghezza dell'array delle righe (default: 'totRec')
 * @property {string} filteredRecField - Solo modalità server-side: chiave del JSON recuperato che contiene il numero di
 *   record che corrispondono alla ricerca corrente (numerico); se mancante viene usato il valore di `totRecField` (default: 'filteredRec')
 * @property {Array<Object>|null} data - Righe inline (array di oggetti semplici); ha la precedenza su `jsonUrl`.
 *   Come attributo HTML deve essere una stringa JSON, sempre trattata come l'array delle righe stesso
 *   (`jsonDataField` viene ignorato) (default: null)
 * @property {ColDefinition[]} cols - OBBLIGATORIO: definizione delle colonne (default: [])
 * @property {Object<string, DataTypeDefinition>} dataTypes - Data type personalizzati, uniti a quelli predefiniti
 *   (`string`, `num`, `id`, `perc`, `percDecimal`, `currency`, `euro`, `date`, `datetime`, `bool`, `email`).
 *   Una chiave che corrisponde a un tipo predefinito ne sovrascrive solo le proprietà indicate (default: {})
 * @property {string|Function|null} caption - Caption della tabella, mostrata sotto la tabella (lato iniziale della barra del footer)
 *   e collegata alla tabella tramite `aria-labelledby`: una stringa (testo semplice o HTML) oppure, solo tramite `init()`, una funzione
 *   che restituisce una stringa o un Node (default: null)
 * @property {boolean} search - Se renderizzare l'input di ricerca (default: true)
 * @property {number} searchDebounce - Ritardo (ms) tra l'ultima pressione di un tasto e l'esecuzione della ricerca (default: 300)
 * @property {number} perPage - Righe per pagina; `0` disattiva la paginazione (tutte le righe in una sola pagina, nessuna
 *   navigazione) (default: 25)
 * @property {number} paginationDelta - Numero di pulsanti di pagina mostrati per lato rispetto alla pagina corrente (default: 2)
 * @property {boolean} serverSide - Modalità server-side: paginazione, ordinamento e ricerca sono delegati al server.
 *   Ogni cambiamento attiva una nuova richiesta a `jsonUrl` (vedi `serverParams`) e si presume che il JSON contenga solo le
 *   righe della pagina richiesta, più `totRecField` e `filteredRecField`. Richiede `jsonUrl`; `tfoot` non è
 *   disponibile in questa modalità (default: false)
 * @property {ServerParams} serverParams - Solo modalità server-side: nomi dei parametri della query string (vedi `ServerParams`)
 * @property {SortDef|null} initialSort - Ordinamento applicato al caricamento, es. `{ key: 'name', dir: 'asc' }` (default: null)
 * @property {boolean} tfoot - Se renderizzare il `<tfoot>` (vedi `ColDefinition.tfootRender`); ignorato in
 *   modalità server-side (default: false)
 * @property {boolean} updateFooterOnPageChange - Se true, `tfootRender` riceve solo le righe della pagina corrente
 *   (subtotali di pagina) e il footer viene aggiornato a ogni cambio di pagina; se false riceve l'intero
 *   insieme filtrato e viene aggiornato solo ai cambi di filtro (default: false)
 * @property {string|InfoTextFn|null} infoText - Contenuto dell'area informativa: una stringa in stile mustache (segnaposto
 *   `{start}`, `{end}`, `{totRec}`, `{filteredRec}`, `{page}`, `{totPages}`) oppure una funzione
 *   `(start, end, totRec, filteredRec, page, totPages) => content`. `null` usa `labels.info` (default: null)
 * @property {TemplateItem[]|((parts: Object<string, DomBuilderItem>, params: JsonTableParams) => TemplateItem[])} template -
 *   Layout del contenuto del wrapper principale, come array domBuilder in cui gli elementi `{ slot: 'name' }` vengono sostituiti dalle
 *   parti predefinite `infoSection` (testo informativo + ricerca), `resultInfo`, `search`, `table`, `caption`, `pagination`.
 *   `caption` e `pagination` sono inclusi nella parte `table` (barra del footer) a meno che siano collocati esplicitamente.
 *   È accettata anche una funzione che riceve le parti e restituisce l'array (solo tramite `init()`)
 *   (default: [{ slot: 'infoSection' }, { slot: 'table' }])
 * @property {string} locale - Locale usato per formattare numeri e date e per confrontare le stringhe durante l'ordinamento (default: 'it-IT')
 * @property {string} currency - Codice ISO 4217 usato dal data type `currency` (default: 'EUR')
 * @property {Intl.DateTimeFormatOptions} datesLocaleOpts - Opzioni per la parte data di `date`/`datetime`
 *   (default: { year: 'numeric', month: 'short', day: 'numeric' })
 * @property {Intl.DateTimeFormatOptions} timesLocaleOpts - Opzioni per la parte oraria di `datetime`
 *   (default: { hour12: false, hour: '2-digit', minute: '2-digit' })
 * @property {Intl.NumberFormatOptions} numbersLocaleOpts - Opzioni per il tipo `num` (default: { maximumFractionDigits: 2 })
 * @property {Intl.NumberFormatOptions} currPercLocaleOpts - Opzioni per i tipi `currency`/`euro`/`perc`/`percDecimal`
 *   (default: { minimumFractionDigits: 2, maximumFractionDigits: 2 })
 * @property {string|null} renderNullAs - Contenuto mostrato per i valori `null`/`undefined` (default: '—')
 * @property {string|null} renderZeroAs - Se non null, contenuto mostrato per i valori numerici uguali a zero (default: null)
 * @property {string|null} renderNaNAs - Contenuto mostrato dai tipi numerici per i valori non numerici (default: '—')
 * @property {IconDef} boolTrueIcon - Icona dei valori `true` nelle colonne `bool` (default: icona `check-bold` di minimo)
 * @property {IconDef} boolFalseIcon - Icona dei valori `false` nelle colonne `bool` (default: icona `x-bold` di minimo)
 * @property {IconDef} sortAscArrowIcon - Icona del pulsante di ordinamento, ordinamento crescente attivo (default: icona `arrow-up` di minimo)
 * @property {IconDef} sortDescArrowIcon - Icona del pulsante di ordinamento, ordinamento decrescente attivo (default: icona `arrow-down` di minimo)
 * @property {IconDef} sortNoneArrowIcon - Icona del pulsante di ordinamento, nessun ordinamento attivo (default: icona `arrows-down-up` di minimo)
 * @property {IconDef} paginationPrevIcon - Icona del pulsante pagina precedente (default: icona `caret-left` di minimo)
 * @property {IconDef} paginationNextIcon - Icona del pulsante pagina successiva (default: icona `caret-right` di minimo)
 * @property {((tr: HTMLTableRowElement, row: Object, params: JsonTableParams) => void)|null} trCallback - Callback
 *   invocata dopo il rendering di ogni riga del body (default: null)
 * @property {string|null} tableId - Attributo `id` dell'elemento `<table>` (default: null)
 * @property {JsonTableClasses} classes - Nomi di classe del consumer (vedi `JsonTableClasses`)
 * @property {JsonTableLabels} labels - Testi (vedi `JsonTableLabels`)
 */

/**
 * Nomi dei parametri oggetto il cui valore viene unito in modo superficiale tra le sorgenti
 * (default predefinito ← `setDefaults()` ← attributo HTML ← `init()`) invece di essere sostituito.
 * @type {ReadonlyArray<keyof JsonTableParams>}
 */
export const mergedParams = ['classes', 'labels', 'dataTypes', 'serverParams'];

/**
 * Default predefiniti.
 *
 * @type {JsonTableParams}
 *
 * @example
 * {
 *   debug: false,
 *   jsonUrl: null,
 *   jsonDataField: 'data',
 *   totRecField: 'totRec',
 *   filteredRecField: 'filteredRec',
 *   data: null,
 *   cols: [],                          // obbligatorio
 *   dataTypes: {},
 *   caption: null,
 *   search: true,
 *   searchDebounce: 300,
 *   perPage: 25,                       // 0 = nessuna paginazione
 *   paginationDelta: 2,
 *   serverSide: false,
 *   serverParams: { page: 'page', start: 'start', perPage: 'perPage', sort: 'sort', dir: 'dir', search: 'search' },
 *   initialSort: null,                 // es. { key: 'name', dir: 'asc' }
 *   tfoot: false,
 *   updateFooterOnPageChange: false,
 *   infoText: null,                    // → labels.info
 *   template: [{ slot: 'infoSection' }, { slot: 'table' }],
 *   locale: 'it-IT',
 *   currency: 'EUR',
 *   datesLocaleOpts: { year: 'numeric', month: 'short', day: 'numeric' },
 *   timesLocaleOpts: { hour12: false, hour: '2-digit', minute: '2-digit' },
 *   numbersLocaleOpts: { maximumFractionDigits: 2 },
 *   currPercLocaleOpts: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
 *   renderNullAs: '—',
 *   renderZeroAs: null,
 *   renderNaNAs: '—',
 *   boolTrueIcon: '<svg …>',           // minimo check-bold
 *   boolFalseIcon: '<svg …>',          // minimo x-bold
 *   sortAscArrowIcon: '<svg …>',       // minimo arrow-up
 *   sortDescArrowIcon: '<svg …>',      // minimo arrow-down
 *   sortNoneArrowIcon: '<svg …>',      // minimo arrows-down-up
 *   paginationPrevIcon: '<svg …>',     // minimo caret-left
 *   paginationNextIcon: '<svg …>',     // minimo caret-right
 *   trCallback: null,
 *   tableId: null,
 *   classes: { … },                    // vedi JsonTableClasses
 *   labels: { … }                      // vedi JsonTableLabels
 * }
 */
export const defaults = {
  debug: false,

  jsonUrl: null,
  jsonDataField: 'data',
  totRecField: 'totRec',
  filteredRecField: 'filteredRec',
  data: null,

  cols: [],
  dataTypes: {},

  caption: null,
  search: true,
  searchDebounce: 300,

  perPage: 25,
  paginationDelta: 2,
  serverSide: false,
  serverParams: {
    page: 'page',
    start: 'start',
    perPage: 'perPage',
    sort: 'sort',
    dir: 'dir',
    search: 'search'
  },
  initialSort: null,

  tfoot: false,
  updateFooterOnPageChange: false,
  infoText: null,

  template: [{ slot: 'infoSection' }, { slot: 'table' }],

  locale: 'it-IT',
  currency: 'EUR',
  datesLocaleOpts: { year: 'numeric', month: 'short', day: 'numeric' },
  timesLocaleOpts: { hour12: false, hour: '2-digit', minute: '2-digit' },
  numbersLocaleOpts: { maximumFractionDigits: 2 },
  currPercLocaleOpts: { minimumFractionDigits: 2, maximumFractionDigits: 2 },

  renderNullAs: '—',
  renderZeroAs: null,
  renderNaNAs: '—',

  boolTrueIcon,
  boolFalseIcon,
  sortAscArrowIcon,
  sortDescArrowIcon,
  sortNoneArrowIcon,
  paginationPrevIcon,
  paginationNextIcon,

  trCallback: null,

  tableId: null,

  classes: {
    wrapper: null,
    infoOuter: null,
    info: null,
    resultInfo: null,
    search: null,
    searchInput: 'form-control form-control-sm',
    tableWrapper: 'table-responsive',
    table: 'table table-bordered',
    tableFooter: null,
    caption: null,
    pagination: null,
    paginationBtn: 'btn-reset',
    sortBtn: 'btn-reset',
    empty: null,
    textStart: null,
    textCenter: 'text-center',
    textEnd: 'text-end',
    nowrap: 'text-nowrap',
    numeric: 'text-numeric',
    boolCell: null,
    boolTrue: null,
    boolFalse: null
  },

  labels: {
    loading: 'Caricamento dati…',
    searchPlaceholder: 'Cerca...',
    searchTitle: 'Cerca nella tabella',
    searchAriaLabel: 'Filtra risultati',
    info: 'Stai visualizzando le righe da {start} a {end}, su un totale di {filteredRec} record trovati',
    noRows: 'Nessun record trovato',
    noResults: 'Nessun risultato per la ricerca',
    sortAsc: 'Ordina questa colonna in senso ascendente (A → Z)',
    sortDesc: 'Ordina questa colonna in senso discendente (Z → A)',
    sortNone: 'Rimuovi l’ordinamento a questa colonna',
    paginationAriaLabel: 'Navigazione pagine',
    prevPage: 'Pagina precedente',
    nextPage: 'Pagina successiva',
    pageTitle: 'Vai a pagina {page}',
    currentPage: 'Pagina {page}, corrente'
  }
};
