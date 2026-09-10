// @ts-nocheck

// pre-elaborazione tipi dati predefiniti
// le chiavi che cominciano con '_' sono di questa applicazione, le altre sono di simple-datatable

import { classnames } from '../../../../index.js';

import * as styles from '../s-datatable-component.module.css';

import checkIcon from '../../../icons/check-bold.svg?inline';
import xIcon from '../../../icons/x-bold.svg?inline';

// col_obj è l'oggetto che descrive una singola colonna del datatable
// viene utilizzato per produrre l'oggetto columns di simple-datatable
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
        cellClass: classnames('text-end', col_obj.cellClass),
        headerClass: classnames('text-end', col_obj.headerClass),
      };

    } else if(col_obj._renderMode === 'email') {
      return {
        ...col_obj,
        type: 'string',
        render: value => value.text?.replace('@', '<wbr />@<wbr />')
      };

    // campi booleani
    } else if (col_obj.type === 'boolean' || col_obj._renderMode === 'bool_true_only') {
      // il valore null arriva qui "genuino" (computeCellValue non applica _renderNullAs
      // alle colonne booleane), ma è comunque trattato come false (icona rossa/vuota)
      // TODO distinguere visivamente il caso null da false, se necessario

      return {
        ...col_obj,
        type: 'boolean',
        cellClass: styles.hasIcon,
        headerClass: classnames('text-center', col_obj.headerClass),
        render: (value, td) => {

          if(Boolean(value)) {
            td.attributes.class = classnames(td.attributes.class, 'text-success');
            return checkIcon;
          } else {
            td.attributes.class = classnames(td.attributes.class, 'text-danger');
            return col_obj._renderMode === 'bool_true_only'? '' : xIcon;
          }
        }
      };

    // campi date e datetime, symfony e no
    // nel caso di datetime/date symfony, il valore è stato già preelaborato da _load
    } else if(['sf_datetime', 'sf_date', 'date', 'datetime'].includes(col_obj._renderMode)) {

      const _isDatetime = ['sf_datetime', 'datetime'].includes(col_obj._renderMode);

      return {
        ...col_obj,
        type: 'string',
        cellClass: classnames('text-end', col_obj.cellClass),
        headerClass: classnames('text-end', col_obj.headerClass),

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

            const dateObj = new Date(value);


            cell.attributes['data-order'] = _isDatetime? value : value.substring(0,10);

            return `<span class="text-nowrap">${dateObj.toLocaleString('it-IT', {
              year: '2-digit',
              month: 'short',
              day: 'numeric',
            })}</span>` +
              (_isDatetime
                ? `\u2009<span class="text-xs">${dateObj.toLocaleString('it-IT', {
                  hour12: false,
                  hour:'2-digit',
                  minute:'2-digit'
                })}</span>`
                : '');
          }

        }
      };

    } else if( col_obj._renderMode === 'numeric' ||
      col_obj._renderMode === 'euro' ||
      col_obj._renderMode === 'euro_currency' ||
      col_obj._renderMode === 'euro_no_dec') {

      const digits = col_obj._renderMode === 'numeric'
        ? undefined
        : col_obj._renderMode === 'euro_no_dec'
          ? 0
          : 2;


      return {
        ...col_obj,
        render: (value, cell) => {
          // console.log(value);
          if(value == null || isNaN(value)) {
            cell.attributes['data-order'] = '';
            return '\u2014';

          } else {
            cell.attributes['data-order'] = value;
            return Number(value).toLocaleString('it-IT', {
              minimumFractionDigits: digits,
              maximumFractionDigits: digits,
              useGrouping: 'always',
              style: col_obj._renderMode === 'euro_currency' ? 'currency' : 'decimal',
              currency: col_obj._renderMode === 'euro_currency' ? 'EUR' : undefined
            });
          }
        },
        // le classi definite dall'utente vengono unite, non sostituite
        cellClass: classnames('text-nowrap text-end text-numeric', col_obj.cellClass),
        headerClass: classnames('text-nowrap text-end text-numeric', col_obj.headerClass), // NB: usata anche per il footer
        type: 'number'
      };

    }
  } // end if not render

  return col_obj;
}
