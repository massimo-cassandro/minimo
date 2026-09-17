/*! minimo - Validation Error */
/*
usage:
throw new ValidationError('Duplicate values found');
throw new ValidationError('Duplicate values found', errorFields);
throw new ValidationError('Duplicate values found', errorFields, 'Each value can be used only once');
*/

/*
example:

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
      throw new ValidationError('__message__', [errorFields, ...] ); // errorFields is optional
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

          // rimuove la classe che attiva la visualizzaione
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
 * Custom error class for form validation failures.
 * Extends the native Error with an optional array of invalid form fields
 * and an optional extended description.
 *
 * @example
 * throw new ValidationError('Duplicate values found', [field1, field2], 'Each value can be used only once');
 *
 * // parameters with default values
 * throw new ValidationError(
 *   'Duplicate values found', // message (required)
 *   null,                     // fields (default: null)
 *   null                      // description (default: null)
 * );
 */
export class ValidationError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {Element[]|null} [fields] - Array of invalid form field elements (default: null)
   * @param {string|null} [description] - Extended description of the error (default: null)
   */
  constructor(message, fields = null, description = null) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.description = description;
  }
}
