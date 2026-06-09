import { classnames } from '@massimo-cassandro/js-utilities/index.js';

import * as styles from '../css/table.module.css';



export function tableBuilder() {
  return [
    {
      className: styles.tableWrapper,
      children: [
        {
          tag: 'table',
          className: classnames(styles.table, this.params.tableClassName),
          id: this.params.tableId,
          callback: el => this.params.elements.table = el,
          children: [
            {
              tag: 'caption',
              condition: !!this.params.caption,
              content: this.params.caption
            },
            // thead
            this.tableThead(),

            // tbody
            {
              tag: 'tbody',
              callback: el => this.params.elements.tbody = el,

              children: this.params.ajax
                ? [] // TODO  dati da ajax
                : this.params.data.map(row_data => this.tableRow(row_data))
            },

            // tfoot
            // TODO tfoot ajax ???
            this.tableTfoot(),

          ]
        }
      ]
    }
  ];
}
