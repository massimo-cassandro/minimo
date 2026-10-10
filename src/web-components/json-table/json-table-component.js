/*! minimo - json-table */

import { defaults } from './src/defaults.js';
import { resolveParams } from './src/resolve-params.js';
import { getData } from './src/get-data.js';
import { buildDataTypes } from './src/data-types.js';
import { parseCols } from './src/parse-cols.js';
import { parseRows } from './src/parse-rows.js';
import { mainBuilder } from './src/main-builder.js';
import { renderTbody } from './src/table-body.js';
import { renderTfoot } from './src/tfoot.js';
import { updateInfo } from './src/update-info.js';
import { applySortState, setSortListener } from './src/thead.js';
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
 * Stato del rendering.
 *
 * Modalità client-side: `rows` contiene tutte le righe analizzate, `filtered` le righe dopo ricerca e ordinamento,
 * `pageRows` la porzione della pagina corrente. Modalità server-side: i tre array contengono le righe
 * restituite dall'ultima richiesta (la pagina corrente), `totRec`/`filteredRec` provengono dal JSON.
 *
 * @typedef {Object} JsonTableState
 * @property {number} totRec - Numero totale di record (non filtrati, vedi `totRecField`)
 * @property {number} filteredRec - Numero di record che corrispondono alla ricerca corrente
 * @property {ParsedRow[]} rows - Tutte le righe analizzate (solo la pagina corrente in modalità server-side)
 * @property {ParsedRow[]} filtered - Righe dopo ricerca e ordinamento
 * @property {ParsedRow[]} pageRows - Righe della pagina corrente
 * @property {string} searchTerm - Termine di ricerca attivo ('' = nessuno)
 * @property {SortDef|null} sort - Ordinamento attivo (chiave della colonna e direzione), oppure null
 * @property {number} page - Pagina corrente (da 1)
 * @property {number} totPages - Numero totale di pagine (1 quando la paginazione è disattivata)
 */

/**
 * Motivo di un aggiornamento dello stato, passato nel detail dell'evento `jt:update`.
 * @typedef {'page'|'sort'|'search'} UpdateReason
 */

/**
 * Default a livello di progetto, impostati con `JsonTable.setDefaults()`.
 * A livello di modulo, così da essere condivisi da ogni istanza.
 * @type {Partial<JsonTableParams>}
 */
let projectDefaults = {};

/**
 * Stato vuoto.
 * @returns {JsonTableState}
 */
const emptyState = () => ({
  totRec: 0, filteredRec: 0, rows: [], filtered: [], pageRows: [], searchTerm: '', sort: null, page: 1, totPages: 1
});


/**
 * `<json-table>` – generatore di tabelle HTML da dati JSON (inline o recuperati via fetch), custom element in light DOM,
 * con ordinamento, ricerca e paginazione (client-side, oppure server-side con `serverSide: true`).
 *
 * I parametri (vedi `src/defaults.js` → `JsonTableParams`) si possono impostare come attributi HTML o tramite
 * `init()`; precedenza: `init()` > attributo HTML > `JsonTable.setDefaults()` > default predefinito.
 *
 * Eventi (entrambi con bubbling, `event.detail.jsonTable` è l'istanza del componente):
 * - `jt:ready`: emesso quando la struttura è stata costruita e i primi dati sono stati renderizzati
 * - `jt:update`: emesso dopo ogni cambio di pagina / ordinamento / ricerca (`event.detail.reason`)
 *
 * @example
 * // solo markup
 * // <json-table jsonurl="/api/rows.json" caption="Utenti" perpage="10"
 * //   cols='[{"key":"id","dataType":"id"},{"key":"name","title":"Nome"},{"key":"amount","dataType":"euro"}]'
 * // ></json-table>
 *
 * @example
 * // script
 * import { JsonTable } from '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';
 *
 * JsonTable.setDefaults({ classes: { table: 'table' } }); // opzionale, a livello di progetto
 *
 * const el = document.querySelector('json-table');
 * el.addEventListener('jt:ready', e => console.log(e.detail.jsonTable.data));
 * el.init({
 *   debug: false,                       // default: false
 *   jsonUrl: '/api/rows.json',          // default: null
 *   jqDatatableMode: false,             // default: false (true: default compatibili con jQuery DataTables)
 *   jsonDataField: 'data',              // default: 'data'
 *   totRecField: 'totRec',              // default: 'totRec'
 *   filteredRecField: 'filteredRec',    // default: 'filteredRec' (modalità server-side)
 *   data: null,                         // default: null (ha la precedenza su jsonUrl quando impostato)
 *   cols: [                             // obbligatorio
 *     { key: 'id', dataType: 'id' },
 *     { key: 'name', title: 'Nome', render: (row, tr, td) => `<a href="/users/${row.id}">${row.name}</a>` },
 *     { key: 'amount', dataType: 'euro', tfootRender: '@sum' },
 *     { key: 'active', dataType: 'bool' }
 *   ],
 *   dataTypes: {},                      // default: {} (tipi personalizzati, uniti a quelli predefiniti)
 *   caption: 'Utenti',                  // default: null
 *   search: true,                       // default: true
 *   searchDebounce: 300,                // default: 300 (ms)
 *   perPage: 25,                        // default: 25 (0 = nessuna paginazione)
 *   paginationDelta: 2,                 // default: 2
 *   serverSide: false,                  // default: false
 *   serverParams: { page: 'page', start: 'start', perPage: 'perPage', sort: 'sort', dir: 'dir', search: 'search' }, // default
 *   initialSort: { key: 'name', dir: 'asc' }, // default: null
 *   tfoot: true,                        // default: false (non disponibile in modalità server-side)
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
 *   classes: { table: 'table' },        // unito ai default (vedi JsonTableClasses)
 *   labels: { noRows: 'Nessun utente' } // unito ai default (vedi JsonTableLabels)
 * });
 */
export class JsonTable extends HTMLElement {

  /**
   * Imposta i default a livello di progetto, condivisi da ogni istanza creata successivamente
   * (le istanze già renderizzate non vengono aggiornate). Chiamarlo una sola volta, prima della creazione
   * delle istanze, ad es. in uno script condiviso. I valori vengono uniti a quelli precedenti.
   *
   * @param {Partial<JsonTableParams>} [newDefaults={}] - Parametri da sovrascrivere (default: {})
   * @returns {void}
   *
   * @example
   * JsonTable.setDefaults({
   *   perPage: 50,
   *   classes: { searchInput: 'form-control', table: 'table' }, // unito alle classi predefinite
   *   labels: { searchPlaceholder: 'Cerca…' },                  // unito alle label predefinite
   *   infoText: (start, end, totRec, filteredRec) => `${filteredRec} di ${totRec} record`
   * });
   */
  static setDefaults(newDefaults = {}) {
    projectDefaults = { ...projectDefaults, ...newDefaults };
  }

  /**
   * Cancella i default a livello di progetto impostati con `setDefaults()`.
   * @returns {void}
   */
  static resetDefaults() {
    projectDefaults = {};
  }

  /**
   * Restituisce i default predefiniti uniti a quelli a livello di progetto.
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
    // light DOM: nessun attachShadow

    /** @type {Partial<JsonTableParams>|null} configurazione passata tramite init()/reload() */
    this._config = null;
    this._initCalledProgrammatically = false;
    this._isConnected = false;
    this._loadStarted = false;
    /** incrementato a ogni init()/reload()/destroy(): un _load() in sospeso la cui generazione è obsoleta rinuncia */
    this._loadGeneration = 0;
    /** incrementato a ogni richiesta server-side: una risposta obsoleta viene ignorata */
    this._requestGeneration = 0;
    /** timer di debounce della ricerca in sospeso (vedi `search.js`) @type {ReturnType<typeof setTimeout>|undefined} */
    this._searchTimer = undefined;

    /** Parametri risolti, disponibili dopo il primo caricamento. @type {JsonTableParams} */
    this.params = /** @type {JsonTableParams} */ ({ ...defaults });

    /** Righe grezze, disponibili dopo il primo caricamento (solo la pagina corrente in modalità server-side). @type {Array<Object>|null} */
    this.data = null;

    /** Mappa dei data type (predefiniti + personalizzati), disponibile dopo il primo caricamento. @type {Object<string, DataTypeDefinition>} */
    this.dataTypes = {};

    /** Colonne visibili analizzate, disponibili dopo il primo caricamento. @type {ParsedCol[]} */
    this.cols = [];

    /** Stato del rendering, disponibile dopo il primo caricamento. @type {JsonTableState} */
    this.state = emptyState();

    /** Elementi generati, disponibili dopo il primo caricamento. @type {JsonTableElements} */
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


  // ─── API pubblica ─────────────────────────────────────────────────────────────

  /**
   * Avvia il componente tramite script, passando la configurazione come oggetto.
   * Può essere chiamato prima o dopo che l'elemento è stato aggiunto al DOM.
   *
   * I parametri non inclusi in `config` vengono letti dal corrispondente attributo HTML
   * (se presente), poi dai default di progetto, poi dai default predefiniti.
   * Per ignorare esplicitamente un attributo esistente passare `null` nella config.
   *
   * @param {Partial<JsonTableParams>} [config={}] - Vedi `JsonTableParams` (default: {})
   * @returns {void}
   *
   * @example
   * // <json-table caption="Utenti" search="false" cols='[...]'></json-table>
   * el.init({ jsonUrl: '/api/rows.json' });   // jsonUrl dallo script, caption, search e cols dagli attributi
   * el.init({ jsonUrl: '/api/rows.json', search: null }); // search → default (true), l'attributo viene ignorato
   */
  init(config = {}) {
    this._config = config;
    this._initCalledProgrammatically = true;

    // un init() esplicito deve sempre riavviare, anche se connectedCallback ha già
    // eseguito un _load() prematuro (ad es. quando domBuilder aggiunge l'elemento prima di init())
    this._loadStarted = false;
    this._loadGeneration++;

    if (this._isConnected) {
      this._load();
    }
  }

  /**
   * Svuota il componente e ne azzera lo stato. Dopo si può richiamare `init()`
   * per reinizializzarlo con nuovi parametri, senza ricreare l'elemento.
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
   * Ricarica i dati e ricostruisce la struttura, sovrascrivendo opzionalmente alcuni parametri
   * (uniti alla config passata a `init()`, se presente). Ricerca, ordinamento e pagina vengono azzerati.
   *
   * @param {Partial<JsonTableParams>} [overrides={}] - Parametri da sovrascrivere (default: {})
   * @returns {Promise<void>}
   *
   * @example
   * await el.reload();                                  // stessa sorgente
   * await el.reload({ jsonUrl: '/api/rows.json?y=2025' }); // nuovo URL
   * await el.reload({ data: [{ id: 1 }] });             // dati inline (hanno la precedenza su jsonUrl)
   */
  async reload(overrides = {}) {
    this._config = { ...(this._config ?? {}), ...overrides };
    this._loadStarted = false;
    this._loadGeneration++;
    await this._load();
  }

  /**
   * Mostra la pagina indicata (limitata all'intervallo disponibile). In modalità server-side viene inviata
   * una nuova richiesta. Non succede nulla quando la pagina non cambia.
   *
   * @param {number} page - Numero di pagina (da 1)
   * @param {string|null} [focusTarget=null] - `data-page` del pulsante di paginazione a cui dare il focus dopo il
   *   rendering (usato dai pulsanti di paginazione stessi) (default: null)
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
   * Ordina le righe per una colonna (`dir` null rimuove l'ordinamento) e torna alla prima pagina.
   * La colonna deve esistere ed essere ordinabile, altrimenti la chiamata viene ignorata con un errore in console.
   * In modalità server-side viene inviata una nuova richiesta.
   *
   * @param {string} key - Chiave della colonna
   * @param {'asc'|'desc'|null} dir - Direzione, oppure null per rimuovere l'ordinamento
   * @returns {void}
   *
   * @example
   * el.setSort('name', 'desc');
   * el.setSort('name', null); // ordine originale
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
   * Filtra le righe per un termine di ricerca (ogni parola separata da spazi deve corrispondere, senza distinzione tra maiuscole e minuscole)
   * e torna alla prima pagina; un termine vuoto rimuove il filtro. L'input di ricerca, quando
   * presente, resta sincronizzato. In modalità server-side viene inviata una nuova richiesta.
   *
   * @param {string} term - Termine di ricerca
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


  // ─── Caricamento e costruzione ───────────────────────────────────────────────────────────

  /**
   * Risolve i parametri, analizza le colonne, recupera i dati e costruisce la struttura.
   * Protetto da chiamate concorrenti/obsolete tramite `_loadStarted` e `_loadGeneration`.
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

    // placeholder di caricamento (spinner di minimo)
    domBuilder([
      {
        className: 'spinner',
        children: [{ tag: 'span', className: 'visually-hidden', content: params.labels.loading }]
      }
    ], this, { emptyParent: true });

    // analisi delle colonne (gli errori di configurazione vengono segnalati e fermano il rendering)
    try {
      this.dataTypes = buildDataTypes(params);
      this.cols = parseCols(params.cols, this.dataTypes, params);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      this.innerHTML = '';
      return;
    }

    // stato iniziale
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

    // un init()/reload()/destroy() più recente ha sostituito questo caricamento
    if (generation !== this._loadGeneration) {
      return;
    }

    if (failed) {
      this.innerHTML = '';
      return;
    }

    if (result === null) {
      // nessuna sorgente: silenzioso quando creato da markup senza attributi (init() può seguire)
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

    // emesso nel microtask successivo così che i listener registrati subito dopo init() lo ricevano comunque
    const event = new CustomEvent('jt:ready', { detail: { jsonTable: this }, bubbles: true });
    Promise.resolve().then(() => this.dispatchEvent(event));
  }

  /**
   * Normalizza i parametri risolti che dipendono l'uno dall'altro, segnalando le incoerenze:
   * `perPage`/`paginationDelta` devono essere numeri non negativi, `serverSide` richiede `jsonUrl`
   * (ignorato con `data` inline) e disattiva `tfoot` (gli aggregati verrebbero calcolati solo sulla
   * pagina corrente).
   * @param {JsonTableParams} params - Parametri risolti (modificati)
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
   * Stato corrente della richiesta server-side (vedi `get-data.js` → `ServerRequest`).
   * @returns {import('./src/get-data.js').ServerRequest}
   */
  _serverRequest() {
    const { state, params } = this;
    return {
      page: state.page,
      perPage: params.perPage > 0 ? params.perPage : 0,
      sort: state.sort,
      search: state.searchTerm,
      cols: this.cols
    };
  }

  /**
   * Memorizza un risultato di dati: righe grezze, righe analizzate e totali.
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
   * Calcola `filtered`, `pageRows`, `filteredRec`, `totPages` e limita `page` a partire da `rows`,
   * `searchTerm`, `sort` e `page`.
   *
   * Modalità client-side: ricerca e ordinamento vengono applicati a `rows`, poi viene estratta la pagina corrente.
   * Modalità server-side: `rows` è già la pagina richiesta, `filteredRec` proviene dal JSON.
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
   * Applica un cambio di stato (pagina, ordinamento o ricerca): ricalcola lo stato e rieffettua il rendering oppure, in
   * modalità server-side, invia una nuova richiesta (le risposte obsolete vengono ignorate) e ne renderizza il risultato.
   * Emette `jt:update` alla fine.
   *
   * @param {UpdateReason} reason - Cosa è cambiato
   * @param {string|null} [focusTarget=null] - Passato a `renderPagination()` (default: null)
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
        return; // sostituita da una richiesta più recente o da un reload/destroy
      }
      this.elements.wrapper?.removeAttribute('aria-busy');

      if (!result) {
        return;
      }
      this._setData(result);
      this._computeState();

      // la pagina richiesta non esiste più (l'insieme di dati si è ridotto dall'ultima richiesta):
      // `_computeState` ha limitato la pagina, recupera l'ultima disponibile
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
   * Renderizza le parti che dipendono dallo stato: righe del body, footer, indicatori di ordinamento, paginazione e
   * testo informativo. Il footer viene saltato ai cambi di pagina quando `updateFooterOnPageChange` è false
   * (il suo contenuto non cambierebbe).
   *
   * @param {UpdateReason|null} [reason=null] - Cosa è cambiato (null al primo rendering) (default: null)
   * @param {string|null} [focusTarget=null] - Passato a `renderPagination()` (default: null)
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
