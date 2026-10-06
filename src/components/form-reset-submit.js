/*! minimo - Form Reset Submit */
// import './form.css'; // incluso nell'entry point CSS principale
import { enableSubmitBtns } from '../utilities/enable-submit-btns.js';

/**
 * Collega la validazione al submit e il comportamento di disabilitazione dei pulsanti a tutti i form.
 * - Aggiunge la classe `was-validated` al submit (a meno che sia presente `data-no-was-validated`).
 * - Rimuove le classi `.is-invalid` / `.is-valid` prima di ogni tentativo di invio.
 * - Disabilita i pulsanti submit a invio valido (a meno che sia presente `data-no-disabling`).
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
        // 'data-disable-submit' mantenuto per retrocompatibilità
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
