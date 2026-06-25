// usage:
// throw new ValidationError('Duplicate values found', errorFields);

/*
example:

const form = document.getElementById('form-__xxxx___');
form.addEventListener('submit', e => {
  form.querySelectorAll('.is-invalid').forEach(item => {
    item.classList.remove('is-invalid');
  });
  form.classList.add('was-validated');
  try {
    if( ... ) {
      throw new ValidationError('__message__', [errorFields, ...] );
    }
  } catch( error ) {
    e.preventDefault();
    form.querySelector('[type="submit"]').disabled = false;

    if (error instanceof ValidationError) {

      (error.fields??[]).forEach(field => {
        field.classList.add('is-invalid');
      });

      error.fields[0]?.focus({preventScroll:false});
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
 * Extends the native Error with an array of invalid form fields.
 */
export class ValidationError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {Element[]} fields - Array of invalid form field elements.
   */
  constructor(message, fields) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}
