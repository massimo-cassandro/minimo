import * as styles from '../css/main-builder.module.css';
import { classnames } from '@massimo-cassandro/js-utilities/index.js';
import { domBuilder } from '@massimo-cassandro/dom-builder/index.js';

export function mainBuilder() {

  /*
  <section class="wrapper">
    <div class="infoOuterContainer">
      <!-- content -->
    </div>

    <div class="tableWrapper">
      <table>
        <caption>Static table demo</caption>
        <thead>
          <!-- thead rows -->
        </thead>
        <tbody>
          <!-- tbody rows -->
        </table>
      </table>
    </div>

  </section>
  */

  domBuilder([
    {
      tag: 'section',
      className: classnames(styles.wrapper, this.params.mainWrapperExtraClassName),
      children: [
        ...this.infoSection(),
        ...this.tableBuilder()
      ]
    }
  ], this.params.container);

  if(!this.params.ajax) {
    this.params.elements.tbodyRows = this.params.elements.table.querySelectorAll('tbody tr');
  }

  this.updateInfo();
  this.setSearchListener();
  this.setSortListeners();


  // TODO pagination => https://www.taniarascia.com/front-end-tables-sort-filter-paginate/



  // TODO check custom event
  // ready customEvent
  const event = new CustomEvent('jt:ready', { detail: { jsonTable: this }, bubbles: true });
  // dispatch into the next microtask so any listeners registered immediately after the instance can intercept it
  Promise.resolve().then(() => this.params.container.dispatchEvent(event));
}


/*
// TODO resize observer per calcolo altezza infoOuterContainer

// TODO wrapper con altezza definita per abilitare il thead sticky
//     stabilire una proprietà css per lo spazio dal bordo inferiore del viewport e definire l'altezza di conseguenza.
//     Oppure impostare una variabile per altezza arbitraria.
//     Da ricalcolare con resize observer??


const infoSection = document.querySelector('.infoOuterContainer');
const tableWrapper = document.querySelector('.tableWrapper');

if (infoSection && tableWrapper) {
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      // Prende l'altezza esatta dell'elemento incluse le variazioni responsive
      const height = entry.contentRect.height +
                     parseFloat(getComputedStyle(infoSection).paddingTop) +
                     parseFloat(getComputedStyle(infoSection).paddingBottom);

      tableWrapper.style.setProperty('--js-thead-sticky-top', `${height}px`);
    }
  });

  resizeObserver.observe(infoSection);
}

 */
