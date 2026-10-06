// @ts-check
/*! minimo - Linked Dates */

/**
 * Collega i campi input date/datetime-local in modo che un campo vincoli
 * il min/max di un altro.
 *
 * L'attributo `data-max` di un campo data deve contenere l'`id` del campo
 * il cui valore imposta il vincolo `max` del campo corrente (data di inizio).
 * L'attributo `data-min` di un campo data deve contenere l'`id` del campo
 * il cui valore imposta il vincolo `min` del campo corrente (data di fine).
 *
 * Se il campo collegato è disabilitato, il vincolo viene rimosso al focus
 * e ripristinato quando il campo collegato viene riabilitato.
 *
 * @param {Document|Element} context - elemento radice in cui cercare (default: document)
 * @returns {void}
 */
export function linkedDates(context = document) {

  // campi data di inizio: vincolati da un valore max proveniente da un campo collegato
  context.querySelectorAll('input[type="date"][data-max], input[type="datetime-local"][data-max]').forEach(el => {
    const maxId = /** @type {HTMLInputElement} */ (el).dataset.max;
    let linked_field = maxId ? document.getElementById(maxId) : null;

    if(linked_field) {
      el.setAttribute('max', /** @type {HTMLInputElement} */ (linked_field).value);

      linked_field.addEventListener('change', () => {
        el.setAttribute('max', /** @type {HTMLInputElement} */ (linked_field).value);
      });

      // rimuove max se il campo collegato è disabilitato; lo ripristina quando riceve di nuovo il focus da abilitato
      el.addEventListener('focus', () => {
        if(/** @type {HTMLInputElement} */ (linked_field).disabled) {
          el.removeAttribute('max');
        } else {
          el.setAttribute('max', /** @type {HTMLInputElement} */ (linked_field).value);
        }
      }, false);
    }
  });

  // campi data di fine: vincolati da un valore min proveniente da un campo collegato
  context.querySelectorAll('input[type="date"][data-min], input[type="datetime-local"][data-min]').forEach(el => {
    const minId = /** @type {HTMLInputElement} */ (el).dataset.min;
    let linked_field = minId ? document.getElementById(minId) : null;

    if(linked_field) {
      linked_field.addEventListener('change', () => {
        el.setAttribute('min', /** @type {HTMLInputElement} */ (linked_field).value);
      });

      // rimuove min se il campo collegato è disabilitato; lo ripristina quando riceve di nuovo il focus da abilitato
      el.addEventListener('focus', () => {
        if(/** @type {HTMLInputElement} */ (linked_field).disabled) {
          el.removeAttribute('min');
        } else {
          el.setAttribute('min', /** @type {HTMLInputElement} */ (linked_field).value);
        }
      }, false);
    }
  });

}
