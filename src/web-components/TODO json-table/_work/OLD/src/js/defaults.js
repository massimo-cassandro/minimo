/**
 * Parametri di configurazione
 *
 */
import trueIcon from '../icons/true.svg?inline';
import falseIcon from '../icons/false.svg?inline';

export const defaults_params = {

  // if true, logs debug info to the console
  debug                   : false,

  // element to insert the table into. Required
  container               : null,

  // if true, jsonTable uses the same json schema and query parameters (simplified)
  // of jQuery Datatable (currently it is always active, setting it to false has no effect)
  jqDatatableCompliant    : true,

  columns                 : [],    // coluns definitions
  ajax                    : false, // true: uses `ajaxUrl` and ignores `data`
  ajaxUrl                 : null,  // ajax url for rows data
  data                    : [],    // rows data (static version)
  footerData              : [],    // TODO  che succede con ajax???
  caption                 : null,
  addRowIndex             : false, // if true adds a data-index attribute to the `tr` with the json record index

  // activate search and sort features
  search                  : true,
  sort                    : true,
  // object of column keys with 'asc` or `desc` for default sorting
  // keys order must reflect the order of the database sorting statement
  // example: { key1: 'asc', key2: 'desc' }
  // sort directions strings will be forced to lowercase
  defaultSorting          : {},

  locale                  : 'it-IT', // locale string
  datesLocaleOpts         : { year: 'numeric', month: 'short', day: 'numeric' },
  timesLocaleOpts         : { hour12: false, hour:'2-digit', minute:'2-digit' },
  numbersLocaleOpts       : { maximumFractionDigits: 2 }, // numbers
  currPercLocaleOpts      : { maximumFractionDigits: 2, minimumFractionDigits: 2 }, // currency and percentages

  tableId                 : null,  // custom table id, if needed

  // extra or alternative classes for the main wrapper (contains info and table), info section or table
  // extra classes are added to the default classes
  // alternative classes replace them completely (and any extra classes are not taken into account)
  // If `infoAltClassName` is defined, no default classes are added to the elements in the info section
  // (anyway, the class specified in `searchInputClassName`, if defined, is added to the input element)
  mainWrapperExtraClassName    : null,
  mainWrapperAltClassName      : null,
  infoExtraClassName           : null,
  infoAltClassName             : null,
  tableExtraClassName          : null,
  tableAltClassName            : null,

  // if true, wraps the table in a div to prevent overly large tables from breaking the layout
  // since it uses the `overflow` property, it is not suitable for tables with sticky headers
  addTableWrapper         : true,
  // alternative class for the div that wraps table.
  tableWrapperClassName     : null,

  // custom classes for align and styling, if not defined or null, the default ones are used
  // centerAlignClassName    : null, // currently unused
  inlineEndAlignClassName : null,
  nowrapClassName         : null,
  euroClassName           : null,
  percClassName           : null,

  datesNowrap             : true,      // if true, renders cells containing a date “nowrap”
  useZeroAltChar          : true,      // enables value conversions === `0`, overrides any column rendering function
  zeroAltChar             : '\u2014',  // dash, used for values === `0` if useZeroAltChar === true
  isNaNChar               : '\u2014',  // dash, used for NaN values of numeric datatypes, set it to false to avoid rendering

  // class to be assigned to the cell containing boolean values, used for styling svg icons. Overrides the default class
  // you may need to change it if you use a different icon set
  boolValuesClassName     : null,

  // Optional custom class names for `true` and `false` boolean values.
  // They are added to the containing cell (`td`) beside the `boolValuesClassName` class,
  // but only if the `boolValuesClassName` parameter is not null
  boolTrueClassName       : null,
  boolFalseClassName      : null,

  // icons svg code for boolean values
  boolTrueIcon            : trueIcon,  // icon for boolean true
  boolFalseIcon           : falseIcon, // icon for boolean false

  searchInputClassName    : null,      // custom class for the search input, overrides the default one,
  searchInputTitle        : 'Filtra records',
  searchInputPlaceholder  : 'INVIO per eseguire la ricerca',
  searchInputAriaLabel    : 'Filtra risultati',

  // TODO (??) alternative templates markups

  // callback functions after `tr` elements rendering, it's called for each row
  // It is invoked with three arguments: the tr element, the corresponding data object and the whole parsed params object
  trCallback              : null,

  // TODO download button (xlsx) (???)
  /*
  showDownloadBtn         : false,      // se `ajax` === true, è forzato su false
  downloadBtnLabel        : 'Download',
  downloadBtnClassName    : 'btn btn-outline-secondary btn-sm',
  separateDownloadBtn     : false, // se true viene restituito un array con tabella e pulsante download separati
  downloadFilename        : 'download',
  downloadFormat          : 'excel', // 'excel' o 'csv'
  */

};



/**
 * Columns default values
 * Some default (tfoot, searchable, sortable,...) can be changed for specific data types,
 * according to the `colDefaultsOverrides` object in dataTypes
 * (see the `default-columns-data-types.js` file)
 *
 */

export const columns_default = {

  // column title (th text)
  title                     : null,

  // json object key
  key                       : null,

  // cell data type, it must be one of the keys of the `data_types` object
  dataType                  : 'string',

  // class to be assigned to the cell. If present it overrides the default class of the data_types object
  className                 : null,

  // rendering function for the cell. If present it overrides the default render function of the data_types object
  render                    : null,

  // parsing function for the cell. If present the value is passed to this function before rendering
  parse                     : null,

  // if true, the cell is a th[scope=row] instead of a td
  rowHeading                : false,

  // if false, the cell will not be rendered in the tfoot element
  tfoot                     : true,

  // if true, the column content is searchable
  searchable                : true,

  // if true, the column content is sortable
  sortable                  : true,

  // custom sort function for the column, overrides the default one
  customSortFunction        : null,
};
