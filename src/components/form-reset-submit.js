// import './form.css'; // included in the main CSS entry point
import { enableSubmitBtns } from '../../index.js';

/**
 * Wires up submit validation and button-disabling behaviour on all forms.
 * - Adds `was-validated` class on submit (unless `data-no-was-validated` is present).
 * - Clears `.is-invalid` / `.is-valid` classes before each submission attempt.
 * - Disables submit buttons on valid submission (unless `data-no-disabling` is present).
 * @returns {void}
 */
export function formResetSubmit(){

  document.querySelectorAll('form').forEach( form => {

    // form.querySelectorAll('[type="submit"]').forEach(btn =>{
    //   btn.addEventListener('click', () => {
    //     form.classList.add('was-validated');
    //   }, false);
    // });

    form.addEventListener('submit', e => {

      if(!form.hasAttribute('data-no-was-validated')) {
        form.classList.add('was-validated');
      }

      form.querySelectorAll('.is-invalid, .is-valid').forEach(item => {
        item.classList.remove('is-invalid', 'is-valid');
      });

      if(!form.checkValidity()) {
        e.preventDefault();
        enableSubmitBtns();

      } else {
        // 'data-disable-submit' kept for backwards compatibility
        if(!form.hasAttribute('data-no-disabling') && !form.hasAttribute('data-disable-submit')) {
          form.querySelectorAll('[type="submit"]').forEach(btn => {
            const button = /** @type {HTMLButtonElement} */ (btn);
            button.disabled = true;
          });
        }
      }
    }, false);
  });
}
