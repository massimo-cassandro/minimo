
import * as styles from '../json-table-component.module.css';
import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../../utilities/classnames.js';
import { setContent, getCellValue } from './content-utils.js';
import { cellContent } from './cell-content.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */

/**
 * Numero di `<tr>` occupati da un record: il massimo tra i `rowspan` delle colonne. I valori non validi
 * (non numerici o minori di 1) contano come 1.
 *
 * @param {Object} row - Oggetto riga
 * @param {JsonTable['cols']} cols - Colonne analizzate
 * @returns {number}
 *
 * @example
 * recordSpan({ items: ['a', 'b', 'c'] }, [{ rowspan: row => row.items.length }, { rowspan: null }]); // → 3
 */
function recordSpan(row, cols) {
  return Math.max(1, ...cols
    .filter(col => col.rowspan != null)
    .map(col => Math.floor(Number(typeof col.rowspan === 'function' ? col.rowspan(row) : col.rowspan)) || 1)
  );
}


/**
 * Elementi domBuilder dei `<tr>` di un record: uno solo, oppure più di uno quando sono presenti colonne con `rowspan`.
 * In questo caso le celle con `rowspan` compaiono solo nel primo `<tr>`, mentre le altre vengono ripetute in ognuno.
 *
 * Le celle vengono create vuote da domBuilder (tag, classi, attributi) e riempite nella
 * callback del `<tr>`, così che le funzioni `render` delle colonne ricevano sia l'elemento `tr` sia `td`.
 * `trCallback` viene invocata per ultima, una volta per ogni `<tr>`.
 *
 * Struttura generata:
 * ```
 * tr[data-jt-idx]
 *   td[data-key][cellClass][internalCellClass]           ← cellContent()
 *   th[scope=row][data-key]…                             ← quando col.rowHeading è true
 *   td[rowspan][data-key]…                               ← quando col.rowspan è definito (solo nel primo tr)
 * ```
 *
 * @param {ParsedRow} parsed - Riga analizzata (vedi `parse-rows.js`)
 * @param {JsonTable} jt - L'istanza del componente (`params`, `cols`)
 * @returns {DomBuilderItem[]}
 *
 * @example
 * domBuilder(rowItems(parsedRow, jt), tbody);
 */
export function rowItems(parsed, jt) {

  const { params, cols } = jt;
  const row = parsed.row;
  const span = recordSpan(row, cols);

  return Array.from({ length: span }, (_, subIdx) => {

    const trCols = subIdx === 0 ? cols : cols.filter(col => col.rowspan == null);

    return {
      tag: 'tr',
      attrs: { 'data-jt-idx': parsed.idx },
      children: trCols.map(col => ({
        tag: col.rowHeading ? 'th' : 'td',
        className: classnames(
          col.cellClass,
          typeof col._type.internalCellClass === 'function'
            ? col._type.internalCellClass(getCellValue(row, col, subIdx), row, params)
            : null
        ),
        attrs: {
          scope: col.rowHeading ? 'row' : null,
          rowspan: col.rowspan != null ? span : null,
          'data-key': col.key
        }
      })),
      callback: el => {
        const tr = /** @type {HTMLTableRowElement} */ (el);
        const cells = tr.cells;

        trCols.forEach((col, i) => {
          const td = cells[i];
          setContent(td, cellContent(col, row, params, tr, td, subIdx));
        });

        if (typeof params.trCallback === 'function') {
          params.trCallback(tr, row, params, subIdx);
        }
      }
    };
  });
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

  domBuilder(state.pageRows.flatMap(parsed => rowItems(parsed, jt)), tbody, { emptyParent: true });
}
