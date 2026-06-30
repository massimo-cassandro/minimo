import { titleCase } from './utilities';
import searchArrow from '../icons/search-arrows.svg?inline';
import * as styles from '../css/table.module.css';

export function tableHead() {

  const thead = document.createElement('thead'),
    tr = document.createElement('tr');

  this.params.columns.forEach(col => {

    const th = document.createElement('th'),
      sorting_available = this.params.sort && col.sortable,
      sorting_activated = sorting_available && this.params.defaultSorting[col.key],
      sorting_direction = sorting_activated && (this.params.defaultSorting[col.key]?? null),

      className = [
        this.setColumClassname(col, false),
        ...(sorting_available? [styles.sort] : []),
        ...(sorting_activated? [styles.sortingOn] : []),
        ...(sorting_direction? [ styles[`sorting${titleCase(sorting_direction)}`] ] : []),
      ];


    th.setAttribute('scope', 'col');
    th.className = className.join(' ');

// TODO defaul desc sorting non si vede (freccia non colorata)
    th.innerHTML = sorting_available?
      '<div>' +
        `<span>${col.title}</span>` +
        `<span class="${styles.sortArrows}">` +
          `<span class="${styles.sortArrowUp}">${searchArrow}</span>` +
          `<span class="${styles.sortArrowDn}">${searchArrow}</span>` +
        '</span>' +
      '</div>'
      : col.title;

    tr.appendChild(th);
  });


  // TODO sort listener

  thead.appendChild(tr);
  return thead;
}
