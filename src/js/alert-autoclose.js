// alert autoclose
let flash_alert = document.querySelector('.alert-success.autoclose');
if (flash_alert) {
  window.setTimeout(function () {
    slideUp(flash_alert, 500, () => {
      flash_alert.remove();
    });
  }, 4000);
}
