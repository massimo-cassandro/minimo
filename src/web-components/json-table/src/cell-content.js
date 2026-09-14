/*! minimo - json-table: cell & footer content */

import { getNestedValue, resolveMustache } from './content-utils.js';
import { toNumber } from './data-types.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').CellContent} CellContent */
/** @typedef {import('./parse-cols.js').ParsedCol} ParsedCol */

/**
 * Computes the content of a body cell.
 *
 * Pipeline:
 * 1. column `render`: function `(row, tr, td)` or mustache-like string (`[[key]]`); a function
 *    returning `undefined` lets the pipeline go on (useful to only decorate `td`/`tr`), `null`
 *    gives `renderNullAs`
 * 2. `null`/`undefined` raw value → `renderNullAs`
 * 3. data type `render(value, row, params)`
 * 4. raw value
 *
 * @param {ParsedCol} col - Parsed column
 * @param {Object} row - Row object
 * @param {JsonTableParams} params - Resolved params
 * @param {HTMLTableRowElement} [tr] - Row element, passed to the column `render`
 * @param {HTMLTableCellElement} [td] - Cell element, passed to the column `render`
 * @returns {CellContent}
 *
 * @example
 * cellContent({ ...col, key: 'amount', _type: types.euro }, { amount: 12 }, params);   // → '12,00 €'
 * cellContent({ ...col, key: 'amount', _type: types.euro }, { amount: null }, params); // → '—' (renderNullAs)
 * cellContent({ ...col, render: '<b>[[name]]</b>' }, { name: 'Mario' }, params);      // → '<b>Mario</b>'
 * cellContent({ ...col, render: (row, tr, td) => { td.title = row.name; } }, row, params, tr, td);
 * // → data type / raw value (render returned undefined)
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
 * Built-in footer aggregates (`tfootRender: '@sum'`, ...), computed on the numeric values
 * of the column (non-numeric values are skipped).
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
 * Computes the content of a footer cell from the column `tfootRender`:
 * - function `(rows, td) => content`
 * - built-in aggregate `'@sum'`, `'@avg'`, `'@min'`, `'@max'` (formatted by the column data
 *   type, e.g. as currency for `euro` columns) or `'@count'` (number of numeric values)
 * - any other string: static content (e.g. a "Totale" label)
 * - `null`: empty cell
 *
 * @param {ParsedCol} col - Parsed column
 * @param {Array<Object>} rows - Rows to aggregate (filtered set or current page, see `updateFooterOnPageChange`)
 * @param {JsonTableParams} params - Resolved params
 * @param {HTMLTableCellElement} [td] - Footer cell element, passed to the `tfootRender` function
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
