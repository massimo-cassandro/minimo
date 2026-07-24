import buttons from './demo-files/buttons.html';
import datetime_test from './demo-files/datetime-fields-test.html';
import { snackbarsDemo } from './demo-files/snackbars-demo.js';
import { domBuilderDemo } from './demo-files/domBuilder-demo.js';
import { modalPopupDemo } from './demo-files/modal-popup-demo.js';
import { slideUpDownToggleDemo } from './demo-files/slide-up-down-toggle-demo/slide-up-down-toggle-demo.js';
import { unsplashPageDemo } from './demo-files/unsplash-page-demo/unsplash-page-demo.js';
import { modalAlertDemo } from './demo-files/modal-alert-demo/modal-alert-demo.js';

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
    key: 'modalPopup',
    callback: modalPopupDemo
  },
  {
    key: 'slide-Up-Down-Toggle',
    callback: slideUpDownToggleDemo
  },
  {
    key: 'unsplash-page',
    callback: unsplashPageDemo,
    fullPage: true
  },
  {
    key: 'modal-alert',
    callback: modalAlertDemo,
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
