/*! minimo - Dismiss Alerts */
/**
 * Aggiunge listener click a tutti gli elementi `[data-dismiss]` per rimuovere il loro antenato
 * più vicino che corrisponde alla classe indicata nell'attributo `data-dismiss`.
 * Tipicamente usato per rimuovere i box di alert.
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
