// import './spinner.css'; // incorporato nel css principale

export function spinner(container, withOverlay = false) {
  const spinnerMarkup =
    `<div class="${withOverlay? 'spinner-overlay' : 'spinner-wrapper'}"><div class="spinner">Loading...</div></div>`;


  if(container != null) {
    container.insertAdjacentHTML('beforeend', spinnerMarkup);
  } else {
    return spinnerMarkup;
  }
}

export function removeSpinner(container) {
  container.querySelectorAll('.spinner-overlay, .spinner-wrapper')
    .forEach(item => item.remove());

}
