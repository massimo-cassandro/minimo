/**
 * Disables all `[type=submit]` and `[type=button]` buttons on form submit.
 *
 * Applies to all `<form>` elements in the document except those with
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
