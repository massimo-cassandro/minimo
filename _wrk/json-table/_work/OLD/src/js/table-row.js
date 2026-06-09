import { isFunction } from './utilities';
import * as iconStyles from '../css/icons.module.css';

export function tableRow(row, idx, target = 'null') {

  const tr = document.createElement('tr');
  if (this.params.addRowIndex && idx) {
    tr.dataset.id = idx;
  }

  this.params.columns.forEach((col, i) => {
    let raw_content, content;

    const datatypeObj = this.params.dataTypes[col.dataType]?? {};

    if(col.parse && isFunction(col.parse)) {
      raw_content = col.parse(row);
    } else {
      raw_content = row[col.key];
    }

    // if target is 'tfoot', columns with `tfoot: false` in their column definitions are not rendered
    if(target === 'tfoot' && !col.tfoot) {
      content = '';

    } else if(raw_content === 0 && this.params.useZeroAltChar) {
      content = this.params.zeroAltChar;

    // All `render` functions are invoked with the `raw_content` value and the global params object as arguments
    } else if(col.render && isFunction(col.render)) {
      content = col.render(raw_content, this.params);

    } else if(col.dataType && isFunction(datatypeObj?.render)) {
      content = datatypeObj.render(raw_content, this.params);

    } else  if(raw_content == null) {
      content = '';

    } else {
      content = raw_content;
    }

    const isTh = col.rowHeading && i === 0,
      CellTag = isTh? 'th' : 'td'
    ;
    let classnames = this.setColumClassname(col, false);
    classnames = classnames? [classnames] : [];


    // adding different classes for true and false boolean icons
    // NB: main icon class is added in setColumClassname() and is defined in the `default-columns-data-types.js` script
    if(col.dataType === 'bool') {

      if(this.params.boolValuesClassName !== null) { // custom class for icons
        classnames = [
          ...classnames,
          ...(this.params.boolTrueClassName && raw_content === true? [this.params.boolTrueClassName] : []),
          ...(this.params.boolFalseClassName && raw_content === false? [this.params.boolFalseClassName] : []),
        ];
      } else {
        classnames.push(raw_content === true? iconStyles.true : (raw_content === false? iconStyles.false : ''));
      }
    }

    tr.insertAdjacentHTML('beforeend',
      `<${CellTag}` +
        (isTh? ' scope="row"' : '') +
        (classnames.length? ` class="${classnames.join(' ')}"` : '') +

        // dataset values: // TODO necessari? possibile accedere ai dati in altro modo?
  // TODO sort e search solo se abilitati
  // TODO custom sort e search data su col, deve prevalere sulle funzioni di default
        ` data-key="${col.key}"` +
        ` data-search="${datatypeObj.searchValue? datatypeObj.searchValue(raw_content, this.params) : raw_content}"` +
        ` data-sort="${datatypeObj.sortValue? datatypeObj.sortValue(raw_content, this.params) : raw_content}"` +
        ` data-type="${col.dataType}"` +
      `>${content}</${CellTag}>`
    );
  });

  return tr;

}
