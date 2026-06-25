// tab / list navigation — copies the primary nav markup into all `.inner-nav` containers
/*
<p class="inner-nav-main">...</p>
...
<p class="inner-nav"></p>
*/

import './inner-nav.css';

/**
 * Copies the inner HTML of `.inner-nav-main` into every `.inner-nav` element on the page.
 * @returns {void}
 */
export function innerNav(){

  const nav_primary = document.querySelector('.inner-nav-main');
  if (nav_primary) {
    // nav_primary.classList.add('text-right', 'd-print-none');
    let nav = nav_primary.innerHTML;

    document.querySelectorAll('.inner-nav').forEach(item => {
      item.innerHTML = nav;
      // item.classList.add('text-right', 'd-print-none');
    });
  }
}
