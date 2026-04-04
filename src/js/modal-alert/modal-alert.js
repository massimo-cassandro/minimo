// import './modal-alert.css'; // importato direttamente dal css principale per ottimizzarne l'uso

import modalAlert from '@massimo-cassandro/modal-alert';

import checkIcon from './svg/check-circle-duotone.svg?inline';
import infoIcon from './svg/info-duotone.svg?inline';
import confirmIcon from './svg/question-duotone.svg?inline';
import warningIcon from './svg/warning-duotone.svg?inline';
import errorIcon from './svg/x-circle-duotone.svg?inline';

const custom_defaults = {

  globals: {
    onOpen: () => {
      document.body.classList.add('overflow-hidden');
    },
    onClose: () => {
      document.body.classList.remove('overflow-hidden');
    },
    cssFile: null,
    animation: true,
    showMarks: true,
  },

  success: {
    title: 'Operazione completata',
    mes: null,
    ok_btn_text: 'OK',
    heading_class: null,
    ok_btn_class: 'btn btn-success',
    timer: 4000, // ms
  },
  error: {
    title: 'Si è verificato un errore',
    mes: null,
    ok_btn_text: 'OK',
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn btn-danger',
    timer: null,
  },
  warning: {
    title: 'Attenzione!',
    mes: null,
    ok_btn_text: 'OK',
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn btn-warning',
    timer: null,
  },
  info: {
    title: null,
    mes: null,
    ok_btn_text: 'OK',
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn btn-info',
    timer: null,
  },
  confirm: {
    title: 'Confermi?',
    mes: null,
    ok_btn_text: 'OK',
    cancel_btn_text: 'Cancel',
    cancel_focus: true, // false to give focus to the ok button
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn btn-warning',
    cancel_btn_class: 'btn btn-outline-secondary',
    callback: null,
    timer: null
  }
};

const marks = {
  success: checkIcon,
  error: errorIcon,
  warning: warningIcon,
  info: infoIcon,
  confirm: confirmIcon
};

export function mAlert(params) {
  modalAlert(params, custom_defaults, marks);
}
