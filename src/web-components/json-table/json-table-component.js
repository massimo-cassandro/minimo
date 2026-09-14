/*! minimo - json-table */

import { defaults } from './src/defaults.js';
import { resolveParams } from './src/resolve-params.js';
import { getData } from './src/get-data.js';
import { buildDataTypes } from './src/data-types.js';
import { parseCols } from './src/parse-cols.js';
import { parseRows } from './src/parse-rows.js';
import { mainBuilder } from './src/main-builder.js';
import { renderTbody } from './src/table-body.js';
import { renderTfoot } from './src/table-tfoot.js';
import { updateInfo } from './src/update-info.js';
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';

/** @typedef {import('./src/defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./src/defaults.js').DataTypeDefinition} DataTypeDefinition */
/** @typedef {import('./src/parse-cols.js').ParsedCol} ParsedCol */
/** @typedef {import('./src/parse-rows.js').ParsedRow} ParsedRow */
/** @typedef {import('./src/main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Rendering state, rebuilt on every load.
 * TODO ordinamento, ricerca e paginazione (step 3/4) aggiorneranno `filtered`, `pageRows` e `searchTerm`
 * @typedef {Object} JsonTableState
 * @property {number} totRec - Total number of records (unfiltered, see `totRecField`)
 * @property {ParsedRow[]} rows - All the parsed rows
 * @property {ParsedRow[]} filtered - Rows after filtering (currently all the rows)
 * @property {ParsedRow[]} pageRows - Rows of the current page (currently all the filtered rows)
 * @property {string} searchTerm - Active search term (currently always empty)
 */

/**
 * Project-wide defaults, set via `JsonTable.setDefaults()`.
 * Module-level so they are shared by every instance.
 * @type {Partial<JsonTableParams>}
 */
let projectDefaults = {};


/**
 * `<json-table>` – HTML table generator from JSON data (inline or fetched), light DOM custom element.
 *
 * WORK IN PROGRESS (step 2): columns (`cols`), data types, rows rendering, `tfoot`, info text and
 * layout `template` are implemented; the sort buttons are rendered but inactive. Sorting, search
 * and pagination are not implemented yet.
 *
 * Parameters (see `src/defaults.js` → `JsonTableParams`) can be set as HTML attributes or via
 * `init()`; precedence: `init()` > HTML attribute > `JsonTable.setDefaults()` > built-in default.
 *
 * Events: `jt:ready` (bubbles) is dispatched on the element once the structure has been built;
 * `event.detail.jsonTable` is the component instance.
 *
 * @example
 * // markup only
 * // <json-table jsonurl="/api/rows.json" caption="Utenti"
 * //   cols='[{"key":"id","dataType":"id"},{"key":"name","title":"Nome"},{"key":"amount","dataType":"euro"}]'
 * // ></json-table>
 *
 * @example
 * // script
 * import { JsonTable } from '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';
 *
 * JsonTable.setDefaults({ classes: { table: 'table' } }); // optional, project-wide
 *
 * const el = document.querySelector('json-table');
 * el.addEventListener('jt:ready', e => console.log(e.detail.jsonTable.data));
 * el.init({
 *   debug: false,                       // default: false
 *   jsonUrl: '/api/rows.json',          // default: null
 *   jsonDataField: 'data',              // default: 'data'
 *   totRecField: 'totRec',              // default: 'totRec'
 *   data: null,                         // default: null (takes precedence over jsonUrl when set)
 *   cols: [                             // default: [] (one column per key of the first row)
 *     { key: 'id', dataType: 'id' },
 *     { key: 'name', title: 'Nome', render: (row, tr, td) => `<a href="/users/${row.id}">${row.name}</a>` },
 *     { key: 'amount', dataType: 'euro', tfootRender: '@sum' },
 *     { key: 'active', dataType: 'bool' }
 *   ],
 *   dataTypes: {},                      // default: {} (custom types, merged with the built-in ones)
 *   caption: 'Utenti',                  // default: null
 *   search: true,                       // default: true
 *   tfoot: true,                        // default: false
 *   updateFooterOnPageChange: false,    // default: false
 *   infoText: null,                     // default: null → labels.info
 *   template: [{ slot: 'infoSection' }, { slot: 'table' }], // default
 *   locale: 'it-IT',                    // default: 'it-IT'
 *   currency: 'EUR',                    // default: 'EUR'
 *   renderNullAs: '—',                  // default: '—'
 *   renderZeroAs: null,                 // default: null
 *   renderNaNAs: '—',                   // default: '—'
 *   trCallback: null,                   // default: null
 *   tableId: null,                      // default: null
 *   classes: { table: 'table' },        // merged with the defaults (see JsonTableClasses)
 *   labels: { noRows: 'Nessun utente' } // merged with the defaults (see JsonTableLabels)
 * });
 */
export class JsonTable extends HTMLElement {

  /**
   * Sets project-wide defaults, shared by every instance created afterwards
   * (instances already rendered are not updated). Call it once, before the instances
   * are created, e.g. in a shared script. Values are merged with the previous ones.
   *
   * @param {Partial<JsonTableParams>} [newDefaults={}] - Parameters to override (default: {})
   * @returns {void}
   *
   * @example
   * JsonTable.setDefaults({
   *   classes: { searchInput: 'form-control', table: 'table' }, // merged with the built-in classes
   *   labels: { searchPlaceholder: 'Cerca…' },                  // merged with the built-in labels
   *   infoText: (start, end, totRec, filteredRec) => `${filteredRec} di ${totRec} record`
   * });
   */
  static setDefaults(newDefaults = {}) {
    projectDefaults = { ...projectDefaults, ...newDefaults };
  }

  /**
   * Clears the project-wide defaults set via `setDefaults()`.
   * @returns {void}
   */
  static resetDefaults() {
    projectDefaults = {};
  }

  /**
   * Returns the built-in defaults merged with the project-wide ones.
   * @returns {JsonTableParams}
   *
   * @example
   * JsonTable.getDefaults().classes.tableWrapper; // → 'table-responsive'
   */
  static getDefaults() {
    return { ...defaults, ...projectDefaults };
  }


  constructor() {
    super();
    // light DOM: no attachShadow

    /** @type {Partial<JsonTableParams>|null} config passed via init()/reload() */
    this._config = null;
    this._initCalledProgrammatically = false;
    this._isConnected = false;
    this._loadStarted = false;
    /** incremented on every init()/reload()/destroy(): a pending _load() whose generation is stale gives up */
    this._loadGeneration = 0;

    /** Resolved params, available after the first load. @type {JsonTableParams} */
    this.params = /** @type {JsonTableParams} */ ({ ...defaults });

    /** Raw rows, available after the first load. @type {Array<Object>|null} */
    this.data = null;

    /** Data types map (built-in + custom), available after the first load. @type {Object<string, DataTypeDefinition>} */
    this.dataTypes = {};

    /** Parsed visible columns, available after the first load. @type {ParsedCol[]} */
    this.cols = [];

    /** Rendering state, available after the first load. @type {JsonTableState} */
    this.state = { totRec: 0, rows: [], filtered: [], pageRows: [], searchTerm: '' };

    /** Generated elements, available after the first load. @type {JsonTableElements} */
    this.elements = {};
  }


  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  connectedCallback() {
    this._isConnected = true;
    if (!this._loadStarted) {
      this._load();
    }
  }

  disconnectedCallback() {
    this._isConnected = false;
  }


  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Starts the component via script, passing the configuration as an object.
   * Can be called before or after the element is attached to the DOM.
   *
   * Parameters not included in `config` are read from the corresponding HTML attribute
   * (if present), then from the project defaults, then from the built-in defaults.
   * To explicitly ignore an existing attribute pass `null` in the config.
   *
   * @param {Partial<JsonTableParams>} [config={}] - See `JsonTableParams` (default: {})
   * @returns {void}
   *
   * @example
   * // <json-table caption="Utenti" search="false"></json-table>
   * el.init({ jsonUrl: '/api/rows.json' });   // jsonUrl from script, caption and search from attributes
   * el.init({ jsonUrl: '/api/rows.json', search: null }); // search → default (true), the attribute is ignored
   */
  init(config = {}) {
    this._config = config;
    this._initCalledProgrammatically = true;

    // an explicit init() must always restart, even if connectedCallback already
    // ran a premature _load() (e.g. when domBuilder appends the element before init())
    this._loadStarted = false;
    this._loadGeneration++;

    if (this._isConnected) {
      this._load();
    }
  }

  /**
   * Empties the component and resets its state. `init()` can be called again afterwards
   * to re-initialize it with new params, without recreating the element.
   * @returns {void}
   */
  destroy() {
    this._loadStarted = false;
    this._loadGeneration++;
    this.elements = {};
    this.data = null;
    this.cols = [];
    this.state = { totRec: 0, rows: [], filtered: [], pageRows: [], searchTerm: '' };
    this.innerHTML = '';
  }

  /**
   * Reloads the data and rebuilds the structure, optionally overriding some params
   * (merged with the config passed to `init()`, if any).
   *
   * @param {Partial<JsonTableParams>} [overrides={}] - Params to override (default: {})
   * @returns {Promise<void>}
   *
   * @example
   * await el.reload();                                  // same source
   * await el.reload({ jsonUrl: '/api/rows.json?y=2025' }); // new URL
   * await el.reload({ data: [{ id: 1 }] });             // inline data (takes precedence over jsonUrl)
   */
  async reload(overrides = {}) {
    this._config = { ...(this._config ?? {}), ...overrides };
    this._loadStarted = false;
    this._loadGeneration++;
    await this._load();
  }


  // ─── Load & build ───────────────────────────────────────────────────────────

  /**
   * Resolves params, retrieves the data, parses columns and rows and builds the structure.
   * Guarded against concurrent/stale calls via `_loadStarted` and `_loadGeneration`.
   * @returns {Promise<void>}
   */
  async _load() {
    if (this._loadStarted) {
      return;
    }
    this._loadStarted = true;
    const generation = this._loadGeneration;

    const params = resolveParams(this, this._config, projectDefaults);
    this.params = params;

    // loading placeholder (minimo spinner)
    domBuilder([
      {
        className: 'spinner',
        children: [{ tag: 'span', className: 'visually-hidden', content: params.labels.loading }]
      }
    ], this, { emptyParent: true });

    /** @type {import('./src/get-data.js').DataResult|null} */
    let result = null;
    let failed = false;

    try {
      result = await getData(params);
    } catch (err) {
      failed = true;
      // eslint-disable-next-line no-console
      console.error(err);
    }

    // a newer init()/reload()/destroy() superseded this load
    if (generation !== this._loadGeneration) {
      return;
    }

    if (failed) {
      this.innerHTML = '';
      return;
    }

    if (result === null) {
      // no source: silent when created from markup without attributes (init() may follow)
      if (this._initCalledProgrammatically) {
        // eslint-disable-next-line no-console
        console.error('[json-table] Nessuna sorgente dati: specificare `data` o `jsonUrl`.');
      }
      this.innerHTML = '';
      return;
    }

    this.data = result.rows;

    // columns & rows parsing (configuration errors are reported and stop the rendering)
    try {
      this.dataTypes = buildDataTypes(params);
      this.cols = parseCols(params.cols, this.dataTypes, params, this.data[0]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      this.innerHTML = '';
      return;
    }

    const rows = parseRows(this.data, this.cols, params);
    this.state = { totRec: result.totRec, rows, filtered: rows, pageRows: rows, searchTerm: '' };

    this.elements = mainBuilder(this);
    this._render();

    if (params.debug) {
      /* eslint-disable no-console */
      console.groupCollapsed('[json-table] params, cols, data, state & elements', this);
      console.log('params', params);
      console.log('dataTypes', this.dataTypes);
      console.log('cols', this.cols);
      console.log('data', this.data);
      console.log('state', this.state);
      console.log('elements', this.elements);
      console.groupEnd();
      /* eslint-enable no-console */
    }

    // dispatched in the next microtask so listeners registered right after init() still catch it
    const event = new CustomEvent('jt:ready', { detail: { jsonTable: this }, bubbles: true });
    Promise.resolve().then(() => this.dispatchEvent(event));
  }

  /**
   * Renders the parts depending on the state: body rows, footer and info text.
   * TODO invocata anche da ordinamento/ricerca/paginazione (step 3/4)
   * @returns {void}
   */
  _render() {
    renderTbody(this);
    renderTfoot(this);
    updateInfo(this);
  }

} // end component


if (!customElements.get('json-table')) {
  customElements.define('json-table', JsonTable);
}
