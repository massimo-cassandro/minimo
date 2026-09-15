/*! minimo - json-table: data acquisition */

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').SortDef} SortDef */

/**
 * Result of `getData()`.
 * @typedef {Object} DataResult
 * @property {Array<Object>} rows - The rows array (the requested page only, in server-side mode)
 * @property {number} totRec - Total number of records: the numeric value of `params.totRecField` in the
 *   fetched JSON, `rows.length` otherwise
 * @property {number} filteredRec - Number of records matching the current search: the numeric value of
 *   `params.filteredRecField` in the fetched JSON (server-side mode), `totRec` otherwise
 */

/**
 * State of the request in server-side mode.
 * @typedef {Object} ServerRequest
 * @property {number} page - Requested page (1-based)
 * @property {number} perPage - Rows per page
 * @property {SortDef|null} sort - Active sort, or null
 * @property {string} search - Search term ('' = none)
 */

/**
 * Reads a numeric field of the fetched JSON; `undefined` when missing or not numeric.
 * @param {*} json - Fetched JSON
 * @param {string|null|undefined} field - Key to read
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
 * Builds the URL of a server-side request: `params.jsonUrl` plus the query string parameters
 * named in `params.serverParams` (parameters set to `null` are omitted; `sort`/`dir` are sent
 * only when a sort is active, `search` only when not empty). Existing query string parameters
 * of `jsonUrl` are preserved.
 *
 * @param {JsonTableParams} params - Resolved params
 * @param {ServerRequest} request - Request state
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

  /** @type {(name: string|null|undefined, value: string|number|null|undefined) => void} */
  const set = (name, value) => {
    if (name && value != null && value !== '') {
      url.searchParams.set(name, String(value));
    }
  };

  set(names.page, request.page);
  set(names.start, (request.page - 1) * request.perPage);
  set(names.perPage, request.perPage);
  set(names.sort, request.sort?.key);
  set(names.dir, request.sort ? request.sort.dir : null);
  set(names.search, request.search);

  return url.toString();
}


/**
 * Retrieves the rows array from the configured source.
 *
 * `data` takes precedence over `jsonUrl`. With `jsonUrl` the JSON is fetched and the rows are
 * read from the `jsonDataField` key (`null`/`''` = the JSON root is the array itself); when the
 * JSON also holds a numeric `totRecField` key, it is returned as `totRec`, otherwise `totRec` is
 * the rows array length. In server-side mode (`request` given) the URL carries the pagination /
 * sort / search parameters (see `buildServerUrl`) and `filteredRecField` is read too.
 * Returns `null` when no source is configured.
 *
 * @param {JsonTableParams} params - Resolved params (see `resolve-params.js`)
 * @param {ServerRequest|null} [request=null] - Server-side request state; `null` for a plain request (default: null)
 * @returns {Promise<DataResult|null>} Rows and totals, or `null` when neither `data` nor `jsonUrl` is set
 * @throws {Error} When `data` is not an array, on HTTP/network errors, or when the fetched JSON
 *   does not contain an array at `jsonDataField`
 *
 * @example
 * // inline data (jsonUrl ignored)
 * await getData({ ...params, data: [{ id: 1 }], jsonUrl: '/ignored.json' });
 * // → { rows: [{ id: 1 }], totRec: 1, filteredRec: 1 }
 *
 * // fetched JSON: { data: [...], totRec: 1500 }  (jsonDataField default: 'data', totRecField default: 'totRec')
 * await getData({ ...params, jsonUrl: '/api/rows.json' });
 *
 * // fetched JSON whose root is the array itself
 * await getData({ ...params, jsonUrl: '/api/rows.json', jsonDataField: null });
 *
 * // server-side: GET /api/rows.json?page=2&start=25&perPage=25&search=mar
 * // expected JSON: { data: [...25 rows], totRec: 1500, filteredRec: 40 }
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
