/* eslint-disable no-console */
import jsonTable from '@src/index.js';

const container = document.getElementById('ajax-table-demo');

// Register listener BEFORE instantiation so it can catch the event
// TODO verificare funzionamento
container.addEventListener('jt:ready', e => {
  console.log('Static table ready');
  console.log(e.detail);
});

new jsonTable(
  // params
  {
    debug: true,
    container: container,
    useZeroAltChar: false,

    // true: => use the standard parameters (similar to datatable ones), object: customize parameters
    // see ajax_config_default in `src/js/defaults.js`
    ajax: {

      // https://github.com/typicode/json-server
      urlParams: {
        startItem: `_page`,
        perPage : '_per_page',
        // TODO search param
        // search : 'search[value]',
        // TODO columns + order
      },

      // Config for returned object keys: uses default
      // jsonKeys: {}
    },
    ajaxUrl: 'http://localhost:3004',

    addRowIndex: true,
    searchInputClassName: 'form-control',
    infoExtraClassName: 'border border-secondary rounded p-2', // some classes from the used framework (bootstrap)
    tableClassName: 'table table-striped table-hover table-bordered',
    defaultSorting: {date: 'asc', perc: 'desc'},

    // add a red background to each number cell whose content is a number and less than 3000
    trCallback: (tr/* , row_data, params */) => {

      tr.querySelectorAll('td').forEach(cell => {

        const raw_value = +cell.dataset.raw;
        if(!isNaN(raw_value) && raw_value < 3000 && cell.dataset.type === 'num') {
          cell.classList.add('text-bg-danger');
        }
      });
    },

    caption: 'Ajax table demo',

    // using some bootstrap classes
    // tableClassName: 'table table-striped table-hover table-bordered', // overrides the default class
    inlineEndAlignClassName : 'text-end',
    nowrapClassName         : 'text-nowrap',

    columns: [
      {
        title       : 'ID',
        key         : 'id',
        // dataType    : 'string',  // dataType can be omitted if it's `string`
        className   : 'small text-center',
        rowHeading  : true,
        tfoot       : false // avoid rendering these values inside the tfoot element
      },
      {
        title       : 'Boolean',
        key         : 'bool',
        dataType    : 'bool',
        // parse       : row => !!row.isActive // if the original data contains other values besides true or false and you need to force them all to boolean
      },
      {
        title       : 'Boolean (customized)',
        key         : 'boolCustomized',
        dataType    : 'boolWithNull' // custom dataType, see below
      },
      {
        title       : 'Text column',
        key         : 'text',
        dataType    : 'string'
      },
      {
        title       : 'Number #1',
        key         : 'number1',
        dataType    : 'num',
      },
      {
        title       : 'Number #2',
        key         : 'number2',
        dataType    : 'num',
        render      : cell_data => {                           // custom render function
          const [int, dec] = cell_data.toFixed(2).split('.');
          return `${int}.<small>${dec}</small>`;
        }
      },
      {
        key         : 'sum',
        title       : 'Sum #1 + #2',
        dataType    : 'num',
        parse       : (row) => row.number1 + row.number2        // parsed value
      },
      {
        title       : 'Date',
        key         : 'date',
        dataType    : 'date'
      },
      {
        title       : 'Datetime (obj)',
        key         : 'sfDatetime',
        dataType    : 'datetime',
      },
      {
        title       : 'Perc',
        key         : 'perc',
        dataType    : 'perc'
      },
      {
        title       : 'Perc. (dec.)',
        key         : 'percDecimal',
        dataType    : 'percDecimal'
      },
      {
        title       : 'Perc. (dec.)',
        key         : 'euro',
        dataType    : 'euro'
      },

    ],

  }, // end params

  // custom dataTypes
  {
    // redefine the default `string` dataType
    string: {
      // inheritsFrom: 'string', // inherits properties from the default dataType, if needed
      className: 'fst-italic' // from bootstrap css
    },

    // new dataType
    // similar to the default dataType `bool`, but also renders null values with a different style
    // SVG icons are replaced with text symbols
    boolWithNull: {
      inheritsFrom     : 'bool', // inherits properties from the default dataType, if needed
      className        : 'text-center', // from bootstrap css

      render           : function (val /* , params */) { // you can access the global params object if you need
        if(val == null) {
          return '<span class="text-bg-warning py-1 px-3 small rounded">null</span>';

        } else {
          return val
            ? '<span class="text-success lead">&check;</span>'
            : '<span class="text-danger lead">&#x2715;</span>';
        }
      }
    }
  } // end custom dataTypes
);
