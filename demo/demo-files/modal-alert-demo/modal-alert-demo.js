import { modalAlert } from '@src/components/modal-alert/modal-alert.js';
import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';

import * as styles from './modal-alert-demo.module.css';

export function modalAlertDemo(){

  const root = document.getElementById('root')
    ,baseBtn = {
      tag: 'button',
      className: 'btn btn-primary',
      attrs: { type: 'button' }
    };

  domBuilder([
    {
      className: styles.demoButtons,
      children: [
        {
          ...baseBtn,
          content: 'alert success (with callback)',
          callback: el => {
            el.addEventListener('click', () => {
              modalAlert({
                type: 'success',
                mes: 'Lorem ipsum dolor sit amet',
                callback: () => alert('callback')
              });
            });
          }
        },

        {
          ...baseBtn,
          content: 'alert info',
          callback: el => {
            el.addEventListener('click', () => {
              modalAlert({
                type  : 'info',
                title: 'Info',
                mes: '<strong>Lorem ipsum</strong> dolor sit amet'
              });
            });
          }
        },

        {
          ...baseBtn,
          content: 'alert error',
          callback: el => {
            el.addEventListener('click', () => {
              modalAlert({
                type  : 'error',
                title: 'Error!',
                mes: '<strong>Lorem ipsum</strong> dolor sit amet'
              });
            });
          }
        },

        {
          ...baseBtn,
          content: 'alert error + extra btn',
          callback: el => {
            el.addEventListener('click', () => {
              modalAlert({
                type  : 'error',
                extraBtn: {
                  tag: 'button',
                  className: 'btn btn-danger',
                  content: 'extra btn',
                  attrs: {
                    type: 'button'
                  },
                  callback: el => {
                    el.addEventListener('click', () => {
                      window.alert('extra btn pressed');
                    });
                  }
                },
                extraBtnFocus: true,
              });
            });
          }
        },

        {
          ...baseBtn,
          content: 'alert warning',
          callback: el => {
            el.addEventListener('click', () => {
              modalAlert({
                type  : 'warning',
                mes: '<p>Quo dolorum cumque quo placeat aperiam doloribus dolorum animi. Sunt et dolores quas autem. Porro inventore ratione. Ex facere doloremque. Consectetur enim dolor. Sint ut facere quidem et et dicta natus itaque.</p> <p>Odit in eos repellat exercitationem tempore blanditiis voluptate. Dignissimos est tempora qui ducimus at et expedita esse.</p>'
              });
            });
          }
        },

        {
          ...baseBtn,
          content: 'alert confirm',
          callback: el => {
            el.addEventListener('click', () => {
              modalAlert({
                type  : 'confirm',
                title : 'Confirm',
                callback: result => {
                  // eslint-disable-next-line no-console
                  console.log('Result:', result);
                  alert(`${result? 'OK button or ENTER key' : 'Cancel button or ESC key'} pressed`);
                }
              });
            });
          }
        },

      ]
    }, // end demoButtons

    'h2 Buttons within forms:',

    {
      tag: 'form',
      callback: el => {

        el.addEventListener('submit', e => {
          let choiceIsNeeded = true;

          if(choiceIsNeeded) {
            e.preventDefault();
            modalAlert({
              type  : 'confirm',
              title: 'A choice is needed',
              mes: 'Some message...',
              okBtnText: 'Continue submit',
              cancelBtnText: 'Stop',

              callback: result => {
                if(result) {
                  alert('submit');
                  e.target.submit();
                } else {
                  alert('submit canceled');
                }
              }
            });
          }
        });
      },
      children: [
        {
          ...baseBtn,
          content: 'Confirm on form submit',
          attrs: {type: 'submit'}
        },
        'input[type: hidden, name:form_var, value: You can only see this if the form has been submitted]'
      ]
    }, // end form 1

    {
      tag: 'form',
      callback: el => {
        el.addEventListener('submit', e => {

          e.preventDefault();
          modalAlert({
            type  : 'error',
            title: 'Oh my! There is an error...',
            mes: 'Some message'
          });
        });
      },
      children: [
        {
          ...baseBtn,
          content: 'Error on form submit',
          attrs: {type: 'submit'}
        },
      ]
    }, // end form

  ], root);

}
