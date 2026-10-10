
import * as styles from '../json-table-component.module.css';
import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../../utilities/classnames.js';
import { setContent, getNestedValue } from './content-utils.js';
import { cellContent } from './cell-content.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */

/**
 * Elemento domBuilder di una riga del body.
 *
 * Le celle vengono create vuote da domBuilder (tag, classi, attributi) e riempite nella
 * callback del `<tr>`, così che le funzioni `render` delle colonne ricevano sia l'elemento `tr` sia `td`.
 * `trCallback` viene invocata per ultima.
 *
 * Struttura generata:
 * ```
 * tr[data-jt-idx]
 *   td[data-key][cellClass][internalCellClass]           ← cellContent()
 *   th[scope=row][data-key]…                             ← quando col.rowHeading è true
 * ```
 *
 * @param {ParsedRow} parsed - Riga analizzata (vedi `parse-rows.js`)
 * @param {JsonTable} jt - L'istanza del componente (`params`, `cols`)
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
 * Renderizza le righe della pagina corrente (`state.pageRows`) dentro `elements.tbody`, sostituendo
 * il contenuto precedente. Quando non ci sono righe, una singola cella che si estende su tutte le colonne mostra
 * `labels.noResults` (ricerca attiva) oppure `labels.noRows`.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 *
 * @example
 * renderTbody(jt); // dopo l'aggiornamento di `jt.state`
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
