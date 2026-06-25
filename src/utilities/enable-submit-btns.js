/**
 * Re-enables all submit and non-disabled button elements within the given context.
 * @param {Document | Element} [context=document]
 * @returns {void}
 */
export function enableSubmitBtns(context = document) {
  context.querySelectorAll('[type=submit], [type=button]:not([data-disabled])').forEach(btn => {
    const button = /** @type {HTMLButtonElement | HTMLInputElement} */ (btn);
    button.disabled = false;
  });
}
