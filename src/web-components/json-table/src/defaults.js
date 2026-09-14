/*! minimo - json-table: defaults */

import { boolTrueIcon, boolFalseIcon, sortAscArrowIcon, sortDescArrowIcon, sortNoneArrowIcon } from './icons.js';

/**
 * Content accepted by every cell / heading / info area: plain text, HTML string, number,
 * DOM node or domBuilder array. `null` is rendered as `renderNullAs`, `undefined` lets the
 * default rendering pipeline go on (see `cell-content.js`).
 * @typedef {string|number|Node|DomBuilderItem[]|null|undefined} CellContent
 */

/**
 * Icon / markup used for booleans and sort buttons: an SVG/HTML string (e.g. an `.svg?inline`
 * import), a DOM node, a domBuilder item, or a function returning one of them.
 * @typedef {string|Node|DomBuilderItem|(() => string|Node|DomBuilderItem)} IconDef
 */

/**
 * Column cell renderer. Arguments are positional (all optional) to keep the simplest
 * case (`row => row.name`) as short as possible.
 * @callback ColRender
 * @param {Object} row - The data object of the current row
 * @param {HTMLTableRowElement} [tr] - The `<tr>` element of the current row
 * @param {HTMLTableCellElement} [td] - The cell element (`<td>` or `<th scope="row">`)
 * @returns {CellContent} Cell content; `undefined` falls back to the data type rendering, `null` to `renderNullAs`
 */

/**
 * Footer cell renderer.
 * @callback TfootRender
 * @param {Object[]} rows - The whole filtered data set, or the current page only when `updateFooterOnPageChange` is true
 * @param {HTMLTableCellElement} [td] - The footer cell element
 * @returns {CellContent}
 */

/**
 * Column definition (`cols` items).
 *
 * @typedef {Object} ColDefinition
 * @property {string} key - REQUIRED: key of the row object (dot notation allowed for nested values, e.g. `owner.name`)
 * @property {CellContent|(() => CellContent)} [title] - REQUIRED: heading content (text, HTML, Node, domBuilder array or function).
 *   When the column is sortable it is the text of the sort button (default: the key itself)
 * @property {string} [dataType] - Data type, one of the `dataTypes` keys. `type` is accepted as an alias (default: 'string')
 * @property {string} [type] - Alias of `dataType`
 * @property {ColRender|string|null} [render] - Cell renderer: a function `(row, tr, td) => content` or,
 *   via HTML attribute too, a mustache-like string where `[[key]]` placeholders are replaced with the row
 *   values (nested keys allowed). Overrides the data type rendering (default: null)
 * @property {TfootRender|string|null} [tfootRender] - Footer cell content (only when `tfoot` is true): a function
 *   `(rows, td) => content`, a static string, or one of the built-in aggregates `'@sum'`, `'@avg'`, `'@min'`,
 *   `'@max'`, `'@count'` computed on the column values and formatted by the column data type.
 *   `null` renders an empty cell (default: null)
 * @property {boolean} [rowHeading] - When true the cell is a row heading (`<th scope="row">`) (default: false)
 * @property {boolean} [searchable] - Enables the search on this column (default: true)
 * @property {boolean} [sortable] - Enables the sorting on this column (default: true)
 * @property {*|((row: Object) => *)} [sortValue] - Value used for sorting, or function `row => value`.
 *   Overrides the data type `sortValue` (default: undefined = data type / raw value)
 * @property {*|((row: Object) => *)} [searchValue] - Same as `sortValue`, for the search (default: undefined)
 * @property {boolean|((params: JsonTableParams) => boolean)} [condition] - When false (or a function returning
 *   false) the column is not rendered at all (default: true)
 * @property {string|null} [headerClass] - Class(es) of the `<th>`, replacing the data type ones. When only one of
 *   `headerClass`/`cellClass` is set, the other one takes the same value (default: null)
 * @property {string|null} [cellClass] - Class(es) of the body/footer cells, replacing the data type ones (default: null)
 */

/**
 * Data type definition (`dataTypes` values). Every function is optional.
 *
 * @typedef {Object} DataTypeDefinition
 * @property {string|null} [headerClass] - Default class(es) of the `<th>` (overridable via `ColDefinition.headerClass`)
 * @property {string|null} [cellClass] - Default class(es) of the cells (overridable via `ColDefinition.cellClass`)
 * @property {((value: *, row: Object, params: JsonTableParams) => string|null)} [internalCellClass] - Class(es) always
 *   added to the cells, regardless of `cellClass` (used by the built-in `bool` type for the icon styles)
 * @property {(value: *, row: Object|null, params: JsonTableParams) => CellContent} [render] - Cell renderer; not invoked
 *   for `null`/`undefined` values, which are rendered as `renderNullAs`. `row` is null when the function is
 *   used to format a footer aggregate (`tfootRender: '@sum'`, ...)
 * @property {(value: *, row: Object, params: JsonTableParams) => *} [sortValue] - Value used for sorting (default: raw value)
 * @property {(value: *, row: Object, params: JsonTableParams) => string} [searchValue] - Value used for searching (default: `String(value)`)
 * @property {Partial<ColDefinition>} [colDefaults] - Column defaults forced by this type (e.g. `{ sortable: false }`),
 *   still overridable in the column definition
 * @property {string} [inheritsFrom] - Custom types only: key of the built-in type to extend
 */

/**
 * Consumer class names used by the generated structure. Internal layout classes (CSS module)
 * are always applied in addition to these.
 *
 * @typedef {Object} JsonTableClasses
 * @property {string|null} [wrapper] - Main wrapper (`<section>`: info section + table) (default: null)
 * @property {string|null} [infoOuter] - Outer info container (default: null)
 * @property {string|null} [info] - Info container (info text + search) (default: null)
 * @property {string|null} [resultInfo] - Info text container (default: null)
 * @property {string|null} [search] - Search input wrapper (default: null)
 * @property {string|null} [searchInput] - Search input (default: 'form-control form-control-sm')
 * @property {string|null} [tableWrapper] - Div wrapping the table (default: 'table-responsive')
 * @property {string|null} [table] - `<table>` element (default: 'table table-bordered')
 * @property {string|null} [sortBtn] - Sort buttons inside the `<th>` (default: 'btn-reset')
 * @property {string|null} [empty] - The single cell shown when there are no rows (default: null)
 * @property {string|null} [textStart] - Inline-start alignment class (default: null, minimo cells are start-aligned by default)
 * @property {string|null} [textCenter] - Center alignment class (default: 'text-center')
 * @property {string|null} [textEnd] - Inline-end alignment class (default: 'text-end')
 * @property {string|null} [nowrap] - No-wrap class (default: 'text-nowrap')
 * @property {string|null} [numeric] - Tabular figures class, used by numeric types (default: 'text-numeric')
 * @property {string|null} [boolCell] - Extra class of every `bool` cell (default: null)
 * @property {string|null} [boolTrue] - Extra class of `bool` cells whose value is `true` (default: null)
 * @property {string|null} [boolFalse] - Extra class of `bool` cells whose value is `false` (default: null)
 */

/**
 * Texts used by the component.
 *
 * @typedef {Object} JsonTableLabels
 * @property {string} [loading] - Loading placeholder (visually hidden) (default: 'Caricamento dati…')
 * @property {string} [searchPlaceholder] - Search input placeholder (default: 'Cerca...')
 * @property {string} [searchTitle] - Search input `title` (default: 'Cerca nella tabella')
 * @property {string} [searchAriaLabel] - Search input `aria-label` (default: 'Filtra risultati')
 * @property {string} [info] - Info text template, placeholders: `{start}`, `{end}`, `{totRec}`, `{filteredRec}`
 *   (default: 'Stai visualizzando le righe da {start} a {end}, su un totale di {filteredRec} record trovati')
 * @property {string} [noRows] - Info text and empty cell content when the data set is empty (default: 'Nessun record trovato')
 * @property {string} [noResults] - Same as `noRows`, when a search returns nothing (default: 'Nessun risultato per la ricerca')
 * @property {string} [sortAsc] - `aria-label`/`title` of the sort button when the next click sorts ascending
 *   (default: 'Ordina questa colonna in senso ascendente (A → Z)')
 * @property {string} [sortDesc] - Same, descending (default: 'Ordina questa colonna in senso discendente (Z → A)')
 * @property {string} [sortNone] - Same, sorting removal (default: 'Rimuovi l’ordinamento a questa colonna')
 */

/**
 * Info text function.
 * @callback InfoTextFn
 * @param {number} start - Index (1-based) of the first displayed row
 * @param {number} end - Index of the last displayed row
 * @param {number} totRec - Total number of records (unfiltered)
 * @param {number} filteredRec - Number of records after filtering
 * @returns {CellContent}
 */

/**
 * Template item: a domBuilder item or a slot placeholder replaced with one of the built-in parts.
 * @typedef {DomBuilderItem & { slot?: 'infoSection'|'resultInfo'|'search'|'table' }} TemplateItem
 */

/**
 * `<json-table>` parameters.
 *
 * Every parameter can be set either as an HTML attribute of the `<json-table>` element
 * (attribute names are case-insensitive, so `jsonurl="…"` and `jsonUrl="…"` are equivalent)
 * or as a property of the object passed to `init()`. Values that are functions can only be
 * set via `init()`. Object parameters (`classes`, `labels`, `dataTypes`) are merged with the
 * defaults, so only the keys to override need to be passed.
 *
 * Precedence: `init()` > HTML attribute > `JsonTable.setDefaults()` > built-in default.
 *
 * TODO paginazione (`jsonMaxLength`/`jsonPaginationParams`, `refs`) e ordinamento/ricerca: step successivi
 *
 * @typedef {Object} JsonTableParams
 * @property {boolean} [debug] - Logs resolved params, columns, data and generated elements to the console (default: false)
 * @property {string|null} [jsonUrl] - URL of the JSON to fetch. Ignored when `data` is set (default: null)
 * @property {string|null} [jsonDataField] - Key of the fetched JSON holding the rows array (e.g. `{ data: [...] }`);
 *   `null` or an empty string means the JSON root is the rows array itself (default: 'data')
 * @property {string} [totRecField] - Key of the fetched JSON holding the total number of records (numeric), for
 *   paginated JSON sources; when missing or not numeric the total is the rows array length (default: 'totRec')
 * @property {Array<Object>|null} [data] - Inline rows (array of plain objects); takes precedence over `jsonUrl`.
 *   As an HTML attribute it must be a JSON string, which is always treated as the rows array itself
 *   (`jsonDataField` is ignored) (default: null)
 * @property {ColDefinition[]} [cols] - Columns definition. When empty, one `string` column per key of the first
 *   row is generated (default: [])
 * @property {Object<string, DataTypeDefinition>} [dataTypes] - Custom data types, merged with the built-in ones
 *   (`string`, `num`, `id`, `perc`, `percDecimal`, `currency`, `euro`, `date`, `datetime`, `bool`, `email`).
 *   A key matching a built-in type overrides only the given properties (default: {})
 * @property {string|Function|null} [caption] - Table caption: a string (plain text or HTML) or, via `init()` only,
 *   a function returning a string or a Node (default: null)
 * @property {boolean} [search] - Whether to render the search input (default: true)
 * @property {boolean} [tfoot] - Whether to render the `<tfoot>` (see `ColDefinition.tfootRender`) (default: false)
 * @property {boolean} [updateFooterOnPageChange] - When true, `tfootRender` receives the rows of the current page
 *   only (page subtotals) and the footer is updated on every page change; when false it receives the whole
 *   filtered set and is updated on filter changes only (default: false)
 * @property {string|InfoTextFn|null} [infoText] - Info area content: a mustache-like string (placeholders
 *   `{start}`, `{end}`, `{totRec}`, `{filteredRec}`) or a function `(start, end, totRec, filteredRec) => content`.
 *   `null` uses `labels.info` (default: null)
 * @property {TemplateItem[]|((parts: Object<string, DomBuilderItem>, params: JsonTableParams) => TemplateItem[])} [template] -
 *   Layout of the main wrapper content, as a domBuilder array where `{ slot: 'name' }` items are replaced with the
 *   built-in parts `infoSection` (info text + search), `resultInfo`, `search`, `table`. A function receiving the
 *   parts and returning the array is accepted too (`init()` only)
 *   (default: [{ slot: 'infoSection' }, { slot: 'table' }])
 * @property {string} [locale] - Locale used to format numbers and dates (default: 'it-IT')
 * @property {string} [currency] - ISO 4217 code used by the `currency` data type (default: 'EUR')
 * @property {Intl.DateTimeFormatOptions} [datesLocaleOpts] - Options for the date part of `date`/`datetime`
 *   (default: { year: 'numeric', month: 'short', day: 'numeric' })
 * @property {Intl.DateTimeFormatOptions} [timesLocaleOpts] - Options for the time part of `datetime`
 *   (default: { hour12: false, hour: '2-digit', minute: '2-digit' })
 * @property {Intl.NumberFormatOptions} [numbersLocaleOpts] - Options for the `num` type (default: { maximumFractionDigits: 2 })
 * @property {Intl.NumberFormatOptions} [currPercLocaleOpts] - Options for the `currency`/`euro`/`perc`/`percDecimal`
 *   types (default: { minimumFractionDigits: 2, maximumFractionDigits: 2 })
 * @property {string|null} [renderNullAs] - Content shown for `null`/`undefined` values (default: '—')
 * @property {string|null} [renderZeroAs] - When not null, content shown for numeric values equal to zero (default: null)
 * @property {string|null} [renderNaNAs] - Content shown by numeric types for non-numeric values (default: '—')
 * @property {IconDef} [boolTrueIcon] - Icon of `true` values in `bool` columns (default: minimo `check-bold` icon)
 * @property {IconDef} [boolFalseIcon] - Icon of `false` values in `bool` columns (default: minimo `x-bold` icon)
 * @property {IconDef} [sortAscArrowIcon] - Sort button icon, ascending sort active (default: minimo `arrow-up` icon)
 * @property {IconDef} [sortDescArrowIcon] - Sort button icon, descending sort active (default: minimo `arrow-down` icon)
 * @property {IconDef} [sortNoneArrowIcon] - Sort button icon, no sort active (default: minimo `arrows-down-up` icon)
 * @property {((tr: HTMLTableRowElement, row: Object, params: JsonTableParams) => void)|null} [trCallback] - Callback
 *   invoked after the rendering of every body row (default: null)
 * @property {string|null} [tableId] - `id` attribute of the `<table>` element (default: null)
 * @property {JsonTableClasses} [classes] - Consumer class names (see `JsonTableClasses`)
 * @property {JsonTableLabels} [labels] - Texts (see `JsonTableLabels`)
 */

/**
 * Names of the object params whose value is shallow-merged across the sources
 * (built-in default ← `setDefaults()` ← HTML attribute ← `init()`) instead of being replaced.
 * @type {ReadonlyArray<keyof JsonTableParams>}
 */
export const mergedParams = ['classes', 'labels', 'dataTypes'];

/**
 * Built-in defaults.
 *
 * @type {Required<JsonTableParams>}
 *
 * @example
 * {
 *   debug: false,
 *   jsonUrl: null,
 *   jsonDataField: 'data',
 *   totRecField: 'totRec',
 *   data: null,
 *   cols: [],
 *   dataTypes: {},
 *   caption: null,
 *   search: true,
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
 *   trCallback: null,
 *   tableId: null,
 *   classes: { … },                    // see JsonTableClasses
 *   labels: { … }                      // see JsonTableLabels
 * }
 */
export const defaults = {
  debug: false,

  jsonUrl: null,
  jsonDataField: 'data',
  totRecField: 'totRec',
  data: null,

  cols: [],
  dataTypes: {},

  caption: null,
  search: true,
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
    sortNone: 'Rimuovi l’ordinamento a questa colonna'
  }
};
