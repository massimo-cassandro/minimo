import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';
import { spinner } from '../spinner/spinner.js';
import * as styles from './modal-popup.module.css';


// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement


// TODO testare la modalità iframe

let dialogEl, dialogContentEl;

function closeDialog() {
  dialogEl.classList.remove(styles.on);

  dialogEl.addEventListener('transitionend', () => {
    dialogEl.close();
  }, { once: true });
}

/**
 * modalPopup
 * Mostra un popup con il contenuto indicato
 * il contentuo può essere in forma di:
 *  - array domBuilder oppure plain text oppure HTML (parametro `content`)
 *  - contenuto caricato via Ajax  (parametri `ajaxUrl` e `ajaxCallback`)
 *  - iframe (parametro `iframeUrl`)
 *
 * in presenza di più impostazioni in conflitto, viene scelta la prima opzione utile
 * nell'ordine di priorità riportato nella lista precedente.
 */

export function modalPopup({

  /** dialog extra class */
  dialogExtraClassName = null,

  /** extra classname added to  dialogInner */
  contentExtraClassName = null,

  /** iframe url */
  iframeUrl = null,

  /** content: plain text, html or  domBuilder array */
  content = null,

  /** url ajax e relatuva funzione di callback.
   * Quest'ultima viene invocata con argomenti i dati restituiti dalla chiamata ajax
   * e con l''elemento contenitore (`ajaxCallback(data, dialogContentEl)`)
  */
  ajaxUrl = null,
  ajaxCallback = null,

  /** eventuale callback da invocare alla chiusra del dialog
   * Viene invocato con il le'elento dialog (`closeCallback(dialogEl)`)
   * NB: `dialogEl` viene eliminato subito dopo
   */
  closeCallback = null,
  addScrollbarPadding = false, // aggiunge un padding extra a destra per la barra di scorrimento

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

  domBuilder([
    {
      tag: 'dialog',
      className: classnames(styles.dialog, dialogExtraClassName, addScrollbarPadding && styles.scrollBarPadding),
      attrs: {
        'closedby': 'any'
      },
      callback: el => dialogEl = el,
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
                ...(mode === 'domBuilder'? content : []),
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
                      const response = await fetch(ajaxUrl),
                        data = await response.json();
                      el.innerHTML = '';
                      ajaxCallback(data, dialogContentEl);
                    })();

                  } catch(err) {
                    /* eslint-disable no-console */
                    console.error(ajaxUrl);
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


  // listener sul pulsante di chiusura
  dialogEl.querySelector(`.${styles.closeButton}`).addEventListener('click', () => {
    closeDialog();
  }, false);

  // // Esc e clic sul backdrop
  // dialogEl.addEventListener('cancel', (e) => {
  //   e.preventDefault();
  //   closeDialog();
  // }, false);



  dialogEl.addEventListener('close', () => {

    document.body.classList.remove('overflow-hidden');

    if(closeCallback) {
      closeCallback(dialogEl);
    }
    dialogEl.remove();

  }, false);


  document.body.classList.add('overflow-hidden');
  dialogEl.showModal();
  dialogEl.focus();

  dialogEl.classList.add(styles.on);


  return dialogEl;

}
