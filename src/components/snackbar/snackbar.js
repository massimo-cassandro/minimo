import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';
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
// TODO handle multiple simultaneous snackbars (no stacking)

/**
 * Displays a snackbar / toast notification using the Popover API.
 * @param {string} message - The message to display.
 * @param {Object} [options={}]
 * @param {string | null} [options.status=null] - Status variant: `danger`, `warning`, `info`, or `success`.
 * @param {number | false | null} [options.duration=4000] - Auto-close delay in ms; `false` or `null` disables auto-close.
 * @param {boolean} [options.close_btn=true] - Whether to show the close button.
 * @param {Function | null} [options.action=null] - Action callback.
 * @param {string | null} [options.action_text=null] - Label for the action button.
 * @returns {{ close: function(): void }}
 */
export function snackbar(message, options = {}){

  options = {

    status       : null, // danger, warning, info, success
    duration     : 4000, // ms or false/null to avoid autoclose
    close_btn    : true, // true | false

    action       : null, // null or function
    action_text  : null, // null or string

    ...options
  };

  /** @type {HTMLElement | null} */
  let _popover = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let _timeoutID;
  let _isRemoving = false;

  const removePopover = () => {
    if (_isRemoving || !_popover?.matches(':popover-open')) return;
    _isRemoving = true; // prevents double-removal if called multiple times during the close animation

    if (_timeoutID) clearTimeout(_timeoutID);

    _popover?.classList.add(styles.isHiding);

    _popover?.addEventListener('animationend', () => {
      _popover?.hidePopover();
      _popover?.remove();
    }, { once: true }); // 'once' prevents duplicate listeners; the flag guards against calls before animation ends
  };

  _popover = domBuilder([
    {
      className: classnames(styles.snackbarOuter, options.status? styles[`status-${options.status}`] : null),
      attrs: {
        popover: 'manual',
        role: (options.action || (options.status != null && ['danger','warning'].includes(options.status))) ? 'alert' : 'status'
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

  _popover?.showPopover();


  if(options.duration) {
    const duration = options.duration; // const preserves narrowing inside closures
    _timeoutID = setTimeout(removePopover, duration);

    // pause the auto-close timeout on hover
    _popover?.addEventListener('mouseenter', () => clearTimeout(_timeoutID));
    _popover?.addEventListener('mouseleave', () => {
      _timeoutID = setTimeout(removePopover, duration);
    });

  }

  return {
    close: removePopover
  };
}
