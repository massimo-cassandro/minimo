/*! minimo - json-table: table part */

import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';
import { theadPart } from './table-thead.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/**
 * domBuilder item of the table (template slot `table`).
 *
 * Generated structure:
 * ```
 * div.tableWrapper[classes.tableWrapper]
 *   table#tableId.table[classes.table]
 *     caption                   (if `caption`)
 *     thead                     ← theadPart()
 *     tbody                     ← filled by `renderTbody()`
 *     tfoot                     (if `tfoot`) ← filled by `renderTfoot()`
 * ```
 *
 * References to the generated elements are stored in `elements`
 * (`tableWrapper`, `table`, `thead`, `tbody`, `tfoot`).
 *
 * @param {JsonTable} jt - The component instance (`params`, `cols`)
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([tablePart(jt, elements)], host);
 * elements.tbody; // → HTMLTableSectionElement (empty until renderTbody() is called)
 */
export function tablePart(jt, elements) {

  const { params } = jt;

  return {
    className: classnames(styles.tableWrapper, params.classes.tableWrapper),
    callback: el => { elements.tableWrapper = /** @type {HTMLElement} */ (el); },
    children: [
      {
        tag: 'table',
        id: params.tableId,
        className: classnames(styles.table, params.classes.table),
        callback: el => { elements.table = /** @type {HTMLTableElement} */ (el); },
        children: [
          {
            tag: 'caption',
            condition: params.caption != null,
            content: params.caption
          },
          theadPart(jt, elements),
          {
            tag: 'tbody',
            callback: el => { elements.tbody = /** @type {HTMLTableSectionElement} */ (el); }
          },
          {
            tag: 'tfoot',
            condition: params.tfoot,
            callback: el => { elements.tfoot = /** @type {HTMLTableSectionElement} */ (el); }
          }
        ]
      }
    ]
  };
}
