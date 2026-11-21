
import { setContent } from './content-utils.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */

/**
 * Aggiorna il testo informativo (`elements.resultInfo`) a partire dallo stato corrente.
 *
 * Risoluzione del contenuto:
 * - funzione `params.infoText` → `infoText(start, end, totRec, filteredRec, page, totPages)`
 * - nessuna riga → `labels.noResults` (ricerca attiva) oppure `labels.noRows`
 * - altrimenti il template in stile mustache `params.infoText` (stringa) o `labels.info` (seguito da
 *   `labels.infoPages` quando c'è più di una pagina), con i segnaposto `{start}`, `{end}`, `{totRec}`,
 *   `{filteredRec}`, `{page}`, `{totPages}` sostituiti dai numeri formattati secondo il locale
 *
 * `start`/`end` sono gli indici (da 1) della prima/ultima riga della pagina corrente all'interno
 * dell'insieme filtrato (0 quando non ci sono righe).
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 *
 * @example
 * updateInfo(jt);
 * // `labels.info` di default, pagina 2 con 25 righe per pagina, 60 righe → "Righe 26–50 di 60 (pag. 2 di 3)"
 * // con una sola pagina `labels.infoPages` non viene accodato → "Righe 1–20 di 20"
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
    const tpl = params.infoText ?? (params.labels.info ?? '') + (state.totPages > 1 ? params.labels.infoPages ?? '' : '');
    content = String(tpl).replace(
      /\{(start|end|totRec|filteredRec|page|totPages)\}/g,
      (_, key) => values[key].toLocaleString(params.locale)
    );
  }

  setContent(target, content);
}
