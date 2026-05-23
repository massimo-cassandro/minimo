import buttons from './demo-files/buttons.html';
import datetime_test from './demo-files/datetime-fields-test.html';
import { snackbarsDemo } from './demo-files/snackbars-demo.js';
import { domBuilderDemo } from './demo-files/domBuilder-demo.js';

import chartsHTML  from './demo-files/charts/charts.html';
import { chartsDemo } from './demo-files/charts/charts-demo.js';

export const routes = [
  {
    key: 'dom-builder',
    callback: domBuilderDemo
  },
  {
    key: 'snackbars',
    callback: snackbarsDemo
  },
  {
    key: 'buttons',
    incl: buttons
  },
  {
    key: 'charts',
    incl: chartsHTML,
    callback: chartsDemo
  },
  {
    key: 'datetime-fields-test',
    title: 'Forms: date & time fields browser test',
    incl: datetime_test
  },
];
