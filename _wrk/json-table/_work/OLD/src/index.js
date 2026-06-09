/**
 * JsonTable
 * build a table from a static or ajax-imported JSON object.
 *
 * @param {object} params - parametri di configurazione.
 * @author Massimo Cassandro
 */

import { parseParams } from './js/parse-params';
import { mainBuilder } from './js/main-builder';
import { infoSection } from './js/info-section';
import { tableBuilder } from './js/table-builder';
import { tableHead } from './js/table-head';
import { tableFoot } from './js/table-foot';
import { tableRow } from './js/table-row';
import { setColumClassname } from './js/set-column-classname';


class JsonTable {

  constructor(custom_params, custom_data_types) {
    this.params = parseParams({
      custom_params: custom_params,
      custom_data_types: custom_data_types,
    });

    if(this.params.debug) {
      /* eslint-disable no-console */
      console.groupCollapsed('JsonTable params');
      console.log(this.params);
      console.groupEnd();
      /* eslint-enable no-console */
    }


    if(this.params.err) {
      // eslint-disable-next-line no-console
      console.error(this.params.err);

    } else {
      this.build();

    }
  }

}

JsonTable.prototype.build = mainBuilder;
JsonTable.prototype.infoSection = infoSection;
JsonTable.prototype.tableBuilder = tableBuilder;
JsonTable.prototype.tableHead = tableHead;
JsonTable.prototype.tableFoot = tableFoot;
JsonTable.prototype.tableRow = tableRow;
JsonTable.prototype.setColumClassname = setColumClassname;

export default JsonTable;
