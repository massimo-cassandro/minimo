import buttons from './demos/buttons.html';
import datetime_test from './demos/datetime-fields-test.html';
import { snackbarsDemo } from './demos/snackbars-demo.js';
import { domBuilderDemo } from './demos/domBuilder-demo.js';

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
    key: 'datetime-fields-test',
    title: 'Forms: date & time fields browser test',
    incl: datetime_test
  },
];
