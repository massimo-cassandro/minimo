
import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';
import { theadPart } from './thead.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/** Contatore usato per generare id univoci delle caption */
let captionUid = 0;

/**
 * Id dell'elemento caption di una tabella (usato da `aria-labelledby`): `<tableId>-caption`, oppure un
 * id univoco generato quando `tableId` non è impostato.
 *
 * @param {JsonTableParams} params - Parametri risolti
 * @returns {string}
 *
 * @example
 * captionId({ ...params, tableId: 'users' }); // → 'users-caption'
 * captionId(params);                          // → 'jt-1-caption'
 */
export function captionId(params) {
  return params.tableId ? `${params.tableId}-caption` : `jt-${++captionUid}-caption`;
}


/**
 * Elemento domBuilder della caption (slot del template `caption`), renderizzato solo quando `params.caption`
 * è impostato. È un semplice contenitore collocato sotto la tabella (barra del footer) invece di un elemento
 * `<caption>`: la tabella è collegata a esso tramite `aria-labelledby`, che dà alla tabella lo stesso
 * nome accessibile che avrebbe con un `<caption>`.
 *
 * Struttura generata: `div.caption[classes.caption]#<id>`; l'elemento viene memorizzato in `elements.caption`.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @param {string} id - Id dell'elemento (vedi `captionId`)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([captionPart(jt, elements, 'users-caption')], host);
 * elements.caption; // → HTMLElement (quando params.caption è impostato)
 */
export function captionPart(jt, elements, id) {

  const { params } = jt;

  return {
    id,
    condition: params.caption != null,
    className: classnames(styles.caption, params.classes.caption),
    content: params.caption,
    callback: el => { elements.caption = /** @type {HTMLElement} */ (el); }
  };
}


/**
 * Elemento domBuilder della barra del footer sotto la tabella: caption (lato iniziale) e paginazione (lato
 * finale). Renderizzato solo quando `children` non è vuoto (vedi `mainBuilder`, che rimuove le parti
 * collocate altrove dal template).
 *
 * Struttura generata: `div.tableFooter[classes.tableFooter] > [caption] [pagination]`; l'elemento
 * viene memorizzato in `elements.tableFooter`.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @param {DomBuilderItem[]} children - Parti del footer (elementi caption e/o paginazione)
 * @returns {DomBuilderItem}
 *
 * @example
 * const footer = tableFooterPart(jt, elements, [captionItem, paginationItem]);
 * domBuilder([tablePart(jt, elements, footer)], host);
 */
export function tableFooterPart(jt, elements, children) {

  const { params } = jt;

  return {
    condition: children.length > 0,
    className: classnames(styles.tableFooter, params.classes.tableFooter),
    children,
    callback: el => { elements.tableFooter = /** @type {HTMLElement} */ (el); }
  };
}


/**
 * Elemento domBuilder della tabella (slot del template `table`).
 *
 * Generated structure:
 * ```
 * div.tableWrapper[classes.tableWrapper]
 *   table#tableId.table[classes.table][aria-labelledby=<caption id>]   (aria-labelledby se `caption`)
 *     thead                     ← theadPart()
 *     tbody                     ← riempito da `renderTbody()`
 *     tfoot                     (se `tfoot`) ← riempito da `renderTfoot()`
 * div.tableFooter               ← footerBar (caption + paginazione), se indicata
 * ```
 *
 * I riferimenti agli elementi generati vengono memorizzati in `elements`
 * (`tableWrapper`, `table`, `thead`, `tbody`, `tfoot`).
 *
 * @param {JsonTable} jt - L'istanza del componente (`params`, `cols`)
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @param {DomBuilderItem|null} [footerBar=null] - Elemento della barra del footer (vedi `tableFooterPart`) (default: null)
 * @param {string|null} [captionElId=null] - Id dell'elemento caption, per `aria-labelledby` (default: null)
 * @returns {DomBuilderItem} Un `div` che racchiude il wrapper della tabella e la barra del footer
 *
 * @example
 * domBuilder([tablePart(jt, elements, footerBar, 'users-caption')], host);
 * elements.tbody; // → HTMLTableSectionElement (vuoto finché non viene chiamato renderTbody())
 */
export function tablePart(jt, elements, footerBar = null, captionElId = null) {

  const { params } = jt;

  return {
    className: styles.tableOuter,
    children: [
      {
        className: classnames(styles.tableWrapper, params.classes.tableWrapper),
        callback: el => { elements.tableWrapper = /** @type {HTMLElement} */ (el); },
        children: [
          {
            tag: 'table',
            id: params.tableId,
            className: classnames(styles.table, params.classes.table),
            attrs: { 'aria-labelledby': params.caption != null ? captionElId : null },
            callback: el => { elements.table = /** @type {HTMLTableElement} */ (el); },
            children: [
              theadPart(jt, elements),
              {
                tag: 'tbody',
                callback: el => { elements.tbody = /** @type {HTMLTableSectionElement} */ (el); }
              },
              {
                tag: 'tfoot',
                condition: params.tfoot,
                callback: el => { elements.tfoot = /** @type {HTMLTableSectionElement} */ (el); }
              }
            ]
          }
        ]
      },
      ...(footerBar ? [footerBar] : [])
    ]
  };
}
