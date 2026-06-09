import { nanoid } from 'nanoid';
import { isFunction } from './utilities';

import * as styles from '../css/table.module.css';


export function tableBuilder() {

  this.params.tableId ??= nanoid();

  try {

    const table = document.createElement('table');
    table.className = this.params.tableAltClassName??
      styles.table + (this.params.tableExtraClassName? ` ${this.params.tableExtraClassName}` : '');
    table.id = this.params.tableId;

    if(this.params.caption) {
      table.insertAdjacentHTML('beforeend', `<caption>${this.params.caption}</caption>`);
    }

    // headings
    table.insertAdjacentElement('beforeend', this.tableHead());

    // rows
    const data = this.params.data; // TODO  dati da ajax

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    data.forEach((row_data, idx) => {
      tbody.insertAdjacentElement('beforeend', this.tableRow(row_data, idx));
    });

    // TODO tfoot ajax ???
    // tfoot
    if(this.params.footerData) {
      table.insertAdjacentElement('beforeend', this.tableFoot());
    }


    // TODO table sort (vedi custom sort function in defaults.js)

    // tr callback
    if(isFunction(this.params.trCallback) ) {
      table.querySelectorAll('tbody tr').forEach((row, idx) => this.params.trCallback(row, data[idx], this.params));
    }

    // responsive wrapper
    if(this.params.addTableWrapper) {
      const wrapper = document.createElement('div');
      wrapper.className = this.params.tableWrapperClassName?? styles.tableWrapper;
      wrapper.appendChild(table);
      return wrapper;

    } else {
      table.classList.add(styles.stickyHeaders);
      return table;
    }

  } catch(e) { //throw error
    console.error( e ); // eslint-disable-line
  } // finally {}
}
