/*! minimo - json-table: rows parsing (sort & search values) */

import { getNestedValue } from './content-utils.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./parse-cols.js').ParsedCol} ParsedCol */

/**
 * A data row with the values precomputed for sorting and searching.
 * @typedef {Object} ParsedRow
 * @property {number} idx - Index of the row in the original data set
 * @property {Object} row - The original row object
 * @property {Object<string, *>} sortValues - Sort value of every sortable column, keyed by column key
 * @property {string} searchText - Lowercased concatenation of the search values of the searchable columns
 */

/**
 * Resolves the sort/search value of a cell: column-level value or function `row => value`
 * (when defined) → data type function `(value, row, params) => value` → raw value.
 * @param {*} colValue - Column `sortValue`/`searchValue` (undefined = not set)
 * @param {((value: *, row: Object, params: JsonTableParams) => *)|undefined} typeFn - Data type function
 * @param {*} value - Raw cell value
 * @param {Object} row - Row object
 * @param {JsonTableParams} params - Resolved params
 * @returns {*}
 */
function resolveValue(colValue, typeFn, value, row, params) {
  if (colValue !== undefined) {
    return typeof colValue === 'function' ? colValue(row) : colValue;
  }
  if (typeof typeFn === 'function') {
    return typeFn(value, row, params);
  }
  return value;
}


/**
 * Precomputes, for every row, the values used by sorting and searching, so that they are
 * calculated once and not on every sort/search operation (see `sorting.js` and `search.js`).
 *
 * @param {Array<Object>} rows - Raw data rows
 * @param {ParsedCol[]} cols - Parsed columns (see `parse-cols.js`)
 * @param {JsonTableParams} params - Resolved params
 * @returns {ParsedRow[]}
 *
 * @example
 * parseRows([{ id: 1, name: 'Mario', amount: '12.5' }], cols, params);
 * // → [{ idx: 0, row: {…}, sortValues: { id: 1, name: 'Mario', amount: 12.5 }, searchText: 'mario 12,5' }]
 */
export function parseRows(rows, cols, params) {

  return rows.map((row, idx) => {

    /** @type {Object<string, *>} */
    const sortValues = {};
    /** @type {string[]} */
    const searchParts = [];

    cols.forEach(col => {
      const value = getNestedValue(row, col.key);

      if (col.sortable) {
        sortValues[col.key] = resolveValue(col.sortValue, col._type.sortValue, value, row, params);
      }

      if (col.searchable) {
        const searchValue = resolveValue(
          col.searchValue,
          col._type.searchValue ?? (v => (v == null ? '' : String(v))),
          value, row, params
        );
        if (searchValue != null && searchValue !== '') {
          searchParts.push(String(searchValue));
        }
      }
    });

    return { idx, row, sortValues, searchText: searchParts.join(' ').toLowerCase() };
  });
}
