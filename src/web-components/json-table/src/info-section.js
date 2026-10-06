/*! minimo - json-table: info section parts */

import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Elemento domBuilder del contenitore del testo informativo (slot del template `resultInfo`).
 *
 * Struttura generata: `div.resultInfo[classes.resultInfo][aria-live=polite]`; il contenuto è
 * impostato da `update-info.js`. L'elemento viene memorizzato in `elements.resultInfo`.
 *
 * @param {JsonTableParams} params - Parametri risolti
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([resultInfoPart(params, elements)], host);
 * elements.resultInfo; // → HTMLElement
 */
export function resultInfoPart(params, elements) {
  return {
    className: classnames(styles.resultInfo, params.classes.resultInfo),
    attrs: { 'aria-live': 'polite' },
    callback: el => { elements.resultInfo = /** @type {HTMLElement} */ (el); }
  };
}


/**
 * Elemento domBuilder dell'input di ricerca (slot del template `search`), renderizzato solo quando
 * `params.search` è true.
 *
 * Struttura generata: `div.search[classes.search] > input[type=search][classes.searchInput]`.
 * L'input viene memorizzato in `elements.searchInput`.
 *
 * TODO listener sull'input di ricerca: step 3
 *
 * @param {JsonTableParams} params - Parametri risolti
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([searchPart(params, elements)], host);
 * elements.searchInput; // → HTMLInputElement (quando params.search è true)
 */
export function searchPart(params, elements) {
  return {
    condition: params.search,
    className: classnames(styles.search, params.classes.search),
    children: [
      {
        tag: 'input',
        className: classnames(params.classes.searchInput),
        attrs: {
          type: 'search',
          title: params.labels.searchTitle,
          placeholder: params.labels.searchPlaceholder,
          'aria-label': params.labels.searchAriaLabel
        },
        callback: el => { elements.searchInput = /** @type {HTMLInputElement} */ (el); }
      }
    ]
  };
}


/**
 * Elemento domBuilder dell'intera sezione informativa (slot del template `infoSection`): testo informativo + input di ricerca.
 *
 * Struttura generata:
 * ```
 * div.infoOuter[classes.infoOuter]
 *   div.info[classes.info]
 *     div.resultInfo                       ← resultInfoPart()
 *     div.search > input[type=search]      ← searchPart(), solo se `params.search` è true
 * ```
 *
 * I riferimenti agli elementi generati vengono memorizzati in `elements`
 * (`infoOuter`, `info`, `resultInfo`, `searchInput`).
 *
 * @param {JsonTableParams} params - Parametri risolti
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([{ tag: 'section', children: [infoSectionPart(params, elements)] }], host);
 * elements.info; // → HTMLElement
 */
export function infoSectionPart(params, elements) {
  return {
    className: classnames(styles.infoOuter, params.classes.infoOuter),
    callback: el => { elements.infoOuter = /** @type {HTMLElement} */ (el); },
    children: [
      {
        className: classnames(styles.info, params.classes.info),
        callback: el => { elements.info = /** @type {HTMLElement} */ (el); },
        children: [
          resultInfoPart(params, elements),
          searchPart(params, elements)
        ]
      }
    ]
  };
}
