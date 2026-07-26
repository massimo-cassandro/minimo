/*! minimo - Modal Alert */
import * as styles from './modal-alert.module.css';
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';

import successIcon from './svg/success.svg?inline';
import infoIcon from './svg/info.svg?inline';
import confirmIcon from './svg/confirm.svg?inline';
import warningIcon from './svg/warning.svg?inline';
import errorIcon from './svg/error.svg?inline';
import dangerIcon from './svg/danger.svg?inline';

// backward compatibility: legacy snake_case param names mapped to their camelCase equivalent
const legacyParamNames = {
  extra_class: 'extraClass',
  heading_class: 'headingClass',
  text_class: 'textClass',
  extra_btn: 'extraBtn',
  extra_btn_focus: 'extraBtnFocus',
  ok_btn_text: 'okBtnText',
  ok_btn_class: 'okBtnClass',
  cancel_btn_text: 'cancelBtnText',
  cancel_btn_class: 'cancelBtnClass',
  cancel_focus: 'cancelBtnFocus',
  use_warning_icon: 'useAltIcon'
};

const defaults = {

  // settings applied to all dialog types; can be overridden per type
  globals: {
    extraClass: null,
    onOpen: null,
    onClose: null,
    animation: true,
    showMarks: true,
    callback: null,
    timer: null,
    title: null,
    mes: null,
    headingClass: null,
    textClass: null,
    icon: null,
    altIcon: null,
    useAltIcon: false,
    type: null,

    // extra btn markup, ignored on confirm
    extraBtn: null,
    extraBtnFocus: true
  },

  success: {
    type: 'success',
    title: 'Operazione completata',
    okBtnText: 'OK',
    okBtnClass: 'btn btn-success',
    timer: 4000, // ms
    icon: successIcon
  },
  error: {
    type: 'error',
    title: 'Si è verificato un errore',
    okBtnText: 'OK',
    okBtnClass: 'btn btn-danger',
    icon: errorIcon
  },
  warning: {
    type: 'warning',
    title: 'Attenzione!',
    okBtnText: 'OK',
    okBtnClass: 'btn btn-warning',
    icon: warningIcon,
    altIcon: dangerIcon,
    useAltIcon: false // when true, uses altIcon (danger) instead of the default warning icon
  },
  info: {
    type: 'info',
    title: null,
    okBtnText: 'OK',
    okBtnClass: 'btn btn-info',
    icon: infoIcon
  },
  confirm: {
    type: 'confirm',
    title: 'Confermi?',
    okBtnText: 'OK',
    cancelBtnText: 'Annulla',
    cancelBtnFocus: true, // false to give focus to the ok button
    okBtnClass: 'btn btn-primary',
    cancelBtnClass: 'btn btn-primary btn-hollow',
    icon: confirmIcon,
    altIcon: warningIcon,
    useAltIcon: false // when true, uses altIcon (warning) instead of the default confirm icon
  }

};

/**
 * @typedef {Object} ModalAlertParams
 * @property {string} [type] - Dialog type: `success`, `error`, `warning`, `info`, or `confirm`.
 * @property {string | null} [extraClass] - optional dialog extra class
 * @property {(() => void) | null} [onOpen] - optional callback on dialog open
 * @property {(() => void) | null} [onClose] - optional callback on dialog close
 * @property {boolean} [animation] - if true, dialog will be animated
 * @property {boolean} [showMarks] - if true, mark iconswill be showed
 * @property {((arg?: *) => void) | null} [callback] - optional callback dialog after user choice
 * @property {number | null} [timer] - timer for autoclose (ms). `null` for disable
 * @property {string | null} [title] - title text
 * @property {string | null} [mes] - text message (plain or html)
 * @property {string | null} [headingClass] - optional extra class for heading
 * @property {string | null} [textClass] - optional extra class for text
 * @property {string | null} [icon] - Icon markup used for the dialog; defaults to the type's icon.
 * @property {string | null} [altIcon] - Alternate icon markup, used instead of `icon` when `useAltIcon` is `true`.
 * @property {boolean} [useAltIcon] - When `true`, uses `altIcon` instead of `icon` (e.g. the `danger` icon on a `warning` dialog, or the `warning` icon on a `confirm` dialog).
 * @property {DomBuilderItem | null} [extraBtn] - optional extra button (as domBuilder object)
 * @property {boolean} [extraBtnFocus] - true if the extra button should be focused when the dialog box opens (overrides any focus assigned to the 'cancel' button)
 * @property {string} [okBtnText] - text for 'ok' button
 * @property {string} [okBtnClass] - alternative class for 'ok' button. It replaces the default one
 * @property {string} [cancelBtnText] - text for 'cancel' button
 * @property {string} [cancelBtnClass] - alternative class for 'cancel' button. It replaces the default one
 * @property {boolean} [cancelBtnFocus] - true if the cancel button should be focused when the dialog box opens. It has no effect if an extraBtn is set
 */

/**
 * Renders and opens a modal alert dialog.
 *
 * Backward compatibility: legacy snake_case parameter names (`extra_class`, `heading_class`,
 * `text_class`, `extra_btn`, `extra_btn_selector`, `extra_btn_focus`, `ok_btn_text`,
 * `ok_btn_class`, `cancel_btn_text`, `cancel_btn_class`, `cancel_focus`, `use_warning_icon`)
 * are still accepted and internally mapped to their camelCase equivalent, see `legacyParamNames`.
 *
 * @param {ModalAlertParams} params - Dialog parameters (merged with defaults by type).
 * @returns {Promise<string | boolean | undefined>} Resolves when the dialog closes. If the
 *   dismissing button has a `data-malert-result` attribute, that string is used; otherwise, for
 *   `confirm` dialogs, resolves `true`/`false` for the OK/Cancel button; otherwise `undefined`.
 */
export function modalAlert(params = {}) {

  return new Promise((resolve) => {

    try {

      // garbage collection
      document.querySelector('.modal-alert')?.remove();

      // backward compatibility: map legacy snake_case keys to their camelCase equivalent
      const rawParams = /** @type {Record<string, any>} */ (params);
      Object.entries(legacyParamNames).forEach(([legacyKey, newKey]) => {
        if(legacyKey in rawParams && !(newKey in rawParams)) {
          rawParams[newKey] = rawParams[legacyKey];
        }
      });

      const typedDefaults = /** @type {Record<string, any>} */ (defaults);

      params = /** @type {ModalAlertParams} */ ({
        ...(typedDefaults.globals ?? {}),
        ...(typedDefaults[params.type ?? ''] ?? {}),
        ...params
      });

      // backwards compatibility: 'danger' is an alias for 'error'
      if(params.type === 'danger') {
        params.type = 'error';
      }

      if(!params.type || Object.keys(defaults).filter(item => item !== 'globals').indexOf(params.type) === -1) {
        throw 'Missing or incorrect `type` parameter';
      }

      if(params.callback && typeof params.callback !== 'function') {
        throw 'Incorrect `callback` parameter';
      }
      if(params.onOpen && typeof params.onOpen !== 'function') {
        throw 'Incorrect `onOpen` parameter';
      }
      if(params.onClose && typeof params.onClose !== 'function') {
        throw 'Incorrect `onClose` parameter';
      }

      /** @type {HTMLElement | undefined} */
      let okBtn;
      /** @type {HTMLElement | undefined} */
      let cancelBtn;
      /** @type {HTMLElement | undefined} */
      let extraBtn;

      const focusTarget =  (params.extraBtn != null && params.extraBtnFocus)
        ? 'extra'
        : (params.type === 'confirm' && params.cancelBtnFocus)
          ? 'cancel'
          : 'ok';

      console.log(params);

      const dialog = /** @type {HTMLDialogElement} */ (domBuilder([
        {
          tag: 'dialog',
          className: classnames(
            styles.malert,
            styles[params.type],
            params.animation && styles.mAnimated,
            params.extraClass
          ),
          attrs: {
            closedBy: ['success', 'info'].includes(params.type)? 'any' : null
          },
          children: [
            {
              className: styles.innerWrapper,
              children: [
                {
                  condition: params.showMarks,
                  className: styles.mMark,
                  content: (params.useAltIcon && params.altIcon)? params.altIcon : params.icon
                },
                {
                  className: styles.mBody,
                  children: [
                    {
                      condition: !!params.title,
                      className: classnames(styles.mHeading, params.headingClass),
                      content: params.title
                    },
                    {
                      className: classnames(styles.mText, params.textClass),
                      content: params.mes
                    },
                    {
                      className: styles.mBtns,
                      children: [
                        {
                          tag: 'button',
                          className: params.okBtnClass? params.okBtnClass : 'btn btn-primary',
                          content: params.okBtnText,
                          attrs: {
                            type: 'button',
                            autofocus: focusTarget === 'ok'
                          },
                          callback: el => okBtn = el
                        },
                        {
                          condition: params.type === 'confirm',
                          tag: 'button',
                          className: params.cancelBtnClass? params.cancelBtnClass : 'btn btn-secondary btn-hollow',
                          content: params.cancelBtnText,
                          attrs: {
                            type: 'button',
                            autofocus: focusTarget === 'cancel'
                          },
                          callback: el => cancelBtn = el
                        },
                        {
                          ...(params.extraBtn?? {}),
                          condition: params.extraBtn != null,
                          callback: el => {
                            extraBtn = el;
                            if(typeof params.extraBtn?.callback === 'function') {
                              params.extraBtn.callback(el);
                            }
                          },
                          attrs: {
                            ...(params.extraBtn?.attrs?? {}),
                            autofocus: focusTarget === 'extra'
                          }
                        },
                      ]
                    },
                  ]
                }
              ]
            }
          ]

        }
      ], document.body));

      dialog.showModal();

      if(params.onOpen && typeof params.onOpen === 'function') {
        params.onOpen();
      }

      /** @type {number | undefined} */
      let timeoutID;

      /**
       * @param {HTMLElement | null} [btn]
       * @returns {void}
       */
      const dialogDismiss = (btn = null) => {
        dialog.remove();

        if(params.onClose && typeof params.onClose === 'function') {
          params.onClose();
        }

        // If present, the resolved/callback argument is `btn.dataset.malertResult`
        // Otherwise, if the modal type is `confirm`, it is `true` for the OK button, `false` for the Cancel button
        // Otherwise, for all other modal types, it is `undefined`
        let arg;
        if(btn) {
          if(btn.dataset?.malertResult) {
            arg = btn.dataset.malertResult;

          } else if(params.type === 'confirm') {
            arg = btn.classList.contains('malert-ok');
          }
        }

        if(params.callback && typeof params.callback === 'function') {
          params.callback(arg);
        }
        resolve(arg);

        if(timeoutID) {
          window.clearTimeout(timeoutID);
        }
      };

      if( params.timer != null && params.type !== 'confirm') {
        timeoutID = window.setTimeout( function() {
          dialogDismiss();
        }, params.timer);
      }

      dialog.addEventListener('close', () => {
        dialogDismiss();
      }, false);

      [okBtn, cancelBtn, ...(extraBtn? [extraBtn] : [])].forEach(btn => {

        btn?.addEventListener('click', () => {
          dialogDismiss(btn);
        }, false);

      });


    } catch(e) {
      console.error( '[modal-alert] ' + e ); // eslint-disable-line
      resolve(undefined);
    }

  });

}
