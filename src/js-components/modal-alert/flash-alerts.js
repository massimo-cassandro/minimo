import { mAlert } from './modal-alert.js';


/*
twig message labels:
  - success
  - notice
  - error
  - warning
*/
document.querySelectorAll('.flash-alert').forEach(item => {

  mAlert({
    // test
    // type  : 'confirm',
    // timer: null,

    type  : item.dataset.label === 'notice'? 'warning' : item.dataset.label,
    // title : item.message,
    mes   : item.dataset.message
    // use_warning_icon: true, // solo confirm
    // ok_btn_text: 'OK',
    // cancel_btn_text: 'Annulla',
    // callback: function(esito) {}, // confirm: console.log( esito? 'Confermato' : 'Annullato')
    // timer: 4000 // ms
    // extra_btn: '<button type="button" data-confirm-result="annulla" class="stop-btn btn btn-confirm">Annulla</button>',
    // extra_btn_selector: '.stop-btn',
    // extra_btn_focus: true,

  });

});
