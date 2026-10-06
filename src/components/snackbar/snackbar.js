/*! minimo - Snackbar */
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';
import * as styles from './snackbar.module.css';

/*
Riferimenti
* https://web.dev/learn/css/popover-and-dialog
* https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover
* https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
* https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using

* https://m3.material.io/components/snackbar/guidelines

*/

// TODO azione della snackbar
// TODO gestire più snackbar simultanee (senza stacking)
// TODO test con prefers-reduced-motion

/**
 * Mostra una notifica snackbar / toast usando la Popover API.
 * @param {string} message - Il messaggio da mostrare.
 * @param {Object} [options={}] (default: {})
 * @param {string | null} [options.status=null] - Variante di stato: `danger`, `warning`, `info` o `success` (default: null)
 * @param {number | false | null} [options.duration=4000] - Ritardo di chiusura automatica in ms; `false` o `null` disattiva la chiusura automatica (default: 4000)
 * @param {boolean} [options.close_btn=true] - Se mostrare il pulsante di chiusura (default: true)
 * @param {Function | null} [options.action=null] - Callback dell'azione (default: null)
 * @param {string | null} [options.action_text=null] - Etichetta del pulsante di azione (default: null)
 * @returns {{ close: function(): void }}
 */
export function snackbar(message, options = {}){

  options = {

    status       : null, // danger, warning, info, success
    duration     : 4000, // ms oppure false/null per evitare la chiusura automatica
    close_btn    : true, // true | false

    action       : null, // null o funzione
    action_text  : null, // null o stringa

    ...options
  };

  /** @type {HTMLElement | null} */
  let _popover = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let _timeoutID;
  let _isRemoving = false;

  const removePopover = () => {
    if (_isRemoving || !_popover?.matches(':popover-open')) return;
    _isRemoving = true; // evita la doppia rimozione se chiamata più volte durante l'animazione di chiusura

    if (_timeoutID) clearTimeout(_timeoutID);

    const remove = () => {
      _popover?.hidePopover();
      _popover?.remove();
    };

    _popover?.classList.add(styles.isHiding);

    // con `prefers-reduced-motion` (o qualsiasi override che disattivi le animazioni) non parte
    // alcuna animazione e `animationend` non scatterebbe mai: in tal caso rimuove subito
    if (_popover?.getAnimations().length) {
      // 'once' evita listener duplicati; il flag protegge dalle chiamate prima della fine dell'animazione
      _popover.addEventListener('animationend', remove, { once: true });
    }
    else {
      remove();
    }
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
    const duration = options.duration; // const mantiene il narrowing dentro le closure
    _timeoutID = setTimeout(removePopover, duration);

    // mette in pausa il timeout di chiusura automatica al passaggio del mouse
    _popover?.addEventListener('mouseenter', () => clearTimeout(_timeoutID));
    _popover?.addEventListener('mouseleave', () => {
      _timeoutID = setTimeout(removePopover, duration);
    });

  }

  return {
    close: removePopover
  };
}
