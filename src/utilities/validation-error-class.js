
// uso
// throw new ValidationError('Sono presenti cicli duplicati', campiErrore );

/*
esempio:

const form = document.getElementById('form-__xxxx___');
form.addEventListener('submit', e => {
  form.querySelectorAll('.is-invalid').forEach(item => {
    item.classList.remove('is-invalid');
  });
  form.classList.add('was-validated');
  try {
    if( ... ) {
      throw new ValidationError('__messaggio__', [campiErrore, ...] );
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

export class ValidationError extends Error {
  constructor(message, fields) {
    super(message); // Passa il messaggio alla classe Error originale
    this.name = 'ValidationError';
    this.fields = fields; // Parametro custom
  }
}
