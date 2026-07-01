import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';
import { spinner } from '../spinner/spinner.js';
import * as styles from './modal-popup.module.css';


// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement


// TODO test iframe mode

/** @type {HTMLDialogElement | undefined} */
let dialogEl;
/** @type {HTMLElement | undefined} */
let dialogContentEl;

/**
 * @param {HTMLDialogElement} el
 * @returns {void}
 */
function closeDialog(el) {
  el.classList.remove(styles.on);

  el.addEventListener('transitionend', () => {
    el.close();
  }, { once: true });
}

/**
 * modalPopup
 * Opens a popup dialog with the given content.
 *
 * Content can be provided as:
 *  - a domBuilder array, plain text, or HTML (via `content`)
 *  - content loaded via Ajax (via `ajaxUrl` and `ajaxCallback`)
 *  - an iframe (via `iframeUrl`)
 *
 * When multiple options conflict, the first applicable one in the list above takes precedence.
 *
 * @param {Object} params
 * @param {string | null} [params.dialogExtraClassName=null] - Extra class added to the dialog element.
 * @param {string | null} [params.contentExtraClassName=null] - Extra class added to the content wrapper.
 * @param {string | null} [params.iframeUrl=null] - URL to load in an iframe.
 * @param {string | any[] | null} [params.content=null] - Plain text, HTML, or a domBuilder array.
 * @param {string | null} [params.ajaxUrl=null] - URL for Ajax content loading.
 * @param {((data: *, el: Element) => void) | null} [params.ajaxCallback=null] - Called with the Ajax response and the content element.
 * @param {((el: HTMLDialogElement) => void) | null} [params.closeCallback=null] - Called with the dialog element just before it is removed.
 * @param {boolean} [params.addScrollbarPadding=false] - Adds right padding to compensate for the scrollbar.
 * @param {string | null} [params.headerContent=null] - Header content: plain text or HTML.
 * @param {string | null} [params.footerContent=null] - Footer content: plain text or HTML.
 * @returns {HTMLDialogElement} The dialog element.
 */
export function modalPopup({

  /** dialog extra class */
  dialogExtraClassName = null,

  /** extra classname added to dialogInner */
  contentExtraClassName = null,

  /** iframe url */
  iframeUrl = null,

  /** content: plain text, html or domBuilder array */
  content = null,

  /** Ajax url and callback.
   * The callback is invoked with the response data and the content container element
   * (`ajaxCallback(data, dialogContentEl)`)
  */
  ajaxUrl = null,
  ajaxCallback = null,

  /** optional callback invoked when the dialog closes;
   * receives the dialog element (`closeCallback(dialogEl)`)
   * NB: `dialogEl` is removed immediately after
   */
  closeCallback = null,
  addScrollbarPadding = false, // adds extra right padding to compensate for the scrollbar

  /** header content: plain text or HTML */
  headerContent = null,

  /** footer content: plain text or HTML  */
  footerContent = null,
}) {



  if(content == null && (ajaxUrl == null || ajaxCallback == null) && iframeUrl == null) {
    throw '[modalContent] parametri `content`, `ajaxUrl`/ `ajaxCallback` e `iframeUrl` mancanti';
  }

  let mode;
  if(content != null && Array.isArray(content)) {
    mode = 'domBuilder';

  } else if (content != null) {
    mode = 'html';

  } else if (ajaxUrl != null && ajaxCallback != null) {
    mode = 'ajax';

  } else {
    mode = 'iframe';
  }

  // capture for use in the ajax callback closure (ajaxUrl is non-null when mode === 'ajax')
  const safeAjaxUrl = /** @type {string} */ (ajaxUrl);

  domBuilder([
    {
      tag: 'dialog',
      className: classnames(styles.dialog, dialogExtraClassName, addScrollbarPadding && styles.scrollBarPadding),
      attrs: {
        'closedby': 'any'
      },
      callback: el => { dialogEl = /** @type {HTMLDialogElement} */ (el); },
      children: [
        {
          tag: 'button',
          className: classnames('btn-close', styles.closeButton),
          attrs: {
            type: 'button',
            'aria-label': 'Chiudi'
          }
        },
        {
          className: styles.contentWrapper,
          children: [
            {
              className: styles.header,
              condition: headerContent != null,
              content: headerContent
            },
            {
              className: classnames(styles.content, contentExtraClassName),

              content: mode === 'html'
                ? content
                : mode === 'ajax'
                  ? spinner()
                  : null,

              children: [
                ...(mode === 'domBuilder'? /** @type {any[]} */ (content) : []),
                {
                  condition: mode === 'iframe',
                  className: styles.iframe,
                  tag: 'iframe',
                  attrs: {
                    src: iframeUrl
                  }
                }
              ],
              callback: el => {
                dialogContentEl = el;

                if(mode === 'ajax') {
                  try {

                    (async () => {
                      const response = await fetch(safeAjaxUrl),
                        data = await response.json();
                      el.innerHTML = '';
                      ajaxCallback?.(data, dialogContentEl);
                    })();

                  } catch(err) {
                    /* eslint-disable no-console */
                    console.error(safeAjaxUrl);
                    console.error(err);
                    /* eslint-enable no-console */
                  }
                }

              },
            },
            {
              className: styles.footer,
              condition: footerContent != null,
              content: footerContent
            },
          ]
        }
      ]
    }
  ], document.body);

  // snapshot: dialogEl could be overwritten by a subsequent modalPopup call
  const thisDialog = /** @type {HTMLDialogElement} */ (dialogEl);

  // close button listener
  thisDialog.querySelector(`.${styles.closeButton}`)?.addEventListener('click', () => {
    closeDialog(thisDialog);
  }, false);

  // // Esc and backdrop click
  // thisDialog.addEventListener('cancel', (e) => {
  //   e.preventDefault();
  //   closeDialog(thisDialog);
  // }, false);



  thisDialog.addEventListener('close', () => {

    document.body.classList.remove('overflow-hidden');

    if(closeCallback) {
      closeCallback(thisDialog);
    }
    thisDialog.remove();

  }, false);


  document.body.classList.add('overflow-hidden');
  thisDialog.showModal();
  thisDialog.focus();

  thisDialog.classList.add(styles.on);


  return thisDialog;

}
