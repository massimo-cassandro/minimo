/*! minimo - Modal Popup */
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';
import { spinner } from '../spinner/spinner.js';
import * as styles from './modal-popup.module.css';


// https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement


// TODO testare la modalità iframe

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
 * Racchiude in un array un singolo oggetto domBuilder (non un array, non un Node DOM),
 * così che `content`/`headerContent`/`footerContent` possano essere gestiti in modo uniforme con gli array domBuilder.
 * @param {*} value
 * @returns {*}
 */
function normalizeContentParam(value) {
  if(value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Node)) {
    return [value];
  }
  return value;
}

/**
 * @param {*} value - un valore non nullo di `content`/`headerContent`/`footerContent`
 * @returns {'domBuilder' | 'node' | 'function' | 'html'}
 */
function getContentKind(value) {
  if(Array.isArray(value)) {
    return 'domBuilder';
  }
  if(value instanceof Node) {
    return 'node';
  }
  if(typeof value === 'function') {
    return 'function';
  }
  return 'html';
}

/**
 * Risolve le proprietà domBuilder `content`/`children` per un valore di `headerContent`/`footerContent`.
 * Il tipo `function` non viene gestito qui: viene invocato separatamente, dalla `callback` dell'elemento,
 * una volta che l'elemento contenitore esiste.
 * @param {*} value
 * @returns {{content: string | Node | null, children: DomBuilderItem[] | undefined}}
 */
function getDomBuilderContentProps(value) {
  if(value == null) {
    return { content: null, children: undefined };
  }
  const kind = getContentKind(value);
  return {
    content: (kind === 'html' || kind === 'node') ? value : null,
    children: kind === 'domBuilder' ? value : undefined
  };
}

/**
 * modalPopup
 * Apre un dialog popup con il contenuto indicato.
 *
 * Il contenuto può essere fornito come:
 *  - un array domBuilder, testo semplice o HTML (tramite `content`)
 *  - contenuto caricato via Ajax (tramite `ajaxUrl` e `ajaxCallback`)
 *  - un iframe (tramite `iframeUrl`)
 *
 * Quando più opzioni sono in conflitto, ha la precedenza la prima applicabile nell'elenco qui sopra.
 *
 * @param {Object} params
 * @param {string | null} [params.dialogExtraClassName=null] - Classe extra aggiunta all'elemento dialog (default: null)
 * @param {string | DomBuilderItem | DomBuilderItem[] | Node | ((container: HTMLElement) => void) | null} [params.content=null] - Testo semplice, HTML, un oggetto domBuilder, un array domBuilder, un nodo DOM (aggiunto così com'è) o una funzione invocata con l'elemento contenitore del contenuto per popolarlo direttamente (`content(dialogContentEl)`) (default: null)
 * @param {string | null} [params.contentExtraClassName=null] - Classe extra aggiunta al wrapper del contenuto (default: null)
 * @param {HTMLElement | null} [params.triggerElement=null] - Elemento opzionale che ha attivato il popup; se impostato, su di esso vengono gestiti `aria-haspopup`, `aria-controls` e `aria-expanded` (default: null)
 * @param {boolean} [params.addFocus=true] - se true, il dialog riceve il focus dopo l'apertura (default: true)
 * @param {string | null} [params.headerExtraClassName=null] - Classe extra aggiunta al wrapper dell'header (default: null)
 * @param {string | null} [params.footerExtraClassName=null] - Classe extra aggiunta al wrapper del footer (default: null)
 * @param {string | number | null} [params.dialogWidth=null] - valore opzionale della larghezza del dialog - se impostato, sovrascrive la custom prop css principale (default: null)
 * @param {string | number | null} [params.dialogMinWidth=null] - valore opzionale della larghezza minima del dialog - se impostato, sovrascrive la custom prop css principale (default: null)
 * @param {string | number | null} [params.dialogMaxWidth=null] - valore opzionale della larghezza massima del dialog - se impostato, sovrascrive la custom prop css principale (default: null)
 * @param {string | number | null} [params.dialogHeight=null] - valore opzionale dell'altezza del dialog - se impostato, sovrascrive la custom prop css principale (default: null)
 * @param {string | number | null} [params.dialogMinHeight=null] - valore opzionale dell'altezza minima del dialog - se impostato, sovrascrive la custom prop css principale (default: null)
 * @param {string | number | null} [params.dialogMaxHeight=null] - valore opzionale dell'altezza massima del dialog - se impostato, sovrascrive la custom prop css principale (default: null)
 * @param {string | number | null} [params.dialogContentPadding=null] - valore opzionale del padding del contenuto del dialog - se impostato, sovrascrive la custom prop css principale (default: null)
 * @param {string | null} [params.iframeUrl=null] - URL da caricare in un iframe (default: null)
 * @param {string | null} [params.ajaxUrl=null] - URL per il caricamento del contenuto via Ajax (default: null)
 * @param {((el: HTMLDialogElement) => void) | null} [params.openCallback=null] - Chiamata dopo l'apertura, riceve l'elemento dialog (`openCallback(dialogEl)`) (default: null)
 * @param {((el: HTMLDialogElement) => void) | null} [params.closeCallback=null] - Chiamata subito prima della rimozione del dialog, riceve l'elemento dialog (`closeCallback(dialogEl)`). NB: `dialogEl` viene rimosso subito dopo la chiusura (default: null)
 * @param {((data: *, el: Element) => void) | null} [params.ajaxCallback=null] - Chiamata con la risposta Ajax e l'elemento del contenuto (default: null)
 * @param {boolean} [params.addScrollbarPadding=false] - Aggiunge padding destro per compensare la scrollbar (default: false)
 * @param {string | DomBuilderItem | DomBuilderItem[] | Node | ((container: HTMLElement) => void) | null} [params.headerContent=null] - Contenuto dell'header: testo semplice, HTML, un oggetto domBuilder, un array domBuilder, un nodo DOM o una funzione invocata con l'elemento contenitore dell'header per popolarlo direttamente (default: null)
 * @param {string | DomBuilderItem | DomBuilderItem[] | Node | ((container: HTMLElement) => void) | null} [params.footerContent=null] - Contenuto del footer: stessi tipi accettati di `headerContent`, invocata con l'elemento contenitore del footer (default: null)
 * @returns {HTMLDialogElement} L'elemento dialog.
 */

export function modalPopup({

  /** classe extra del dialog */
  dialogExtraClassName = null,

  /** classe extra aggiunta a dialogInner */
  contentExtraClassName = null,

  /** valori opzionali per sovrascrivere le custom props principali */
  dialogWidth     = null,
  dialogMinWidth  = null,
  dialogMaxWidth  = null,
  dialogHeight    = null,
  dialogMinHeight = null,
  dialogMaxHeight = null,
  dialogContentPadding = null,

  addFocus = true,

  /** url dell'iframe */
  iframeUrl = null,

  /** content: testo semplice, html, oggetto/array domBuilder, nodo DOM o function(container) */
  content = null,

  /** url e callback Ajax.
   * La callback viene invocata con i dati della risposta e l'elemento contenitore del contenuto
   * (`ajaxCallback(data, dialogContentEl)`)
  */
  ajaxUrl = null,
  ajaxCallback = null,

  openCallback = null,
  closeCallback = null,
  addScrollbarPadding = false, // aggiunge padding destro extra per compensare la scrollbar

  /** contenuto dell'header: testo semplice, HTML, oggetto/array domBuilder, nodo DOM o function(container) */
  headerContent = null,

  /** classe extra aggiunta all'header */
  headerExtraClassName = null,

  /** contenuto del footer: testo semplice, HTML, oggetto/array domBuilder, nodo DOM o function(container) */
  footerContent = null,

  /** classe extra aggiunta al footer */
  footerExtraClassName = null,

  /** elemento che ha attivato il popup: se impostato, su di esso vengono gestiti `aria-haspopup`, `aria-controls` e `aria-expanded` */
  triggerElement = null,

}) {


  if(content == null && (ajaxUrl == null || ajaxCallback == null) && iframeUrl == null) {
    throw '[modalContent] parametri `content`, `ajaxUrl`/ `ajaxCallback` e `iframeUrl` mancanti';
  }

  // consente un singolo oggetto domBuilder (oltre a un array domBuilder) racchiudendolo in un array
  content = normalizeContentParam(content);
  headerContent = normalizeContentParam(headerContent);
  footerContent = normalizeContentParam(footerContent);

  let mode;
  if(content != null) {
    mode = getContentKind(content);

  } else if (ajaxUrl != null && ajaxCallback != null) {
    mode = 'ajax';

  } else {
    mode = 'iframe';
  }



  // catturato per l'uso nella closure della callback ajax (ajaxUrl non è null quando mode === 'ajax')
  const safeAjaxUrl = /** @type {string} */ (ajaxUrl);

  // regolazione fine delle custom props
  /** @type {Record<string, string | number | null>} */
  const cpropsValues = {
    dialogWidth,
    dialogMinWidth,
    dialogMaxWidth,
    dialogHeight,
    dialogMinHeight,
    dialogMaxHeight,
    dialogContentPadding,
  };
  /** @type {Record<string, string>} */
  const cpropsMap = {
    dialogWidth          : '--mpopup-width',
    dialogMinWidth       : '--mpopup-min-width',
    dialogMaxWidth       : '--mpopup-max-width',
    dialogHeight         : '--mpopup-height',
    dialogMinHeight      : '--mpopup-min-height',
    dialogMaxHeight      : '--mpopup-max-height',
    dialogContentPadding : '--mpopup-content-padding'
  };
  /** @type {string[]} */
  let dialogStyle = [];
  Object.keys(cpropsMap).forEach(item => {
    if(cpropsValues[item] != null) {
      const value = typeof cpropsValues[item] === 'number' ? `${cpropsValues[item]}px` : cpropsValues[item];
      dialogStyle.push(`${cpropsMap[item]}: ${value}`);
    }
  });

  // id per aria-controls (trigger → dialog) e aria-labelledby (dialog → header), generati solo quando servono
  const dialogId = triggerElement != null ? `mpopup-${crypto.randomUUID()}` : null;
  const headerId = headerContent != null ? `mpopup-header-${crypto.randomUUID()}` : null;

  domBuilder([
    {
      tag: 'dialog',
      id: dialogId,
      className: classnames(styles.dialog, dialogExtraClassName, addScrollbarPadding && styles.scrollBarPadding),
      attrs: {
        closedby: 'any',
        'aria-modal': 'true',
        'aria-labelledby': headerId,
        style: dialogStyle.length? dialogStyle.join(';') : null
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
              id: headerId,
              className: classnames(styles.header, headerExtraClassName),
              condition: headerContent != null,
              ...getDomBuilderContentProps(headerContent),
              callback: el => {
                if(headerContent != null && getContentKind(headerContent) === 'function') {
                  /** @type {(container: HTMLElement) => void} */ (headerContent)(/** @type {HTMLElement} */ (el));
                }
              }
            },
            {
              className: classnames(styles.content, contentExtraClassName),
              content: (mode === 'html' || mode === 'node')
                ? /** @type {string | Node} */ (content)
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
                dialogContentEl = /** @type {HTMLElement} */ (el);

                if(mode === 'function') {
                  /** @type {(container: HTMLElement) => void} */ (content)(dialogContentEl);
                }

                if(mode === 'ajax') {
                  try {

                    (async () => {
                      const response = await fetch(safeAjaxUrl),
                        data = await response.json();
                      dialogContentEl.innerHTML = '';
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
              className: classnames(styles.footer, footerExtraClassName),
              condition: footerContent != null,
              ...getDomBuilderContentProps(footerContent),
              callback: el => {
                if(footerContent != null && getContentKind(footerContent) === 'function') {
                  /** @type {(container: HTMLElement) => void} */ (footerContent)(/** @type {HTMLElement} */ (el));
                }
              }
            },
          ]
        }
      ]
    }
  ], document.body);

  // snapshot: dialogEl potrebbe essere sovrascritto da una successiva chiamata a modalPopup
  const thisDialog = /** @type {HTMLDialogElement} */ (dialogEl);

  if(openCallback) {
    openCallback(thisDialog);
  }

  // listener del pulsante di chiusura
  thisDialog.querySelector(`.${styles.closeButton}`)?.addEventListener('click', () => {
    closeDialog(thisDialog);
  }, false);

  // // Esc e click sul backdrop
  // thisDialog.addEventListener('cancel', (e) => {
  //   e.preventDefault();
  //   closeDialog(thisDialog);
  // }, false);



  thisDialog.addEventListener('close', () => {

    document.body.classList.remove('overflow-hidden');

    if(triggerElement != null) {
      triggerElement.setAttribute('aria-expanded', 'false');
    }

    if(closeCallback) {
      closeCallback(thisDialog);
    }
    thisDialog.remove();

  }, false);


  if(triggerElement != null) {
    triggerElement.setAttribute('aria-haspopup', 'dialog');
    triggerElement.setAttribute('aria-controls', /** @type {string} */ (dialogId));
    triggerElement.setAttribute('aria-expanded', 'true');
  }

  document.body.classList.add('overflow-hidden');
  thisDialog.showModal();

  if(addFocus) {
    thisDialog.focus();
  }

  thisDialog.classList.add(styles.on);


  return thisDialog;

}
