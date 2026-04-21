
import { DataTable } from 'simple-datatables';

import { parseCols } from './src/parse-cols.js';

import * as styles from './simple-datatable.module.css';

import caretLeftIcon from '../../icons/caret-left.svg?inline';
import caretRightIcon from '../../icons/caret-right.svg?inline';

// TODO possibilità di definizione cols anche da js. In questo caso, in presenza ANCHE dell'attributo, deve prevalere quest'ultimo

// https://fiduswriter.github.io/simple-datatables/documentation/

class SimpleDatatable extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({ mode: 'open' }); // commentare per light dom
  }


  // implementare se necessario modificare gli attributi nel runtime
  /*
  static get observedAttributes() {
    return ['icon', 'variant', 'size', 'url'];
  }

  attributeChangedCallback() {}
  */


  async connectedCallback() {
    this.innerHTML = '<div class="spinner"><span class="visually-hidden">Caricamento dati...</span></div>';

    const jsonUrl = this.getAttribute('json') || null,
      cols = JSON.parse(this.getAttribute('cols')?? {});

    try {
      const response = await fetch(jsonUrl),
        json_data = await response.json();

      this.headings = cols.map(item => item._title? `<abbr title="${item._title}">${item._heading}</abbr>` : item._heading);

      this.data = json_data.data.map((row, idx) => {

        // riga datatable
        return {
          attributes: {'data-jidx': idx}, // indice della riga dati nel json originale

          cells: cols.map((col_item, col_idx) => {

            let value = row[col_item._field];
            // let order = null;

            // ------------------
            // elaborazione _renderTpl -> aggiunta id e/o altri riferimenti a campi della riga.
            // necessario farlo così, perché simple-datatable non permette l'accesso ai dati di riga
            // durante il render delle celle, i riferimenti vanno quindi risolti al momento di elaborare i dati
            if(col_item._renderTpl) {
              const this_value = decodeURIComponent(col_item._renderTpl).replace(/\[\[(.*?)\]\]/g, (match, key) => {

                if(row[key] == null) {
                  // eslint-disable-next-line no-console
                  console.error(`[s-datatable] Chiave “${key}” non trovata (colonna ${col_idx})`);
                }
                return row[key]?? '{{' + key + '}}';
              });

              value = this_value;
              // order = row[col_item._field];
            }
            // ------------------

            // conversione date symfony in ISO8601
            else if(col_item._renderMode === 'sf_datetime' && value != null) {
              value = value.date.replace(' ', 'T') +
                (value.timezone === 'UTC'? 'Z' : '');
            }

            return value; //{text: value, ...(order? {order: order} : {})};
          })
        };
      });

      this.columns = cols.map((col_settings, idx ) => {

        // pre-elaborazione tipi predefiniti
        col_settings = parseCols(col_settings);

        const col_obj = {
          ...(Object.fromEntries(
            Object.entries(col_settings).filter(([key]) => !key.startsWith('_'))
          )),
          select: idx,
          type: col_settings.type?? 'string',
          searchable: col_settings.searchable?? true,
          sortable: col_settings.sortable?? true,
        };

        return col_obj;
      });

      // console.log('json_data', json_data);
      // console.log('cols', cols);
      // console.log('columns', this.columns);
      // console.log('data', this.data);

    } catch(err) {
      /* eslint-disable no-console */
      console.error(jsonUrl);
      console.error(err);
      /* eslint-enable no-console */
    }

    this.render();
  }

  // approccio per eventuale modifica degli attributi nel runtime
  // set variant(val) {this.setAttribute('variant', val);} get variant(val) {return this.getAttribute('variant')}

  render() {
    this.innerHTML = '';
    const table = document.createElement('table');
    this.appendChild(table);

    // https://fiduswriter.github.io/simple-datatables/documentation/Options
    const dt = new DataTable(table, {
      locale: 'it',
      searchable: true,
      sortable: true,
      fixedHeight: false,
      fixedColumns: false,
      paging: true,
      perPage: +this.getAttribute('perPage') || 25,
      pagerDelta: 2,
      perPageSelect: false,

      labels: {
        placeholder: 'Cerca...',
        searchTitle: 'Cerca nella tabella',
        pageTitle: 'Pagina {page}',
        perPage: 'Righe per pagina',
        noRows: 'Nessun record trovato',
        info: 'Stai visualizzando le righe da {start} a {end}, su un totale di {rows}',
        noResults: 'Nessun risultato per la ricerca',
      },
      classes: {
        wrapper                 : styles.datatableWrapper,
        container               : 'table-responsive',
        loading                 : 'datatable-loading', // ??

        // barra superiore
        top                     : styles.topArea,
        search                  : styles.searchWrapper,
        input                   : 'form-control form-control-sm',
        // dropdown         : 'datatable-dropdown', // selettore righe per pagina, disattivato

        empty                   : styles.empty,

        // table
        table                   : `table table-bordered ${styles.table}`,
        // buttons in thead per il sort
        sorter                  : `btn-reset ${styles.sortBtn}`,
        ascending               : styles.sortAscending,
        descending              : styles.sortDescending,

        // area inferiore
        bottom                  : styles.bottomArea,
        // info text
        info                    : styles.info,

        // pagination
        // pagination           : styles.paginationNav,
        paginationList          : styles.paginationList,
        paginationListItem      : styles.paginationListItem,
        paginationListItemLink  : styles.paginationListItemBtn,
        // hidden                  : 'datatable-hidden',
        disabled                : styles.paginationDisabled,
        active                  : styles.paginationActive,

        // cursor: 'datatable-cursor',
        // dropdown: 'datatable-dropdown',
        // ellipsis: 'datatable-ellipsis',
        // filter: 'datatable-filter',
        // filterActive: 'datatable-filter-active',
        // headercontainer: 'datatable-headercontainer',
        // selector: 'datatable-selector',
      },

      columns: this.columns,
      data: {
        headings: this.headings,
        data: this.data
      }
    });

    dt.on('datatable.init', () => {
      const pagination = this.querySelector(`.${styles.paginationList}`);

      if(pagination.querySelectorAll(`.${styles.paginationListItem}`).length) {

        pagination.querySelector(`.${styles.paginationListItem}:first-child .${styles.paginationListItemBtn}`)
          .innerHTML = caretLeftIcon;

        pagination.querySelector(`.${styles.paginationListItem}:last-child .${styles.paginationListItemBtn}`)
          .innerHTML = caretRightIcon;

        pagination.querySelectorAll(`.${styles.paginationListItemBtn}:has(svg)`)
          .forEach(btn => btn.classList.add(styles.hasSvg));
      }
    });

  } // end render
} // end component

if (!customElements.get('s-datatable')) {
  customElements.define('s-datatable', SimpleDatatable);
}
