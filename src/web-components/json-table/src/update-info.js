/*! minimo - json-table: info text update */

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Updates the info text (`elements.resultInfo`) using `params.infoText(shown, total)`.
 *
 * The returned value can be a Node (appended as-is), a plain string (set as `textContent`)
 * or an HTML string (sanitized via `Element.setHTML` where supported, `innerHTML` otherwise,
 * consistently with domBuilder).
 *
 * @param {JsonTableElements} elements - Generated elements (see `main-builder.js`)
 * @param {JsonTableParams} params - Resolved params
 * @param {number} shown - Number of rows currently displayed
 * @param {number} total - Total number of rows in the data set
 * @returns {void}
 *
 * @example
 * updateInfo(elements, params, 25, 100);
 * // with the default `infoText` → "Visualizzate <strong>25</strong> righe su <strong>100</strong>"
 */
export function updateInfo(elements, params, shown, total) {

  const target = elements.resultInfo;
  if (!target) {
    return;
  }

  const content = params.infoText(shown, total);

  if (content instanceof Node) {
    target.replaceChildren(content);
    return;
  }

  const text = String(content ?? '');

  if (!text.includes('<')) {
    target.textContent = text;

  } else if (typeof target.setHTML === 'function') {
    target.setHTML(text);

  } else {
    target.innerHTML = text;
  }
}
