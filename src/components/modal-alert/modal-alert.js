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

/**
 * Mappa i vecchi nomi di parametro snake_case sul rispettivo equivalente camelCase (modifica l'oggetto passato)
 * @param {Record<string, any>} obj - Oggetto parametri
 * @returns {Record<string, any>}
 */
const mapLegacyParams = obj => {
  Object.entries(legacyParamNames).forEach(([legacyKey, newKey]) => {
    if(legacyKey in obj && !(newKey in obj)) {
      obj[newKey] = obj[legacyKey];
    }
  });
  return obj;
};

/**
 * Default a livello di progetto, impostati con `modalAlert.setDefaults()`.
 * Stessa struttura di `defaults`: `globals` per tutti i tipi, più una chiave per ogni tipo.
 *
 * Sono salvati su `globalThis` con una chiave `Symbol.for()` (registro globale dei simboli), e non
 * in una variabile di modulo: in questo modo sono condivisi da tutte le istanze del modulo presenti
 * nella pagina, anche quando `modal-alert.js` viene incluso più volte (più entry webpack con runtime
 * separati, bundle di build diverse, ecc.).
 */
const PROJECT_DEFAULTS_KEY = Symbol.for('@massimo-cassandro/minimo/modal-alert/defaults');

/**
 * Restituisce (creandolo se necessario) l'oggetto condiviso dei default di progetto.
 * @returns {Record<string, Record<string, any>>}
 */
const getProjectDefaults = () => {
  const g = /** @type {Record<symbol, any>} */ (globalThis);
  return (g[PROJECT_DEFAULTS_KEY] ??= {});
};

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
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * // (i default indicati "per tipo" dipendono da `type`)
 * modalAlert({
 *   type: 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm', OBBL
 *   extraClass: null, // classi extra del dialog, FAC
 *   onOpen: null, // callback all'apertura, FAC
 *   onClose: null, // callback alla chiusura, FAC
 *   animation: true, // dialog animato, FAC
 *   showMarks: true, // mostra le icone, FAC
 *   callback: null, // callback dopo la scelta dell'utente, FAC
 *   timer: null, // chiusura automatica in ms (per tipo: 4000 per success), FAC
 *   title: null, // titolo (default: per tipo), FAC
 *   mes: null, // messaggio (testo o HTML), FAC
 *   headingClass: null, // classi extra del titolo, FAC
 *   textClass: null, // classi extra del testo, FAC
 *   icon: null, // markup dell'icona (default: per tipo), FAC
 *   altIcon: null, // markup dell'icona alternativa (default: per tipo), FAC
 *   useAltIcon: false, // usa altIcon al posto di icon, FAC
 *   extraBtn: null, // pulsante extra (oggetto domBuilder), FAC
 *   extraBtnFocus: true, // focus sul pulsante extra, FAC
 *   okBtnText: 'OK', // testo del pulsante ok, FAC
 *   okBtnClass: undefined, // classe del pulsante ok (default: per tipo), FAC
 *   cancelBtnText: 'Annulla', // testo del pulsante cancel (solo confirm), FAC
 *   cancelBtnClass: undefined, // classe del pulsante cancel (default: per tipo, solo confirm), FAC
 *   cancelBtnFocus: true, // focus sul pulsante cancel (solo confirm), FAC
 * });
 *
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
      mapLegacyParams(/** @type {Record<string, any>} */ (params));

      // retrocompatibilità: 'danger' è un alias di 'error'
      // (normalizzato prima dell'unione con i default, così da applicare quelli del tipo 'error')
      if(params.type === 'danger') {
        params = { ...params, type: 'error' };
      }

      const typedDefaults = /** @type {Record<string, any>} */ (defaults);
      const projectDefaults = getProjectDefaults();
      const typeKey = params.type ?? '';

      // precedenza: params > default di progetto del tipo > default di progetto globali > default del tipo > default globali
      params = /** @type {ModalAlertParams} */ ({
        ...(typedDefaults.globals ?? {}),
        ...(typedDefaults[typeKey] ?? {}),
        ...(projectDefaults.globals ?? {}),
        ...(projectDefaults[typeKey] ?? {}),
        ...params
      });

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


const dialogTypes = Object.keys(defaults).filter(item => item !== 'globals');

/**
 * Imposta i default a livello di progetto per la sessione corrente (pagina), condivisi da tutte le chiamate
 * successive di `modalAlert`, anche da file o bundle diversi (i default sono salvati su `globalThis`).
 * I valori vengono uniti a quelli impostati in precedenza.
 *
 * Le chiavi corrispondenti a un tipo di dialog (`success`, `error`, `warning`, `info`, `confirm`, più l'alias
 * `danger` → `error`) accettano un oggetto di parametri applicato solo a quel tipo; tutte le altre chiavi
 * vengono applicate a tutti i tipi.
 *
 * Precedenza: parametri della chiamata > default di progetto del tipo > default di progetto globali >
 * default predefiniti del tipo > default predefiniti globali.
 *
 * Il parametro `type` viene ignorato. Sono accettati anche i vecchi nomi snake_case.
 *
 * @param {Partial<ModalAlertParams> & Partial<Record<'success'|'error'|'danger'|'warning'|'info'|'confirm', Partial<ModalAlertParams>>>} [newDefaults] - Parametri da sovrascrivere (default: {})
 * @returns {void}
 *
 * @example
 * // file A
 * import { modalAlert } from '@massimo-cassandro/minimo';
 * modalAlert.setDefaults({
 *   animation: false,                                // tutti i tipi
 *   success: { timer: 2000 },                        // solo success
 *   confirm: { okBtnText: 'Sì', cancelBtnText: 'No' } // solo confirm
 * });
 *
 * // file B (stessa pagina)
 * import { modalAlert } from '@massimo-cassandro/minimo';
 * modalAlert({ type: 'confirm', mes: 'Eliminare il record?' }); // usa 'Sì' / 'No', senza animazione
 */
modalAlert.setDefaults = (newDefaults = {}) => {
  const { type: _ignored, ...rest } = /** @type {Record<string, any>} */ (newDefaults); // eslint-disable-line no-unused-vars
  const projectDefaults = getProjectDefaults();
  /** @type {Record<string, any>} */
  const globals = {};

  Object.entries(rest).forEach(([key, value]) => {
    const typeKey = key === 'danger' ? 'error' : key;

    if(dialogTypes.includes(typeKey) && value && typeof value === 'object') {
      const { type: _t, ...typeParams } = mapLegacyParams({ ...value }); // eslint-disable-line no-unused-vars
      projectDefaults[typeKey] = { ...(projectDefaults[typeKey] ?? {}), ...typeParams };

    } else {
      globals[key] = value;
    }
  });

  projectDefaults.globals = { ...(projectDefaults.globals ?? {}), ...mapLegacyParams(globals) };
};

/**
 * Cancella i default a livello di progetto impostati con `modalAlert.setDefaults()`.
 * @returns {void}
 */
modalAlert.resetDefaults = () => {
  // svuotato sul posto, così da restare lo stesso oggetto condiviso
  const projectDefaults = getProjectDefaults();
  Object.keys(projectDefaults).forEach(key => delete projectDefaults[key]);
};

/**
 * Restituisce i parametri di default effettivi (predefiniti + di progetto) per un tipo di dialog.
 * @param {string} type - Tipo di dialog (`success`, `error`, `danger`, `warning`, `info` o `confirm`)
 * @returns {ModalAlertParams}
 *
 * @example
 * modalAlert.getDefaults('confirm').okBtnText; // → 'OK' (o il valore impostato con setDefaults)
 */
modalAlert.getDefaults = type => {
  const typeKey = type === 'danger' ? 'error' : type;
  const typedDefaults = /** @type {Record<string, any>} */ (defaults);
  const projectDefaults = getProjectDefaults();
  return {
    ...typedDefaults.globals,
    ...(typedDefaults[typeKey] ?? {}),
    ...(projectDefaults.globals ?? {}),
    ...(projectDefaults[typeKey] ?? {})
  };
};
