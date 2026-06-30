/**
 * JsonTable
 * build a table from a static or ajax-imported JSON object.
 *
 * @param {object} params - parametri di configurazione.
 * @author Massimo Cassandro
 */

import './css/custom-media.css';

import { initStaticTable } from './js/init-static-table.js';
import { initAjaxTable } from './js/init-ajax-table.js';
import { getAjaxData } from './js/get-ajax-data.js';

import { parseParams } from './js/parse-params.js';
import { parseDataRow } from './js/parse-data-row.js';
import { mainBuilder } from './js/main-builder.js';
import { infoSection } from './js/info-section.js';
import { tableBuilder } from './js/table-builder.js';
import { tableThead } from './js/table-thead.js';
import { tableTfoot } from './js/table-tfoot.js';
import { tableRow } from './js/table-row.js';
import { updateInfo } from './js/update-info.js';
import { setSearchListener } from './js/set-search-listener.js';
import { setSortListeners } from './js/set-sort-listeners.js';
// import { staticDataSorting } from './js/static-data-sorting.js';

class JsonTable {

  constructor(custom_params, custom_data_types) {
    this.params = parseParams({
      custom_params: custom_params,
      custom_data_types: custom_data_types,
    });

    if(this.params.err) {
      // eslint-disable-next-line no-console
      console.error(this.params.err);

    } else {

      this.appInit();
    }

  }

  async appInit() {

    if(this.params.ajax === false) {
      this.initStaticTable();

    } else {
      await this.initAjaxTable();
    }

    // Add aria attributes to icons
    // and convert all icon variables to DOM nodes (if they aren't)
    const div = document.createElement('div');
    [
      'boolTrueIcon',
      'boolFalseIcon',
      'sortArrowIcon'
    ].forEach(icon => {
      if(this.params[icon] instanceof Element) {
        div.replaceChildren(this.params[icon]);
      } else {
        div.innerHTML = this.params[icon] || 'missing icon';
      }

      div.querySelector('svg').setAttribute('aria-hidden', true);

      this.params[icon] = div.firstElementChild;

    });
    div.remove();

    this.mainBuilder();

    if(this.params.debug) {
      /* eslint-disable no-console */
      console.groupCollapsed('JsonTable params & elements');
      console.log('this.params');
      console.log(this.params);
      console.log('generated elements (this.params.elements)');
      console.log(this.params.elements);
      console.log('this.parsedData (static table only)');
      console.log(this.parsedData?? 'n/a');
      console.groupEnd();
      /* eslint-enable no-console */
    }
  }
}

JsonTable.prototype.initStaticTable = initStaticTable;
JsonTable.prototype.initAjaxTable = initAjaxTable;
JsonTable.prototype.getAjaxData = getAjaxData;
JsonTable.prototype.parseDataRow = parseDataRow;
JsonTable.prototype.mainBuilder = mainBuilder;
JsonTable.prototype.infoSection = infoSection;
JsonTable.prototype.tableBuilder = tableBuilder;
JsonTable.prototype.tableThead = tableThead;
JsonTable.prototype.tableTfoot = tableTfoot;
JsonTable.prototype.tableRow = tableRow;
JsonTable.prototype.updateInfo = updateInfo;
JsonTable.prototype.setSearchListener = setSearchListener;
JsonTable.prototype.setSortListeners = setSortListeners;
// JsonTable.prototype.staticDataSorting = staticDataSorting;

export default JsonTable;


// TODO opzione per acquisire i dati dal markup di una tabella
// TODO local storage per opzioni di ordinamento e ricerca
// TODO Alternativa excel : https://gitlab.com/catamphetamine/write-excel-file ??
// TODO jsdoc
// TODO opzione per usare parametri più semplici non compatibili con dt
// TODO add parse cell method (unificare tipi con static Table)
// TODO versione con css separato?

// TODO see:
// https://www.raymondcamden.com/2022/05/23/building-table-sorting-and-pagination-in-a-web-component
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table?retiredLocale=it#table_sorting
// https://pencilandpaper.io/articles/user-experience/ux-pattern-analysis-enterprise-data-tables/
// https://medium.com/design-with-figma/the-ultimate-guide-to-designing-data-tables-7db29713a85a
// https://medium.com/nextux/design-better-data-tables-4ecc99d23356
