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

// retrocompatibilità: i vecchi nomi di parametro snake_case sono mappati sul rispettivo equivalente camelCase
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

// TODO aggiungere metodo setDefaults per cambiare a livello globale i valori di default
//      senza doverli ripetere ad ogni istanza del modulo


const defaults = {

  // impostazioni applicate a tutti i tipi di dialog; sovrascrivibili per tipo
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

    // markup del pulsante extra, ignorato su confirm
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
    useAltIcon: false // se true, usa altIcon (danger) invece dell'icona warning predefinita
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
    cancelBtnFocus: true, // false per dare il focus al pulsante ok
    okBtnClass: classnames('btn', styles.btnConfirm),
    cancelBtnClass: classnames('btn', styles.btnConfirm, styles.btnHollow),
    icon: confirmIcon,
    altIcon: warningIcon,
    useAltIcon: false // se true, usa altIcon (warning) invece dell'icona confirm predefinita
  }

};

/**
 * @typedef {Object} ModalAlertParams
 * @property {string} [type] - Tipo di dialog: `success`, `error`, `warning`, `info` o `confirm`.
 * @property {string | null} [title] - testo del titolo
 * @property {string | null} [mes] - messaggio di testo (semplice o html) (default: null)
 * @property {((arg?: *) => void) | null} [callback] - callback opzionale invocata dopo la scelta dell'utente (default: null)
 * @property {number | null} [timer] - timer di chiusura automatica (ms). `null` per disattivarlo (default: null, tranne il tipo 'success' che ha 4000)
 * @property {(() => void) | null} [onOpen] - callback opzionale all'apertura del dialog (default: null)
 * @property {(() => void) | null} [onClose] - callback opzionale alla chiusura del dialog (default: null)
 * @property {string | null} [extraClass] - classe extra opzionale del dialog (default: null)
 * @property {string} [okBtnText] - testo del pulsante 'ok' (default: 'OK')
 * @property {string} [okBtnClass] - classe alternativa per il pulsante 'ok'. Sostituisce quella predefinita
 * @property {string} [cancelBtnText] - testo del pulsante 'cancel' (default: 'Annulla', solo tipo 'confirm')
 * @property {string} [cancelBtnClass] - classe alternativa per il pulsante 'cancel'. Sostituisce quella predefinita
 * @property {boolean} [cancelBtnFocus] - true se il pulsante cancel deve ricevere il focus all'apertura del dialog. Non ha effetto se è impostato un extraBtn (default: true, solo tipo 'confirm')
 * @property {string | null} [headingClass] - classe extra opzionale per il titolo (default: null)
 * @property {DomBuilderItem | null} [extraBtn] - pulsante extra opzionale (come oggetto domBuilder) (default: null)
 * @property {boolean} [extraBtnFocus] - true se il pulsante extra deve ricevere il focus all'apertura del dialog (ha la precedenza sul focus assegnato al pulsante 'cancel') (default: true)
 * @property {boolean} [animation] - se true, il dialog viene animato (default: true)
 * @property {boolean} [showMarks] - se true, vengono mostrate le icone (default: true)
 * @property {string | null} [textClass] - classe extra opzionale per il testo (default: null)
 * @property {string | null} [icon] - Markup dell'icona usata per il dialog; di default è l'icona del tipo.
 * @property {string | null} [altIcon] - Markup dell'icona alternativa, usata al posto di `icon` quando `useAltIcon` è `true`.
 * @property {boolean} [useAltIcon] - Se `true`, usa `altIcon` al posto di `icon` (ad es. l'icona `danger` su un dialog `warning`, o l'icona `warning` su un dialog `confirm`) (default: false)
 */

/**
 * Renderizza e apre un dialog modale di alert.
 *
 * Retrocompatibilità: i vecchi nomi di parametro snake_case (`extra_class`, `heading_class`,
 * `text_class`, `extra_btn`, `extra_btn_selector`, `extra_btn_focus`, `ok_btn_text`,
 * `ok_btn_class`, `cancel_btn_text`, `cancel_btn_class`, `cancel_focus`, `use_warning_icon`)
 * sono ancora accettati e internamente mappati sul rispettivo equivalente camelCase, vedi `legacyParamNames`.
 *
 * Il tipo base del parametro qui sotto è volutamente `object` (non `ModalAlertParams`): TypeScript
 * espande le proprietà `@param` con notazione puntata (necessarie perché IntelliSense dell'editor elenchi
 * ogni proprietà) solo quando il tipo base è il letterale `object`; un typedef con nome darebbe errore (TS8032).
 * @param {object} [params] - Parametri del dialog (uniti ai default in base al tipo) (default: {})
 * @param {string} [params.type] - Tipo di dialog: `success`, `error`, `warning`, `info` o `confirm`.
 * @param {string | null} [params.extraClass] - classe extra opzionale del dialog (default: null)
 * @param {(() => void) | null} [params.onOpen] - callback opzionale all'apertura del dialog (default: null)
 * @param {(() => void) | null} [params.onClose] - callback opzionale alla chiusura del dialog (default: null)
 * @param {boolean} [params.animation] - se true, il dialog viene animato (default: true)
 * @param {boolean} [params.showMarks] - se true, vengono mostrate le icone (default: true)
 * @param {((arg?: *) => void) | null} [params.callback] - callback opzionale invocata dopo la scelta dell'utente (default: null)
 * @param {number | null} [params.timer] - timer di chiusura automatica (ms). `null` per disattivarlo (default: null, tranne il tipo 'success' che ha 4000)
 * @param {string | null} [params.title] - testo del titolo
 * @param {string | null} [params.mes] - messaggio di testo (semplice o html) (default: null)
 * @param {string | null} [params.headingClass] - classe extra opzionale per il titolo (default: null)
 * @param {string | null} [params.textClass] - classe extra opzionale per il testo (default: null)
 * @param {string | null} [params.icon] - Markup dell'icona usata per il dialog; di default è l'icona del tipo.
 * @param {string | null} [params.altIcon] - Markup dell'icona alternativa, usata al posto di `icon` quando `useAltIcon` è `true`.
 * @param {boolean} [params.useAltIcon] - Se `true`, usa `altIcon` al posto di `icon` (ad es. l'icona `danger` su un dialog `warning`, o l'icona `warning` su un dialog `confirm`) (default: false)
 * @param {DomBuilderItem | null} [params.extraBtn] - pulsante extra opzionale (come oggetto domBuilder) (default: null)
 * @param {boolean} [params.extraBtnFocus] - true se il pulsante extra deve ricevere il focus all'apertura del dialog (ha la precedenza sul focus assegnato al pulsante 'cancel') (default: true)
 * @param {string} [params.okBtnText] - testo del pulsante 'ok' (default: 'OK')
 * @param {string} [params.okBtnClass] - classe alternativa per il pulsante 'ok'. Sostituisce quella predefinita
 * @param {string} [params.cancelBtnText] - testo del pulsante 'cancel' (default: 'Annulla', solo tipo 'confirm')
 * @param {string} [params.cancelBtnClass] - classe alternativa per il pulsante 'cancel'. Sostituisce quella predefinita
 * @param {boolean} [params.cancelBtnFocus] - true se il pulsante cancel deve ricevere il focus all'apertura del dialog. Non ha effetto se è impostato un extraBtn (default: true, solo tipo 'confirm')
 * @returns {Promise<string | boolean | undefined>} Si risolve alla chiusura del dialog. Se il
 *   pulsante che lo chiude ha un attributo `data-malert-result`, viene usata quella stringa; altrimenti, per i
 *   dialog `confirm`, si risolve con `true`/`false` per il pulsante OK/Annulla; altrimenti con `undefined`.
 */
export function modalAlert(params = {}) {

  return new Promise((resolve) => {

    try {

      // garbage collection
      document.querySelector('.modal-alert')?.remove();

      // retrocompatibilità: mappa le vecchie chiavi snake_case sul rispettivo equivalente camelCase
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

      // retrocompatibilità: 'danger' è un alias di 'error'
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

      // console.log(params);

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
       * @param {HTMLElement | null} [btn] (default: null)
       * @returns {void}
       */
      const dialogDismiss = (btn = null) => {
        dialog.remove();

        if(params.onClose && typeof params.onClose === 'function') {
          params.onClose();
        }

        /*
          Se presente, l'argomento risolto/della callback è `btn.dataset.malertResult`
          Altrimenti, se il tipo di modale è `confirm`, è `true` per il pulsante OK, `false` per il pulsante Annulla
          Altrimenti, per tutti gli altri tipi di modale, è `undefined`
        */
        let arg;
        if(btn) {
          if(btn.dataset?.malertResult) {
            arg = btn.dataset.malertResult;

          } else if(params.type === 'confirm') {
            arg = btn === okBtn;
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
