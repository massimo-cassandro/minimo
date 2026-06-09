/** Module defaults and inline JSDoc for `defaults_params` */
/**
 * @typedef {Object} DateLocaleOpts
 * @property {'numeric'|'2-digit'|'short'|'long'|'narrow'} [year]
 * @property {'numeric'|'2-digit'|'short'|'long'|'narrow'} [month]
 * @property {'numeric'|'2-digit'|'short'|'long'|'narrow'} [day]
 *
 * @typedef {Object} TimeLocaleOpts
 * @property {boolean} [hour12]
 * @property {'2-digit'|'numeric'} [hour]
 * @property {'2-digit'|'numeric'} [minute]
 * @property {'2-digit'|'numeric'} [second]
 *
 * @typedef {Object} NumberFormatOpts
 * @property {number} [maximumFractionDigits]
 * @property {number} [minimumFractionDigits]
 *
 *
 * @typedef {'string'|'number'|'date'|'boolean'|'currency'|'percentage'|'custom'} DataType
 */

import trueIcon from '../icons/true.svg?inline';
import falseIcon from '../icons/false.svg?inline';
import sortArrow from '../icons/arrow-down-bold.svg?inline';

export const defaults_params = {
  /**
   * If true, logs debug info to the console.
   * @type {boolean}
   */
  debug : false,

  /**
   * Element to insert the table into.
   * @type {HTMLElement|null}
   */
  container : null,

  /**
   * Collection of generated DOM elements used by the table instance.
   * @type {Object}
   */
  elements : {},

  /**
   * Columns definitions (see `columns_default`).
   * @type {Array<ColumnDefault>}
   */
  columns : [],

  /**
   * If true, fetch rows from `ajaxUrl` and ignore `data`.
   * @type {boolean}
   */
  ajax : false,

  /**
   * Ajax URL for rows data.
   * @type {string|null}
   */
  ajaxUrl : null,

  /**
   * If null, default config (see `ajax_config_default` at bottom of this file) is used
   * If Object, must provide parameters about ajax request, according to `ajax_config_default` obj
   * @type {null|Object}
   */
  ajaxConfig : null,

  /**
   * Static rows data.
   * @type {Array}
   */
  data : [],

  /**
   * Footer data for static tables.
   * @type {Array}
   */
  footerData : [],

  /**
   * Table caption (string or HTML).
   * @type {string|null}
   */
  caption : null,

  /**
   * Enable search input.
   * @type {boolean}
   */
  search : true,

  /**
   * Enable column sorting.
   * @type {boolean}
   */
  sort : true,

  /**
   * Default sorting object: { key: 'asc'|'desc' }.
   * @type {Object}
   */
  defaultSorting : {},

  /**
   * Aria label for ascending sort button.
   * @type {string}
   */
  sortButtonAriaLabelAsc : 'Ordina questa colonna in senso ascendente (A\u00A0→\u00A0Z)',

  /**
   * Aria label for descending sort button.
   * @type {string}
   */
  sortButtonAriaLabelDesc : 'Ordina questa colonna in senso discendente (Z\u00A0→\u00A0A)',

  /**
   * Aria label to remove sorting.
   * @type {string}
   */
  sortButtonAriaLabelNone : 'Rimuovi l’ordinamento a questa colonna',

  /**
   * Locale string used for date/number formatting.
   * @type {string}
   */
  locale : 'it-IT',

  /**
   * Options passed to Intl.DateTimeFormat for dates.
   * @type {DateLocaleOpts}
   */
  datesLocaleOpts : { year: 'numeric', month: 'short', day: 'numeric' },

  /**
   * Options passed to Intl.DateTimeFormat for times.
   * @type {TimeLocaleOpts}
   */
  timesLocaleOpts : { hour12: false, hour:'2-digit', minute:'2-digit' },

  /**
   * Number formatting options.
   * @type {NumberFormatOpts}
   */
  numbersLocaleOpts : { maximumFractionDigits: 2 },

  /**
   * Currency/percentage formatting options.
   * @type {NumberFormatOpts}
   */
  currPercLocaleOpts : { maximumFractionDigits: 2, minimumFractionDigits: 2 },

  /**
   * Custom table id if needed.
   * @type {string|null}
   */
  tableId : null,

  /**
   * Extra class for the div that wraps the table.
   * @type {string|null}
   */
  tableWrapperExtraClassName : null,

  /**
   * Class name to assign to the <table> element.
   * @type {string|null}
   */
  tableClassName : null,

  /**
   * Extra class for main wrapper (contains info and table).
   * @type {string|null}
   */
  mainWrapperExtraClassName : null,

  /**
   * Extra class for outer info section.
   * @type {string|null}
   */
  outerInfoExtraClassName : null,

  /**
   * Extra class for info section.
   * @type {string|null}
   */
  infoExtraClassName : null,

  /**
   * If true, make info container sticky.
   * @type {boolean}
   */
  stickyInfo : true,

  /**
   * If true, make the table header sticky.
   * @type {boolean}
   */
  stickyThead : true,

  /**
   * Class for inline-end alignment.
   * @type {string|null}
   */
  inlineEndAlignClassName : null,

  /**
   * Class to prevent wrapping of content.
   * @type {string|null}
   */
  nowrapClassName : null,

  /**
   * Class for euro currency formatting.
   * @type {string|null}
   */
  euroClassName : null,

  /**
   * Class for percentage formatting.
   * @type {string|null}
   */
  percClassName : null,

  /**
   * If true, date cells are rendered with nowrap.
   * @type {boolean}
   */
  datesNowrap : true,

  /**
   * If true, treat 0 as an alternate (dash) character.
   * @type {boolean}
   */
  useZeroAltChar : true,

  /**
   * Character used for zero values when `useZeroAltChar` is true.
   * @type {string}
   */
  zeroAltChar : '\u2014',

  /**
   * Character used for NaN numeric values or `false` to disable.
   * @type {string|boolean}
   */
  isNaNChar : '\u2014',

  /**
   * Class added to both true/false boolean icon cells.
   * @type {string|null}
   */
  boolValuesClassName : null,

  /**
   * Class added to true icons.
   * @type {string|null}
   */
  boolTrueClassName : null,

  /**
   * Class added to false icons.
   * @type {string|null}
   */
  boolFalseClassName : null,

  /**
   * Icons used by the table for booleans and sorting.
   *
   * - `boolTrueIcon`: icon/markup for boolean true
   * - `boolFalseIcon`: icon/markup for boolean false
   * - `sortArrowIcon`: icon/markup for the sort arrow
   *
   * Imported icons can be a string, HTMLElement, SVGElement or a function returning markup.
   * Note: if you use custom icons, until you recompile the library, the default icons markup
   * remains embedded in the build even if you provide custom icons.
   * Note: The default sortArrowIcon is downward-oriented; if the custom one is upward-oriented,
   * you'll need to change the CSS properties `--jt-sort-asc-arrow-rotate` and `--jt-sort-desc-arrow-rotate`
   * or change something else in the CSS.
   * @type {string|HTMLElement|SVGElement|Function}
   */
  boolTrueIcon : trueIcon,
  boolFalseIcon : falseIcon,
  sortArrowIcon : sortArrow,

  /**
   * Alternative class for the search input (overrides default).
   * @type {string|null}
   */
  searchInputAltClassName : null,

  /**
   * Additional class for the search input.
   * @type {string|null}
   */
  searchInputExtraClassName : null,

  /**
   * Title attribute for search input.
   * @type {string}
   */
  searchInputTitle : 'Filtra records: inserisci un termine per eseguire la ricerca',

  /**
   * Placeholder text for search input.
   * @type {string}
   */
  searchInputPlaceholder : 'Inserisci il termine da cercare',

  /**
   * Aria-label for search input.
   * @type {string}
   */
  searchInputAriaLabel : 'Filtra risultati',

  /**
   * Callback invoked after each row (<tr>) rendering.
   * Signature: (trElement: HTMLElement, rowData: Object, params: Object)
   * @type {Function|null}
   */
  trCallback : null,

  // TODO download button (xlsx) (???)
  /*
  showDownloadBtn : false,      // se `ajax` === true, è forzato su false
  downloadBtnLabel : 'Download',
  downloadBtnClassName : 'btn btn-outline-secondary btn-sm',
  separateDownloadBtn : false, // se true viene restituito un array con tabella e pulsante download separati
  downloadFilename : 'download',
  downloadFormat : 'excel', // 'excel' o 'csv'
  */

};


/**
 * Column default options.
 * @typedef {Object} ColumnDefault
 * @property {string|null} key - REQUIRED json object key (= db column name).
 * @property {string|null} title - Column title (th text, can be an HTML string).
 * @property {string} [dataType='string'] - Cell data type; must be one of keys of `data_types`.
 * @property {string|null} className - Class assigned to the cell; overrides default.
 * @property {Function|null} render - Rendering function for the cell.
 * @property {Function|null} parse - Parsing function for the cell.
 * @property {boolean} [rowHeading=false] - If true, the cell is a row heading (th[scope=row]).
 * @property {boolean} [tfoot=true]
 * @property {boolean} [searchable=true]
 * @property {boolean} [sortable=true]
 * @property {Function|null} sortValueCustomParser - Custom sort function for static tables.
 * @property {Function|null} searchValueCustomParser - Custom search function for static tables.
 */

export const columns_default = {

  /**
   * REQUIRED: json object key (db column name)
   * @type {string|null}
   */
  key : null,

  /**
   * Column title (th text, can be an HTML string)
   * @type {string|null}
   */
  title : null,

  /**
   * Cell data type (one of keys in `data_types`).
   * @type {DataType}
   */
  dataType : 'string',

  /**
   * Class to assign to the cell; overrides default for the data type.
   * @type {string|null}
   */
  className : null,

  /**
   * Custom rendering function for the cell.
   * @type {Function|null}
   */
  render : null,

  /**
   * Parsing function applied to the raw value before rendering.
   * @type {Function|null}
   */
  parse : null,

  /**
   * If true, render cell as a row heading (th[scope=row]).
   * @type {boolean}
   */
  rowHeading : false,

  /**
   * If false, cell won't be rendered in the tfoot element.
   * @type {boolean}
   */
  tfoot : true,

  /**
   * If true, column content is searchable.
   * @type {boolean}
   */
  searchable : true,

  /**
   * If true, column content is sortable.
   * @type {boolean}
   */
  sortable : true,

  /**
   * Custom sort function for static tables; should match default parser signature.
   * @type {Function|null}
   */
  sortValueCustomParser : null,

  /**
   * Custom search function for static tables; should match default parser signature.
   * @type {Function|null}
   */
  searchValueCustomParser : null,
};


/**
 * ajax config default options.
 * Defaults values are referred to datatables keys
 * @typedef {Object} AjaxConfigDefault
 */

export const ajax_config_default = {


  /**
    * Config for ajax url
    * @type {Object|null}
    */
  urlParamsKeys: {


    /**
     * Key for start item, record or page, of the returned data
     * @type {string|null}
     */
    startItem: `start`,

    /**
     * Key for number of record to be returned
     * @type {string|null}
     */
    perPage : 'length',

    /**
     * Key for search strings
     * @type {string|null}
     */
    search : 'search[value]',

    // TODO columns + order
  },

  urlParams: {
    /**
     * array of static item to be appended to query string
     * Each item is a key-value array
     * @type {array|null}
     */
    staticValues: [['draw', 1]],

    perPageValue: 25

  },


  /**
    * Config for returned object keys
    * @type {Object|null}
    */
  jsonKeys: {
    /**
     * array of static item to be appended to returned object
     * Each item is a key-value array
     * @type {array|null}
     */
    staticParams: [['draw', 1]],

    /**
     * Key for number of records found
     * @type {string|null}
     */
    totRec : 'recordsTotal',

    /**
     * Key for number of records found when filtered by search
     * @type {string|null}
     */
    totRecFiltered : 'recordsFiltered',

    /**
     * Key for data object
     * @type {string|null}
     */
    data : 'data',
  }
}
