// import './overlay.css'; incorporato nel css principale

export function overlay(context = document.body, scroll_lock = false) {
  context.insertAdjacentHTML('beforeend', '<div class="overlay"/>');
  if(scroll_lock) {
    document.body.classList.add('overflow-hidden');
  }
}
export function removeOverlay(context = document.body) {
  context.querySelector(':scope > .overlay')?.remove();
  document.body.classList.remove('overflow-hidden');
}
