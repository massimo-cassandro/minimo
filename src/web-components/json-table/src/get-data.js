/*! minimo - json-table: data acquisition */

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */

/**
 * Retrieves the rows array from the configured source.
 *
 * `data` takes precedence over `jsonUrl`. With `jsonUrl` the JSON is fetched and the rows are
 * read from the `jsonDataField` key (`null`/`''` = the JSON root is the array itself).
 * Returns `null` when no source is configured.
 *
 * @param {JsonTableParams} params - Resolved params (see `resolve-params.js`)
 * @returns {Promise<Array<Object>|null>} The rows array, or `null` when neither `data` nor `jsonUrl` is set
 * @throws {Error} When `data` is not an array, on HTTP/network errors, or when the fetched JSON
 *   does not contain an array at `jsonDataField`
 *
 * @example
 * // inline data (jsonUrl ignored)
 * await getData({ ...params, data: [{ id: 1 }], jsonUrl: '/ignored.json' }); // → [{ id: 1 }]
 *
 * // fetched JSON: { data: [...] }  (jsonDataField default: 'data')
 * await getData({ ...params, jsonUrl: '/api/rows.json' });
 *
 * // fetched JSON whose root is the array itself
 * await getData({ ...params, jsonUrl: '/api/rows.json', jsonDataField: null });
 */
export async function getData(params) {

  if (params.data != null) {
    if (!Array.isArray(params.data)) {
      throw new Error('[json-table] `data` deve essere un array di oggetti');
    }
    return params.data;
  }

  if (params.jsonUrl) {
    const response = await fetch(params.jsonUrl);

    if (!response.ok) {
      throw new Error(`[json-table] ${params.jsonUrl}: risposta HTTP ${response.status}`);
    }

    const json = await response.json();
    const field = params.jsonDataField;
    const rows = (field == null || field === '') ? json : json?.[field];

    if (!Array.isArray(rows)) {
      throw new Error(
        `[json-table] ${params.jsonUrl}: ` +
        (field ? `il campo \`${field}\` non contiene un array` : 'la risposta non è un array')
      );
    }
    return rows;
  }

  return null;
}
