/*! minimo - Disable Buttons On Submit */
/**
 * Disabilita tutti i pulsanti `[type=submit]` e `[type=button]` al submit del form.
 *
 * Si applica a tutti gli elementi `<form>` del documento, tranne quelli con
 * `data-disable-submit="false"`.
 *
 * @returns {void}
 */
export function disableBtnsOnSubmit() {
  document.querySelectorAll('form:not([data-disable-submit=false])').forEach( el => {
    el.addEventListener('submit', () => {
      /** @type {NodeListOf<HTMLButtonElement|HTMLInputElement>} */
      const btns = el.querySelectorAll('[type=submit], [type=button]');
      btns.forEach(btn => {
        btn.disabled = true;
      });
    });
  });
}
