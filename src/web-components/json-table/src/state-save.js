/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').SortDef} SortDef */
/** @typedef {import('./defaults.js').StateReferrer} StateReferrer */

/**
 * Persistenza dello stato della tabella (parametro `stateSave`): pagina, righe per pagina, ordinamento, ricerca,
 * valori applicati del form di filtro e dati extra della pagina, salvati in `sessionStorage` o `localStorage` e
 * ripristinati al caricamento successivo (vedi la sezione "Persistenza dello stato" della documentazione).
 */

/** Versione del formato dello stato salvato: uno stato con una versione diversa viene scartato. */
export const STATE_VERSION = 1;

/**
 * Stato salvato.
 * @typedef {Object} SavedState
 * @property {number} v - Versione del formato (vedi `STATE_VERSION`)
 * @property {string} sig - Firma delle colonne (vedi `colsSignature`)
 * @property {number} savedAt - Timestamp (ms) del salvataggio
 * @property {number} page - Pagina corrente (da 1)
 * @property {number} perPage - Righe per pagina al momento del salvataggio (0 = nessuna paginazione)
 * @property {SortDef[]} sort - Criteri di ordinamento ([] = nessun ordinamento)
 * @property {string} search - Termine di ricerca ('' = nessuno)
 * @property {Array<[string, string]>|null} filters - Valori applicati del form di filtro (coppie nome/valore, i nomi
 *   possono ripetersi), `null` senza `filterForm`
 * @property {*} extra - Dati della pagina, impostati tramite l'evento `jt:statesave` (default: null)
 */

/**
 * Destinazione dello stato: storage e chiave.
 * @typedef {Object} StateTarget
 * @property {Storage} storage
 * @property {string} key
 */


/**
 * Restituisce lo storage indicato, oppure `null` quando non è disponibile (anche il solo accesso a
 * `window.sessionStorage` può lanciare un'eccezione, ad es. con i cookie bloccati).
 *
 * @param {'session'|'local'} type - Tipo di storage
 * @returns {Storage|null}
 */
export function getStorage(type) {
  try {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

/**
 * Legge una voce dello storage, `null` in caso di errore.
 * @param {StateTarget} target
 * @returns {string|null}
 */
export function storageRead({ storage, key }) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Scrive una voce dello storage (gli errori, ad es. quota esaurita, vengono ignorati).
 * @param {StateTarget} target
 * @param {string} value
 * @returns {boolean} `true` se la scrittura è riuscita
 */
export function storageWrite({ storage, key }, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rimuove una voce dello storage (gli errori vengono ignorati).
 * @param {StateTarget} target
 * @returns {void}
 */
export function storageRemove({ storage, key }) {
  try {
    storage.removeItem(key);
  } catch {
    // storage non accessibile: niente da fare
  }
}


/**
 * Chiave dello stato: `stateKey` se indicata, altrimenti `json-table:<pathname>:<id>`.
 *
 * @param {string|null|undefined} stateKey - Parametro `stateKey`
 * @param {string|null|undefined} id - Id dell'elemento `<json-table>` (o, in sua assenza, `tableId`)
 * @param {string} pathname - Path della pagina corrente
 * @returns {string|null} La chiave, oppure `null` quando non è possibile ricavarla
 *
 * @example
 * buildStateKey(null, 'clienti', '/clienti/elenco'); // → 'json-table:/clienti/elenco:clienti'
 * buildStateKey('elenco-clienti', null, '/x');       // → 'elenco-clienti'
 * buildStateKey(null, '', '/x');                     // → null
 */
export function buildStateKey(stateKey, id, pathname) {
  if (typeof stateKey === 'string' && stateKey.trim() !== '') {
    return stateKey.trim();
  }
  if (typeof id === 'string' && id !== '') {
    return `json-table:${pathname}:${id}`;
  }
  return null;
}


/**
 * Firma delle colonne: le chiavi delle colonne analizzate, nell'ordine. Uno stato salvato con una firma diversa
 * (colonne aggiunte, rimosse o riordinate) viene scartato.
 *
 * @param {Array<{key: string}>} cols - Colonne analizzate
 * @returns {string}
 *
 * @example
 * colsSignature([{ key: 'id' }, { key: 'name' }]); // → 'id,name'
 */
export function colsSignature(cols) {
  return cols.map(col => col.key).join(',');
}


/**
 * Normalizza il parametro `stateReferrers`: una stringa (tipicamente da attributo HTML) viene divisa sulle virgole;
 * sono ammesse stringhe non vuote (prefissi di path), oggetti `RegExp` e funzioni. Le voci non valide vengono segnalate
 * e scartate.
 *
 * @param {*} value - Valore risolto di `stateReferrers`
 * @returns {StateReferrer[]|null} `null` = qualunque referrer è ammesso
 *
 * @example
 * normalizeReferrers('/clienti/scheda, /clienti/modifica'); // → ['/clienti/scheda', '/clienti/modifica']
 * normalizeReferrers(null);                                  // → null
 */
export function normalizeReferrers(value) {
  /* eslint-disable no-console */
  if (value == null) {
    return null;
  }

  const list = typeof value === 'string'
    ? value.split(',').map(item => item.trim()).filter(Boolean)
    : value;

  if (!Array.isArray(list)) {
    console.warn('[json-table] `stateReferrers` deve essere un array (o una stringa con i path separati da virgola): parametro ignorato, ogni referrer è ammesso');
    return null;
  }

  return list.filter(item => {
    if ((typeof item === 'string' && item.trim() !== '') || item instanceof RegExp || typeof item === 'function') {
      return true;
    }
    console.warn('[json-table] `stateReferrers`: ogni voce deve essere una stringa non vuota, una RegExp o una funzione: voce ignorata', item);
    return false;
  }).map(item => (typeof item === 'string' ? item.trim() : item));
  /* eslint-enable no-console */
}


/**
 * Tipo della navigazione corrente (`navigate`, `reload`, `back_forward`, `prerender`), `null` se non disponibile.
 * @returns {string|null}
 */
export function getNavigationType() {
  try {
    const entry = /** @type {PerformanceNavigationTiming|undefined} */ (performance.getEntriesByType('navigation')[0]);
    return entry?.type ?? null;
  } catch {
    return null;
  }
}


/**
 * Indica se lo stato salvato può essere ripristinato in base alla pagina di provenienza.
 *
 * Lo stato è sempre ammesso quando `referrers` è `null`, quando il referrer è vuoto (come in auto-datatables-bs5) e
 * quando la pagina è stata ricaricata o raggiunta con i pulsanti avanti/indietro del browser (in questo caso
 * `document.referrer` è quello originale della voce di cronologia, non la pagina appena lasciata). Altrimenti il
 * referrer deve avere la stessa origine della pagina e corrispondere ad almeno una voce:
 * - stringa: prefisso del path del referrer (`/clienti/scheda` ammette anche `/clienti/scheda/12`)
 * - `RegExp`: verificata su path + query string del referrer
 * - funzione: riceve l'URL del referrer, deve restituire `true`
 *
 * @param {StateReferrer[]|null} referrers - `stateReferrers` normalizzato
 * @param {string} referrer - `document.referrer`
 * @param {string} currentHref - `location.href`
 * @param {string|null} [navigationType=null] - Vedi `getNavigationType()` (default: null)
 * @returns {boolean}
 *
 * @example
 * isReferrerAllowed(['/clienti/scheda'], 'https://ex.it/clienti/scheda/12', 'https://ex.it/clienti'); // → true
 * isReferrerAllowed(['/clienti/scheda'], 'https://ex.it/home', 'https://ex.it/clienti');              // → false
 * isReferrerAllowed(['/clienti/scheda'], 'https://ex.it/home', 'https://ex.it/clienti', 'back_forward'); // → true
 */
export function isReferrerAllowed(referrers, referrer, currentHref, navigationType = null) {

  if (referrers == null || !referrer || navigationType === 'reload' || navigationType === 'back_forward') {
    return true;
  }

  let url;
  try {
    url = new URL(referrer);
    if (url.origin !== new URL(currentHref).origin) {
      return false;
    }
  } catch {
    return false;
  }

  return referrers.some(item => {
    if (typeof item === 'string') {
      return url.pathname.startsWith(item);
    }
    if (item instanceof RegExp) {
      item.lastIndex = 0;
      return item.test(url.pathname + url.search);
    }
    try {
      return item(url) === true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[json-table] `stateReferrers`: errore nella funzione', err);
      return false;
    }
  });
}


/**
 * Analizza e valida uno stato salvato.
 *
 * @param {string|null} raw - Contenuto dello storage
 * @param {Object} opts
 * @param {string} opts.sig - Firma delle colonne correnti (vedi `colsSignature`)
 * @param {number} [opts.maxAge=0] - Durata massima in secondi, 0 = nessuna scadenza (default: 0)
 * @param {number} [opts.now=Date.now()] - Timestamp corrente in ms (default: Date.now())
 * @returns {{state: SavedState|null, reason: string|null}} Lo stato normalizzato, oppure `null` con il motivo dello scarto
 *   (`reason` è `null` anche quando non c'è nessuno stato salvato)
 *
 * @example
 * parseSavedState(sessionStorage.getItem(key), { sig: 'id,name', maxAge: 0 });
 * // → { state: { v: 1, sig: 'id,name', page: 2, … }, reason: null }
 */
export function parseSavedState(raw, { sig, maxAge = 0, now = Date.now() }) {

  if (raw == null || raw === '') {
    return { state: null, reason: null };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { state: null, reason: 'JSON non valido' };
  }

  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return { state: null, reason: 'formato non valido' };
  }
  if (data.v !== STATE_VERSION) {
    return { state: null, reason: `versione del formato diversa (${data.v})` };
  }
  if (data.sig !== sig) {
    return { state: null, reason: 'colonne diverse da quelle dello stato salvato' };
  }

  const savedAt = Number(data.savedAt);
  if (maxAge > 0 && (!Number.isFinite(savedAt) || now - savedAt > maxAge * 1000)) {
    return { state: null, reason: 'stato scaduto' };
  }

  const page = Math.floor(Number(data.page));
  const perPage = Math.floor(Number(data.perPage));

  return {
    state: {
      v: STATE_VERSION,
      sig,
      savedAt: Number.isFinite(savedAt) ? savedAt : 0,
      page: Number.isFinite(page) && page >= 1 ? page : 1,
      perPage: Number.isFinite(perPage) && perPage >= 0 ? perPage : 0,
      sort: Array.isArray(data.sort)
        ? data.sort.filter(/** @returns {s is SortDef} */ s => s != null && typeof s.key === 'string' && (s.dir === 'asc' || s.dir === 'desc'))
          .map(({ key, dir }) => ({ key, dir }))
        : [],
      search: typeof data.search === 'string' ? data.search : '',
      filters: Array.isArray(data.filters)
        ? data.filters.filter(/** @returns {pair is [string, string]} */ pair => Array.isArray(pair) && pair.length === 2
          && typeof pair[0] === 'string' && typeof pair[1] === 'string')
        : null,
      extra: data.extra ?? null
    },
    reason: null
  };
}


/**
 * Criteri di ordinamento ripristinabili: solo colonne esistenti e ordinabili, senza chiavi ripetute.
 *
 * @param {SortDef[]} sort - Criteri salvati
 * @param {Array<{key: string, sortable: boolean}>} cols - Colonne analizzate
 * @returns {SortDef[]}
 *
 * @example
 * restoreSort([{ key: 'name', dir: 'asc' }, { key: 'old', dir: 'desc' }], cols); // → [{ key: 'name', dir: 'asc' }]
 */
export function restoreSort(sort, cols) {
  const seen = new Set();
  return (Array.isArray(sort) ? sort : []).filter(s => {
    const col = cols.find(c => c.key === s?.key);
    if (!col || !col.sortable || (s.dir !== 'asc' && s.dir !== 'desc') || seen.has(s.key)) {
      return false;
    }
    seen.add(s.key);
    return true;
  }).map(({ key, dir }) => ({ key, dir }));
}


/**
 * Pagina da ripristinare: se le righe per pagina sono cambiate rispetto allo stato salvato, viene ricalcolata in modo
 * che resti visibile lo stesso primo record.
 *
 * @param {number} page - Pagina salvata (da 1)
 * @param {number} savedPerPage - Righe per pagina salvate (0 = nessuna paginazione)
 * @param {number} perPage - Righe per pagina correnti (0 = nessuna paginazione)
 * @returns {number}
 *
 * @example
 * restorePage(3, 25, 25); // → 3
 * restorePage(3, 25, 10); // → 6 (record 51 → pagina 6)
 * restorePage(3, 25, 0);  // → 1
 */
export function restorePage(page, savedPerPage, perPage) {
  const p = Math.max(1, Math.floor(Number(page) || 1));
  if (!(perPage > 0) || !(savedPerPage > 0)) {
    return 1;
  }
  if (savedPerPage === perPage) {
    return p;
  }
  return Math.floor(((p - 1) * savedPerPage) / perPage) + 1;
}


/**
 * Ripopola un form con i valori salvati (coppie nome/valore, i nomi possono ripetersi). Per ogni controllo con
 * `name`, non disabilitato e non di tipo file/pulsante:
 * - checkbox e radio: selezionati se il loro `value` è tra quelli salvati per il nome
 * - `select` multipla: ogni `option` selezionata se il suo valore è tra quelli salvati
 * - `select` singola: viene selezionata l'opzione con il valore salvato (o con valore vuoto); se non esiste resta invariata
 * - altri campi: i valori salvati vengono assegnati nell'ordine, ai campi con lo stesso nome
 *
 * Un nome assente dallo stato corrisponde a un campo vuoto (i campi vuoti non vengono salvati) e viene quindi svuotato.
 * Non viene emesso alcun evento `input`/`change`.
 *
 * @param {HTMLFormElement} form - Il form
 * @param {Array<[string, string]>} entries - Valori salvati
 * @returns {void}
 *
 * @example
 * fillForm(form, [['anno', '2025'], ['stato[]', '1'], ['stato[]', '2']]);
 */
export function fillForm(form, entries) {

  /** @type {Map<string, string[]>} */
  const values = new Map();
  entries.forEach(([name, value]) => {
    values.set(name, [...(values.get(name) ?? []), value]);
  });

  /** @type {Map<string, number>} indice del prossimo valore da assegnare, per nome (campi di testo ripetuti) */
  const nextIdx = new Map();

  Array.from(form.elements).forEach(control => {
    const el = /** @type {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} */ (control);
    const tag = String(el.tagName).toUpperCase();
    if (!el.name || el.disabled || !['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
      return;
    }
    const type = String(el.type ?? '').toLowerCase();
    if (['file', 'submit', 'button', 'reset', 'image'].includes(type)) {
      return;
    }

    const vals = values.get(el.name) ?? [];

    if (type === 'checkbox' || type === 'radio') {
      /** @type {HTMLInputElement} */ (el).checked = vals.includes(el.value);
      return;
    }

    if (tag === 'SELECT') {
      const options = Array.from(/** @type {HTMLSelectElement} */ (el).options);
      if (/** @type {HTMLSelectElement} */ (el).multiple) {
        options.forEach(opt => {
          opt.selected = vals.includes(opt.value);
        });
        return;
      }
      const idx = nextIdx.get(el.name) ?? 0;
      nextIdx.set(el.name, idx + 1);
      const value = vals[idx] ?? '';
      const opt = options.find(o => o.value === value);
      if (opt) {
        opt.selected = true;
      }
      return;
    }

    const idx = nextIdx.get(el.name) ?? 0;
    nextIdx.set(el.name, idx + 1);
    el.value = vals[idx] ?? '';
  });
}
