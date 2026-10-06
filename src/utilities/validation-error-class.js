/*! minimo - Validation Error */
/*
utilizzo:
throw new ValidationError('Duplicate values found');
throw new ValidationError('Duplicate values found', errorFields);
throw new ValidationError('Duplicate values found', errorFields, 'Each value can be used only once');
*/

/*
esempio:

const form = document.getElementById('form-__xxxx___');
form.addEventListener('submit', e => {

  // TODO disableBtnOnSubmit ??

  form.querySelectorAll('.is-invalid').forEach(item => {
    item.classList.remove('is-invalid');
    item.setCustomValidity('');
  });
  form.classList.add('was-validated');
  try {
    if( ... ) {
      throw new ValidationError('__message__', [errorFields, ...] ); // errorFields è opzionale
    }
  } catch( error ) {
    e.preventDefault();
    enableSubmitBtns();

    if (error instanceof ValidationError) {

      (error.fields??[]).forEach(field => {
        field.classList.add('is-invalid');
        field.setCustomValidity(error.message);

        // rimuove il setCustomValidity alla modifica del campo
        field.addEventListener('input', () => {
          field.setCustomValidity('');
          field.classList.remove('is-invalid');

          // rimuove la classe che attiva la visualizzazione
          form.classList.remove('was-validated');
        }, {once: true});
      });

      error.fields?.[0]?.focus({preventScroll:false});
    }
    mAlert({
      type  : 'error',
      title : error.message
    });
  }
});
*/

/**
 * Classe di errore personalizzata per i fallimenti di validazione dei form.
 * Estende l'Error nativo con un array opzionale di campi del form non validi
 * e una descrizione estesa opzionale.
 *
 * @example
 * throw new ValidationError('Duplicate values found', [field1, field2], 'Each value can be used only once');
 *
 * // parametri con i valori di default
 * throw new ValidationError(
 *   'Duplicate values found', // message (obbligatorio)
 *   null,                     // fields (default: null)
 *   null                      // description (default: null)
 * );
 */
export class ValidationError extends Error {
  /**
   * @param {string} message - Messaggio di errore.
   * @param {Element[]|null} [fields] - Array di elementi dei campi del form non validi (default: null)
   * @param {string|null} [description] - Descrizione estesa dell'errore (default: null)
   */
  constructor(message, fields = null, description = null) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.description = description;
  }
}
