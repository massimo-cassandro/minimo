import { DataTable } from 'simple-datatables';

import { parseCols } from './src/parse-cols.js';

import * as styles from './s-datatable-component.module.css';

import caretLeftIcon from '../../icons/caret-left.svg?inline';
import caretRightIcon from '../../icons/caret-right.svg?inline';


/**
 * Impementazione di simple-datatable (https://fiduswriter.github.io/simple-datatables/documentation/)
 * per generare una tabella da dati json e da un oggetto `cols` di configurazione
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PARAMETRI
 * ─────────────────────────────────────────────────────────────────────────────
 * Tutti i parametri sono leggibili sia da attributo HTML che da script (init).
 * Ordine di precedenza: script > attributo HTML > default interno.
 *
 * @typedef  {object} ColDefinition
 * @property {string}  _heading              Intestazione della colonna (obbligatorio).
 * @property {string}  _field                Chiave del campo nell'oggetto dato (obbligatorio).
 * @property {string}  [_title]              Testo del tooltip sull'intestazione.
 * @property {string}  [_renderTpl]          Template HTML per il contenuto della cella.
 *                                           I segnaposto `[[key]]` vengono sostituiti con i
 *                                           valori corrispondenti dell'oggetto riga.
 * @property {'id'|'email'|'boolean'|'sf_datetime'} [_renderMode]
 *                                           Modalità di visualizzazione predefinita:
 *                                           - `id`          – colonna numerica, non ricercabile, allineata a destra
 *                                           - `email`       – inserisce andate a capo prima e dopo la `@`
 *                                           - `boolean`     – icona segno di spunta / croce con colore semantico
 *                                           - `sf_datetime` – data e ora da oggetto Symfony (con pre-elaborazione in `_load`)
 *
 * @param {string}        json      URL da cui recuperare i dati (struttura attesa: `{ data: [...] }`).
 *                                  Ignorato se `data` è presente.
 *                                  Eventuali altre chiavi aggiuntive (oltre a `data`) vengono ignorate
 *
 * @param {Array<object>} data      Dati inline, come array di oggetti plain.
 *                                  Ha precedenza su `json` se entrambi sono specificati.
 *                                  Come attributo HTML è utile principalmente in contesti SSR
 *                                  (Twig, Blade, ecc.) dove il JSON viene serializzato server-side;
 *                                  per grandi dataset è preferibile `json`.
 *
 * @param {ColDefinition[]} cols     Definizione delle colonne. Le chiavi con prefisso `_` sono
 *                                  proprietà di questo componente; le restanti vengono passate
 *                                  direttamente a simple-datatables (es. `sortable`, `searchable`).
 *                                  Default: `[]`
 *
 * @param {number}        perPage   Numero di righe per pagina.
 *                                  Default: `25`
 */



/**
 * getNestedValue
 *
 * Legge un valore da un oggetto tramite un percorso di chiavi separate da punto.
 * Supporta sia chiavi semplici ('commessa') che composte ('owner.nome').
 * Restituisce undefined se una chiave intermedia non esiste.
 *
 * Esempi:
 *   getNestedValue(row, 'commessa')        → row.commessa
 *   getNestedValue(row, 'owner.nome')      → row.owner.nome
 *   getNestedValue(row, 'ciclo.ciclo')     → row.ciclo.ciclo
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}



class SimpleDatatableAdapter extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({ mode: 'open' }); // commentare per light dom

    this._config = null;
    this._initCalledProgrammatically = false;
    this._isConnected = false;
    this._loadStarted = false;

    /** Riferimento all'istanza DataTable di simple-datatables */
    this._dt = null;

    /** Filtro da applicare dopo il prossimo reload (vedi reload()) */
    this._pendingSearch = null;
    this._loadGeneration = 0;

    // Handler bound per poterli rimuovere in disconnectedCallback
    this._onSearch      = this._handleSearch.bind(this);
    this._onMultiSearch = this._handleMultiSearch.bind(this);
    this._onReload      = this._handleReload.bind(this);
  }


  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async connectedCallback() {
    this._isConnected = true;

    // Registra i listener sugli eventi globali
    document.addEventListener('datatable:search',      this._onSearch);
    document.addEventListener('datatable:multisearch', this._onMultiSearch);
    document.addEventListener('datatable:reload',      this._onReload);

    if (this._initCalledProgrammatically) {
      if (!this._loadStarted) this._load();
      return;
    }

    this._load();
  }

  disconnectedCallback() {
    document.removeEventListener('datatable:search',      this._onSearch);
    document.removeEventListener('datatable:multisearch', this._onMultiSearch);
    document.removeEventListener('datatable:reload',      this._onReload);
  }


  // ─── API pubblica ────────────────────────────────────────────────────────────

  /**
   * Avvia il componente via script, passando la configurazione come oggetto.
   * Può essere chiamato sia prima che dopo l'inserimento nel DOM.
   *
   * I parametri non inclusi in `config` vengono letti dall'attributo HTML
   * corrispondente, se presente — consentendo un mix dei due approcci:
   *
   *   <s-datatable
   *     cols='[{"_heading":"Nome","_field":"name"}]'
   *   ></s-datatable>
   *
   *   el.init({ json: '/api/data.json', perPage: 20 });
   *   // → json e perPage da script, cols dall'attributo
   *
   * Per ignorare esplicitamente un attributo esistente e forzare il default
   * interno, passare il valore `null` nel config:
   *
   *   el.init({ json: '/api/data.json', cols: null });
   *   // → cols = null (l'attributo viene ignorato)
   */
  init(config = {}) {
    this._config = config;
    this._initCalledProgrammatically = true;

    // Azzera il flag di caricamento: init() chiamato esplicitamente deve
    // sempre ripartire, anche se connectedCallback aveva già tentato un
    // _load() prematuro (es. quando domBuilder appende l'elemento al DOM
    // prima che la configurazione sia disponibile).
    this._loadStarted = false;
    this._loadGeneration++;

    if (this._isConnected) {
      this._load();
    }
  }

  /**
   * Ricerca testuale su una o più colonne.
   * @param {string}   term
   * @param {number[]} [columns]  indici di colonna; se omesso cerca su tutto
   */
  search(term, columns) {
    if (!this._dt) return;
    this._dt.search(term, columns);
  }

  /**
   * Ricerca multi-colonna con query indipendenti.
   * @param {Array<{ terms: string[], columns?: number[] }>} queries
   */
  multiSearch(queries) {
    if (!this._dt) return;
    this._dt.multiSearch(queries);
  }

  /**
   * Ricarica i dati (eventualmente da un nuovo URL e/o con nuove colonne),
   * con possibilità di applicare un filtro contestuale al termine del fetch.
   *
   * @param {object} [overrides]
   * @param {string} [overrides.json]    Nuovo URL dati (ignorato se `data` è presente)
   * @param {Array}  [overrides.data]    Dati inline (array di oggetti); ha precedenza su `json`
   * @param {Array}  [overrides.cols]    Nuove colonne
   * @param {object} [overrides.search]  Filtro da applicare dopo il caricamento.
   *   Formati supportati:
   *   - { term, columns? }                   → ricerca semplice (search)
   *   - { queries: [{terms, columns?}, …] }  → ricerca multipla (multiSearch)
   *   I due si escludono: se presente `queries` → multiSearch, altrimenti search.
   */
  async reload(overrides = {}) {
    if (overrides.json)   this._setParam('json', overrides.json);
    if (overrides.data !== undefined) this._setParam('data', overrides.data);
    if (overrides.cols)   this._setParam('cols', overrides.cols);

    // Memorizza il filtro pendente: verrà applicato dentro datatable.init,
    // dopo che simple-datatables ha terminato di renderizzare i nuovi dati.
    this._pendingSearch = overrides.search ?? null;

    this._loadStarted = false;
    this._loadGeneration++;
    await this._load();
  }


  // ─── Helpers interni ─────────────────────────────────────────────────────────

  /**
   * Risolve il valore di un parametro fondendo le tre sorgenti possibili.
   *
   * Ordine di precedenza (dal più al meno prioritario):
   *   1. _config  – valore passato via init() o _setParam().
   *                 Se presente e !== undefined sovrascrive sempre l'attributo.
   *                 Passare esplicitamente `null` per ignorare l'attributo e
   *                 ricevere il defaultValue.
   *   2. Attributo HTML – se il valore inizia con [ o { viene auto-parsato
   *                 da JSON (utile per cols, che può stare nell'attributo).
   *   3. defaultValue – fallback finale.
   *
   * Esempi con config = { json: '/api/x.json' }  e  attr cols='[…]':
   *   _getParam('json')       → '/api/x.json'   (da config)
   *   _getParam('cols')       → [… parsed …]    (da attributo, auto-JSON)
   *   _getParam('perPage', 25)→ 25              (default)
   *
   * Per ignorare esplicitamente un attributo, passare null nel config:
   *   init({ cols: null })  → _getParam('cols') restituisce null,
   *                           l'attributo viene saltato.
   */
  _getParam(name, defaultValue = null) {
    // 1. Config da script (undefined = chiave assente → scendi di livello)
    if (this._config && this._config[name] !== undefined) {
      return this._config[name];
    }

    // 2. Attributo HTML
    const attr = this.getAttribute(name);
    if (attr !== null) {
      // Auto-parse JSON per array e oggetti (es. cols='[…]')
      const trimmed = attr.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try { return JSON.parse(trimmed); } catch { /* restituisce la stringa grezza */ }
      }
      return attr;
    }

    // 3. Default interno
    return defaultValue;
  }

  _setParam(name, value) {
    if (!this._config) this._config = {};
    this._config[name] = value;
  }

  /**
   * Ritorna true se questo elemento è il target dell'evento.
   * Se detail.target è assente, risponde sempre;
   * altrimenti solo se corrisponde all'id dell'elemento.
   */
  _isTarget(detail) {
    return !detail.target || detail.target === this.id;
  }


  // ─── Handler eventi globali ──────────────────────────────────────────────────

  _handleSearch(e) {
    if (!this._isTarget(e.detail)) return;
    const { term = '', columns } = e.detail;
    this.search(term, columns);
  }

  _handleMultiSearch(e) {
    if (!this._isTarget(e.detail)) return;
    const { queries = [] } = e.detail;
    this.multiSearch(queries);
  }

  _handleReload(e) {
    if (!this._isTarget(e.detail)) return;
    // Propaga `data` solo se esplicitamente presente nel detail
    const overrides = { ...e.detail };
    this.reload(overrides);
  }


  // ─── Caricamento dati ────────────────────────────────────────────────────────

  async _load() {
    if (this._loadStarted) return;
    this._loadStarted = true;
    const generation = this._loadGeneration;

    this.innerHTML = '<div class="spinner"><span class="visually-hidden">Caricamento dati...</span></div>';

    const inlineData = this._getParam('data');
    const jsonUrl    = this._getParam('json');
    const cols       = this._getParam('cols', []);

    if (inlineData == null && !jsonUrl) {
      if (this._initCalledProgrammatically) {
        // eslint-disable-next-line no-console
        console.error('[s-datatable] Nessuna sorgente dati: specificare `data` o `json`.');
      }
      this.innerHTML = '';
      return;
    }

    try {
      // Risolvi i dati grezzi: inline `data` ha precedenza su `json`
      let rawData;
      if (inlineData != null) {
        rawData = Array.isArray(inlineData) ? inlineData : [];
      } else {
        const response = await fetch(jsonUrl);
        const parsed   = await response.json();
        rawData = parsed.data;
      }

      this.headings = cols.map(item =>
        item._title
          ? `<abbr title="${item._title}">${item._heading}</abbr>`
          : item._heading
      );

      this.data = rawData.map((row, idx) => ({
        attributes: { 'data-jidx': idx },

        cells: cols.map((col_item, col_idx) => {
          let value = getNestedValue(row, col_item._field);

          if (col_item._renderTpl) {
            value = decodeURIComponent(col_item._renderTpl).replace(
              /\[\[(.*?)\]\]/g,
              (match, key) => {
                const resolved  = getNestedValue(row, key);
                const pathParts = key.split('.');
                const parentObj = pathParts.length > 1
                  ? getNestedValue(row, pathParts.slice(0, -1).join('.'))
                  : row;

                // Segnala solo se il padre esiste ma la chiave foglia manca
                // (errore di configurazione). Se il padre è null il dato è
                // semplicemente assente (es. Symfony restituisce owner: null).
                if (parentObj != null && !Object.prototype.hasOwnProperty.call(parentObj, pathParts.at(-1))) {
                  // eslint-disable-next-line no-console
                  console.error(`[s-datatable] Chiave "${key}" non trovata nella struttura dati (colonna ${col_idx})`);
                }

                return resolved ?? '';
              }
            );
          } else if (col_item._renderMode === 'sf_datetime' && value != null) {
            value = value.date.replace(' ', 'T') +
              (value.timezone === 'UTC' ? 'Z' : '');
          }

          return value;
        })
      }));

      this.columns = cols.map((col_settings, idx) => {
        col_settings = parseCols(col_settings);

        return {
          ...(Object.fromEntries(
            Object.entries(col_settings).filter(([key]) => !key.startsWith('_'))
          )),
          select:     idx,
          type:       col_settings.type       ?? 'string',
          searchable: col_settings.searchable ?? true,
          sortable:   col_settings.sortable   ?? true,
        };
      });

    } catch (err) {
      /* eslint-disable no-console */
      if (jsonUrl) console.error(jsonUrl);
      console.error(err);
      /* eslint-enable no-console */
    }

    if (generation !== this._loadGeneration) return;
    this._render();
  }


  // ─── Render ──────────────────────────────────────────────────────────────────

  _render() {
    // Distrugge l'istanza precedente prima di ricrearla (es. dopo reload)
    if (this._dt) {
      this._dt.destroy();
      this._dt = null;
    }

    this.innerHTML = '';
    const table = document.createElement('table');
    this.appendChild(table);

    const perPage = +this._getParam('perPage', 25);

    this._dt = new DataTable(table, {
      locale: 'it',
      searchable: true,
      sortable: true,
      fixedHeight: false,
      fixedColumns: false,
      paging: true,
      perPage,
      pagerDelta: 2,
      perPageSelect: false,

      labels: {
        placeholder: 'Cerca...',
        searchTitle: 'Cerca nella tabella',
        pageTitle: 'Pagina {page}',
        perPage: 'Righe per pagina',
        noRows: 'Nessun record trovato',
        info: 'Stai visualizzando le righe da {start} a {end}, su un totale di {rows}',
        noResults: 'Nessun risultato per la ricerca',
      },

      classes: {
        wrapper                 : styles.datatableWrapper,
        container               : 'table-responsive',
        loading                 : 'datatable-loading', // ??

        // barra superiore
        top                     : styles.topArea,
        search                  : styles.searchWrapper,
        input                   : 'form-control form-control-sm',
        // dropdown         : 'datatable-dropdown', // selettore righe per pagina, disattivato

        empty                   : styles.empty,

        // table
        table                   : `table table-bordered ${styles.table}`,
        // buttons in thead per il sort
        sorter                  : `btn-reset ${styles.sortBtn}`,
        ascending               : styles.sortAscending,
        descending              : styles.sortDescending,

        // area inferiore
        bottom                  : styles.bottomArea,
        // info text
        info                    : styles.info,

        // pagination
        // pagination           : styles.paginationNav,
        paginationList          : styles.paginationList,
        paginationListItem      : styles.paginationListItem,
        paginationListItemLink  : styles.paginationListItemBtn,
        // hidden                  : 'datatable-hidden',
        disabled                : styles.paginationDisabled,
        active                  : styles.paginationActive,

        // cursor: 'datatable-cursor',
        // dropdown: 'datatable-dropdown',
        // ellipsis: 'datatable-ellipsis',
        // filter: 'datatable-filter',
        // filterActive: 'datatable-filter-active',
        // headercontainer: 'datatable-headercontainer',
        // selector: 'datatable-selector',
      },

      columns: this.columns,
      data: {
        headings: this.headings,
        data: this.data
      }
    });

    this._dt.on('datatable.init', () => {
      const pagination = this.querySelector(`.${styles.paginationList}`);
      if (!pagination) return;

      const items = pagination.querySelectorAll(`.${styles.paginationListItem}`);
      if (!items.length) return;

      pagination.querySelector(
        `.${styles.paginationListItem}:first-child .${styles.paginationListItemBtn}`
      ).innerHTML = caretLeftIcon;

      pagination.querySelector(
        `.${styles.paginationListItem}:last-child .${styles.paginationListItemBtn}`
      ).innerHTML = caretRightIcon;

      pagination.querySelectorAll(`.${styles.paginationListItemBtn}:has(svg)`)
        .forEach(btn => btn.classList.add(styles.hasSvg));

      // Applica eventuale filtro contestuale passato via reload({ search: … })
      // Lo facciamo qui, dentro datatable.init, per essere certi che
      // simple-datatables abbia completato il render dei nuovi dati.
      if (this._pendingSearch) {
        const ps = this._pendingSearch;
        this._pendingSearch = null;

        if (ps.queries) {
          this._dt.multiSearch(ps.queries);
        } else if (ps.term !== undefined) {
          this._dt.search(ps.term, ps.columns);
        }
      }
    });

  } // end _render

} // end component


if (!customElements.get('s-datatable')) {
  customElements.define('s-datatable', SimpleDatatableAdapter);
}
