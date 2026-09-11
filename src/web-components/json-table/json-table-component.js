/*! minimo - json-table */

import { defaults } from './src/defaults.js';
import { resolveParams } from './src/resolve-params.js';
import { getData } from './src/get-data.js';
import { mainBuilder } from './src/main-builder.js';
import { updateInfo } from './src/update-info.js';

/** @typedef {import('./src/defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./src/main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Project-wide defaults, set via `JsonTable.setDefaults()`.
 * Module-level so they are shared by every instance.
 * @type {Partial<JsonTableParams>}
 */
let projectDefaults = {};


/**
 * `<json-table>` – HTML table generator from JSON data (inline or fetched), light DOM custom element.
 *
 * WORK IN PROGRESS: at this stage only the outer structure is generated (info section, search
 * input, empty table with caption). Columns, rows rendering, sorting, search and pagination
 * are not implemented yet.
 *
 * Parameters (see `src/defaults.js` → `JsonTableParams`) can be set as HTML attributes or via
 * `init()`; precedence: `init()` > HTML attribute > `JsonTable.setDefaults()` > built-in default.
 *
 * Events: `jt:ready` (bubbles) is dispatched on the element once the structure has been built;
 * `event.detail.jsonTable` is the component instance.
 *
 * @example
 * // markup only
 * // <json-table jsonurl="/api/rows.json" caption="Utenti"></json-table>
 *
 * @example
 * // script
 * import { JsonTable } from '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';
 *
 * JsonTable.setDefaults({ tableClass: 'table' }); // optional, project-wide
 *
 * const el = document.querySelector('json-table');
 * el.addEventListener('jt:ready', e => console.log(e.detail.jsonTable.data));
 * el.init({
 *   debug: false,                       // default: false
 *   jsonUrl: '/api/rows.json',          // default: null
 *   jsonDataField: 'data',              // default: 'data'
 *   data: null,                         // default: null (takes precedence over jsonUrl when set)
 *   caption: 'Utenti',                  // default: null
 *   search: true,                       // default: true
 *   searchInputClass: 'form-control',   // default: 'form-control'
 *   tableId: null,                      // default: null
 *   tableWrapperClass: 'table-responsive', // default: 'table-responsive'
 *   tableClass: 'table table-bordered', // default: 'table table-bordered'
 *   mainWrapperExtraClass: null,        // default: null
 *   outerInfoExtraClass: null,          // default: null
 *   infoExtraClass: null,               // default: null
 *   infoText: (shown, total) => `${shown} / ${total}` // default: Italian "Visualizzate N righe su M"
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
   *   searchInputClass: 'form-control form-control-sm', // default: 'form-control'
   *   tableClass: 'table',                              // default: 'table table-bordered'
   *   infoText: (shown, total) => `${shown} di ${total}`
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
   * JsonTable.getDefaults().tableWrapperClass; // → 'table-responsive'
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

    /** Resolved params, available after the first load. @type {JsonTableParams|null} */
    this.params = null;

    /** Raw rows, available after the first load. @type {Array<Object>|null} */
    this.data = null;

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
   * Resolves params, retrieves the data and builds the structure.
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
    this.innerHTML = '<div class="spinner"><span class="visually-hidden">Caricamento dati...</span></div>';

    /** @type {Array<Object>|null} */
    let rows = null;
    let failed = false;

    try {
      rows = await getData(params);
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

    if (rows === null) {
      // no source: silent when created from markup without attributes (init() may follow)
      if (this._initCalledProgrammatically) {
        // eslint-disable-next-line no-console
        console.error('[json-table] Nessuna sorgente dati: specificare `data` o `jsonUrl`.');
      }
      this.innerHTML = '';
      return;
    }

    this.data = rows;
    this.elements = mainBuilder(this, params);

    // TODO `shown` dovrà riflettere righe filtrate/paginate quando ricerca e paginazione saranno implementate
    updateInfo(this.elements, params, rows.length, rows.length);

    if (params.debug) {
      /* eslint-disable no-console */
      console.groupCollapsed('[json-table] params, data & elements', this);
      console.log('params', params);
      console.log('data', rows);
      console.log('elements', this.elements);
      console.groupEnd();
      /* eslint-enable no-console */
    }

    // dispatched in the next microtask so listeners registered right after init() still catch it
    const event = new CustomEvent('jt:ready', { detail: { jsonTable: this }, bubbles: true });
    Promise.resolve().then(() => this.dispatchEvent(event));
  }

} // end component


if (!customElements.get('json-table')) {
  customElements.define('json-table', JsonTable);
}
