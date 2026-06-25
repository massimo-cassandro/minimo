/**
 * Adds click listeners to all `[data-dismiss]` elements to remove their closest ancestor
 * that matches the class specified in the `data-dismiss` attribute.
 * Typically used to remove alert boxes.
 * @returns {void}
 */
export function dismissAlerts(){
  document.querySelectorAll('[data-dismiss]').forEach(item => {
    const el = /** @type {HTMLElement} */ (item);
    el.addEventListener('click', () => {
      el.closest('.' + el.dataset.dismiss)?.remove();
    }, false);
  });
}
