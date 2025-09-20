import './overlay.css';

export function overlay(scroll_lock = false) {
  document.body.insertAdjacentHTML('beforeend', '<div class="overlay"/>');
  if(scroll_lock) {
    document.body.classList.add('overflow-hidden');
  }
}
export function remove_overlay() {
  document.body.querySelector(':scope > .overlay')?.remove();
  document.body.classList.remove('overflow-hidden');
}
