/*! minimo - json-table: cell & footer content */

import { getNestedValue, resolveMustache } from './content-utils.js';
import { toNumber } from './data-types.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').CellContent} CellContent */
/** @typedef {import('./parse-cols.js').ParsedCol} ParsedCol */

/**
 * Calcola il contenuto di una cella del body.
 *
 * Pipeline:
 * 1. `render` della colonna: funzione `(row, tr, td)` o stringa in stile mustache (`[[key]]`); una funzione
 *    che restituisce `undefined` lascia proseguire la pipeline (utile per decorare solo `td`/`tr`), `null`
 *    dà `renderNullAs`
 * 2. valore grezzo `null`/`undefined` → `renderNullAs`
 * 3. `render(value, row, params)` del data type
 * 4. valore grezzo
 *
 * @param {ParsedCol} col - Colonna analizzata
 * @param {Object} row - Oggetto riga
 * @param {JsonTableParams} params - Parametri risolti
 * @param {HTMLTableRowElement} [tr] - Elemento riga, passato al `render` della colonna
 * @param {HTMLTableCellElement} [td] - Elemento cella, passato al `render` della colonna
 * @returns {CellContent}
 *
 * @example
 * cellContent({ ...col, key: 'amount', _type: types.euro }, { amount: 12 }, params);   // → '12,00 €'
 * cellContent({ ...col, key: 'amount', _type: types.euro }, { amount: null }, params); // → '—' (renderNullAs)
 * cellContent({ ...col, render: '<b>[[name]]</b>' }, { name: 'Mario' }, params);      // → '<b>Mario</b>'
 * cellContent({ ...col, render: (row, tr, td) => { td.title = row.name; } }, row, params, tr, td);
 * // → data type / valore grezzo (render ha restituito undefined)
 */
export function cellContent(col, row, params, tr, td) {

  const nullAs = params.renderNullAs ?? '';

  if (col.render != null) {
    const content = typeof col.render === 'function'
      ? col.render(row, tr, td)
      : resolveMustache(String(col.render), row, nullAs);

    if (content !== undefined) {
      return content ?? nullAs;
    }
  }

  const value = getNestedValue(row, col.key);

  if (value == null) {
    return nullAs;
  }

  if (typeof col._type.render === 'function') {
    return col._type.render(value, row, params) ?? nullAs;
  }

  return value;
}


/**
 * Aggregati predefiniti del footer (`tfootRender: '@sum'`, ...), calcolati sui valori numerici
 * della colonna (i valori non numerici vengono saltati).
 * @type {Object<string, (nums: number[]) => number>}
 */
const aggregates = {
  '@sum': nums => nums.reduce((acc, n) => acc + n, 0),
  '@avg': nums => (nums.length ? nums.reduce((acc, n) => acc + n, 0) / nums.length : NaN),
  '@min': nums => (nums.length ? Math.min(...nums) : NaN),
  '@max': nums => (nums.length ? Math.max(...nums) : NaN),
  '@count': nums => nums.length
};


/**
 * Calcola il contenuto di una cella del footer dal `tfootRender` della colonna:
 * - funzione `(rows, td) => content`
 * - aggregato predefinito `'@sum'`, `'@avg'`, `'@min'`, `'@max'` (formattato dal data
 *   type della colonna, ad es. come valuta per le colonne `euro`) oppure `'@count'` (numero di valori numerici)
 * - qualsiasi altra stringa: contenuto statico (ad es. un'etichetta "Totale")
 * - `null`: cella vuota
 *
 * @param {ParsedCol} col - Colonna analizzata
 * @param {Array<Object>} rows - Righe da aggregare (insieme filtrato o pagina corrente, vedi `updateFooterOnPageChange`)
 * @param {JsonTableParams} params - Parametri risolti
 * @param {HTMLTableCellElement} [td] - Elemento cella del footer, passato alla funzione `tfootRender`
 * @returns {CellContent}
 *
 * @example
 * tfootContent({ ...col, key: 'amount', tfootRender: '@sum', _type: types.euro }, rows, params); // → '1.234,56 €'
 * tfootContent({ ...col, tfootRender: 'Totale' }, rows, params);                                 // → 'Totale'
 * tfootContent({ ...col, tfootRender: rows => `${rows.length} righe` }, rows, params);           // → '10 righe'
 * tfootContent({ ...col, tfootRender: null }, rows, params);                                     // → ''
 */
export function tfootContent(col, rows, params, td) {

  const renderer = col.tfootRender;

  if (renderer == null) {
    return '';
  }

  if (typeof renderer === 'function') {
    return renderer(rows, td) ?? '';
  }

  const tpl = String(renderer);

  if (tpl.startsWith('@')) {
    const aggregate = aggregates[tpl];

    if (!aggregate) {
      // eslint-disable-next-line no-console
      console.error(`[json-table] colonna \`${col.key}\`: aggregato \`${tpl}\` non riconosciuto (disponibili: ${Object.keys(aggregates).join(', ')})`);
      return '';
    }

    const nums = rows
      .map(row => toNumber(getNestedValue(row, col.key)))
      .filter(n => !Number.isNaN(n));

    const result = aggregate(nums);

    if (tpl === '@count') {
      return result.toLocaleString(params.locale);
    }

    return typeof col._type.render === 'function'
      ? col._type.render(result, null, params)
      : result.toLocaleString(params.locale, params.numbersLocaleOpts);
  }

  return tpl;
}
