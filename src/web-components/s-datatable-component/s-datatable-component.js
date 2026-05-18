import { DataTable } from 'simple-datatables';

import { parseCols } from './src/parse-cols.js';

import * as styles from './s-datatable-component.module.css';

import caretLeftIcon from '../../icons/caret-left.svg?inline';
import caretRightIcon from '../../icons/caret-right.svg?inline';


/**
 * Implementazione di simple-datatable (https://fiduswriter.github.io/simple-datatables/documentation/)
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
 * @property {string|Function}  [_headingTitle]       Testo del tooltip sull'intestazione (`<abbr title="…">`).
 *                                           Accetta:
 *                                           - stringa semplice (tooltip statico)
 *                                           - stringa mustache-like con segnaposto `[[key]]`
 *                                             (interpolati sui dati della prima riga disponibile;
 *                                              utile solo se il titolo varia per colonna, non per riga)
 *                                           - funzione `(row) => string` (row è null per le intestazioni)
 * @property {string|Function}  [_cellTitle]          Testo del tooltip delle celle (attributo `title`).
 *                                           Accetta:
 *                                           - stringa semplice (tooltip statico uguale per tutte le righe)
 *                                           - stringa mustache-like con segnaposto `[[key]]`
 *                                             (i segnaposto vengono sostituiti con i valori della riga corrente)
 *                                           - funzione `(row) => string` (riceve l'oggetto riga corrente)
 * @property {string|Function} [_cellRender]     stringa o funzione per renderizzare il contenuto della cella.
 *                                           Accetta:
 *                                           - stringa mustache-like con segnaposto `[[key]]`
 *                                             (sostituiti con i valori dell'oggetto riga;
 *                                              i segnaposto non trovati usano `_renderNullAs`)
 *                                           - funzione `(row) => string`
 *                                           - se sono impostate sia `_cellRender` che l'opzione `render` di simple-datatable
 *                                             quest'ultima viene annullata per evitare potenziali conflitti
 * @property {string|Function} [_footerRender] Contenuto della cella <td> nel <tfoot> per questa colonna.
 *                                           Accetta:
 *                                           - funzione `(data) => string` dove `data` è l'array dei
 *                                             record visibili (filtrati dalla ricerca corrente, ma non
 *                                             limitati alla pagina attuale): ideale per somme, medie, conteggi.
 *                                           - stringa statica (es. etichetta fissa "Totale:")
 *                                           Le colonne senza `_footerRender` producono una <td> vuota.
 *                                           Il <tfoot> viene aggiunto solo se almeno una colonna lo definisce.
 *                                           La cella eredita le classi CSS (allineamento) della colonna.
 *
 * @property {string|Function} [_sortValue]   Percorso del campo da usare per l'ORDINAMENTO al posto
 *                                           del contenuto visualizzato, oppure una funzione
 *                                           `(row) => string|number` per casi complessi
 *                                           (es. booleani, valori calcolati).
 *                                           Stringa: percorso con notazione punto (es. 'owner.cognome').
 *                                           Funzione: riceve l'oggetto riga originale.
 * @property {string|Function} [_searchValue] Percorso/i del campo da usare per la RICERCA al posto
 *                                           del contenuto visualizzato, oppure una funzione
 *                                           `(row) => string` per casi complessi (es. booleani).
 *                                           Stringa: uno o più percorsi separati da spazio.
 *                                           Funzione: riceve l'oggetto riga originale.
 * @property {string}  [_renderNullAs]       Stringa da mostrare al posto di valori null/undefined.
 *                                           Default: `'&mdash;'` (trattino em).
 *                                           Applicato al valore della cella e ai segnaposto
 *                                           di `_cellRender` che si risolvono a null.
 * @property {'id'|'email'|'sf_datetime'} [_renderMode]
 *                                           Modalità di visualizzazione predefinita:
 *                                           - `id`          – colonna numerica, non ricercabile, allineata a destra
 *                                           - `email`       – inserisce andate a capo prima e dopo la `@`
 *                                           - `sf_datetime` – data e ora da oggetto Symfony (con pre-elaborazione in `_load`)
 *                                           Per i booleani usare `type: 'boolean'` (proprietà nativa
 *                                           simple-datatables): parseCols aggiunge automaticamente
 *                                           l'icona spunta/croce con colore semantico.
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
 * @param {number}        perPage          Numero di righe per pagina.
 *                                           Default: `25`
 *
 * @param {string}        renderNullAs     Stringa globale da mostrare al posto di valori null/undefined
 *                                           in tutte le colonne. Può essere sovrascritto per singola
 *                                           colonna con `_renderNullAs`.
 *                                           Default: `\u2014` (em dash)
 *
 * @param {boolean}       updateFooterOnPageChange     Se true, la callback `_footerRender` riceve i soli record
 *                                           della pagina corrente (subtotale di pagina). Se false
 *                                           (default), riceve l'intero set filtrato indipendentemente
 *                                           dalla paginazione (totale complessivo).
 *                                           Quando è false il footer si aggiorna solo al cambio di
 *                                           filtro, non al cambio pagina.
 *
 * @param {string[]}      refs  Elenco di percorsi URL da cui, se si proviene,
 *                                           la pagina corrente viene ripristinata dal cookie
 *                                           di sessione `sd-pag`. Se il referrer non è tra
 *                                           quelli indicati, il cookie viene eliminato.
 *                                           Confronto su `pathname` (query string e hash ignorati).
 *                                           Esempio: `['/utenti']`
 *                                           NB: il match è positivo anche se il referrer è parte di una delle stringhe permesse
 *                                           quindi, ad esempio, `['/utenti']` intercetta sia `/utenti` che `/utenti/1234`
 *

 ------------ DA VALUTARE NON IMPLEMENTATO -----------
 * @param {string[]}      refsCallback  callback da eseguire in seguito al match di refs.
 *                                      È invocato con l'argomento isRef (true | false) che indica se la pagina referrer
 *                                      è tra quelle mappate in refs, quindi `['/utenti']`.
 *                                      Utilizzabile solo nella configurazione via script
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
  return path?.split('.')?.reduce((acc, key) => acc?.[key], obj) ?? null;
}


/**
 * resolveTemplate
 *
 * Risolve un template in base al suo tipo:
 *   - Funzione:              invocata con `row`, deve restituire una stringa.
 *   - Stringa mustache-like ([[key]]): i segnaposto vengono sostituiti con i
 *                            valori corrispondenti dell'oggetto riga.
 *   - Stringa semplice:      restituita così com'è (utile per tooltip statici).
 *
 * Quando `row` è null/undefined (caso intestazioni) le funzioni vengono
 * comunque chiamate con null; la stringa mustache-like viene restituita
 * letteralmente perché non ci sono dati da interpolare.
 *
 * @param {string|Function} tpl           Template da risolvere.
 * @param {object|null}     row           Oggetto riga corrente (null per le intestazioni).
 * @param {object}          [opts]        Opzioni aggiuntive.
 * @param {string}          [opts.nullAs] Stringa da usare come fallback per i segnaposto
 *                                        che si risolvono a null (default: `''`).
 *                                        Se non fornita i segnaposto non trovati diventano ''.
 * @param {number}          [opts.warnColIdx] Se fornito, emette console.error quando una
 *                                        chiave foglia non esiste sul padre (indica un errore
 *                                        di configurazione, non un dato assente).
 * @returns {string|null}                 Stringa risolta, oppure null se `tpl` è falsy.
 */
function resolveTemplate(tpl, row, { nullAs = '', warnColIdx } = {}) {
  if (!tpl) return null;

  if (typeof tpl === 'function') {
    return tpl(row) ?? null;
  }

  // Stringa mustache-like: interpola solo se row è disponibile
  if (row != null && /\[\[.*?\]\]/.test(tpl)) {
    return decodeURIComponent(tpl).replace(
      /\[\[(.*?)\]\]/g,
      (_, key) => {
        const resolved  = getNestedValue(row, key);
        if (warnColIdx !== undefined) {
          const pathParts = key.split('.');
          const parentObj = pathParts.length > 1
            ? getNestedValue(row, pathParts.slice(0, -1).join('.'))
            : row;
          if (parentObj != null && !Object.prototype.hasOwnProperty.call(parentObj, pathParts.at(-1))) {
            // eslint-disable-next-line no-console
            console.error(`[s-datatable] Chiave "${key}" non trovata nella struttura dati (colonna ${warnColIdx})`);
          }
        }
        return resolved ?? nullAs;
      }
    );
  }

  return tpl;
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

    /**
     * Conteggio centralizzato delle righe attualmente visibili (post-filtro).
     * Viene inizializzato al totale in datatable.init e aggiornato dall'evento
     * datatable.search tramite dt.data?.data.length.
     * È l'unica fonte di verità per _renderTfoot().
     */
    this._filteredCount = 0;

    /**
     * Array di record raw attualmente visibili (post-filtro, pre-paginazione).
     * Popolato da onFilter al momento dell'evento datatable.search/multisearch,
     * quando dt.searchData è garantito aggiornato.
     * null = nessun filtro attivo → _renderTfoot usa rawData direttamente.
     */
    this._filteredData = null;

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
   * Distrugge l'istanza DataTable interna e svuota il componente.
   * Equivale a datatable.destroy() di simple-datatables.
   * Dopo la chiamata è possibile richiamare init() per reinizializzare
   * la tabella con nuovi dati o colonne, senza ricreare l'elemento.
   */
  destroy() {
    if (this._dt) {
      this._dt.destroy();
      this._dt = null;
    }
    this._loadStarted = false;
    this._loadGeneration++;
    this.innerHTML = '';
  }

  /**
   * Restituisce l'istanza DataTable interna di simple-datatables.
   * Utile per operazioni non coperte dall'API del componente.
   * Restituisce null se la tabella non è ancora stata inizializzata.
   *
   * Esempio:
   *   const instance = dt.getDataTable();
   *   instance.page(2);
   *   instance.on('datatable.sort', (col, dir) => console.log(col, dir));
   */
  getDataTable() {
    return this._dt ?? null;
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
      // Auto-parse booleani solo quando il parametro è dichiaratamente booleano
      // (defaultValue === true | false). Copre tutti i formati HTML idiomatici:
      //   updateFooterOnPageChange            (attributo senza valore → '')  → true
      //   updateFooterOnPageChange="true"  /  updateFooterOnPageChange="1"   → true
      //   updateFooterOnPageChange="false" /  updateFooterOnPageChange="0"   → false
      // I valori "1" e "0" NON vengono intercettati qui se defaultValue non è
      // boolean, per non interferire con parametri numerici (es. perPage="1").
      const trimmed = attr.trim();
      if (typeof defaultValue === 'boolean') {
        const lower = trimmed.toLowerCase();
        // Stringa vuota '' = attributo presente senza valore → true (standard HTML)
        return lower !== 'false' && lower !== '0';
      }

      // Auto-parse JSON per array e oggetti (es. cols='[…]')
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
   * Restituisce true se il referrer corrisponde a uno dei percorsi in `refs`.
   * Il confronto avviene su `pathname` per ignorare query string e hash.
   */
  _isReferrer() {
    let allowed = this._getParam('refs', []);

    if (typeof allowed === 'string') {
      try {
        allowed = JSON.parse(allowed);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[s-datatable] Errore nel parsing di \'refs\':', e);
        return false;
      }
    }
    if (!Array.isArray(allowed) || !allowed.length || !document.referrer) {
      return false;
    }
    const referrerPath = new URL(document.referrer).pathname;

    // Ritorna true se il path del referrer è contenuto in una delle stringhe di 'allowed'
    return allowed.some(allowedUrl =>
      (typeof allowedUrl === 'string') && (referrerPath.includes(allowedUrl))
    );
  }


  /** Salva la pagina corrente nel cookie di sessione `sd-pag`. */
  _savePageCookie(page) {
    document.cookie = `sd-pag=${page}; path=${location.pathname}`;
  }

  /** Legge la pagina dal cookie `sd-pag`. Restituisce null se assente. */
  _readPageCookie() {
    const match = document.cookie.match(/(?:^|;\s*)sd-pag=(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /** Elimina il cookie `sd-pag`. */
  _deletePageCookie() {
    document.cookie = `sd-pag=; path=${location.pathname}; max-age=0`;
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

    const inlineData     = this._getParam('data');
    const jsonUrl        = this._getParam('json');
    const cols           = this._getParam('cols', []);
    const globalNullAs   = this._getParam('renderNullAs', '\u2014');

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

      this.headings = cols.map(item => {
        const title = resolveTemplate(item._headingTitle, null);
        return title
          ? `<abbr title="${title}">${item._heading}</abbr>`
          : item._heading;
      });

      this.data = rawData.map((row, idx) => ({
        attributes: { 'data-jidx': idx },

        cells: cols.map((col_item, col_idx) => {
          let value = getNestedValue(row, col_item._field);

          // _renderNullAs: stringa da mostrare quando il valore è null/undefined.
          // Precedenza: _renderNullAs di colonna > renderNullAs globale > '&mdash;'
          const nullAs = col_item._renderNullAs !== undefined
            ? col_item._renderNullAs
            : globalNullAs;

          // _sortValue: valore alternativo per l'ordinamento.
          // Accetta un percorso stringa o una funzione (row) => string|number.
          const sortValue = col_item._sortValue
            ? typeof col_item._sortValue === 'function'
              ? (col_item._sortValue(row) ?? '')
              : (getNestedValue(row, col_item._sortValue) ?? '')
            : null;


          // _cellRender: template per il rendering del valore.
          // Accetta stringa mustache-like ([[key]]) o funzione (row) => string.
          // Delega a resolveTemplate, passando nullAs e l'indice di colonna
          // per i warning di chiavi mancanti.
          if (col_item._cellRender) {
            col_item.render = null; // se presente lo annulla ad evitare conflitti
            value = resolveTemplate(col_item._cellRender, row, { nullAs, warnColIdx: col_idx });

          } else if (col_item._renderMode === 'sf_datetime' && value != null) {
            value = value.date.replace(' ', 'T') +
              (value.timezone === 'UTC' ? 'Z' : '');
          }


// TODO rendere più snella la gestione di questoi casi (???)
// TODO pasare il valore `nullAs` al render predefinito
          // Applica _renderNullAs al valore della cella se null/undefined
          // e la cella non ha già un template che gestisce la visualizzazione.
          // se _renderMode è impostato, il valore null è gestito direttamente dal gestore predefinito
          if (value == null && col_item._cellRender == null && col_item._renderMode == null) {
            value = nullAs;
          }

          // _searchValue: valore alternativo per la ricerca
          // Viene scritto come testo nascosto nella cella così la funzione
          // search personalizzata della colonna può leggerlo direttamente
          // dal contenuto, senza dipendere da attributi non supportati.
          const searchValue = col_item._searchValue
            ? typeof col_item._searchValue === 'function'
              ? (col_item._searchValue(row) ?? '')
              : col_item._searchValue.split(' ')
                .map(path => getNestedValue(row, path.trim()) ?? '')
                .filter(Boolean)
                .join(' ')
            : null;

          // Se sono definiti _sortValue o _searchValue, restituisce un
          // oggetto cellType secondo le API di simple-datatables:
          //   { data, order?, attributes? }
          // - `data`  → contenuto visualizzato (obbligatorio)
          // - `order` → valore alternativo per l'ordinamento (campo nativo)
          // - `attributes['data-search']` → stringa su cui opera searchMethod
          // - `attributes['title']`       → tooltip della cella (_cellTitle)

          // Risolvi _cellTitle: stringa semplice, mustache-like o funzione(row)
          const cellTitle = resolveTemplate(col_item._cellTitle, row);

          if (sortValue !== null || searchValue !== null || cellTitle !== null) {
            const cellObj = { data: value ?? '' };
            if (sortValue !== null)   cellObj.order = sortValue;

            // Unifica data-search e title in un unico oggetto attributes
            const attrs = {};
            if (searchValue !== null) attrs['data-search'] = searchValue;
            if (cellTitle   !== null) attrs['title']       = cellTitle;
            if (Object.keys(attrs).length) cellObj.attributes = attrs;

            return cellObj;
          }

          return value;
        })
      }));

      // Conserva i dati grezzi e le definizioni di colonna per il tfoot
      this._rawData    = rawData;
      this._footerCols = cols;

      this.columns = cols.map((col_settings, idx) => {
        col_settings = parseCols(col_settings);

        const colObj = {
          ...(Object.fromEntries(
            Object.entries(col_settings).filter(([key]) => !key.startsWith('_'))
          )),
          select:     idx,
          type:       col_settings.type       ?? 'string',
          searchable: col_settings.searchable ?? true,
          sortable:   col_settings.sortable   ?? true,
        };

        // _searchValue: funzione searchMethod personalizzata che opera su
        // cell.attributes['data-search'] invece che sul testo visualizzato.
        // L'API simple-datatables prevede: (terms, cell, row, colIdx, source)
        // - terms: array di stringhe (uno per parola cercata)
        // - cell:  oggetto cella dai dati originali (con .text e .attributes)
        // La funzione deve restituire true se la riga è da includere.
        // Comportamento AND: tutti i termini devono essere presenti (come
        // nella demo https://fiduswriter.github.io/simple-datatables/demos/22-and-search/).
        if (col_settings._searchValue) {
          colObj.searchMethod = (terms, cell) => {
            const haystack = (
              cell.attributes?.['data-search'] ?? cell.text ?? ''
            ).toLowerCase();
            return terms.every(term => haystack.includes(term.toLowerCase()));
          };
        }

        return colObj;
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
        info: 'Stai visualizzando le righe da {start} a {end}, su un totale di {rows} record trovati',
        noResults: 'Nessun risultato per la ricerca',
      },

      template: (options, dom) => `<div class='${options.classes.top}'>`+
        `<div class='${options.classes.info}'></div>` +
        (options.searchable
          ? `<div class='${options.classes.search}'>` +
              `<input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='search' title='${options.labels.searchTitle}'${dom.id ? ` aria-controls="${dom.id}"` : ''}>` +
          '</div>'
          : '') +
        '</div>' +
        `<div class='${options.classes.container}'${options.scrollY.length ? ` style='height: ${options.scrollY}; overflow-Y: auto;'` : ""}></div>`+
        `<div class='${options.classes.bottom}'>`+
          `<nav class='${options.classes.pagination}'></nav>` +
        '</div>'
      ,

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
      // Inizializza il conteggio filtrato al totale: al primo render non c'è
      // ricerca attiva, quindi tutti i record sono visibili.
      this._filteredCount = this._rawData?.length ?? 0;
      // ── Icone paginazione ─────────────────────────────────────────────────
      const pagination = this.querySelector(`.${styles.paginationList}`);
      if (pagination) {
        const items = pagination.querySelectorAll(`.${styles.paginationListItem}`);
        if (items.length) {
          pagination.querySelector(
            `.${styles.paginationListItem}:first-child .${styles.paginationListItemBtn}`
          ).innerHTML = caretLeftIcon;

          pagination.querySelector(
            `.${styles.paginationListItem}:last-child .${styles.paginationListItemBtn}`
          ).innerHTML = caretRightIcon;

          pagination.querySelectorAll(`.${styles.paginationListItemBtn}:has(svg)`)
            .forEach(btn => btn.classList.add(styles.hasSvg));
        }
      }

      // ── Ripristino pagina dal cookie di sessione (se referrer autorizzato) ─
      // const isRefUrl = this._isReferrer(), refsCallback = this._getParam('refsCallback', null);
      // if (isRefUrl) {
      if (this._isReferrer()) {
        const savedPage = this._readPageCookie();
        if (savedPage !== null) {
          this._dt.page(savedPage);
        }
      } else {
        this._deletePageCookie();
      }

      // if(refsCallback && typeof refsCallback === 'function') {
      //   refsCallback(isRefUrl);
      // }

      // ── Filtro contestuale post-reload ────────────────────────────────────
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

      // ── Tfoot ─────────────────────────────────────────────────────────────
      // Eseguito sempre, indipendentemente dalla presenza della paginazione.
      this._renderTfoot();
    });

    // Salva la pagina corrente nel cookie ad ogni cambio di pagina;
    // aggiorna il tfoot solo se updateFooterOnPageChange è attivo.
    this._dt.on('datatable.page', page => {
      this._savePageCookie(page);
      if (this._getParam('updateFooterOnPageChange', false)) this._renderTfoot();
    });

    // Aggiorna il tfoot ad ogni cambio di filtro (ricerca / multisearch).
    // L'evento datatable.search è la fonte di verità centralizzata per il conteggio
    // delle righe filtrate: _filteredCount viene aggiornato qui e poi consumato da
    // _renderTfoot(), eliminando letture inconsistenti di dt.data?.data.
    // Il sort non altera il set filtrato: il footer non deve cambiare.
    // datatable.search  emette (term, searchData)
    // datatable.multisearch emette (queries, searchData)
    // searchData è l'array degli indici in dt.data.data (post-sort), NON in rawData.
    // Per risalire ai record raw si usa l'attributo 'data-jidx' scritto su ogni riga
    // in fase di caricamento (_load), che preserva la corrispondenza con rawData
    // anche dopo che simple-datatables ha riordinato dt.data.data internamente.
    // Quando term === '' (reset), searchData è [] ma va usato rawData completo.
    const onFilter = (termOrQueries, searchData) => {
      const rawData = this._rawData ?? [];
      const dt      = this._dt;
      const isReset = termOrQueries === '' ||
        (Array.isArray(termOrQueries) && termOrQueries.length === 0);

      if (isReset) {
        this._filteredData = null;        // null → _renderTfoot usa rawData
      } else {
        // Mappa l'indice dt.data.data → indice rawData tramite data-jidx
        this._filteredData = searchData
          .map(dtIdx => {
            const jidx = dt.data?.data[dtIdx]?.attributes?.['data-jidx'];
            return jidx != null ? rawData[jidx] : undefined;
          })
          .filter(Boolean);
      }

      this._filteredCount = this._filteredData?.length ?? rawData.length;
      this._renderTfoot();
    };
    this._dt.on('datatable.search',      onFilter);
    this._dt.on('datatable.multisearch', onFilter);

  } // end _render


  // ─── Footer (tfoot) ──────────────────────────────────────────────────────────

  /**
   * Costruisce o aggiorna la riga <tfoot> della tabella.
   *
   * Chiamato dopo il render iniziale, ad ogni cambio di filtro (ricerca /
   * multisearch) e — se `updateFooterOnPageChange` è true — anche ad ogni cambio pagina.
   *
   * Il conteggio delle righe filtrate viene letto da `this._filteredCount`,
   * aggiornato centralmente dall'handler di `datatable.search` / `datatable.multisearch`.
   * Il tfoot viene rimosso quando non ci sono righe filtrate.
   *
   * Dataset passato alla callback `_footerRender(data)`:
   *
   *   updateFooterOnPageChange: false (default)
   *     → l'intero set filtrato, indipendente dalla pagina corrente.
   *       I totali non cambiano navigando tra le pagine.
   *       Se non c'è ricerca attiva, viene passato il dataset completo.
   *       I record filtrati vengono letti da `this._filteredData`, popolato
   *       in onFilter dagli argomenti dell'evento datatable.search/multisearch,
   *       che passano `searchData` (array di indici) direttamente senza dover
   *       leggere lo stato interno di simple-datatables.
   *       null = reset o nessun filtro → rawData completo.
   *
   *   updateFooterOnPageChange: true
   *     → solo i record della pagina corrente.
   *       Utile per subtotali di pagina.
   *
   * Quando la ricerca non trova nulla, `_filteredData` è `[]`:
   * in quel caso la callback riceve un array vuoto, non il dataset completo.
   */
  _renderTfoot() {
    const cols    = this._footerCols;
    const rawData = this._rawData;

    if (!cols?.length || !rawData) return;

    const hasFooter = cols.some(c => c._footerRender != null);
    if (!hasFooter) return;

    const table = this.querySelector('table');
    if (!table) return;

    const dt = this._dt;
    const filteredCount = this._filteredCount;

    // Rimuove il tfoot quando non ci sono righe filtrate
    if (filteredCount === 0) {
      table.querySelector('tfoot')?.remove();
      return;
    }

    const updateFooterOnPageChange = this._getParam('updateFooterOnPageChange', false);

    let visibleData;

    if (updateFooterOnPageChange) {
      const pageRows = dt.pages?.[dt.currentPage - 1] ?? [];
      visibleData = pageRows
        .map(row => rawData[row['data-index']])
        .filter(Boolean);
    } else {
      // this._filteredData è popolato in onFilter dagli argomenti dell'evento
      // datatable.search / datatable.multisearch (che passano searchData direttamente).
      // null = nessun filtro attivo (o reset) → usiamo rawData completo.
      visibleData = this._filteredData ?? rawData;
    }

    // Riutilizza tfoot esistente o ne crea uno nuovo
    let tfoot = table.querySelector('tfoot');
    if (!tfoot) {
      tfoot = document.createElement('tfoot');
      table.appendChild(tfoot);
    }

    const tr = document.createElement('tr');

    cols.forEach(col => {
      const td = document.createElement('td');

      if (col._footerRender != null) {
        if (typeof col._footerRender === 'function') {
          td.innerHTML = col._footerRender(visibleData) ?? '';
        } else {
          // Stringa statica (es. etichetta fissa "Totale:")
          td.innerHTML = col._footerRender;
        }
      }

      // Propaga le classi di allineamento della colonna per coerenza visiva
      const cellClass = col.cellClass ?? col.headerClass ?? '';
      if (cellClass) td.className = cellClass;

      tr.appendChild(td);
    });

    tfoot.replaceChildren(tr);
  }


} // end component


if (!customElements.get('s-datatable')) {
  customElements.define('s-datatable', SimpleDatatableAdapter);
}
