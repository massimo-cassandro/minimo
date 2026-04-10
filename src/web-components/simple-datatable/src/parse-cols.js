
// pre-elaborazione tipi dati predefiniti
// le chiavi che cominciano con '_' sono di questa applicazione, le altre sono di simple-datatable

import { classnames } from '@massimo-cassandro/js-utilities/index.js';

import * as styles from '../simple-datatable.module.css';

import checkIcon from '../icons/check-bold.svg?inline';
import xIcon from '../icons/x-bold.svg?inline';

// col_obj è l'oggetto che descrive una singola colonna del datatable
// vine utilizzato per produrre l'oggetto columns di simple-datatable
export function parseCols(col_obj){


  if(col_obj.render == null) {

    // campi template
    if(col_obj._renderTpl) {

      return {
        ...col_obj,
        type: col_obj.type?? 'html',

        // render: (value, cell /*, dataIndex, rowIndex */) => {

        //   cell.attributes['data-order'] = value.replace(/(<([^>]+)>)/ig,'');
        //   return value;
        //   // non viene elaborato qui perché non è possibile raggiungere la riga del json
        //   // return `<a href="${col_obj._href}">${value}</a>`;
        // }

      };

    } else if(col_obj._renderMode === 'id') {

      return {
        ...col_obj,
        type: 'number',
        searchable: false,
        cellClass: 'text-end',
        headerClass: 'text-end',
      };

    } else if(col_obj._renderMode === 'email') {
      return {
        ...col_obj,
        type: 'string',
        render: value => value.text?.replace('@', '<wbr />@<wbr />')
      };

    // campi booleani
    } else if (col_obj.type === 'boolean') {
      // TODO caso in cui il valore è null nel caso si voglia differenziarlo da false

      return {
        ...col_obj,
        cellClass: styles.hasIcon,
        headerClass: 'text-center',
        render: (value, td) => {

          if(Boolean(value)) {
            td.attributes.class = classnames(td.attributes.class, 'text-success');
            return checkIcon;
          } else {
            td.attributes.class = classnames(td.attributes.class, 'text-danger');
            return xIcon;
          }
        }
      };

    // gestione campi data symfony
    } else if(col_obj._renderMode === 'sf_datetime') {
      return {
        ...col_obj,
        type: 'string',
        cellClass: 'text-end',
        headerClass: 'text-end',

        render: (value, cell /*, dataIndex, rowIndex */) => { // value si riferisce al valore già trasformato nella pre-elaborazione dei dati
          /* {
            "date": "2026-03-31 07:54:31.000000",
            "timezone_type": 3,
            "timezone": "UTC"
          } */


          if(value == null) {
            cell.attributes['data-order'] = ' ';
            return '\u2014';

          } else {

            cell.attributes['data-order'] = value;

            const dateObj = new Date(value);

            return `<span class="text-nowrap">${dateObj.toLocaleString('it-IT', {
              year: '2-digit',
              month: 'short',
              day: 'numeric',
            })}</span>` +
            `\u2009<span class="text-xs">${dateObj.toLocaleString('it-IT', {
              hour12: false,
              hour:'2-digit',
              minute:'2-digit'
            })}</span>`;
          }

        }
      };
    }
  } // end if not render

  return col_obj;
}
