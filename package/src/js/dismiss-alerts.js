// dismiss alerts
document.querySelectorAll('[data-dismiss]').forEach(item => {
  item.addEventListener('click', () => {
    item.closest('.' + item.dataset.dismiss).remove();
  }, false);
});
