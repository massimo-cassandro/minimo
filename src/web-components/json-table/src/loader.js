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

  const delay = Number(jt.params.loaderDelay) || 0;
  if (delay > 0) {
    jt._loaderTimer = setTimeout(() => { loader.hidden = false; }, delay);
  } else {
    loader.hidden = false;
  }
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
