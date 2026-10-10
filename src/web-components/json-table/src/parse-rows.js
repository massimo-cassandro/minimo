
import { getNestedValue } from './content-utils.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./parse-cols.js').ParsedCol} ParsedCol */

/**
 * Una riga di dati con i valori precalcolati per ordinamento e ricerca.
 * @typedef {Object} ParsedRow
 * @property {number} idx - Indice della riga nell'insieme di dati originale
 * @property {Object} row - L'oggetto riga originale
 * @property {Object<string, *>} sortValues - Valore di ordinamento di ogni colonna ordinabile, indicizzato per chiave della colonna
 * @property {string} searchText - Concatenazione in minuscolo dei valori di ricerca delle colonne ricercabili
 */

/**
 * Risolve il valore di ordinamento/ricerca di una cella: valore a livello di colonna o funzione `row => value`
 * (se definito) → funzione del data type `(value, row, params) => value` → valore grezzo.
 * @param {*} colValue - `sortValue`/`searchValue` della colonna (undefined = non impostato)
 * @param {((value: *, row: Object, params: JsonTableParams) => *)|undefined} typeFn - Funzione del data type
 * @param {*} value - Valore grezzo della cella
 * @param {Object} row - Oggetto riga
 * @param {JsonTableParams} params - Parametri risolti
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
 * Precalcola, per ogni riga, i valori usati da ordinamento e ricerca, così che vengano
 * calcolati una sola volta e non a ogni operazione di ordinamento/ricerca (vedi `sorting.js` e `search.js`).
 *
 * @param {Array<Object>} rows - Righe di dati grezze
 * @param {ParsedCol[]} cols - Colonne analizzate (vedi `parse-cols.js`)
 * @param {JsonTableParams} params - Parametri risolti
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
