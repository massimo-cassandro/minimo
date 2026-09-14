/*! minimo - json-table: info text update */

import { setContent } from './content-utils.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */

/**
 * Updates the info text (`elements.resultInfo`) from the current state.
 *
 * Content resolution:
 * - `params.infoText` function → `infoText(start, end, totRec, filteredRec)`
 * - no rows → `labels.noResults` (search active) or `labels.noRows`
 * - otherwise the mustache-like template `params.infoText` (string) or `labels.info`, with the
 *   placeholders `{start}`, `{end}`, `{totRec}`, `{filteredRec}` replaced by the locale-formatted numbers
 *
 * TODO paginazione (step 4): `start`/`end` dovranno riflettere la pagina corrente
 *
 * @param {JsonTable} jt - The component instance
 * @returns {void}
 *
 * @example
 * updateInfo(jt);
 * // with the default `labels.info` and 25 rows → "Stai visualizzando le righe da 1 a 25, su un totale di 25 record trovati"
 */
export function updateInfo(jt) {

  const { params, elements, state } = jt;
  const target = elements.resultInfo;

  if (!target) {
    return;
  }

  const shown = state.pageRows.length;
  const values = {
    start: shown ? 1 : 0,
    end: shown,
    totRec: state.totRec,
    filteredRec: state.filtered.length
  };

  let content;

  if (typeof params.infoText === 'function') {
    content = params.infoText(values.start, values.end, values.totRec, values.filteredRec);

  } else if (values.filteredRec === 0) {
    content = state.searchTerm ? params.labels.noResults : params.labels.noRows;

  } else {
    const tpl = params.infoText ?? params.labels.info ?? '';
    content = String(tpl).replace(
      /\{(start|end|totRec|filteredRec)\}/g,
      (_, key) => values[/** @type {keyof values} */ (key)].toLocaleString(params.locale)
    );
  }

  setContent(target, content);
}
