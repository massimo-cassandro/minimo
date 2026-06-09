// import {overlay, remove_overlay} from '@massimo-cassandro/m-utilities/js-utilities/overlay';

/*
.page-overlay, .div-overlay {
  inset: 0;
  z-index: 9999
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff
  background-color: rgb(0 0 0 / .7);

}
.page-overlay {
  position: fixed;
}

.div-overlay {
  position: absolute;
}

*/
export  function overlay( container ) {

  container = container || document.body;
  let full_page = container === document.body;

  container.insertAdjacentHTML('beforeend',
    `<div class="${full_page? 'page-overlay' : 'div-overlay'}">` +
      '<div class="spinner-border" role="status">' +
        '<span class="sr-only visually-hidden">Caricamento...</span>' +
      '</div>' +
    '</div>'
  );
}

export  function remove_overlay( container ) {

  container = container || document.body;
  let full_page = container === document.body;
  let overlay = container.querySelector(`.${full_page? 'page-overlay' : 'div-overlay'}`);
  if(overlay) {
    overlay.remove();
  }

}
