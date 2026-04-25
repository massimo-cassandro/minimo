import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';
import { snackbar } from '@src/components/snackbar/snackbar.js';

export function snackbarsDemo(){
  const root = document.getElementById('root'),
    btns = {};

  domBuilder([
    {
      tag: 'button',
      attrs: {
        type: 'button',
        class: 'btn btn-primary'
      },
      content: 'Snackbar 1 (toast) (duration: 8 sec.)',
      callback: el => btns.toast = el
    }
  ], root);

  btns.toast.addEventListener('click', () => {
    snackbar('Toast message'), {duration: 8000};
  });

}
