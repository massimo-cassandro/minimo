/*! minimo - json-table: table part (table, caption and footer bar) */

import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';
import { theadPart } from './table-thead.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/** Counter used to generate unique caption ids */
let captionUid = 0;

/**
 * Id of the caption element of a table (used by `aria-labelledby`): `<tableId>-caption`, or a
 * generated unique id when `tableId` is not set.
 *
 * @param {JsonTableParams} params - Resolved params
 * @returns {string}
 *
 * @example
 * captionId({ ...params, tableId: 'users' }); // → 'users-caption'
 * captionId(params);                          // → 'jt-1-caption'
 */
export function captionId(params) {
  return params.tableId ? `${params.tableId}-caption` : `jt-${++captionUid}-caption`;
}


/**
 * domBuilder item of the caption (template slot `caption`), rendered only when `params.caption`
 * is set. It is a plain container placed below the table (footer bar) instead of a `<caption>`
 * element: the table is linked to it through `aria-labelledby`, which gives the table the same
 * accessible name a `<caption>` would.
 *
 * Generated structure: `div.caption[classes.caption]#<id>`; the element is stored in `elements.caption`.
 *
 * @param {JsonTable} jt - The component instance
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
 * @param {string} id - Id of the element (see `captionId`)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([captionPart(jt, elements, 'users-caption')], host);
 * elements.caption; // → HTMLElement (when params.caption is set)
 */
export function captionPart(jt, elements, id) {

  const { params } = jt;

  return {
    id,
    condition: params.caption != null,
    className: classnames(styles.caption, params.classes.caption),
    content: params.caption,
    callback: el => { elements.caption = /** @type {HTMLElement} */ (el); }
  };
}


/**
 * domBuilder item of the footer bar below the table: caption (start side) and pagination (end
 * side). Rendered only when `children` is not empty (see `mainBuilder`, which removes the parts
 * placed elsewhere by the template).
 *
 * Generated structure: `div.tableFooter[classes.tableFooter] > [caption] [pagination]`; the element
 * is stored in `elements.tableFooter`.
 *
 * @param {JsonTable} jt - The component instance
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
 * @param {DomBuilderItem[]} children - Footer parts (caption and/or pagination items)
 * @returns {DomBuilderItem}
 *
 * @example
 * const footer = tableFooterPart(jt, elements, [captionItem, paginationItem]);
 * domBuilder([tablePart(jt, elements, footer)], host);
 */
export function tableFooterPart(jt, elements, children) {

  const { params } = jt;

  return {
    condition: children.length > 0,
    className: classnames(styles.tableFooter, params.classes.tableFooter),
    children,
    callback: el => { elements.tableFooter = /** @type {HTMLElement} */ (el); }
  };
}


/**
 * domBuilder item of the table (template slot `table`).
 *
 * Generated structure:
 * ```
 * div.tableWrapper[classes.tableWrapper]
 *   table#tableId.table[classes.table][aria-labelledby=<caption id>]   (aria-labelledby if `caption`)
 *     thead                     ← theadPart()
 *     tbody                     ← filled by `renderTbody()`
 *     tfoot                     (if `tfoot`) ← filled by `renderTfoot()`
 * div.tableFooter               ← footerBar (caption + pagination), if given
 * ```
 *
 * References to the generated elements are stored in `elements`
 * (`tableWrapper`, `table`, `thead`, `tbody`, `tfoot`).
 *
 * @param {JsonTable} jt - The component instance (`params`, `cols`)
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
 * @param {DomBuilderItem|null} [footerBar=null] - Footer bar item (see `tableFooterPart`) (default: null)
 * @param {string|null} [captionElId=null] - Id of the caption element, for `aria-labelledby` (default: null)
 * @returns {DomBuilderItem} A `div` wrapping the table wrapper and the footer bar
 *
 * @example
 * domBuilder([tablePart(jt, elements, footerBar, 'users-caption')], host);
 * elements.tbody; // → HTMLTableSectionElement (empty until renderTbody() is called)
 */
export function tablePart(jt, elements, footerBar = null, captionElId = null) {

  const { params } = jt;

  return {
    className: styles.tableOuter,
    children: [
      {
        className: classnames(styles.tableWrapper, params.classes.tableWrapper),
        callback: el => { elements.tableWrapper = /** @type {HTMLElement} */ (el); },
        children: [
          {
            tag: 'table',
            id: params.tableId,
            className: classnames(styles.table, params.classes.table),
            attrs: { 'aria-labelledby': params.caption != null ? captionElId : null },
            callback: el => { elements.table = /** @type {HTMLTableElement} */ (el); },
            children: [
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
      },
      ...(footerBar ? [footerBar] : [])
    ]
  };
}
