import {slideUp} from '@massimo-cassandro/js-utilities';

export default function () {

  // dismiss alert
  document.querySelectorAll('[data-bs-dismiss]').forEach(item => {
    item.addEventListener('click', () => {
      item.closest('.' + item.dataset.bsDismiss).remove();
    }, false);
  });

  // alert autoclose
  let flash_alert = document.querySelector('.alert-success.alert-flash');
  if(flash_alert) {
    window.setTimeout(function () {
      slideUp(flash_alert, 500, () => {
        flash_alert.remove();
      });
    }, 4000);
  }
}
