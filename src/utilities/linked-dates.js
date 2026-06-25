// @ts-check

/**
 * Links date/datetime-local input fields so that one field constrains
 * the min/max of another.
 *
 * The `data-max` attribute on a date field must contain the `id` of the field
 * whose value sets the `max` constraint of the current field (start date).
 * The `data-min` attribute on a date field must contain the `id` of the field
 * whose value sets the `min` constraint of the current field (end date).
 *
 * If the linked field is disabled, the constraint is removed on focus
 * and restored when the linked field is re-enabled.
 *
 * @param {Document|Element} context - root element to search within (defaults to `document`)
 * @returns {void}
 */
export function linkedDates(context = document) {

  // start date fields: constrained by a max value from a linked field
  context.querySelectorAll('input[type="date"][data-max], input[type="datetime-local"][data-max]').forEach(el => {
    const maxId = /** @type {HTMLInputElement} */ (el).dataset.max;
    let linked_field = maxId ? document.getElementById(maxId) : null;

    if(linked_field) {
      el.setAttribute('max', /** @type {HTMLInputElement} */ (linked_field).value);

      linked_field.addEventListener('change', () => {
        el.setAttribute('max', /** @type {HTMLInputElement} */ (linked_field).value);
      });

      // remove max if the linked field is disabled; restore it when re-focused enabled
      el.addEventListener('focus', () => {
        if(/** @type {HTMLInputElement} */ (linked_field).disabled) {
          el.removeAttribute('max');
        } else {
          el.setAttribute('max', /** @type {HTMLInputElement} */ (linked_field).value);
        }
      }, false);
    }
  });

  // end date fields: constrained by a min value from a linked field
  context.querySelectorAll('input[type="date"][data-min], input[type="datetime-local"][data-min]').forEach(el => {
    const minId = /** @type {HTMLInputElement} */ (el).dataset.min;
    let linked_field = minId ? document.getElementById(minId) : null;

    if(linked_field) {
      linked_field.addEventListener('change', () => {
        el.setAttribute('min', /** @type {HTMLInputElement} */ (linked_field).value);
      });

      // remove min if the linked field is disabled; restore it when re-focused enabled
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
