/*! minimo - json-table: tbody rendering */

import * as styles from '../json-table-component.module.css';
import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../../utilities/classnames.js';
import { setContent, getNestedValue } from './content-utils.js';
import { cellContent } from './cell-content.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */

/**
 * domBuilder item of a body row.
 *
 * Cells are created empty by domBuilder (tag, classes, attributes) and filled in the `<tr>`
 * callback, so that the column `render` functions receive both the `tr` and the `td` elements.
 * `trCallback` is invoked last.
 *
 * Generated structure:
 * ```
 * tr[data-jt-idx]
 *   td[data-key][cellClass][internalCellClass]           ← cellContent()
 *   th[scope=row][data-key]…                             ← when col.rowHeading is true
 * ```
 *
 * @param {ParsedRow} parsed - Parsed row (see `parse-rows.js`)
 * @param {JsonTable} jt - The component instance (`params`, `cols`)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([rowItem(parsedRow, jt)], tbody);
 */
export function rowItem(parsed, jt) {

  const { params, cols } = jt;
  const row = parsed.row;

  return {
    tag: 'tr',
    attrs: { 'data-jt-idx': parsed.idx },
    children: cols.map(col => ({
      tag: col.rowHeading ? 'th' : 'td',
      className: classnames(
        col.cellClass,
        typeof col._type.internalCellClass === 'function'
          ? col._type.internalCellClass(getNestedValue(row, col.key), row, params)
          : null
      ),
      attrs: {
        scope: col.rowHeading ? 'row' : null,
        'data-key': col.key
      }
    })),
    callback: el => {
      const tr = /** @type {HTMLTableRowElement} */ (el);
      const cells = tr.cells;

      cols.forEach((col, i) => {
        const td = cells[i];
        setContent(td, cellContent(col, row, params, tr, td));
      });

      if (typeof params.trCallback === 'function') {
        params.trCallback(tr, row, params);
      }
    }
  };
}


/**
 * Renders the rows of the current page (`state.pageRows`) inside `elements.tbody`, replacing
 * the previous content. When there are no rows, a single cell spanning every column shows
 * `labels.noResults` (search active) or `labels.noRows`.
 *
 * @param {JsonTable} jt - The component instance
 * @returns {void}
 *
 * @example
 * renderTbody(jt); // after `jt.state` has been updated
 */
export function renderTbody(jt) {

  const { params, elements, state, cols } = jt;
  const tbody = elements.tbody;

  if (!tbody) {
    return;
  }

  if (!state.pageRows.length) {
    domBuilder([
      {
        tag: 'tr',
        children: [
          {
            tag: 'td',
            className: classnames(styles.empty, params.classes.empty),
            attrs: { colspan: Math.max(cols.length, 1) },
            content: state.searchTerm ? params.labels.noResults : params.labels.noRows
          }
        ]
      }
    ], tbody, { emptyParent: true });
    return;
  }

  domBuilder(state.pageRows.map(parsed => rowItem(parsed, jt)), tbody, { emptyParent: true });
}
