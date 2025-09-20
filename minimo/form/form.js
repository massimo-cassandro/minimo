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

    form.classList.add('was-validated');

    if(!form.checkValidity()) {
      e.preventDefault();
      enableSubmitBtns();

    } else {
      if(!form.hasAttribute('data-no-disabling')) {
        form.querySelectorAll('[type="submit"]').forEach(btn => {
          btn.disabled = true;
        });
      }
    }
  }, false);
});

