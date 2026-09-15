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
import { applySortState, setSortListener } from './src/table-thead.js';
import { setSearchListener, filterRows } from './src/search.js';
import { sortRows } from './src/sorting.js';
import { calcTotPages, renderPagination } from './src/pagination.js';
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';

/** @typedef {import('./src/defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./src/defaults.js').DataTypeDefinition} DataTypeDefinition */
/** @typedef {import('./src/defaults.js').SortDef} SortDef */
/** @typedef {import('./src/parse-cols.js').ParsedCol} ParsedCol */
/** @typedef {import('./src/parse-rows.js').ParsedRow} ParsedRow */
/** @typedef {import('./src/main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Rendering state.
 *
 * Client-side mode: `rows` holds every parsed row, `filtered` the rows after search and sort,
 * `pageRows` the slice of the current page. Server-side mode: the three arrays hold the rows
 * returned by the last request (the current page), `totRec`/`filteredRec` come from the JSON.
 *
 * @typedef {Object} JsonTableState
 * @property {number} totRec - Total number of records (unfiltered, see `totRecField`)
 * @property {number} filteredRec - Number of records matching the current search
 * @property {ParsedRow[]} rows - All the parsed rows (current page only in server-side mode)
 * @property {ParsedRow[]} filtered - Rows after search and sort
 * @property {ParsedRow[]} pageRows - Rows of the current page
 * @property {string} searchTerm - Active search term ('' = none)
 * @property {SortDef|null} sort - Active sort (column key and direction), or null
 * @property {number} page - Current page (1-based)
 * @property {number} totPages - Total number of pages (1 when the pagination is disabled)
 */

/**
 * Reason of a state update, passed in the `jt:update` event detail.
 * @typedef {'page'|'sort'|'search'} UpdateReason
 */

/**
 * Project-wide defaults, set via `JsonTable.setDefaults()`.
 * Module-level so they are shared by every instance.
 * @type {Partial<JsonTableParams>}
 */
let projectDefaults = {};

/**
 * Empty state.
 * @returns {JsonTableState}
 */
const emptyState = () => ({
  totRec: 0, filteredRec: 0, rows: [], filtered: [], pageRows: [], searchTerm: '', sort: null, page: 1, totPages: 1
});


/**
 * `<json-table>` – HTML table generator from JSON data (inline or fetched), light DOM custom element,
 * with sorting, search and pagination (client-side, or server-side via `serverSide: true`).
 *
 * Parameters (see `src/defaults.js` → `JsonTableParams`) can be set as HTML attributes or via
 * `init()`; precedence: `init()` > HTML attribute > `JsonTable.setDefaults()` > built-in default.
 *
 * Events (both bubble, `event.detail.jsonTable` is the component instance):
 * - `jt:ready`: dispatched once the structure has been built and the first data rendered
 * - `jt:update`: dispatched after every page / sort / search change (`event.detail.reason`)
 *
 * @example
 * // markup only
 * // <json-table jsonurl="/api/rows.json" caption="Utenti" perpage="10"
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
 *   filteredRecField: 'filteredRec',    // default: 'filteredRec' (server-side mode)
 *   data: null,                         // default: null (takes precedence over jsonUrl when set)
 *   cols: [                             // required
 *     { key: 'id', dataType: 'id' },
 *     { key: 'name', title: 'Nome', render: (row, tr, td) => `<a href="/users/${row.id}">${row.name}</a>` },
 *     { key: 'amount', dataType: 'euro', tfootRender: '@sum' },
 *     { key: 'active', dataType: 'bool' }
 *   ],
 *   dataTypes: {},                      // default: {} (custom types, merged with the built-in ones)
 *   caption: 'Utenti',                  // default: null
 *   search: true,                       // default: true
 *   searchDebounce: 300,                // default: 300 (ms)
 *   perPage: 25,                        // default: 25 (0 = no pagination)
 *   paginationDelta: 2,                 // default: 2
 *   serverSide: false,                  // default: false
 *   serverParams: { page: 'page', start: 'start', perPage: 'perPage', sort: 'sort', dir: 'dir', search: 'search' }, // default
 *   initialSort: { key: 'name', dir: 'asc' }, // default: null
 *   tfoot: true,                        // default: false (not available in server-side mode)
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
   *   perPage: 50,
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
    /** incremented on every server-side request: a stale response is ignored */
    this._requestGeneration = 0;
    /** pending search debounce timer (see `search.js`) @type {ReturnType<typeof setTimeout>|undefined} */
    this._searchTimer = undefined;

    /** Resolved params, available after the first load. @type {JsonTableParams} */
    this.params = /** @type {JsonTableParams} */ ({ ...defaults });

    /** Raw rows, available after the first load (current page only in server-side mode). @type {Array<Object>|null} */
    this.data = null;

    /** Data types map (built-in + custom), available after the first load. @type {Object<string, DataTypeDefinition>} */
    this.dataTypes = {};

    /** Parsed visible columns, available after the first load. @type {ParsedCol[]} */
    this.cols = [];

    /** Rendering state, available after the first load. @type {JsonTableState} */
    this.state = emptyState();

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
   * // <json-table caption="Utenti" search="false" cols='[...]'></json-table>
   * el.init({ jsonUrl: '/api/rows.json' });   // jsonUrl from script, caption, search and cols from attributes
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
    clearTimeout(this._searchTimer);
    this._loadStarted = false;
    this._loadGeneration++;
    this._requestGeneration++;
    this.elements = {};
    this.data = null;
    this.cols = [];
    this.state = emptyState();
    this.innerHTML = '';
  }

  /**
   * Reloads the data and rebuilds the structure, optionally overriding some params
   * (merged with the config passed to `init()`, if any). Search, sort and page are reset.
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

  /**
   * Shows the given page (clamped to the available range). In server-side mode a new request
   * is sent. Nothing happens when the page does not change.
   *
   * @param {number} page - Page number (1-based)
   * @param {string|null} [focusTarget=null] - `data-page` of the pagination button to focus after the
   *   rendering (used by the pagination buttons themselves) (default: null)
   * @returns {void}
   *
   * @example
   * el.goToPage(3);
   */
  goToPage(page, focusTarget = null) {
    const requested = Math.min(Math.max(1, Math.floor(Number(page) || 1)), this.state.totPages);
    if (requested === this.state.page) {
      return;
    }
    this.state.page = requested;
    this._update('page', focusTarget);
  }

  /**
   * Sorts the rows by a column (`dir` null removes the sort) and goes back to the first page.
   * The column must exist and be sortable, otherwise the call is ignored with a console error.
   * In server-side mode a new request is sent.
   *
   * @param {string} key - Column key
   * @param {'asc'|'desc'|null} dir - Direction, or null to remove the sort
   * @returns {void}
   *
   * @example
   * el.setSort('name', 'desc');
   * el.setSort('name', null); // original order
   */
  setSort(key, dir) {
    if (dir != null) {
      const col = this.cols.find(c => c.key === key);
      if (!col || !col.sortable) {
        // eslint-disable-next-line no-console
        console.error(`[json-table] setSort: colonna \`${key}\` inesistente o non ordinabile`);
        return;
      }
    }
    this.state.sort = dir == null ? null : { key, dir };
    this.state.page = 1;
    this._update('sort');
  }

  /**
   * Filters the rows by a search term (every whitespace-separated word must match, case-insensitive)
   * and goes back to the first page; an empty term removes the filter. The search input, when
   * present, is kept in sync. In server-side mode a new request is sent.
   *
   * @param {string} term - Search term
   * @returns {void}
   *
   * @example
   * el.setSearch('mario');
   * el.setSearch('');
   */
  setSearch(term) {
    const value = String(term ?? '');
    if (this.elements.searchInput && this.elements.searchInput.value !== value) {
      this.elements.searchInput.value = value;
    }
    if (value.trim() === this.state.searchTerm) {
      return;
    }
    this.state.searchTerm = value.trim();
    this.state.page = 1;
    this._update('search');
  }


  // ─── Load & build ───────────────────────────────────────────────────────────

  /**
   * Resolves params, parses the columns, retrieves the data and builds the structure.
   * Guarded against concurrent/stale calls via `_loadStarted` and `_loadGeneration`.
   * @returns {Promise<void>}
   */
  async _load() {
    if (this._loadStarted) {
      return;
    }
    this._loadStarted = true;
    clearTimeout(this._searchTimer);
    const generation = this._loadGeneration;

    const params = resolveParams(this, this._config, projectDefaults);
    this.params = params;
    this._validateParams(params);

    // loading placeholder (minimo spinner)
    domBuilder([
      {
        className: 'spinner',
        children: [{ tag: 'span', className: 'visually-hidden', content: params.labels.loading }]
      }
    ], this, { emptyParent: true });

    // columns parsing (configuration errors are reported and stop the rendering)
    try {
      this.dataTypes = buildDataTypes(params);
      this.cols = parseCols(params.cols, this.dataTypes, params);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      this.innerHTML = '';
      return;
    }

    // initial state
    this.state = emptyState();
    if (params.initialSort && typeof params.initialSort === 'object') {
      const { key, dir } = params.initialSort;
      const col = this.cols.find(c => c.key === key);
      if (col && col.sortable && (dir === 'asc' || dir === 'desc')) {
        this.state.sort = { key, dir };
      } else {
        // eslint-disable-next-line no-console
        console.error(`[json-table] initialSort: colonna \`${key}\` inesistente o non ordinabile, oppure direzione non valida (${dir})`);
      }
    }

    /** @type {import('./src/get-data.js').DataResult|null} */
    let result = null;
    let failed = false;

    try {
      result = await getData(params, params.serverSide ? this._serverRequest() : null);
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

    this._setData(result);

    this.elements = mainBuilder(this);
    setSortListener(this);
    setSearchListener(this);

    this._computeState();
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
   * Normalizes the resolved params that depend on each other, reporting the inconsistencies:
   * `perPage`/`paginationDelta` must be non-negative numbers, `serverSide` requires `jsonUrl`
   * (ignored with inline `data`) and disables `tfoot` (the aggregates would be computed on the
   * current page only).
   * @param {JsonTableParams} params - Resolved params (mutated)
   * @returns {void}
   */
  _validateParams(params) {
    /* eslint-disable no-console */
    const perPage = Number(params.perPage);
    params.perPage = Number.isFinite(perPage) && perPage >= 0 ? Math.floor(perPage) : defaults.perPage;

    const delta = Number(params.paginationDelta);
    params.paginationDelta = Number.isFinite(delta) && delta >= 0 ? Math.floor(delta) : defaults.paginationDelta;

    if (params.serverSide && (params.data != null || !params.jsonUrl)) {
      console.warn('[json-table] `serverSide` richiede `jsonUrl` (senza `data`): modalità server-side ignorata');
      params.serverSide = false;
    }

    if (params.serverSide && params.tfoot) {
      console.warn('[json-table] `tfoot` non è disponibile in modalità server-side (i dati sono paginati dal server): tfoot ignorato');
      params.tfoot = false;
    }
    /* eslint-enable no-console */
  }

  /**
   * Current server-side request state (see `get-data.js` → `ServerRequest`).
   * @returns {import('./src/get-data.js').ServerRequest}
   */
  _serverRequest() {
    const { state, params } = this;
    return {
      page: state.page,
      perPage: params.perPage > 0 ? params.perPage : 0,
      sort: state.sort,
      search: state.searchTerm
    };
  }

  /**
   * Stores a data result: raw rows, parsed rows and totals.
   * @param {import('./src/get-data.js').DataResult} result
   * @returns {void}
   */
  _setData(result) {
    this.data = result.rows;
    this.state.rows = parseRows(result.rows, this.cols, this.params);
    this.state.totRec = result.totRec;
    this.state.filteredRec = result.filteredRec;
  }

  /**
   * Computes `filtered`, `pageRows`, `filteredRec`, `totPages` and clamps `page` from `rows`,
   * `searchTerm`, `sort` and `page`.
   *
   * Client-side mode: search and sort are applied to `rows`, then the current page is sliced.
   * Server-side mode: `rows` already is the requested page, `filteredRec` comes from the JSON.
   * @returns {void}
   */
  _computeState() {
    const { state, params } = this;

    if (params.serverSide) {
      state.filtered = state.rows;
      state.pageRows = state.rows;
      state.totPages = calcTotPages(state.filteredRec, params.perPage);
      state.page = Math.min(Math.max(1, state.page), state.totPages);
      return;
    }

    const filtered = filterRows(state.rows, state.searchTerm);
    state.filtered = state.sort ? sortRows(filtered, state.sort.key, state.sort.dir, params.locale) : filtered;
    state.filteredRec = state.filtered.length;
    state.totPages = calcTotPages(state.filteredRec, params.perPage);
    state.page = Math.min(Math.max(1, state.page), state.totPages);
    state.pageRows = params.perPage > 0
      ? state.filtered.slice((state.page - 1) * params.perPage, state.page * params.perPage)
      : state.filtered;
  }

  /**
   * Applies a state change (page, sort or search): recomputes the state and re-renders, or, in
   * server-side mode, sends a new request (stale responses are ignored) and renders its result.
   * Dispatches `jt:update` at the end.
   *
   * @param {UpdateReason} reason - What changed
   * @param {string|null} [focusTarget=null] - Passed to `renderPagination()` (default: null)
   * @returns {Promise<void>}
   */
  async _update(reason, focusTarget = null) {

    if (this.params.serverSide) {
      const generation = ++this._requestGeneration;
      const loadGeneration = this._loadGeneration;
      const requestedPage = this.state.page;
      this.elements.wrapper?.setAttribute('aria-busy', 'true');

      /** @type {import('./src/get-data.js').DataResult|null} */
      let result = null;
      try {
        result = await getData(this.params, this._serverRequest());
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }

      if (generation !== this._requestGeneration || loadGeneration !== this._loadGeneration) {
        return; // superseded by a newer request or by a reload/destroy
      }
      this.elements.wrapper?.removeAttribute('aria-busy');

      if (!result) {
        return;
      }
      this._setData(result);
      this._computeState();

      // the requested page no longer exists (the data set shrank since the last request):
      // `_computeState` clamped the page, fetch the last available one
      if (!this.state.rows.length && this.state.filteredRec > 0 && this.state.page !== requestedPage) {
        this._update(reason, focusTarget);
        return;
      }

    } else {
      this._computeState();
    }

    this._render(reason, focusTarget);

    this.dispatchEvent(new CustomEvent('jt:update', { detail: { jsonTable: this, reason }, bubbles: true }));
  }

  /**
   * Renders the parts depending on the state: body rows, footer, sort indicators, pagination and
   * info text. The footer is skipped on page changes when `updateFooterOnPageChange` is false
   * (its content would not change).
   *
   * @param {UpdateReason|null} [reason=null] - What changed (null on the first rendering) (default: null)
   * @param {string|null} [focusTarget=null] - Passed to `renderPagination()` (default: null)
   * @returns {void}
   */
  _render(reason = null, focusTarget = null) {
    renderTbody(this);
    if (reason !== 'page' || this.params.updateFooterOnPageChange) {
      renderTfoot(this);
    }
    applySortState(this);
    renderPagination(this, focusTarget);
    updateInfo(this);
  }

} // end component


if (!customElements.get('json-table')) {
  customElements.define('json-table', JsonTable);
}
