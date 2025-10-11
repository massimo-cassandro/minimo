import { domBuilder, classnames } from '@node_modules/@massimo-cassandro/js-utilities/index.js';
import { spinner } from '@minimo/spinner.js';
import * as styles from './modal-iframe.module.css?inline';




// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement

export function modalIframe({
  /** iframe url */
  url,

  /** dimensione modal: full, medium o small */
  size = 'full',

  /** padding: std (var(--spacing-md) 0) o none */
  padding = 'std'
}) {

  if(!url) {
    throw 'modalIframe: missing url';
  }
  if(!['full', 'medium', 'small'].includes(size)) {
    throw `modalIframe: incorrect size (${size})`;
  }
  if(!['std', 'none'].includes(padding)) {
    throw `modalIframe: incorrect padding (${padding})`;
  }

  let dialog_element = null, iframe;

  if(!dialog_element) {

    domBuilder([
      {
        tag: 'dialog',
        className: styles.modalIframe,
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
            className: styles.modalIframeInner,
            children: [
              {
                className: styles.modalSpinner,
                content: spinner({container: null, withOverlay: false })
              },
              {
                tag: 'iframe',
                attrs: {
                  src: ''
                }
              }
            ]
          }
        ]
      }
    ], document.body);

    dialog_element = document.querySelector(`.${styles.modalIframe}`);
    iframe = dialog_element.querySelector('iframe');

    dialog_element.querySelector(`.${styles.closeButton}`).addEventListener('click', () => {
      dialog_element.close();
    }, false);

    dialog_element.addEventListener('close', () => {
      iframe.src = '';
      document.body.classList.remove('overflow-hidden');
      dialog_element.classList.remove(styles.on);
    }, false);

    iframe.addEventListener('load', () => {
      dialog_element.classList.add(styles.on);
    }, false);

  }

  // aggiunta classi extra
  dialog_element.className = classnames(
    styles.modalIframe,
    styles[`size-${size}`],
    styles[`padding-${padding}`]
  );

  iframe.src = url;
  document.body.classList.add('overflow-hidden');
  dialog_element.showModal();
  iframe.focus();
}
