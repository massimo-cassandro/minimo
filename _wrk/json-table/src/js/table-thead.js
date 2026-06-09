import { titleCase } from './utilities.js';
import * as styles from '../css/table.module.css';
import { classnames } from '@massimo-cassandro/js-utilities/index.js';



// TODO gestire this.params.stickyThead

export function tableThead() {

console.log(typeof this.params.sortArrowIcon);
console.log(this.params.sortArrowIcon instanceof Element);
console.log(this.params.sortArrowIcon instanceof HTMLElement);
console.log(this.params.sortArrowIcon instanceof SVGElement);

  return {
    tag: 'thead',
    callback: el => this.params.elements.thead = el,

    children: [
      {
        tag: 'tr',
        children: this.params.columns.map(col => {
          /*
          {
            title              : null, // column title (th text)
            key                : null, // json object key
            dataType           : 'string', // cell data type, it must be one of the keys of the `data_types` object
            className          : null, // class to be assigned to the cell. If present it overrides the default class of the data_types object
            render             : null, // rendering function for the cell. If present it overrides the default render function of the data_types object
            parse              : null, // parsing function for the cell. If present the value is passed to this function before rendering
            rowHeading         : false, // if true, the cell is a th[scope=row] instead of a td (tbody only)
            tfoot              : true, // if false, the cell will not be rendered in the tfoot element
            searchable         : true, // if true, the column content is searchable
            sortable           : true, // if true, the column content is sortable
            sortValueCustomParser    : null, // custom sort function for the column, overrides the default one
            searchValueCustomParser  : null,
          }
          */

          const sorting_available = this.params.sort && col.sortable,
            sorting_activated = sorting_available && this.params.defaultSorting[col.key] != null,
            sorting_direction = sorting_activated? titleCase(this.params.defaultSorting[col.key]) : null;

          return {
            tag: 'th',
            attrs: {
              scope: 'col',
              'data-key': col.key
            },
            className: classnames(
              sorting_available? styles.sort : null,
              sorting_activated? styles.sortingOn : null,
              sorting_direction? styles[`sorting${sorting_direction}`] : null
            ),

            content: sorting_available? null : col.title,
            // sort arrows
            children: [
              {
                condition: sorting_available,
                tag: 'button',
                className: classnames(
                  styles.sortBtn,
                  styles[`sort${sorting_direction}`],
                  sorting_direction === sorting_direction? styles.sortActive : null
                ),
                // attrs: {
                //   'aria-label': this.params[`sortButton${direction}AriaLabel`],
                //   title: this.params[`sortButton${direction}AriaLabel`],
                // },

//TODO icona inserita in modo non corretto, problema di dombuilder?
// capire se cambiare approccio (content come funzione?)
                content: col.title,
                children: [
                  {
                    tag: 'span',
                    className: '',
                    content: this.params.sortArrowIcon,
                  }
                ]
              }
            ]
          };
        }) // end col map
      } // end tr
    ]

  };
}
