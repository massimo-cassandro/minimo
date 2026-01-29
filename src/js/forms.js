// import './form.css'; //incorporato nel css principale

import { enableSubmitBtns } from '@massimo-cassandro/js-utilities';

document.querySelectorAll('form').forEach( form => {

  // form.querySelectorAll('[type="submit"]').forEach(btn =>{
  //   btn.addEventListener('click', () => {
  //     form.classList.add('was-validated');
  //   }, false);
  // });

  form.querySelectorAll('.is-invalid, .is-valid').forEach(item => {
    item.classList.remove('is-invalid', 'is-valid');
  });

  form.addEventListener('submit', e => {

    if(!form.hasAttribute('data-no-was-validated')) {
      form.classList.add('was-validated');
    }

    if(!form.checkValidity()) {
      e.preventDefault();
      enableSubmitBtns();

    } else {
      if(!form.hasAttribute('data-no-disabling') && !form.hasAttribute('data-disable-submit')) { /* 'data-disable-submit' per compatibilitò con verioni precedenti */
        form.querySelectorAll('[type="submit"]').forEach(btn => {
          btn.disabled = true;
        });
      }
    }
  }, false);
});

