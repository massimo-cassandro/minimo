import { domBuilder, classnames } from '../../../index.js';
import * as styles from './snackbar.module.css';

/*
References
* https://web.dev/learn/css/popover-and-dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
* https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
* https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using

* https://m3.material.io/components/snackbar/guidelines

*/

export function snackbar(message, options = {}){

  options = {

    status       : null, // danger, warning, info, success
    duration     : 4000, // ms or false/null to avoid autoclose
    close_btn    : true, // true | false

    // TODO snackbar action
    action       : null, // null or function
    action_text  : null, // null or string

    ...options
  };

  domBuilder([
    {
      className: classnames(styles.snackbar, options.status? styles[`status-${options.status}`] : null),
      attrs: {
        popover: 'manual',
        role: options.action? 'alert' : 'status'
      },
      children: [
        {
          className: styles.text,
          content: message
        },
        {
          tag: 'button',
          attrs: {
            type: 'button',
          },
          className: classnames('btn-reset', styles.action),
          content: options.action_text?? '_action-text_',
          condition: options.action && (typeof options.action === 'function'),
          // callback: el => {}
        },
        {
          tag: 'button',
          className: classnames('btn-close', styles.closeBtn),
          attrs: {
            type: 'button',
          },
        }
      ]
    }
  ], document.body);

}

/*
export const NotificationCore = {

  createNotificationElement(message, options = {}) {



    const show = () => {
      document.body.appendChild(el);
      el.showPopover();
      setTimeout(() => hide(), duration);
    };

    const hide = () => {
      if (el.matches(':popover-open')) {
        el.hidePopover();
        el.remove(); // Pulizia del DOM
      }
    };

    return { el, show, hide };
  }
};




toast

import { NotificationCore } from './notifications.js';

export const toast = (message, type = 'info') => {
  const { el, show } = NotificationCore.createBase(message, { type, duration: 4000 });

  el.classList.add('ui-toast');

  show();
};


 */
