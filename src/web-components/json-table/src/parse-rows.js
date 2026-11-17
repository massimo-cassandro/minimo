
import { getCellValue, getCellValues, getNestedValue } from './content-utils.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./parse-cols.js').ParsedCol} ParsedCol */

/**
 * Una riga di dati con i valori precalcolati per ordinamento e ricerca.
 * @typedef {Object} ParsedRow
 * @property {number} idx - Indice della riga nell'insieme di dati originale
 * @property {Object} row - L'oggetto riga originale
 * @property {Object<string, *>} sortValues - Valore di ordinamento di ogni colonna ordinabile, indicizzato per chiave della colonna
 * @property {string} searchText - Concatenazione in minuscolo dei valori di ricerca delle colonne ricercabili e di `searchFields`
 */

/**
 * Risolve il valore di ordinamento/ricerca di una cella: valore a livello di colonna o funzione `row => value`
 * (se definito) → funzione del data type `(value, row, params) => value` → valore grezzo.
 * @param {*} colValue - `sortValue`/`searchValue` della colonna (undefined = non impostato)
 * @param {((value: *, row: Object, params: JsonTableParams) => *)|undefined} typeFn - Funzione del data type
 * @param {*} value - Valore della cella (risultato di `parse`, se definito, altrimenti valore grezzo)
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
 * Nelle colonne ripetute su più `<tr>` (`col._subRows`) con valore array, l'ordinamento usa il primo elemento e
 * la ricerca li considera tutti. Il valore di partenza è quello restituito da `parse`, se definito nella colonna.
 * Al testo di ricerca vengono aggiunti i valori di `searchFields` (vedi `searchFieldsValues`).
 * In modalità server-side i valori non vengono calcolati: ordinamento e ricerca spettano al server.
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

  if (params.serverSide) {
    return rows.map((row, idx) => ({ idx, row, sortValues: {}, searchText: '' }));
  }

  return rows.map((row, idx) => {

    /** @type {Object<string, *>} */
    const sortValues = {};
    /** @type {string[]} */
    const searchParts = [];

    cols.forEach(col => {
      if (col.sortable) {
        sortValues[col.key] = resolveValue(col.sortValue, col._type.sortValue, getCellValue(row, col), row, params);
      }

      if (col.searchable) {
        getCellValues(row, col).forEach(item => {
          const searchValue = resolveValue(
            col.searchValue,
            col._type.searchValue ?? (v => (v == null ? '' : String(v))),
            item, row, params
          );
          if (searchValue != null && searchValue !== '') {
            searchParts.push(String(searchValue));
          }
        });
      }
    });

    searchParts.push(...searchFieldsValues(row, params.searchFields));

    return { idx, row, sortValues, searchText: searchParts.join(' ').toLowerCase() };
  });
}


/**
 * Valori di ricerca aggiuntivi di una riga, da `searchFields` (solo modalità client-side): ogni voce è un percorso nel JSON
 * della riga (il punto indica un valore annidato, come in `key`) oppure una funzione `row => valore`.
 * I valori array vengono appiattiti; `null`, stringhe vuote e oggetti vengono scartati (per un oggetto va indicato il percorso
 * fino al valore, es. `owner.name`). I valori sono quelli grezzi del JSON, senza la formattazione dei data type.
 *
 * @param {Object} row - Oggetto riga
 * @param {import('./defaults.js').SearchField[]|null} searchFields - Voci di `searchFields`, già normalizzate (vedi `normalizeSearchFields`)
 * @returns {string[]}
 *
 * @example
 * searchFieldsValues({ note: 'urgente', tags: ['a', 'b'], owner: { name: 'Mario' } }, ['note', 'tags', 'owner.name']);
 * // → ['urgente', 'a', 'b', 'Mario']
 * searchFieldsValues({ items: [{ name: 'x' }, { name: 'y' }] }, [row => row.items.map(item => item.name)]);
 * // → ['x', 'y']
 */
function searchFieldsValues(row, searchFields) {
  if (!searchFields?.length) {
    return [];
  }

  return searchFields
    .flatMap(field => [typeof field === 'function' ? field(row) : getNestedValue(row, field)].flat(Infinity))
    .filter(value => value != null && value !== '' && typeof value !== 'object')
    .map(String);
}
