import buttons from './demo-files/buttons.html';
import datetime_test from './demo-files/datetime-fields-test.html';
import chartsHTML  from './demo-files/charts/charts.html';

/*
  Demo scripts are loaded with dynamic imports: every route gets its own webpack chunk, so the
  CSS imported by a demo (component CSS modules, demo stylesheets) is loaded only when that
  route is shown, instead of being bundled together for every page.
  `callback` may return a promise: demo.js waits for it before completing the page.
*/
export const routes = [
  {
    key: 'dom-builder',
    callback: () => import('./demo-files/domBuilder-demo.js').then(m => m.domBuilderDemo())
  },
  {
    key: 'snackbars',
    callback: () => import('./demo-files/snackbars-demo.js').then(m => m.snackbarsDemo())
  },
  {
    key: 'modalPopup',
    callback: () => import('./demo-files/modal-popup-demo/modal-popup-demo.js').then(m => m.modalPopupDemo())
  },
  {
    key: 'slide-Up-Down-Toggle',
    callback: () => import('./demo-files/slide-up-down-toggle-demo/slide-up-down-toggle-demo.js').then(m => m.slideUpDownToggleDemo())
  },
  {
    key: 'unsplash-page',
    callback: () => import('./demo-files/unsplash-page-demo/unsplash-page-demo.js').then(m => m.unsplashPageDemo()),
    fullPage: true
  },
  {
    key: 'modal-alert',
    callback: () => import('./demo-files/modal-alert-demo/modal-alert-demo.js').then(m => m.modalAlertDemo())
  },
  {
    key: 'json-table',
    callback: () => import('./demo-files/json-table/json-table-demo.js').then(m => m.jsonTableDemo())
  },
  {
    key: 'buttons',
    incl: buttons
  },
  {
    key: 'charts',
    incl: chartsHTML,
    callback: () => import('./demo-files/charts/charts-demo.js').then(m => m.chartsDemo())
  },
  {
    key: 'datetime-fields-test',
    title: 'Forms: date & time fields browser test',
    incl: datetime_test
  },
];
