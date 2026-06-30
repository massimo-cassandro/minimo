import { isFunction } from './utilities.js';


export function tableRow(row_data, parent = 'tbody') {

  // parent: tbody or tfoot

  return {
    tag: 'tr',
    attrs: {
      'data-jt-id': (!this.params.ajax) && parent === 'tbody'? row_data.jtId : null
    },
    children: this.params.columns.map((col, i) => {

      const parsedData = this.params.ajax
        ? this.parseDataRow({
          dataRow: row_data,
          isTbody: parent === 'tbody'
        })
        : row_data; // Static data has already been parsed at startup


      const tag = col.rowHeading && i === 0? 'th' : 'td';

      return {
        tag: tag,
        className: parsedData[col.key]?.className,
        attrs: {
          scope: tag === 'th'? 'row' : null,
          'data-key': col.key,  // key for cell data
        },
        content : parsedData[col.key].displayValue
      }; // end cell
    }), // end columns map

    // tr callback => eseguito al completamento della costruzione della tabella in main-builder
    callback: isFunction(this.params.trCallback) && parent === 'tbody'
      ? tr => this.params.trCallback(tr, row_data, this.params)
      : null

  }; // end tr

}
