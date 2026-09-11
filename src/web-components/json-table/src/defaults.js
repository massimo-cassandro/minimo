/*! minimo - json-table: defaults */

/**
 * Function returning the text of the info area.
 * @callback InfoTextFn
 * @param {number} shown - Number of rows currently displayed
 * @param {number} total - Total number of rows in the data set
 * @returns {string|Node} Plain text, an HTML string or a DOM node
 */

/**
 * `<json-table>` parameters.
 *
 * Every parameter can be set either as an HTML attribute of the `<json-table>` element
 * (attribute names are case-insensitive, so `jsonurl="…"` and `jsonUrl="…"` are equivalent)
 * or as a property of the object passed to `init()`. Values that are functions
 * (e.g. `caption`, `infoText`) can only be set via `init()`.
 *
 * Precedence: `init()` > HTML attribute > `JsonTable.setDefaults()` > built-in default.
 *
 * TODO parametri `cols`, data-types, locale, icone, ordinamento, paginazione: da aggiungere negli step successivi
 *
 * @typedef {Object} JsonTableParams
 * @property {boolean} [debug] - Logs resolved params and generated elements to the console (default: false)
 * @property {string|null} [jsonUrl] - URL of the JSON to fetch. Ignored when `data` is set (default: null)
 * @property {string|null} [jsonDataField] - Key of the fetched JSON holding the rows array (e.g. `{ data: [...] }`);
 *   `null` or an empty string means the JSON root is the rows array itself (default: 'data')
 * @property {Array<Object>|null} [data] - Inline rows (array of plain objects); takes precedence over `jsonUrl`.
 *   As an HTML attribute it must be a JSON string, which is always treated as the rows array itself
 *   (`jsonDataField` is ignored) (default: null)
 * @property {string|Function|null} [caption] - Table caption: a string (plain text or HTML) or, via `init()` only,
 *   a function returning a string or a Node (default: null)
 * @property {boolean} [search] - Whether to render the search input (default: true)
 * @property {string|null} [searchInputClass] - Class(es) of the search input, replacing the default one (default: 'form-control')
 * @property {string} [searchInputTitle] - `title` attribute of the search input (default: 'Filtra record: inserisci un termine per eseguire la ricerca')
 * @property {string} [searchInputPlaceholder] - Placeholder of the search input (default: 'Inserisci il termine da cercare')
 * @property {string} [searchInputAriaLabel] - `aria-label` of the search input (default: 'Filtra risultati')
 * @property {string|null} [tableId] - `id` attribute of the `<table>` element (default: null)
 * @property {string|null} [tableWrapperClass] - Class(es) of the div wrapping the table, replacing the default one (default: 'table-responsive')
 * @property {string|null} [tableClass] - Class(es) of the `<table>` element, replacing the default ones (default: 'table table-bordered')
 * @property {string|null} [mainWrapperExtraClass] - Extra class(es) added to the main wrapper (info section + table) (default: null)
 * @property {string|null} [outerInfoExtraClass] - Extra class(es) added to the outer info container (default: null)
 * @property {string|null} [infoExtraClass] - Extra class(es) added to the info container (default: null)
 * @property {InfoTextFn} [infoText] - Function returning the info text: plain text, an HTML string or a Node
 *   (default: Italian text "Visualizzate N righe su M" / "Nessun record")
 */

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
 *   data: null,
 *   caption: null,
 *   search: true,
 *   searchInputClass: 'form-control',
 *   searchInputTitle: 'Filtra record: inserisci un termine per eseguire la ricerca',
 *   searchInputPlaceholder: 'Inserisci il termine da cercare',
 *   searchInputAriaLabel: 'Filtra risultati',
 *   tableId: null,
 *   tableWrapperClass: 'table-responsive',
 *   tableClass: 'table table-bordered',
 *   mainWrapperExtraClass: null,
 *   outerInfoExtraClass: null,
 *   infoExtraClass: null,
 *   infoText: (shown, total) => '…'
 * }
 */
export const defaults = {
  debug: false,

  jsonUrl: null,
  jsonDataField: 'data',
  data: null,

  caption: null,

  search: true,
  searchInputClass: 'form-control',
  searchInputTitle: 'Filtra record: inserisci un termine per eseguire la ricerca',
  searchInputPlaceholder: 'Inserisci il termine da cercare',
  searchInputAriaLabel: 'Filtra risultati',

  tableId: null,
  tableWrapperClass: 'table-responsive',
  tableClass: 'table table-bordered',

  mainWrapperExtraClass: null,
  outerInfoExtraClass: null,
  infoExtraClass: null,

  infoText: (shown, total) => {
    if (total === 0) {
      return 'Nessun record';
    }
    return shown === 1
      ? `Visualizzata <strong>${shown}</strong> riga su <strong>${total}</strong>`
      : `Visualizzate <strong>${shown}</strong> righe su <strong>${total}</strong>`;
  }
};
