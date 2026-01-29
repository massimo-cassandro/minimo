import { domBuilder, classnames } from '@node_modules/@massimo-cassandro/js-utilities/index.js';
import { spinner } from '@minimo/spinner.js';
import * as styles from './modal-content.module.css?inline';




// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement

export function modalContent({

  /** iframe | content */
  mode = 'iframe',

  /** dialog extra class */
  dialogClassName = null,

  /** iframe url */
  iframeUrl = null,

  /** content string (markup) o array */
  content = null,

  /** content extra classname */
  contentClassName = null,

  /** dimensione modal: full, large, medium o small */
  size = 'large',

  /** padding: std (var(--spacing-md) 0) o none */
  padding = 'std'
}) {

  if(!['content', 'iframe'].includes(mode)) {
    throw `modalContent: parametro 'mode' non corretto (${mode})`;
  }
  if(!iframeUrl && mode === 'iframe') {
    throw 'modalContent: parametro `iframeUrl` mancante';
  }
  if(content == null && mode === 'content') {
    throw 'modalContent: parametro `content` mancante';
  }
  if(!['full', 'large', 'medium', 'small'].includes(size)) {
    throw `modalContent: parametro 'size' non corretto (${size})`;
  }
  if(!['std', 'none'].includes(padding)) {
    throw `modalContent: parametro 'padding' non corretto (${padding})`;
  }

  let dialog_element, dialog_inner, iframe_element = null, content_element = null;
  const iframeLoadEventHandler = () => {
    dialog_element.classList.add(styles.on);
  };

  if(!dialog_element) {

    domBuilder([
      {
        tag: 'dialog',
        className: styles.dialog,
        attrs: {
          'closedby': 'any'
        },
        children: [
          {
            tag: 'button',
            className: styles.closeButton, // TODO standardizzare close btn
            attrs: {
              'aria-label': 'Chiudi'
            }
          },
          {
            className: styles.dialogInner,
            children: [
              {
                className: styles.modalSpinner,
                content: spinner({container: null, withOverlay: false })
              }

            ]
          }
        ]
      }
    ], document.body);


    dialog_element = document.querySelector(`.${styles.dialog}`);
    dialog_inner = dialog_element.querySelector(`.${styles.dialogInner}`);

    dialog_element.querySelector(`.${styles.closeButton}`).addEventListener('click', () => {
      dialog_element.close();
    }, false);

    // listener chiusura
    dialog_element.addEventListener('close', () => {

      iframe_element?.removeEventListener('load', iframeLoadEventHandler, false);
      iframe_element?.remove();
      content_element?.remove();

      document.body.classList.remove('overflow-hidden');
      dialog_element.classList.remove(styles.on);
    }, false);

  }


  // aggiunta classi extra
  dialog_element.className = classnames(
    styles.dialog,
    dialogClassName,
    styles[`size-${size}`],
    styles[`padding-${padding}`]
  );

  domBuilder([
    {
      condition: mode === 'iframe',
      className: styles.iframeEl,
      tag: 'iframe',
      attrs: {
        src: ''
      }
    },
    {
      condition: mode === 'content',
      className: classnames(styles.contentEl, contentClassName),
      content: (content && !Array.isArray(content))? content : null,
      children: (content && Array.isArray(content))? content : null
    }
  ], dialog_inner);


  document.body.classList.add('overflow-hidden');
  dialog_element.showModal();
  dialog_element.focus();


  if(mode === 'iframe') {
    iframe_element = dialog_element.querySelector(`.${styles.iframeEl}`);
    iframe_element.src = iframeUrl;

    // listener load per i frame
    iframe_element?.addEventListener('load', iframeLoadEventHandler, false);


  } else if (mode === 'content') {
    content_element = dialog_element.querySelector(`.${styles.contentEl}`);
    dialog_element.classList.add(styles.on);
  }

}
