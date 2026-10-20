import * as styles from './layout-tools.module.css';

// TODO aggiungere popup info viewport

/**
 * Aggiunge alla pagina un indicatore del breakpoint corrente (solo per sviluppo)
 *
 * @param {object} [options] - Opzioni di configurazione
 * @param {string} [options.framework] - Framework di riferimento per i breakpoint (default: "minimo")
 * @returns {HTMLDivElement} L'elemento aggiunto alla pagina
 *
 * @example
 * layoutTools({
 *   framework: 'minimo'
 * });
 */
export function layoutTools({ framework = 'minimo' } = {}) {

  // evita duplicati in caso di chiamate multiple
  document.getElementById('minimo-layout-tools')?.remove();

  framework = framework.toLowerCase();

  const div = document.createElement('div');
  div.className = styles.layoutTools;
  div.id = 'minimo-layout-tools';
  div.dataset.framework = framework;

  if(framework === 'bs5') {
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

  document.body.appendChild(div);

  // soluzione temporanea, al clic si deve aprire un menu con le info e con il pulsante di rimozione
  div.addEventListener('click', () => {
    div.remove();
  });

  return div;
}
