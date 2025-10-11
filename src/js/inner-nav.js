// navigazione scheda / elenco
let nav_primary = document.querySelector('.inner-nav-main');
if (nav_primary) {
  // nav_primary.classList.add('text-right', 'd-print-none');
  let nav = nav_primary.innerHTML;

  document.querySelectorAll('.inner-nav').forEach(item => {
    item.innerHTML = nav;
    // item.classList.add('text-right', 'd-print-none');
  });
}
