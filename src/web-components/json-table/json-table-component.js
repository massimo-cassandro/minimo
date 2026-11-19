/*! minimo - json-table */

import { defaults } from './src/defaults.js';
import { resolveParams, getParam } from './src/resolve-params.js';
import { getJqMode, loadJqMode } from './src/jq-mode-registry.js';
import { getData } from './src/get-data.js';
import { buildDataTypes } from './src/data-types.js';
import { MISSING_COLS_MESSAGE, parseCols, warnIneffectiveColParams } from './src/parse-cols.js';
import { parseRows } from './src/parse-rows.js';
import { mainBuilder } from './src/main-builder.js';
import { loaderPart, showLoader, hideLoader } from './src/loader.js';
import { renderTbody } from './src/table-body.js';
import { renderTfoot } from './src/tfoot.js';
import { updateInfo } from './src/update-info.js';
import { applySortState, setSortListener } from './src/thead.js';
import { setSearchListener, filterRows, normalizeSearchFields } from './src/search.js';
import { sortRows } from './src/sorting.js';
import { calcTotPages, renderPagination } from './src/pagination.js';
import { bindFilterForm, rereadFilterForm, resolveFilterForm } from './src/filter-form.js';
import {
  STATE_VERSION, buildStateKey, colsSignature, fillForm, getNavigationType, getStorage, isReferrerAllowed,
  normalizeReferrers, parseSavedState, restorePage, restoreSort, storageRead, storageRemove, storageWrite
} from './src/state-save.js';
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';

/** @typedef {import('./src/defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./src/defaults.js').DataTypeDefinition} DataTypeDefinition */
/** @typedef {import('./src/defaults.js').SortDef} SortDef */
/** @typedef {import('./src/parse-cols.js').ParsedCol} ParsedCol */
/** @typedef {import('./src/parse-rows.js').ParsedRow} ParsedRow */
/** @typedef {import('./src/main-builder.js').JsonTableElements} JsonTableElements */
/** @typedef {import('./src/state-save.js').SavedState} SavedState */
/** @typedef {import('./src/state-save.js').StateTarget} StateTarget */

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
 * @property {SortDef[]} sort - Criteri di ordinamento attivi, in ordine di priorità ([] = nessun ordinamento)
 * @property {number} page - Pagina corrente (da 1)
 * @property {number} totPages - Numero totale di pagine (1 quando la paginazione è disattivata)
 */

/**
 * Motivo di un aggiornamento dello stato, passato nel detail dell'evento `jt:update`:
 * `filter` = submit/reset del form di filtro (`filterForm`), `refresh` = chiamata di `refresh()`.
 * @typedef {'page'|'sort'|'search'|'filter'|'refresh'} UpdateReason
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
  totRec: 0, filteredRec: 0, rows: [], filtered: [], pageRows: [], searchTerm: '', sort: [], page: 1, totPages: 1
});

/**
 * `<json-table>` – generatore di tabelle HTML da dati JSON (inline o recuperati via fetch), custom element in light DOM,
 * con ordinamento, ricerca e paginazione (client-side, oppure server-side con `serverSide: true`).
 *
 * I parametri (vedi `src/defaults.js` → `JsonTableParams`) si possono impostare come attributi HTML o tramite
 * `init()`; precedenza: `init()` > attributo HTML > `JsonTable.setDefaults()` > default predefinito.
 *
 * Eventi (tutti con bubbling, `event.detail.jsonTable` è l'istanza del componente):
 * - `jt:ready`: emesso quando la struttura è stata costruita e i primi dati sono stati renderizzati
 * - `jt:update`: emesso dopo ogni cambio di pagina / ordinamento / ricerca / filtro e dopo `refresh()` (`event.detail.reason`)
 * - `jt:stateload`: emesso (annullabile) prima della prima richiesta quando viene ripristinato uno stato salvato
 *   (`event.detail.state`, vedi `stateSave`); `preventDefault()` scarta lo stato
 * - `jt:statesave`: emesso (annullabile) prima di ogni salvataggio dello stato; `event.detail.state.extra` può essere
 *   impostato con dati della pagina, restituiti da `jt:stateload`
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
 *   jsonUrl: '/api/rows.json',          // default: null (con filterForm: action del form)
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
 *   serverParams: { page: 'page', start: 'start', perPage: 'perPage', sort: 'sort', dir: 'dir', search: 'search', searchFields: 'searchFields' }, // default
 *   searchFields: null,                 // default: null (campi di ricerca aggiuntivi, anche non presenti in cols)
 *   filterForm: null,                   // default: null (id del form di filtro, oppure l'elemento <form>)
 *   initialSort: { city: 'asc', name: 'desc' }, // default: null
 *   stateSave: true,                    // default: true (senza id e stateKey l'id dell'elemento viene generato)
 *   stateStorage: 'session',            // default: 'session' ('local' → localStorage)
 *   stateKey: null,                     // default: null → 'json-table:<pathname>:<id>'
 *   stateReferrers: ['/clienti/scheda'], // default: null (ripristino da qualunque pagina)
 *   stateMaxAge: 0,                     // default: 0 (secondi, 0 = nessuna scadenza)
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
    /** timer della comparsa ritardata dell'overlay di caricamento (vedi `loaderDelay`) @type {ReturnType<typeof setTimeout>|undefined} */
    this._loaderTimer = undefined;
    /** true quando il primo caricamento è terminato e la tabella è stata renderizzata con i dati */
    this._loaded = false;
    /** valori correnti del form di filtro (vedi `filter-form.js`) @type {URLSearchParams|null} */
    this._filters = null;
    /** rimuove i listener del form di filtro @type {AbortController|null} */
    this._filterFormController = null;
    /** form di filtro collegato (vedi `filter-form.js`) @type {HTMLFormElement|null} */
    this._filterForm = null;
    /** storage e chiave dello stato salvato, `null` quando `stateSave` non è attivo o disponibile @type {StateTarget|null} */
    this._stateTarget = null;
    /** dati della pagina salvati con lo stato (vedi `jt:statesave`) @type {*} */
    this._stateExtra = null;
    /** true durante `reload()`: lo stato salvato non viene ripristinato */
    this._skipStateRestore = false;

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

    // rimandato al microtask successivo: un init() sincrono arriva prima del caricamento automatico e lo sostituisce
    queueMicrotask(() => {
      if (this._isConnected && !this._loadStarted) {
        this._load();
      }
    });
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
    // eseguito un _load() prematuro (ad es. quando init() viene chiamato da un altro script o dopo un await)
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
    clearTimeout(this._loaderTimer);
    this._loaded = false;
    this._filterFormController?.abort();
    this._filterFormController = null;
    this._filters = null;
    this._filterForm = null;
    this._stateTarget = null;
    this._stateExtra = null;
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
   * (uniti alla config passata a `init()`, se presente). Ricerca, ordinamento e pagina vengono azzerati: lo stato salvato
   * (vedi `stateSave`) non viene ripristinato e viene sovrascritto dal nuovo stato.
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
    this._skipStateRestore = true;
    await this._load();
  }

  /**
   * Richiede di nuovo i dati con lo stato corrente (pagina, ordinamento, ricerca e valori del form di filtro) e
   * ridisegna la tabella senza ricostruirne la struttura, a differenza di `reload()`. Utile, ad esempio, dopo una
   * modifica dei dati sul server o per aggiornamenti periodici. Se la tabella non è ancora stata costruita equivale a
   * `reload()`. Emette `jt:update` con `reason: 'refresh'`.
   *
   * @returns {Promise<void>}
   *
   * @example
   * await el.refresh();
   * setInterval(() => el.refresh(), 60_000);
   */
  async refresh() {
    if (!this._loaded) {
      await this.reload();
      return;
    }
    await this._update('refresh', null, true);
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
    this.state.sort = dir == null ? [] : [{ key, dir }];
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

  /**
   * Cancella lo stato salvato (vedi `stateSave`), compresi i dati extra della pagina. La tabella non cambia, e al prossimo
   * aggiornamento (cambio di pagina, ordinamento, ricerca, filtro) viene salvato un nuovo stato; per tornare anche alla
   * situazione iniziale chiamare poi `reload()`. Non fa nulla prima del caricamento o quando `stateSave` non è attivo.
   *
   * @returns {void}
   *
   * @example
   * el.clearState();
   * await el.reload(); // pagina 1, initialSort, ricerca vuota
   */
  clearState() {
    if (this._stateTarget) {
      storageRemove(this._stateTarget);
    }
    this._stateExtra = null;
  }

  /**
   * Salva subito lo stato corrente (vedi `stateSave`), emettendo `jt:statesave`. Lo stato viene già salvato dopo ogni
   * aggiornamento della tabella: serve, ad esempio, dopo una modifica dei dati extra della pagina.
   *
   * @returns {void}
   */
  saveState() {
    this._saveState();
  }

  /**
   * Restituisce lo stato salvato (vedi `SavedState` in `src/state-save.js`), oppure `null` se assente, non valido o se
   * `stateSave` non è attivo. Disponibile dopo il primo caricamento.
   *
   * @returns {SavedState|null}
   *
   * @example
   * el.getSavedState()?.extra;
   */
  getSavedState() {
    if (!this._stateTarget) {
      return null;
    }
    return parseSavedState(storageRead(this._stateTarget), {
      sig: colsSignature(this.cols), maxAge: Number(this.params.stateMaxAge) || 0
    }).state;
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
    this._loaded = false;
    clearTimeout(this._searchTimer);
    clearTimeout(this._loaderTimer);
    const generation = this._loadGeneration;

    // modulo opzionale `jqDatatableMode`: caricato (chunk separato) solo dalle tabelle che lo usano
    if (getParam(this, this._config, projectDefaults, 'jqDatatableMode') === true && !getJqMode()) {
      try {
        await loadJqMode();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[json-table] `jqDatatableMode`: impossibile caricare il modulo `jq-datatable-mode.js`', err);
        this.innerHTML = '';
        return;
      }
      if (generation !== this._loadGeneration) {
        return;
      }
    }

    /** @type {JsonTableParams} */
    let params;
    try {
      // con `jqDatatableMode` lancia un errore se il modulo opzionale non è disponibile
      params = resolveParams(this, this._config, projectDefaults);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      this.innerHTML = '';
      return;
    }
    this.params = params;

    // form di filtro indicato per id ma non ancora presente (markup successivo alla tabella, documento in caricamento)
    if (typeof params.filterForm === 'string' && params.filterForm && !document.getElementById(params.filterForm)
      && document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
      if (generation !== this._loadGeneration) {
        return;
      }
    }

    // caricamento automatico senza colonne: possono ancora arrivare con init(), anche da un altro script
    if (this._config === null && !params.cols?.length) {
      this._reportMissingColsAfterPageLoad();
      return;
    }

    this._validateParams(params);
    bindFilterForm(this);

    // spinner del primo caricamento, al posto della struttura non ancora costruita (vedi `loader`)
    domBuilder([loaderPart(this, null, true)], this, { emptyParent: true });

    // analisi delle colonne (gli errori di configurazione vengono segnalati e fermano il rendering)
    try {
      this.dataTypes = buildDataTypes(params);
      this.cols = parseCols(params.cols, this.dataTypes, params);
      warnIneffectiveColParams(this.cols, params);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      this.innerHTML = '';
      return;
    }

    // stato iniziale
    this.state = emptyState();
    if (params.initialSort != null) {
      if (typeof params.initialSort === 'object' && !Array.isArray(params.initialSort)) {
        Object.entries(params.initialSort).forEach(([key, dir]) => {
          const col = this.cols.find(c => c.key === key);
          if (col && col.sortable && (dir === 'asc' || dir === 'desc')) {
            this.state.sort.push({ key, dir });
          } else {
            // eslint-disable-next-line no-console
            console.error(`[json-table] initialSort: colonna \`${key}\` inesistente o non ordinabile, oppure direzione non valida (${dir}): criterio ignorato`);
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.error('[json-table] initialSort: deve essere un oggetto `{ chiave: "asc"|"desc", … }`, valore ignorato', params.initialSort);
      }
    }

    // stato salvato (stateSave): ripristinato prima della prima richiesta, con la precedenza su initialSort
    const restoreState = !this._skipStateRestore;
    this._skipStateRestore = false;
    const saved = this._initStateSave(restoreState);
    let restored = false;

    if (saved) {
      const form = this._filterForm;
      const formBefore = form ? [...(this._filters ?? [])] : null;
      if (form && saved.filters) {
        fillForm(form, saved.filters);
      }

      // nel microtask successivo, così che i listener registrati subito dopo init() ricevano l'evento
      await Promise.resolve();
      if (generation !== this._loadGeneration) {
        return;
      }

      const event = new CustomEvent('jt:stateload', { detail: { jsonTable: this, state: saved }, bubbles: true, cancelable: true });
      if (this.dispatchEvent(event)) {
        // il form, eventualmente modificato dai listener, viene riletto: i suoi valori vanno nella prima richiesta
        rereadFilterForm(this);
        this.state.sort = restoreSort(saved.sort, this.cols);
        this.state.searchTerm = String(saved.search ?? '').trim();
        this.state.page = restorePage(saved.page, saved.perPage, params.perPage);
        this._stateExtra = saved.extra ?? null;
        restored = true;
      } else {
        // stato rifiutato: il form torna ai valori precedenti e lo stato salvato viene cancellato
        if (form && formBefore && saved.filters) {
          fillForm(form, formBefore);
        }
        this.clearState();
      }
    }

    /**
     * Richiede i dati con lo stato corrente; `undefined` in caso di errore.
     * @returns {Promise<import('./src/get-data.js').DataResult|null|undefined>}
     */
    const fetchData = async () => {
      try {
        return await getData(params, params.serverSide ? this._serverRequest() : null, this._filters);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        return undefined;
      }
    };

    let result = await fetchData();

    // un init()/reload()/destroy() più recente ha sostituito questo caricamento
    if (generation !== this._loadGeneration) {
      return;
    }

    // la pagina ripristinata non esiste più (l'insieme di dati si è ridotto): viene richiesta l'ultima disponibile
    if (restored && params.serverSide && result && !result.rows.length && result.filteredRec > 0 && this.state.page > 1) {
      this.state.page = calcTotPages(result.filteredRec, params.perPage);
      result = await fetchData();
      if (generation !== this._loadGeneration) {
        return;
      }
    }

    if (result === undefined) {
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

    if (this.elements.searchInput && this.state.searchTerm) {
      this.elements.searchInput.value = this.state.searchTerm;
    }

    this._computeState();
    this._render();
    this._loaded = true;
    this._saveState();

    if (params.debug) {
      /* eslint-disable no-console */
      console.groupCollapsed('[json-table] params, cols, data, state & elements', this);
      console.log('params', params);
      console.log('dataTypes', this.dataTypes);
      console.log('cols', this.cols);
      console.log('data', this.data);
      console.log('state', this.state);
      console.log('filters', this._filters?.toString());
      console.log('stateKey', this._stateTarget?.key ?? null, restored ? '(stato ripristinato)' : '');
      console.log('elements', this.elements);
      console.groupEnd();
      /* eslint-enable no-console */
    }

    // emesso nel microtask successivo così che i listener registrati subito dopo init() lo ricevano comunque
    const event = new CustomEvent('jt:ready', { detail: { jsonTable: this }, bubbles: true });
    Promise.resolve().then(() => this.dispatchEvent(event));
  }

  /**
   * Segnala la mancanza di `cols` al termine del caricamento della pagina, quando tutti gli script sono stati eseguiti,
   * se nel frattempo `init()` e `reload()` non sono stati chiamati.
   * @returns {void}
   */
  _reportMissingColsAfterPageLoad() {
    const report = () => {
      if (this._config === null && this._isConnected) {
        // eslint-disable-next-line no-console
        console.error(MISSING_COLS_MESSAGE);
      }
    };

    if (document.readyState === 'complete') {
      setTimeout(report);
    } else {
      window.addEventListener('load', report, { once: true });
    }
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

    const hasFilterForm = params.filterForm != null && params.filterForm !== '';

    // con `filterForm` e senza `jsonUrl` (né `data`), l'URL viene ricavato dall'attributo `action` del form
    if (hasFilterForm && params.data == null && !params.jsonUrl) {
      const form = resolveFilterForm(params.filterForm);
      if (form) {
        const action = form.getAttribute('action')?.trim();
        if (action) {
          params.jsonUrl = form.action; // URL assoluto, risolto dal browser
        } else {
          console.error('[json-table] Nessuna sorgente dati: `jsonUrl` non impostato e il form di `filterForm` non ha l\'attributo `action`.');
        }
      }
    }

    if (params.serverSide && (params.data != null || !params.jsonUrl)) {
      console.warn('[json-table] `serverSide` richiede `jsonUrl` (senza `data`): modalità server-side ignorata');
      params.serverSide = false;
    }

    if (params.serverSide && params.tfoot) {
      console.warn('[json-table] `tfoot` non è disponibile in modalità server-side (i dati sono paginati dal server): tfoot ignorato');
      params.tfoot = false;
    }

    if (hasFilterForm && (params.data != null || !params.jsonUrl)) {
      if (params.data != null) {
        console.warn('[json-table] `filterForm` non è compatibile con `data` inline: parametro ignorato');
      }
      params.filterForm = null;
    }

    params.searchFields = normalizeSearchFields(params.searchFields, params);

    if (params.stateSave) {
      if (params.stateStorage !== 'session' && params.stateStorage !== 'local') {
        console.warn(`[json-table] \`stateStorage\`: valore non valido (${params.stateStorage}), viene usato 'session'`);
        params.stateStorage = 'session';
      }
      const maxAge = Number(params.stateMaxAge);
      params.stateMaxAge = Number.isFinite(maxAge) && maxAge > 0 ? maxAge : 0;
      params.stateReferrers = normalizeReferrers(params.stateReferrers);
    }
    /* eslint-enable no-console */
  }

  /**
   * Prepara la persistenza dello stato (vedi `stateSave`): ricava storage e chiave (`_stateTarget`) e, con `restore`,
   * legge lo stato salvato. Lo stato viene cancellato quando la pagina di provenienza non è tra `stateReferrers` e quando
   * non è valido (formato o colonne diversi, scaduto).
   *
   * @param {boolean} restore - Se leggere lo stato salvato (false durante `reload()`)
   * @returns {SavedState|null} Lo stato da ripristinare, oppure `null`
   */
  _initStateSave(restore) {
    /* eslint-disable no-console */
    const { params } = this;
    this._stateTarget = null;
    this._stateExtra = null;

    if (!params.stateSave) {
      return null;
    }

    // senza id, tableId e stateKey viene assegnato all'elemento un id generato (vedi `_generateId`)
    if (!this.id && !params.tableId && !(typeof params.stateKey === 'string' && params.stateKey.trim() !== '')) {
      this.id = this._generateId();
      if (params.debug) {
        console.log(`[json-table] \`stateSave\`: elemento senza id, assegnato \`${this.id}\``);
      }
    }

    const key = buildStateKey(params.stateKey, this.id || params.tableId, location.pathname);
    if (!key) {
      return null;
    }

    const storage = getStorage(params.stateStorage);
    if (!storage) {
      if (params.debug) {
        console.warn(`[json-table] \`stateSave\`: ${params.stateStorage}Storage non disponibile, persistenza disattivata`);
      }
      return null;
    }

    const target = { storage, key };
    this._stateTarget = target;

    if (!restore) {
      return null;
    }

    if (!isReferrerAllowed(/** @type {import('./src/defaults.js').StateReferrer[]|null} */ (params.stateReferrers),
      document.referrer, location.href, getNavigationType())) {
      storageRemove(target);
      if (params.debug) {
        console.log(`[json-table] \`stateSave\`: pagina di provenienza non ammessa da \`stateReferrers\` (${document.referrer}), stato cancellato`);
      }
      return null;
    }

    const { state, reason } = parseSavedState(storageRead(target), { sig: colsSignature(this.cols), maxAge: params.stateMaxAge });
    if (reason) {
      storageRemove(target);
      if (params.debug) {
        console.log(`[json-table] \`stateSave\`: stato salvato scartato (${reason})`);
      }
    }
    return state;
    /* eslint-enable no-console */
  }

  /**
   * Genera un id per l'elemento, usato per la chiave dello stato (vedi `stateSave`): `json-table-<n>`, dove `n` è la posizione
   * dell'elemento tra i `<json-table>` del documento (da 1). Non è casuale, così resta lo stesso a ogni caricamento della
   * pagina e lo stato salvato viene ritrovato; se l'id è già usato da un altro elemento viene aggiunto un suffisso.
   * @returns {string}
   *
   * @example
   * // secondo <json-table> della pagina, senza id
   * jt._generateId(); // → 'json-table-2'
   */
  _generateId() {
    const all = Array.from(document.querySelectorAll('json-table'));
    const idx = all.indexOf(this);
    const base = `json-table-${idx >= 0 ? idx + 1 : all.length + 1}`;
    let id = base;
    for (let i = 2; document.getElementById(id) && document.getElementById(id) !== this; i++) {
      id = `${base}-${i}`;
    }
    return id;
  }

  /**
   * Salva lo stato corrente (vedi `stateSave`), dopo aver emesso `jt:statesave`: i listener possono impostare
   * `event.detail.state.extra` o annullare il salvataggio con `preventDefault()`. Non fa nulla quando la persistenza non
   * è attiva o la tabella non è ancora stata costruita.
   * @returns {void}
   */
  _saveState() {
    if (!this._stateTarget || !this._loaded) {
      return;
    }
    const { state, params } = this;

    /** @type {SavedState} */
    const saved = {
      v: STATE_VERSION,
      sig: colsSignature(this.cols),
      savedAt: Date.now(),
      page: state.page,
      perPage: params.perPage,
      sort: state.sort.map(({ key, dir }) => ({ key, dir })),
      search: state.searchTerm,
      filters: this._filterForm ? /** @type {Array<[string, string]>} */ ([...(this._filters ?? [])]) : null,
      extra: this._stateExtra
    };

    const event = new CustomEvent('jt:statesave', { detail: { jsonTable: this, state: saved }, bubbles: true, cancelable: true });
    if (!this.dispatchEvent(event)) {
      return;
    }
    this._stateExtra = saved.extra ?? null;

    let json;
    try {
      json = JSON.stringify(saved);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[json-table] `stateSave`: stato non serializzabile (verificare `extra`), non salvato', err);
      return;
    }
    if (!storageWrite(this._stateTarget, json) && params.debug) {
      // eslint-disable-next-line no-console
      console.warn('[json-table] `stateSave`: scrittura dello storage non riuscita');
    }
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
    state.filtered = state.sort.length ? sortRows(filtered, state.sort, params.locale) : filtered;
    state.filteredRec = state.filtered.length;
    state.totPages = calcTotPages(state.filteredRec, params.perPage);
    state.page = Math.min(Math.max(1, state.page), state.totPages);
    state.pageRows = params.perPage > 0
      ? state.filtered.slice((state.page - 1) * params.perPage, state.page * params.perPage)
      : state.filtered;
  }

  /**
   * Applica i valori del form di filtro (submit o reset, vedi `filter-form.js`): torna alla prima pagina, azzera la
   * ricerca interna (mantenendo l'ordinamento), richiede di nuovo i dati e ridisegna la tabella. Se la tabella non è
   * ancora stata costruita (caricamento in corso o fallito) esegue `reload()`, che rilegge il form.
   *
   * @param {URLSearchParams} filters - Valori del form
   * @returns {Promise<void>}
   */
  async _applyFilters(filters) {
    if (!this._loaded) {
      await this.reload();
      return;
    }

    this._filters = filters;
    clearTimeout(this._searchTimer);
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.state.searchTerm = '';
    this.state.page = 1;
    await this._update('filter', null, true);
  }

  /**
   * Applica un cambio di stato (pagina, ordinamento, ricerca o filtro): ricalcola lo stato e rieffettua il rendering
   * oppure, in modalità server-side o con `refetch`, invia una nuova richiesta (le risposte obsolete vengono ignorate) e
   * ne renderizza il risultato. Emette `jt:update` alla fine.
   *
   * @param {UpdateReason} reason - Cosa è cambiato
   * @param {string|null} [focusTarget=null] - Passato a `renderPagination()` (default: null)
   * @param {boolean} [refetch=false] - Richiede di nuovo i dati anche in modalità client-side (default: false)
   * @returns {Promise<void>}
   */
  async _update(reason, focusTarget = null, refetch = false) {

    if (this.params.serverSide || refetch) {
      const generation = ++this._requestGeneration;
      const loadGeneration = this._loadGeneration;
      const requestedPage = this.state.page;
      // overlay di caricamento solo in modalità server-side; altrimenti (refetch) solo `aria-busy`
      showLoader(this, this.params.serverSide);

      /** @type {import('./src/get-data.js').DataResult|null} */
      let result = null;
      try {
        result = await getData(this.params, this.params.serverSide ? this._serverRequest() : null, this._filters);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }

      if (generation !== this._requestGeneration || loadGeneration !== this._loadGeneration) {
        return; // sostituita da una richiesta più recente o da un reload/destroy
      }
      hideLoader(this);

      if (!result) {
        return;
      }
      this._setData(result);
      this._computeState();

      // la pagina richiesta non esiste più (l'insieme di dati si è ridotto dall'ultima richiesta):
      // `_computeState` ha limitato la pagina, recupera l'ultima disponibile
      if (this.params.serverSide && !this.state.rows.length && this.state.filteredRec > 0 && this.state.page !== requestedPage) {
        this._update(reason, focusTarget);
        return;
      }

    } else {
      this._computeState();
    }

    this._render(reason, focusTarget);
    this._saveState();

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
