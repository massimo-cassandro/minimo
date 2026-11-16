import * as styles from './layout-tools.module.css';
import { bs5 } from './src/bs5.js';
import { minimo } from './src/minimo.js';

// TODO aggiungere popup info viewport (in parte già presente)
// TODO aggiungere info schermo, vedi https://huddlekit.com/tools/viewport-size e simili
// TODO tra le varie opzioni aggiuntice, permettere di impostare un dimensione di schermo da input

// script specifici per ogni framework
const frameworks = { bs5, minimo };

// permette di rimuovere i listener dell'istanza precedente in caso di chiamate multiple
let abortController = null;

/**
 * Aggiunge alla pagina un indicatore del breakpoint corrente (solo per sviluppo).
 *
 * Con il framework `minimo` l'indicatore mostra il nome abbreviato del breakpoint
 * e la larghezza del viewport (es. `XL / 1234`), aggiornati al resize;
 * l'hover sulla larghezza mostra il valore in rem.
 *
 * @param {object} [options] - Opzioni di configurazione
 * @param {string} [options.framework] - Framework di riferimento per i breakpoint: `minimo` o `bs5` (default: "minimo")
 * @param {object|null} [options.customMedia] - Solo per `minimo`: modulo `custom-media.js` del progetto (di norma `app/css/custom-media.js`, importato con `import('@css/custom-media.js')`), da cui vengono letti `breakpoints` e `mediaLabels`; se assente, o per le proprietà mancanti, vengono usati quelli di `src/custom-media.js` di minimo (default: null)
 * @param {number} [options.remBase] - Solo per `minimo`: dimensione in px di 1rem, per il tooltip con la larghezza del viewport in rem (default: 16)
 * @param {Function|null} [options.clickCallback] - Funzione aggiuntiva invocata al clic sull'indicatore, prima della rimozione dell'indicatore stesso e della toolbar Symfony (che avviene comunque); riceve un oggetto `{event, element}` (default: null)
 * @returns {HTMLDivElement} L'elemento aggiunto alla pagina
 *
 * @example
 * // breakpoint di minimo (src/custom-media.js)
 * layoutTools();
 *
 * @example
 * // con le custom media del progetto (app/css/custom-media.js)
 * Promise.all([
 *   import('@massimo-cassandro/minimo/layout-tools'),
 *   import('@css/custom-media.js'),
 * ]).then(([{ layoutTools }, customMedia]) => layoutTools({ customMedia }));
 *
 * @example
 * // callback personalizzato al clic
 * layoutTools({
 *   clickCallback: ({ event, element }) => {
 *     console.log(element.textContent);
 *   }
 * });
 */
export function layoutTools({ framework = 'minimo', clickCallback = null, ...options } = {}) {

  framework = framework.toLowerCase();

  if (!frameworks[framework]) {
    throw new Error(`[layoutTools]: framework "${framework}" non supportato (valori ammessi: ${Object.keys(frameworks).join(', ')})`);
  }

  // evita duplicati in caso di chiamate multiple
  document.getElementById('minimo-layout-tools')?.remove();
  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;

  const div = document.createElement('div');
  div.className = styles.layoutTools;
  div.id = 'minimo-layout-tools';
  div.dataset.framework = framework;

  frameworks[framework](div, { ...options, signal });

  document.body.appendChild(div);

  // soluzione temporanea, al clic si deve aprire un menu con le info viewport (e altro...?) e con il pulsante di rimozione
  // NB: rimuove anche la toolbar symfony se presente
  div.addEventListener('click', event => {
    if (typeof clickCallback === 'function') {
      clickCallback({ event, element: div });
    }

    abortController?.abort();
    div.remove();
    document.querySelector('.sf-toolbar')?.remove();
  }, { signal });

  return div;
}
