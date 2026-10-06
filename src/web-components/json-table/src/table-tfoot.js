/*! minimo - json-table: tfoot rendering */

import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../../utilities/classnames.js';
import { setContent } from './content-utils.js';
import { tfootContent } from './cell-content.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */

/**
 * Renderizza la riga del footer dentro `elements.tfoot` (presente solo quando `params.tfoot` è true),
 * sostituendo il contenuto precedente. Ogni colonna produce una cella il cui contenuto proviene da
 * `tfootContent()` (`tfootRender` della colonna); il footer viene svuotato quando non ci sono righe.
 *
 * Le righe passate a `tfootRender` sono l'intero insieme filtrato, oppure solo la pagina corrente quando
 * `updateFooterOnPageChange` è true.
 *
 * Struttura generata: `tr > td[data-key][cellClass]…`
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 *
 * @example
 * renderTfoot(jt); // dopo l'aggiornamento di `jt.state`
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
        className: classnames(col.cellClass),
        attrs: { 'data-key': col.key },
        callback: el => {
          const td = /** @type {HTMLTableCellElement} */ (el);
          setContent(td, tfootContent(col, rows, params, td));
        }
      }))
    }
  ], tfoot, { emptyParent: true });
}
