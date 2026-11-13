// TODO attivare la selezione dell'autocomplete

/**
 * Azzera sia il campo autocomplete sia il campo hidden quando il valore corrente non corrisponde
 * all'ultima selezione confermata.
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
