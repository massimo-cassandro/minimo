/*! minimo - Overlay */
import './overlay.css';

/**
 * Aggiunge un `div` overlay all'elemento di contesto indicato.
 * @param {Element} [context=document.body] (default: document.body)
 * @param {boolean} [scroll_lock=false] - Se true, blocca lo scroll del body tramite `overflow-hidden` (default: false)
 * @returns {void}
 */
export function overlay(context = document.body, scroll_lock = false) {
  context.insertAdjacentHTML('beforeend', '<div class="overlay"/>');
  if(scroll_lock) {
    document.body.classList.add('overflow-hidden');
  }
}

/**
 * Rimuove l'elemento overlay dal contesto indicato e riabilita lo scroll del body.
 * @param {Element} [context=document.body] (default: document.body)
 * @returns {void}
 */
export function removeOverlay(context = document.body) {
  context.querySelector(':scope > .overlay')?.remove();
  document.body.classList.remove('overflow-hidden');
}
