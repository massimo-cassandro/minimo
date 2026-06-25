// TODO trigger ac selection

/**
 * Resets both the autocomplete and hidden fields when the current value does not match
 * the last confirmed selection.
 * @param {HTMLInputElement | null | undefined} autocomplete_field
 * @param {HTMLInputElement | null | undefined} hidden_field
 * @returns {void}
 */
export function checkAutocomplete(autocomplete_field, hidden_field) {
  if(autocomplete_field && hidden_field) {
    if(autocomplete_field.value === '' || autocomplete_field.value.toLowerCase() !== (autocomplete_field.dataset.sel ?? '').toLowerCase()) {
      autocomplete_field.value = '';
      hidden_field.value = '';
    }
  }
}
