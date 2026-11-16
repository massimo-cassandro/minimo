/**
 * Indicatore del breakpoint per Bootstrap 5: aggiunge uno span per ogni
 * breakpoint, visibile solo nel relativo intervallo tramite le classi `d-*`.
 *
 * @param {HTMLDivElement} div - Elemento contenitore dell'indicatore
 */
export function bs5(div) {
  [
    ['d-sm-none',                     'xs'], // class, text
    ['d-none d-sm-inline d-md-none',  'sm'],
    ['d-none d-md-inline d-lg-none',  'md'],
    ['d-none d-lg-inline d-xl-none',  'lg'],
    ['d-none d-xl-inline d-xxl-none', 'xl'],
    ['d-none d-xxl-inline',           'xxl'],
  ].forEach(brk => {
    const span = document.createElement('span');
    span.className = brk[0];
    span.textContent = brk[1];
    div.appendChild(span);
  });
}
