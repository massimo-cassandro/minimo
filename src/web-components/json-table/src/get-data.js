
/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').SortDef} SortDef */

/**
 * Risultato di `getData()`.
 * @typedef {Object} DataResult
 * @property {Array<Object>} rows - L'array delle righe (solo la pagina richiesta, in modalità server-side)
 * @property {number} totRec - Numero totale di record: il valore numerico di `params.totRecField` nel
 *   JSON recuperato, altrimenti `rows.length`
 * @property {number} filteredRec - Numero di record che corrispondono alla ricerca corrente: il valore numerico di
 *   `params.filteredRecField` nel JSON recuperato (modalità server-side), altrimenti `totRec`
 */

/**
 * Stato della richiesta in modalità server-side.
 * @typedef {Object} ServerRequest
 * @property {number} page - Pagina richiesta (da 1)
 * @property {number} perPage - Righe per pagina
 * @property {SortDef|null} sort - Ordinamento attivo, oppure null
 * @property {string} search - Termine di ricerca ('' = nessuno)
 * @property {Array<{key: string, searchable: boolean, sortable: boolean}>} [cols] - Colonne visualizzate (già analizzate);
 *   usate solo con `jqDatatableMode` per inviare `columns[i][...]` e l'indice della colonna ordinata
 */

/**
 * Legge un campo numerico del JSON recuperato; `undefined` se mancante o non numerico.
 * @param {*} json - JSON recuperato
 * @param {string|null|undefined} field - Chiave da leggere
 * @returns {number|undefined}
 */
function numericField(json, field) {
  if (!field || json == null || typeof json !== 'object') {
    return undefined;
  }
  const raw = json[field];
  const num = Number(raw);
  return (raw != null && raw !== '' && Number.isFinite(num)) ? num : undefined;
}


/**
 * Costruisce l'URL di una richiesta server-side: `params.jsonUrl` più i parametri della query string
 * indicati in `params.serverParams` (i parametri impostati a `null` vengono omessi; `sort`/`dir` vengono inviati
 * solo quando è attivo un ordinamento, `search` solo quando non è vuoto). I parametri della query string
 * già presenti in `jsonUrl` vengono conservati.
 *
 * Con `params.jqDatatableMode` e `request.cols` vengono inviati anche, come fa jQuery DataTables, `draw=1`,
 * `columns[i][name|searchable|orderable]` e, per `sort`, l'indice della colonna al posto della sua chiave.
 *
 * @param {JsonTableParams} params - Parametri risolti
 * @param {ServerRequest} request - Stato della richiesta
 * @returns {string}
 *
 * @example
 * buildServerUrl(
 *   { ...params, jsonUrl: '/api/rows.json?year=2025' },
 *   { page: 3, perPage: 25, sort: { key: 'name', dir: 'desc' }, search: 'mar' }
 * );
 * // → '/api/rows.json?year=2025&page=3&start=50&perPage=25&sort=name&dir=desc&search=mar'
 */
export function buildServerUrl(params, request) {

  const url = new URL(String(params.jsonUrl), document.baseURI);
  const names = params.serverParams ?? {};

  /** @type {(name: string|null|undefined, value: string|number|boolean|null|undefined) => void} */
  const set = (name, value) => {
    if (name && value != null && value !== '') {
      url.searchParams.set(name, String(value));
    }
  };

  set(names.page, request.page);
  set(names.start, (request.page - 1) * request.perPage);
  set(names.perPage, request.perPage);
  const jqCols = params.jqDatatableMode ? request.cols : null;
  if (jqCols) {
    set('draw', 1);
    jqCols.forEach((col, idx) => {
      set(`columns[${idx}][name]`, col.key);
      set(`columns[${idx}][searchable]`, col.searchable);
      set(`columns[${idx}][orderable]`, col.sortable);
    });
  }

  set(names.sort, jqCols && request.sort
    ? jqCols.findIndex(col => col.key === request.sort?.key)
    : request.sort?.key);
  set(names.dir, request.sort ? request.sort.dir : null);
  set(names.search, request.search);

  return url.toString();
}


/**
 * Recupera l'array delle righe dalla sorgente configurata.
 *
 * `data` ha la precedenza su `jsonUrl`. Con `jsonUrl` il JSON viene recuperato e le righe vengono
 * lette dalla chiave `jsonDataField` (`null`/`''` = la radice del JSON è l'array stesso); quando il
 * JSON contiene anche una chiave numerica `totRecField`, viene restituita come `totRec`, altrimenti `totRec` è
 * la lunghezza dell'array delle righe. In modalità server-side (`request` indicato) l'URL porta i parametri di paginazione /
 * ordinamento / ricerca (vedi `buildServerUrl`) e viene letto anche `filteredRecField`.
 * Restituisce `null` quando non è configurata alcuna sorgente.
 *
 * @param {JsonTableParams} params - Parametri risolti (vedi `resolve-params.js`)
 * @param {ServerRequest|null} [request=null] - Stato della richiesta server-side; `null` per una richiesta semplice (default: null)
 * @returns {Promise<DataResult|null>} Righe e totali, oppure `null` quando non sono impostati né `data` né `jsonUrl`
 * @throws {Error} Quando `data` non è un array, in caso di errori HTTP/di rete, oppure quando il JSON recuperato
 *   non contiene un array in `jsonDataField`
 *
 * @example
 * // dati inline (jsonUrl ignorato)
 * await getData({ ...params, data: [{ id: 1 }], jsonUrl: '/ignored.json' });
 * // → { rows: [{ id: 1 }], totRec: 1, filteredRec: 1 }
 *
 * // JSON recuperato: { data: [...], totRec: 1500 }  (jsonDataField default: 'data', totRecField default: 'totRec')
 * await getData({ ...params, jsonUrl: '/api/rows.json' });
 *
 * // JSON recuperato la cui radice è l'array stesso
 * await getData({ ...params, jsonUrl: '/api/rows.json', jsonDataField: null });
 *
 * // server-side: GET /api/rows.json?page=2&start=25&perPage=25&search=mar
 * // JSON atteso: { data: [...25 righe], totRec: 1500, filteredRec: 40 }
 * await getData({ ...params, jsonUrl: '/api/rows.json', serverSide: true }, { page: 2, perPage: 25, sort: null, search: 'mar' });
 */
export async function getData(params, request = null) {

  if (params.data != null) {
    if (!Array.isArray(params.data)) {
      throw new Error('[json-table] `data` deve essere un array di oggetti');
    }
    return { rows: params.data, totRec: params.data.length, filteredRec: params.data.length };
  }

  if (params.jsonUrl) {
    const url = request ? buildServerUrl(params, request) : params.jsonUrl;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`[json-table] ${url}: risposta HTTP ${response.status}`);
    }

    const json = await response.json();
    const field = params.jsonDataField;
    const rows = (field == null || field === '') ? json : json?.[field];

    if (!Array.isArray(rows)) {
      throw new Error(
        `[json-table] ${url}: ` +
        (field ? `il campo \`${field}\` non contiene un array` : 'la risposta non è un array')
      );
    }

    const hasFields = field != null && field !== '';
    const totRec = hasFields ? numericField(json, params.totRecField) : undefined;
    const filteredRec = hasFields ? numericField(json, params.filteredRecField) : undefined;

    return {
      rows,
      totRec: totRec ?? rows.length,
      filteredRec: filteredRec ?? totRec ?? rows.length
    };
  }

  return null;
}
