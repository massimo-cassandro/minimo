import mAlert from '../src/modal-alert.js';

const custom_defaults = {

  //settings to be applied to all dialog types
  globals: {
    onOpen: () => {
      // console.log('open'); // eslint-disable-line
      document.body.classList.add('modal-alert-is-open');
    },
    onClose: () => {
      // console.log('close'); // eslint-disable-line
      document.body.classList.remove('modal-alert-is-open');
    },
    cssFile: null
  },

  success: {
    title: 'Done!',
    mes: null,
    ok_btn_text: 'OK',
    heading_class: 'text-success',
    ok_btn_class: 'btn',
    timer: 4000, // ms
  },
  error: {
    title: 'An error has occurred',
    mes: null,
    ok_btn_text: 'OK',
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn',
    timer: null,
  },
  warning: {
    title: 'Attention!',
    mes: null,
    ok_btn_text: 'OK',
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn',
    timer: null,
  },
  info: {
    title: null,
    mes: null,
    ok_btn_text: 'OK',
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn',
    timer: null,
  },
  confirm: {
    title: 'Do you confirm?',
    mes: null,
    ok_btn_text: 'OK',
    cancel_btn_text: 'Cancel',
    cancel_focus: true, // false to give focus to the ok button
    heading_class: null,
    text_class: null,
    ok_btn_class: 'btn btn-outline',
    cancel_btn_class: 'btn',
    callback: null,
    timer: null,
  }
};

document.querySelector('.demo-success').addEventListener('click', () => {
  mAlert({
    type  : 'success',
    mes: 'Lorem ipsum dolor sit amet',
    callback: () => alert('callback')
  }, custom_defaults);
}, false);

document.querySelector('.demo-info').addEventListener('click', () => {
  mAlert({
    type  : 'info',
    title: 'Info',
    mes: '<strong>Lorem ipsum</strong> dolor sit amet'
  }, custom_defaults);
}, false);

document.querySelector('.demo-error').addEventListener('click', () => {
  mAlert({
    type  : 'error'
  }, custom_defaults);
}, false);

document.querySelector('.demo-error-extra-btn').addEventListener('click', () => {
  mAlert({
    type  : 'error',
    ok_btn_class: 'btn btn-error btn btn-outline',
    extra_btn: '<button type="button" data-malert-result="extra-btn-result" class="btn btn-error extra-btn">Extra btn</button>',
    extra_btn_selector: '.extra-btn',
    extra_btn_focus: true,
    callback: result => alert(result === 'extra-btn-result'? 'Extra button pressed' : 'OK button pressed')
  }, custom_defaults);
}, false);

document.querySelector('.demo-warning').addEventListener('click', () => {
  mAlert({
    type  : 'warning',
    mes: '<p>Quo dolorum cumque quo placeat aperiam doloribus dolorum animi. Sunt et dolores quas autem. Porro inventore ratione. Ex facere doloremque. Consectetur enim dolor. Sint ut facere quidem et et dicta natus itaque.</p> <p>Odit in eos repellat exercitationem tempore blanditiis voluptate. Dignissimos est tempora qui ducimus at et expedita esse.</p>'
  }, custom_defaults);
}, false);

document.querySelector('.demo-confirm').addEventListener('click', () => {
  mAlert({
    type  : 'confirm',
    callback: result => alert(`${result? 'OK' : 'Cancel'} button pressed`)
  }, custom_defaults);
}, false);


// forms
// Confirm on form submit
document.getElementById('test-form').addEventListener('submit', e => {
  let choiceIsNeeded = true;

  if(choiceIsNeeded) {
    e.preventDefault();
    mAlert({
      type  : 'confirm',
      title: 'A choice is needed',
      mes: 'Some message...',
      ok_btn_text: 'Continue submit',
      cancel_btn_text: 'Stop',
      callback: result => {
        if(result) {
          alert('submit');
          e.target.submit();
        } else {
          alert('submit canceled');
        }
      }
    }, custom_defaults);
  }

}, false);

// Error on form submit
document.getElementById('test-form2').addEventListener('submit', e => {
  let isError = true;

  if(isError) {
    e.preventDefault();
    mAlert({
      type  : 'error',
      title: 'Oh my! There is an error...',
      mes: 'Some message'
    }, custom_defaults);
  }

}, false);
