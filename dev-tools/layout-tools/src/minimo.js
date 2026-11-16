import { breakpoints as minimoBreakpoints, mediaLabels } from '../../../src/custom-media.js';

/**
 * Indicatore del breakpoint per minimo: mostra il nome abbreviato del breakpoint
 * e la larghezza del viewport (es. `XL / 1234`), aggiornati al resize.
 * L'hover sulla larghezza mostra un tooltip con il valore in rem.
 *
 * @param {HTMLDivElement} div - Elemento contenitore dell'indicatore
 * @param {object} [options] - Opzioni di configurazione
 * @param {{breakpoints?: Object<string, string>, mediaLabels?: Object<string, string>}|null} [options.customMedia] - Modulo `custom-media.js` del progetto (o oggetto con la stessa struttura): `breakpoints` in ordine decrescente nella forma `{nome: valore}`, `mediaLabels` nella forma `{nome: etichetta}`, con la chiave `xsmall` per il viewport inferiore al breakpoint più piccolo; le proprietà mancanti sono prese da `src/custom-media.js` di minimo, in assenza di etichetta viene mostrato il nome del breakpoint (default: null)
 * @param {number} [options.remBase] - Dimensione in px di 1rem, per la conversione della larghezza del viewport (default: 16)
 * @param {AbortSignal} [options.signal] - Segnale per la rimozione del listener di resize
 */
export function minimo(div, {
  customMedia = null,
  remBase = 16,
  signal,
} = {}) {

  const breakpoints = customMedia?.breakpoints ?? minimoBreakpoints,
    labels = customMedia?.mediaLabels ?? mediaLabels;

  // media query in ordine decrescente: vince la prima che corrisponde
  const mqls = Object.entries(breakpoints).map(([name, value]) => ({
    label: labels[name] ?? name,
    mql: matchMedia(`(width >= ${value})`),
  }));

  const labelEl = document.createElement('span'),
    widthEl = document.createElement('span');

  div.append(labelEl, ' / ', widthEl);

  // `innerWidth` include la scrollbar, come le media query
  const update = () => {
    const width = window.innerWidth;
    labelEl.textContent = mqls.find(item => item.mql.matches)?.label ?? labels.xsmall ?? 'xsmall';
    widthEl.textContent = width;
    // TODO sostituire il tooltip nativo (`title`, compare con ritardo) con un tooltip CSS immediato, con stile coerente con l'indicatore
    widthEl.title = `${+(width / remBase).toFixed(3)}rem`;
  };

  let rafId = null;
  window.addEventListener('resize', () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    }
  }, { signal, passive: true });

  update();
}
