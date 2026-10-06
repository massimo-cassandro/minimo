/*! minimo - Enable Submit Buttons */
/**
 * Riabilita tutti i pulsanti submit e i pulsanti non disabilitati all'interno del contesto indicato.
 * @param {Document | Element} [context=document] (default: document)
 * @returns {void}
 */
export function enableSubmitBtns(context = document) {
  context.querySelectorAll('[type=submit], [type=button]:not([data-disabled])').forEach(btn => {
    const button = /** @type {HTMLButtonElement | HTMLInputElement} */ (btn);
    button.disabled = false;
  });
}
