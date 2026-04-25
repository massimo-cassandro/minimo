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

// TODO snackbar action
// TODO gestione snackbar multiple (NO stacking)


export function snackbar(message, options = {}){

  options = {

    status       : null, // danger, warning, info, success
    duration     : 6000, // ms or false/null to avoid autoclose
    close_btn    : true, // true | false

    action       : null, // null or function
    action_text  : null, // null or string

    ...options
  };

  let _popover, _timeoutID;

  const removePopover = () => {
    if (_popover?.matches(':popover-open')) {
      if (_timeoutID) clearTimeout(_timeoutID);

      _popover.classList.add(styles.isHiding);

      _popover.addEventListener('animationend', () => {
        _popover.hidePopover();
        _popover.remove();
      }, { once: true });
    }
  };

  _popover = domBuilder([
    {
      className: classnames(styles.snackbarOuter, options.status? styles[`status-${options.status}`] : null),
      attrs: {
        popover: 'manual',
        role: (options.action || ['danger','warning'].includes(options.status)) ? 'alert' : 'status'
      },
      children: [
        {
          className: styles.snackbar,
          children: [
            {
              // className: styles.text,
              content: message
            },
            {
              condition: options.action != null && (typeof options.action === 'function'),
              tag: 'button',
              attrs: {
                type: 'button',
              },
              className: classnames('btn-reset', styles.action),
              content: options.action_text?? '_action-text_',
            },
            {
              tag: 'button',
              className: classnames('btn-close', styles.closeBtn),
              attrs: {
                type: 'button',
              },
              callback: el => el.addEventListener('click', () => removePopover())
            }
          ]
        }
      ]
    }
  ], document.body);

  _popover.showPopover();


  if(options.duration) {
    _timeoutID = setTimeout(removePopover, options.duration);

    // mette in pausa il timeout sull'hover
    _popover.addEventListener('mouseenter', () => clearTimeout(_timeoutID));
    _popover.addEventListener('mouseleave', () => {
      _timeoutID = setTimeout(removePopover, options.duration);
    });

  }
}
