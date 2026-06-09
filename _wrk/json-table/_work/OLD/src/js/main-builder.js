import * as styles from '../css/main-wrapper.module.css';

export function mainBuilder() {

  // console.log(this);

  const wrapper = document.createElement('section');
  wrapper.className = this.params.mainWrapperAltClassNam??
    styles.wrapper + (this.params.mainWrapperExtraClassName? ` ${this.params.mainWrapperExtraClassName}` : '');

  // info section
  wrapper.appendChild(this.infoSection());

  // table responsive wrapper & table
  wrapper.appendChild(this.tableBuilder());

  // TODO pagination -> https://www.taniarascia.com/front-end-tables-sort-filter-paginate/
  // TODO search
  // TODO sort


  this.params.container.replaceChildren(wrapper);

  // TODO ready listeners
  // this.params.container.dispatchEvent(new CustomEvent('jt:ready', { detail: { table: this } }));
}
