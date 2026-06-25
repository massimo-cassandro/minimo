import './overlay.css';

/**
 * Appends an overlay `div` to the given context element.
 * @param {Element} [context=document.body]
 * @param {boolean} [scroll_lock=false] - When true, locks body scroll via `overflow-hidden`.
 * @returns {void}
 */
export function overlay(context = document.body, scroll_lock = false) {
  context.insertAdjacentHTML('beforeend', '<div class="overlay"/>');
  if(scroll_lock) {
    document.body.classList.add('overflow-hidden');
  }
}

/**
 * Removes the overlay element from the given context and re-enables body scroll.
 * @param {Element} [context=document.body]
 * @returns {void}
 */
export function removeOverlay(context = document.body) {
  context.querySelector(':scope > .overlay')?.remove();
  document.body.classList.remove('overflow-hidden');
}
