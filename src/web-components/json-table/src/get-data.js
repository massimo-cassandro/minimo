
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
 * @property {SortDef[]} sort - Criteri di ordinamento attivi, in ordine di priorità ([] = nessuno)
 * @property {string} search - Termine di ricerca ('' = nessuno)
 * @property {Array<{key: string, searchable: boolean, sortable: boolean, sortKeys?: string[]|null, searchKeys?: string[]|null}>} [cols] -
 *   Colonne visualizzate (già analizzate); usate per `sort` e `searchFields` e, con `jqDatatableMode`, per inviare
 *   `columns[i][...]` e l'indice della colonna ordinata
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
 * Applica a un URL i valori di un form di filtro (vedi `filterForm`): ogni chiave sostituisce l'eventuale parametro omonimo
 * già presente nell'URL; le chiavi ripetute (checkbox con lo stesso nome, select multiple) vengono aggiunte tutte.
 * @param {URL} url - URL da modificare
 * @param {URLSearchParams|null} [filters=null] - Valori del form (default: null)
 * @returns {void}
 *
 * @example
 * const url = new URL('/api/rows.json?anno=2024&tipo=a', location.href);
 * applyFilters(url, new URLSearchParams('anno=2025&stato[]=1&stato[]=2'));
 * // → /api/rows.json?tipo=a&anno=2025&stato[]=1&stato[]=2
 */
function applyFilters(url, filters = null) {
  if (!filters) {
    return;
  }
  new Set(filters.keys()).forEach(key => url.searchParams.delete(key));
  filters.forEach((value, key) => url.searchParams.append(key, value));
}


/**
 * Valore del parametro di query `searchFields`: `searchKeys` (o, in sua assenza, `key`) delle colonne ricercabili più
 * il parametro `searchFields`, senza duplicati. Un nome semplice viene scartato se è presente anche nella forma
 * `tabella.nome`, che lo rende univoco nelle query con join (es. `cognome` e `clienti.cognome` → `clienti.cognome`).
 * @param {NonNullable<ServerRequest['cols']>} cols - Colonne visualizzate
 * @param {string[]|null} [searchFields=null] - Campi aggiuntivi (default: null)
 * @returns {string}
 *
 * @example
 * buildSearchFields([{ key: 'codice', searchable: true }, { key: 'cognome', searchable: true }], ['clienti.cognome', 'comuni.nome']);
 * // → 'codice,clienti.cognome,comuni.nome'
 */
function buildSearchFields(cols, searchFields = null) {
  const fields = [...new Set([
    ...cols.filter(col => col.searchable).flatMap(col => col.searchKeys ?? [col.key]),
    ...(searchFields ?? [])
  ])];

  return fields
    .filter(field => field.includes('.') || !fields.some(other => other.endsWith(`.${field}`)))
    .join(',');
}


/**
 * Costruisce l'URL di una richiesta server-side: `params.jsonUrl` più i parametri della query string
 * indicati in `params.serverParams` (i parametri impostati a `null` vengono omessi; `sort`/`dir` vengono inviati
 * solo quando è attivo un ordinamento, `search` solo quando non è vuoto). I parametri della query string
 * già presenti in `jsonUrl` vengono conservati. `sort` contiene le chiavi di tutti i criteri unite da virgola e `dir` una
 * direzione per ogni chiave; le colonne con `sortKeys` inviano queste chiavi al posto di `key`, con la direzione ripetuta
 * per ognuna. Se il nome di `sort`/`dir` contiene `{i}` viene invece inviato un parametro per criterio, con `{i}` sostituito
 * dall'indice. `searchFields` viene inviato insieme a `search` (vedi `buildSearchFields`).
 *
 * Con `params.jqDatatableMode` e `request.cols` vengono inviati anche, come fa jQuery DataTables, `draw=1`,
 * `columns[i][name|searchable|orderable]` e, per `sort`, l'indice della colonna al posto della sua chiave
 * (`order[i][column]` e `order[i][dir]` per ogni criterio, con i nomi predefiniti).
 * In questa modalità `sortKeys`, `searchKeys` e `searchFields` non vengono usati.
 *
 * I valori del form di filtro (`filters`) vengono applicati prima dei parametri di `serverParams`, che in caso di
 * nomi coincidenti prevalgono.
 *
 * @param {JsonTableParams} params - Parametri risolti
 * @param {ServerRequest} request - Stato della richiesta
 * @param {URLSearchParams|null} [filters=null] - Valori del form di filtro (vedi `filterForm`) (default: null)
 * @returns {string}
 *
 * @example
 * buildServerUrl(
 *   { ...params, jsonUrl: '/api/rows.json?year=2025' },
 *   { page: 3, perPage: 25, sort: [{ key: 'city', dir: 'asc' }, { key: 'name', dir: 'desc' }], search: 'mar' }
 * );
 * // → '/api/rows.json?year=2025&page=3&start=50&perPage=25&sort=city,name&dir=asc,desc&search=mar'
 */
export function buildServerUrl(params, request, filters = null) {

  const url = new URL(String(params.jsonUrl), document.baseURI);
  applyFilters(url, filters);
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

  const cols = request.cols ?? [];
  const sortDefs = request.sort ?? [];
  // valori inviati per ogni criterio: indice della colonna (jqDatatableMode), oppure `sortKeys` o `key`
  const sortValues = sortDefs.map(({ key }) => jqCols
    ? [jqCols.findIndex(col => col.key === key)]
    : cols.find(col => col.key === key)?.sortKeys ?? [key]);

  if (names.sort?.includes('{i}')) {
    sortDefs.forEach(({ dir }, idx) => {
      set(names.sort?.replace('{i}', String(idx)), sortValues[idx].join(','));
      set(names.dir?.replace('{i}', String(idx)), dir);
    });
  } else {
    set(names.sort, sortValues.flat().join(','));
    set(names.dir, sortDefs.flatMap(({ dir }, idx) => sortValues[idx].map(() => dir)).join(','));
  }
  set(names.search, request.search);
  if (request.search && !params.jqDatatableMode) {
    set(names.searchFields, buildSearchFields(cols, params.searchFields));
  }

  return url.toString();
}


/**
 * Recupera l'array delle righe dalla sorgente configurata.
 *
 * `data` ha la precedenza su `jsonUrl`. Con `jsonUrl` il JSON viene recuperato e le righe vengono
 * lette dalla chiave `jsonDataField` (`null`/`''` = la radice del JSON è l'array stesso); quando il
 * JSON contiene anche una chiave numerica `totRecField`, viene restituita come `totRec`, altrimenti `totRec` è
 * la lunghezza dell'array delle righe. In modalità server-side (`request` indicato) l'URL porta i parametri di paginazione /
 * ordinamento / ricerca (vedi `buildServerUrl`) e viene letto anche `filteredRecField`. I valori del form di filtro
 * (`filters`, vedi `filterForm`) vengono aggiunti alla query string in entrambe le modalità; vengono ignorati con `data`.
 * Restituisce `null` quando non è configurata alcuna sorgente.
 *
 * @param {JsonTableParams} params - Parametri risolti (vedi `resolve-params.js`)
 * @param {ServerRequest|null} [request=null] - Stato della richiesta server-side; `null` per una richiesta semplice (default: null)
 * @param {URLSearchParams|null} [filters=null] - Valori del form di filtro (default: null)
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
 * await getData({ ...params, jsonUrl: '/api/rows.json', serverSide: true }, { page: 2, perPage: 25, sort: [], search: 'mar' });
 *
 * // con i valori di un form di filtro: GET /api/rows.json?anno=2025
 * await getData({ ...params, jsonUrl: '/api/rows.json' }, null, new URLSearchParams('anno=2025'));
 */
export async function getData(params, request = null, filters = null) {

  if (params.data != null) {
    if (!Array.isArray(params.data)) {
      throw new Error('[json-table] `data` deve essere un array di oggetti');
    }
    return { rows: params.data, totRec: params.data.length, filteredRec: params.data.length };
  }

  if (params.jsonUrl) {
    let url;
    if (request) {
      url = buildServerUrl(params, request, filters);
    } else if (filters) {
      const filteredUrl = new URL(String(params.jsonUrl), document.baseURI);
      applyFilters(filteredUrl, filters);
      url = filteredUrl.toString();
    } else {
      url = params.jsonUrl;
    }
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
