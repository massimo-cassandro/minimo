/**
 * Parses a data row and prepares it for rendering, searching, and sorting
 *
 * @param {Object} dataRow - The data row object to parse
 * @param {Object} dataRow.idx - Row unique index, if needed (static tables only)
 * @returns {void}
 * @description This function processes a single data row by:
 * - Adding unique identifiers to rows if needed
 * - Extracting and parsing cell content using custom parse functions or dataType parsers
 * - Rendering content using custom render functions
 * - Storing parsed data (raw, display, searching, and sorting values) for efficiency
 * @note Only works on static tables or on AJAX mode with specific dataRow object
 */

import { isFunction } from './utilities.js';
import * as iconStyles from '../css/icons.module.css';
import { classnames } from '@massimo-cassandro/js-utilities/index.js';

export function parseDataRow({
  dataRow = {},
  idx = null,
  isTbody = true
}){

  try {

    const parsedRow = {};

    // adding unique index (static table only)
    if(idx != null) {
      parsedRow.jtId = idx;
    }

    // exclude any unnecessary data
    this.params.columns.forEach(col => {


      let raw_content, content;

      const datatypeObj = this.params.dataTypes[col.dataType]?? {};

      if(col.parse && isFunction(col.parse)) {
        raw_content = col.parse(dataRow);
      } else {
        raw_content = dataRow[col.key];
      }

      // if parent is 'tfoot', columns with `tfoot: false` in their column definitions are not rendered
      if(!isTbody && !col.tfoot) {
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

      parsedRow[col.key] = {
        raw: raw_content,
        type: col.dataType,
        // datatypeObj: datatypeObj,
        displayValue: content,
      };

      parsedRow[col.key].className = classnames(
        col.className,

        // any default classes defined by the cell's dataType
        col.dataType? this.params.dataTypes[col.dataType]?.className : null,

        // custom bool icons
        this.params.boolValuesClassName,
        this.params.boolTrueClassName && parsedRow[col.key].raw === true
          ? this.params.boolTrueClassName
          : null,
        this.params.boolFalseClassName && parsedRow[col.key].raw === false
          ? this.params.boolFalseClassName
          : null,

        // default icon styles
        !this.params.boolValuesClassName
          ? parsedRow[col.key].raw === true
            ? iconStyles.true
            : iconStyles.false
          : null
      );

      if(isTbody && !this.params.ajax) {
        parsedRow[col.key].searchingValue = col.searchValueCustomParser != null
          ? col.searchValueCustomParser(raw_content, this.params)
          : datatypeObj.searchValueParser
            ? datatypeObj.searchValueParser(raw_content, this.params)
            : String(raw_content);

        parsedRow[col.key].sortingValue = col.sortValueCustomParser != null
          ? col.sortValueCustomParser(raw_content, this.params)
          : datatypeObj.sortValueParser
            ? datatypeObj.sortValueParser(raw_content, this.params)
            : raw_content;
      }

    }); // end foreach

    return parsedRow;

  } catch(e) {
    console.error( e ); // eslint-disable-line
  }



}
