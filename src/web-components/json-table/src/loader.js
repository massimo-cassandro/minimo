import '../../../css/spinner-circle-basic.css';
import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';
import { iconContent } from './icons.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Elemento domBuilder dello spinner di caricamento, renderizzato solo quando `params.loader` è true, in due varianti:
 * - overlay (default): collocato nel contenitore della tabella (`div.tableOuter`), che copre per intero (tabella e
 *   barra del footer); inizialmente nascosto (`hidden`), viene mostrato da `showLoader()` durante le richieste server-side
 * - iniziale (`initial` true): segnaposto mostrato nell'elemento host al primo caricamento, prima che la struttura
 *   della tabella venga costruita
 *
 * Lo spinner predefinito è `span.spinner` di minimo (`src/css/spinner-circle-basic.css`, importato da questo modulo),
 * le cui custom properties `--spinner-*` vengono ridefinite sull'overlay a partire dalle `--jt-loader-spinner-*`.
 * Con `params.loaderIcon` lo spinner viene sostituito dall'icona/markup indicato.
 *
 * Struttura generata:
 * ```
 * div.loader.loaderOverlay[classes.loader][hidden]     (iniziale: div.loader.loaderInitial[classes.loader])
 *   span.spinner[classes.loaderSpinner]     (oppure div.loaderIcon[classes.loaderSpinner] > loaderIcon)
 *   span.loaderLabel                        (labels.loading, nascosto visivamente)
 * ```
 * L'overlay viene memorizzato in `elements.loader`.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {JsonTableElements|null} [elements=null] - Oggetto che raccoglie gli elementi generati (modificato) (default: null)
 * @param {boolean} [initial=false] - Segnaposto del primo caricamento invece dell'overlay (default: false)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([loaderPart(jt, elements)], tableOuter);
 * elements.loader; // → HTMLElement (quando params.loader è true)
 *
 * domBuilder([loaderPart(jt, null, true)], jt, { emptyParent: true }); // spinner del primo caricamento
 */
export function loaderPart(jt, elements = null, initial = false) {

  const { params } = jt;

  /** @type {DomBuilderItem} */
  const spinner = params.loaderIcon != null
    ? {
      className: classnames(styles.loaderIcon, params.classes.loaderSpinner),
      attrs: { 'aria-hidden': 'true' },
      content: iconContent(params.loaderIcon, params.iconFile, params.iconClass)
    }
    : {
      tag: 'span',
      className: classnames('spinner', params.classes.loaderSpinner),
      attrs: { 'aria-hidden': 'true' }
    };

  return {
    condition: params.loader,
    className: classnames(styles.loader, initial ? styles.loaderInitial : styles.loaderOverlay, params.classes.loader),
    attrs: { hidden: initial ? null : '' },
    callback: el => {
      if (elements && !initial) {
        elements.loader = /** @type {HTMLElement} */ (el);
      }
    },
    children: [
      spinner,
      { tag: 'span', className: styles.loaderLabel, content: params.labels.loading }
    ]
  };
}


/**
 * Segnala una richiesta in corso: imposta `aria-busy` sul wrapper e, con `overlay` true, mostra l'overlay di caricamento
 * (vedi `loaderPart`) dopo `params.loaderDelay` ms.
 *
 * Lo spinner viene centrato sull'altezza del click che ha generato la richiesta (es. paginazione nel footer, con tabelle
 * lunghe non visibile in alto), entro i limiti dell'overlay; vedi `getAnchorY()`. In mancanza di un click (o di un
 * elemento attivo) interno alla tabella resta la posizione predefinita (`--jt-loader-justify-content`).
 *
 * Senza overlay (o con `loader: false`) resta solo `aria-busy`, che riduce l'opacità della tabella (`--jt-busy-opacity`).
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {boolean} [overlay=true] - Mostra l'overlay con lo spinner (default: true)
 * @returns {void}
 *
 * @example
 * showLoader(jt, jt.params.serverSide); // overlay solo in modalità server-side
 */
export function showLoader(jt, overlay = true) {

  const { wrapper, loader } = jt.elements;
  clearTimeout(jt._loaderTimer);

  wrapper?.setAttribute('aria-busy', 'true');

  if (!overlay || !loader) {
    return;
  }

  // altezza di riferimento calcolata subito (relativa al contenitore), così da non risentire di scroll durante `loaderDelay`
  const anchorY = getAnchorY(jt, loader);
  const reveal = () => {
    loader.hidden = false;
    positionSpinner(loader, anchorY);
  };

  const delay = Number(jt.params.loaderDelay) || 0;
  if (delay > 0) {
    jt._loaderTimer = setTimeout(reveal, delay);
  } else {
    reveal();
  }
}


/** intervallo massimo (ms) tra `pointerdown` e richiesta perché il click venga considerato l'origine della richiesta */
const POINTER_MAX_AGE = 1500;

/**
 * Altezza (px, relativa al bordo superiore del contenitore dell'overlay) a cui centrare lo spinner:
 * - la coordinata y dell'ultimo `pointerdown` (vedi costruttore del componente), se recente e avvenuto all'interno del
 *   contenitore dell'overlay (es. click su paginazione o intestazione);
 * - altrimenti il centro dell'elemento attivo, se interno al contenitore (es. paginazione azionata da tastiera);
 * - altrimenti `null`: posizione predefinita dell'overlay (`--jt-loader-justify-content`), es. ricerca, `filterForm`,
 *   `refresh()`.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {HTMLElement} loader - L'overlay di caricamento
 * @returns {number|null}
 */
function getAnchorY(jt, loader) {

  const container = loader.parentElement;
  if (!container) {
    return null;
  }

  let clientY = null;
  const pointer = jt._lastPointer;

  if (pointer && performance.now() - pointer.time < POINTER_MAX_AGE
    && pointer.target instanceof Node && container.contains(pointer.target)) {
    clientY = pointer.y;

  } else if (document.activeElement && document.activeElement !== document.body
    && container.contains(document.activeElement)) {
    const rect = document.activeElement.getBoundingClientRect();
    clientY = rect.top + rect.height / 2;
  }

  return clientY == null ? null : clientY - container.getBoundingClientRect().top;
}

/**
 * Posiziona lo spinner dell'overlay (già visibile) centrato su `anchorY`, entro i limiti dell'overlay (al netto di
 * `--jt-loader-padding-block`). Con `anchorY` null ripristina la posizione predefinita.
 *
 * @param {HTMLElement} loader - L'overlay di caricamento
 * @param {number|null} anchorY - Altezza di riferimento restituita da `getAnchorY()`
 * @returns {void}
 */
function positionSpinner(loader, anchorY) {

  loader.classList.remove(styles.loaderAnchored);
  loader.style.removeProperty('--jt-loader-anchor-offset');

  const spinner = /** @type {HTMLElement|null} */ (loader.firstElementChild);
  if (anchorY == null || !spinner) {
    return;
  }

  const cs = getComputedStyle(loader);
  const padStart = parseFloat(cs.paddingBlockStart) || 0;
  const padEnd = parseFloat(cs.paddingBlockEnd) || 0;
  const spinnerHeight = spinner.getBoundingClientRect().height;
  // overlay posizionato con `inset: 0` sul contenitore: stesso riferimento di `anchorY`
  const max = Math.max(padStart, loader.clientHeight - spinnerHeight - padEnd);
  const offset = Math.min(Math.max(anchorY - spinnerHeight / 2, padStart), max);

  loader.style.setProperty('--jt-loader-anchor-offset', `${Math.round(offset)}px`);
  loader.classList.add(styles.loaderAnchored);
}


/**
 * Termina la segnalazione di una richiesta in corso: annulla l'eventuale comparsa ritardata dell'overlay, lo nasconde e
 * rimuove `aria-busy` dal wrapper.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 *
 * @example
 * hideLoader(jt);
 */
export function hideLoader(jt) {

  const { wrapper, loader } = jt.elements;
  clearTimeout(jt._loaderTimer);

  wrapper?.removeAttribute('aria-busy');
  if (loader) {
    loader.hidden = true;
  }
}
