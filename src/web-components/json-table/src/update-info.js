/*! minimo - json-table: info text update */

import { setContent } from './content-utils.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */

/**
 * Updates the info text (`elements.resultInfo`) from the current state.
 *
 * Content resolution:
 * - `params.infoText` function → `infoText(start, end, totRec, filteredRec, page, totPages)`
 * - no rows → `labels.noResults` (search active) or `labels.noRows`
 * - otherwise the mustache-like template `params.infoText` (string) or `labels.info`, with the
 *   placeholders `{start}`, `{end}`, `{totRec}`, `{filteredRec}`, `{page}`, `{totPages}` replaced
 *   by the locale-formatted numbers
 *
 * `start`/`end` are the 1-based indexes of the first/last row of the current page within the
 * filtered set (0 when there are no rows).
 *
 * @param {JsonTable} jt - The component instance
 * @returns {void}
 *
 * @example
 * updateInfo(jt);
 * // default `labels.info`, page 2 of 25 rows per page, 60 rows → "Stai visualizzando le righe da 26 a 50, su un totale di 60 record trovati"
 */
export function updateInfo(jt) {

  const { params, elements, state } = jt;
  const target = elements.resultInfo;

  if (!target) {
    return;
  }

  const shown = state.pageRows.length;
  const perPage = params.perPage > 0 ? params.perPage : shown;
  const start = shown ? (state.page - 1) * perPage + 1 : 0;

  /** @type {Record<string, number>} */
  const values = {
    start,
    end: shown ? start + shown - 1 : 0,
    totRec: state.totRec,
    filteredRec: state.filteredRec,
    page: state.page,
    totPages: state.totPages
  };

  let content;

  if (typeof params.infoText === 'function') {
    content = params.infoText(values.start, values.end, values.totRec, values.filteredRec, values.page, values.totPages);

  } else if (values.filteredRec === 0) {
    content = state.searchTerm ? params.labels.noResults : params.labels.noRows;

  } else {
    const tpl = params.infoText ?? params.labels.info ?? '';
    content = String(tpl).replace(
      /\{(start|end|totRec|filteredRec|page|totPages)\}/g,
      (_, key) => values[key].toLocaleString(params.locale)
    );
  }

  setContent(target, content);
}
