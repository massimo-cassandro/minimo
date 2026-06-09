/* global process */

import 'jquery?as_asset';
import 'datatables.net/js/jquery.dataTables.js?as_asset';

import { spinner } from '@minimo/spinner.js';
import svg_icons from '@imgs/icone.svg';

import { creaDT } from '@massimo-cassandro/auto-datatables-bs5';
import './auto-datatable.css?inline';
/*
per personalizzazioni datatable
da usare insieme alle opzioni globali

  import {default_dt_options} from 'path/to/datatable.js';
  import { dt_default_options, dt_classes } from '@massimo-cassandro/auto-datatables-bs5';

  $.extend( $.fn.dataTable.ext.classes, dt_classes );
  $(__table__).DataTable($.extend(true, {}, dt_default_options, ada_default_dt_options,

    // opzioni specifiche, se necessarie, ad esempio per tabelle non ajax:
    {
      processing  : false,
      serverSide  : false,
      pageLength  : 25,
      order       : [[ 1, 'asc' ]],
      columns     : null
    }
  ));

*/

export const default_dt_options = {

    dom:
      // controlli
      '<\'dt-controls\'lf>' +
      // table + processing
      //"<'position-relative'tr>" +
      // table + processing
      '<\'dt-table-wrapper\'t>r' +
      // info + paginazione
      '<\'dt-footer\'ip>',

    // renderer: 'bootstrap',

    // serverSide     : true,
    // paging         : true,
    // pageLength     : 25,
    language: {
      processing: spinner(),

      lengthMenu:
          '<di class"dt-control-label">Mostra</di>' +
          '<div class="dt-control">_MENU_</div>' +
          '<div>record per pagina</div>',
      search:
          '<div class="dt-control-label">Filtra risultati:</div>' +
          '<div class="dt-control">_INPUT_</div>',
    },

    responsive       : true,
    stateSave        : process.env.NODE_ENV === 'development',
    stateDuration    : -1, //sessionStorage
    // columnDefs       : [{
    //   orderable      : true,
    //   targets        : ['_all']
    // }],
    // ajax             : null,
    // order            : [],
    // columns          : []
  }, // end dt_options

  default_cdt_options = {

    icone: {
      ok  : `<svg class="icon text-success"><use href="${svg_icons}#check-circle-bold"></use></svg>`,
      off : `<svg class="icon text-danger"><use href="${svg_icons}#x-circle-bold"></use></svg>`,
    },

    id_visible_default: true,

    formats: {
      decimals_class: 'data-dec',
      euro_class: 'data-euro',

      date: {
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      },
      time: {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      },
      datetime: {
        date: {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        },
        time: {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        },
        separator: ' ',  // date-time separator
        date_wrapper: '<span class="text-nowrap"></span>', // HTML string or null or ''
        time_wrapper: '<small></small>' // HTML string or null or ''
      }
    },

    use_sorting_arrow: false, // se true viene aggiunta al container la classe `w-arrow` che attiva la visualizzazione delle frecce dell'ordinamento

    // container_header: '', //'Risultato della ricerca', // se presente aggiunge un header prima della tabella

    // container_class: 'dt-container', // classe che viene assegnata al div che contiene la tabella
    //container_header_level: 2, // livello gerarchico dell'header (h2, h3, ecc...)
    // table_id: 'table_result',
    table_class: 'table table-bordered'
    //table_caption: '',
    //table_footer: false, // se true aggiunge una riga tfoot alla tabella, da popolare con un callback
    //extra_info:''
  }
;

/**
  * _datatable
  * crea e renderizza un datatable da un flusso json
  *
  */

export function _datatable(container, options = {}) {

  options.dt_options = {...default_dt_options, ...(options.dt_options?? {}) };
  options.cdt_options = {...default_cdt_options, ...(options.cdt_options?? {}) };

  container.innerHTML = '<div class="datatable-spinner-wrapper">' +
      spinner() +
    '</div>';

  creaDT(container, options.cdt_options, options.dt_options, options.dt_columns?? []);
}


// utilizza _datatable per generare in modo automatico i datatable
// negli elementi con classe 'dt-container'
// i parametri datatable sono ricavati dagli attributi data di '.dt-container'

document.querySelectorAll('.dt-container').forEach(container => {
  _datatable(container);
});

