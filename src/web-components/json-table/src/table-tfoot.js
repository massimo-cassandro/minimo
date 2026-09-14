/*! minimo - json-table: tfoot rendering */

import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { setContent } from './content-utils.js';
import { tfootContent } from './cell-content.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */

/**
 * Renders the footer row inside `elements.tfoot` (present only when `params.tfoot` is true),
 * replacing the previous content. Every column produces a cell whose content comes from
 * `tfootContent()` (column `tfootRender`); the footer is emptied when there are no rows.
 *
 * The rows passed to `tfootRender` are the whole filtered set, or the current page only when
 * `updateFooterOnPageChange` is true.
 *
 * Generated structure: `tr > td[data-key][cellClass]…`
 *
 * @param {JsonTable} jt - The component instance
 * @returns {void}
 *
 * @example
 * renderTfoot(jt); // after `jt.state` has been updated
 */
export function renderTfoot(jt) {

  const { params, elements, state, cols } = jt;
  const tfoot = elements.tfoot;

  if (!tfoot) {
    return;
  }

  if (!state.filtered.length) {
    tfoot.replaceChildren();
    return;
  }

  const rows = (params.updateFooterOnPageChange ? state.pageRows : state.filtered).map(parsed => parsed.row);

  domBuilder([
    {
      tag: 'tr',
      children: cols.map(col => ({
        tag: 'td',
        className: col.cellClass,
        attrs: { 'data-key': col.key },
        callback: el => {
          const td = /** @type {HTMLTableCellElement} */ (el);
          setContent(td, tfootContent(col, rows, params, td));
        }
      }))
    }
  ], tfoot, { emptyParent: true });
}
