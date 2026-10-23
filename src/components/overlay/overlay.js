/*! minimo - Overlay */
import * as styles from './overlay.module.css';
import { classnames } from '../../utilities/classnames.js';

/**
 * Aggiunge un `div` overlay all'elemento di contesto indicato.
 * L'eventuale contenuto viene posizionato al centro dell'overlay.
 * @param {Object} [options={}] - Opzioni (default: {})
 * @param {Element} [options.context=document.body] - Elemento a cui aggiungere l'overlay (default: document.body)
 * @param {boolean} [options.scroll_lock=false] - Se true, blocca lo scroll del body tramite `overflow-hidden` (default: false)
 * @param {Node|string|null} [options.content=null] - Contenuto opzionale: un nodo DOM o una stringa HTML (default: null)
 * @param {string|null} [options.className=null] - Classi aggiuntive, che si sommano a quella dell'overlay (default: null)
 * @returns {HTMLDivElement} L'elemento overlay creato
 * @example
 * overlay({
 *   context: document.body,
 *   scroll_lock: false,
 *   content: null,
 *   className: null
 * });
 */
export function overlay({context = document.body, scroll_lock = false, content = null, className = null} = {}) {

  const div = document.createElement('div');
  div.className = classnames(styles.overlay, className);

  if(typeof content === 'string') {
    div.insertAdjacentHTML('beforeend', content);

  } else if(content) {
    div.appendChild(content);
  }

  context.appendChild(div);

  if(scroll_lock) {
    document.body.classList.add('overflow-hidden');
  }

  return div;
}

/**
 * Rimuove l'elemento overlay dal contesto indicato e riabilita lo scroll del body.
 * @param {Element} [context=document.body] (default: document.body)
 * @returns {void}
 * @example
 * removeOverlay(document.body);
 */
export function removeOverlay(context = document.body) {
  context.querySelector(`:scope > .${CSS.escape(styles.overlay)}`)?.remove();
  document.body.classList.remove('overflow-hidden');
}
