/*! minimo - json-table: main structure builder */

import * as styles from '../json-table-component.module.css';
import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../../utilities/classnames.js';
import { defaults } from './defaults.js';
import { infoSectionPart, resultInfoPart, searchPart } from './info-section.js';
import { tablePart, tableFooterPart, captionPart, captionId } from './table-builder.js';
import { paginationPart } from './pagination.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./defaults.js').TemplateItem} TemplateItem */
/** @typedef {import('./defaults.js').TemplateSlot} TemplateSlot */

/**
 * Elementi generati dal componente, raccolti durante la costruzione.
 * @typedef {Object} JsonTableElements
 * @property {HTMLElement} [wrapper] - Wrapper principale (`section`), contiene le parti del template
 * @property {HTMLElement} [infoOuter] - Contenitore esterno delle info
 * @property {HTMLElement} [info] - Contenitore delle info (riga flex: testo informativo + ricerca)
 * @property {HTMLElement} [resultInfo] - Contenitore del testo informativo
 * @property {HTMLInputElement} [searchInput] - Input di ricerca (solo quando `search` è true)
 * @property {HTMLElement} [tableWrapper] - Div che racchiude la tabella (`table-responsive` di default)
 * @property {HTMLTableElement} [table] - L'elemento `<table>`
 * @property {HTMLTableSectionElement} [thead] - L'elemento `<thead>`
 * @property {HTMLTableSectionElement} [tbody] - L'elemento `<tbody>`
 * @property {HTMLTableSectionElement} [tfoot] - L'elemento `<tfoot>` (solo quando `tfoot` è true)
 * @property {HTMLElement} [tableFooter] - Barra del footer sotto la tabella (caption + paginazione), quando renderizzata
 * @property {HTMLElement} [caption] - Contenitore della caption (solo quando `caption` è impostato)
 * @property {HTMLElement} [pagination] - `<nav>` della paginazione (solo quando `perPage` > 0)
 */

/**
 * Indica se un elemento del template è un segnaposto di slot.
 * @param {*} item
 * @returns {item is { slot: TemplateSlot }}
 */
function isSlot(item) {
  return item != null && typeof item === 'object' && !(item instanceof Node) && typeof item.slot === 'string';
}


/**
 * Raccoglie, ricorsivamente (`children` e `content` array), i nomi degli slot usati da un template.
 *
 * @param {Array<TemplateItem|string|Node>} items - Elementi del template
 * @param {Set<string>} [found=new Set()] - Accumulatore (default: new Set())
 * @returns {Set<string>}
 *
 * @example
 * collectSlots([{ slot: 'table' }, { children: [{ slot: 'pagination' }] }]); // → Set { 'table', 'pagination' }
 */
export function collectSlots(items, found = new Set()) {

  items.forEach(item => {
    if (isSlot(item)) {
      found.add(item.slot);
    } else if (item != null && typeof item === 'object' && !(item instanceof Node)) {
      if (Array.isArray(item.children)) {
        collectSlots(item.children, found);
      }
      if (Array.isArray(item.content)) {
        collectSlots(/** @type {TemplateItem[]} */ (item.content), found);
      }
    }
  });

  return found;
}


/**
 * Sostituisce, ricorsivamente (`children` e `content` array), ogni elemento `{ slot: 'name' }` di un
 * template con la corrispondente parte predefinita. Gli slot sconosciuti vengono segnalati in console
 * e saltati. Gli elementi non slot vengono copiati in modo superficiale, così il template originale non viene mai modificato.
 *
 * @param {Array<TemplateItem|string|Node>} items - Elementi del template
 * @param {Object<string, DomBuilderItem>} parts - Parti predefinite, indicizzate per nome dello slot
 * @returns {Array<DomBuilderItem|string|Node>}
 *
 * @example
 * expandSlots([{ className: 'row', children: [{ slot: 'search' }, { slot: 'resultInfo' }] }, { slot: 'table' }], parts);
 * // → [{ className: 'row', children: [<parte search>, <parte resultInfo>] }, <parte table>]
 */
export function expandSlots(items, parts) {

  /** @type {Array<DomBuilderItem|string|Node>} */
  const result = [];

  items.forEach(item => {

    if (item == null || typeof item !== 'object' || item instanceof Node) {
      result.push(/** @type {string|Node} */ (item));
      return;
    }

    if (isSlot(item)) {
      const part = parts[item.slot];
      if (!part) {
        // eslint-disable-next-line no-console
        console.error(`[json-table] template: slot \`${item.slot}\` non riconosciuto (disponibili: ${Object.keys(parts).join(', ')})`);
        return;
      }
      result.push(part);
      return;
    }

    /** @type {DomBuilderItem} */
    const copy = /** @type {DomBuilderItem} */ ({ ...item });

    if (Array.isArray(item.children)) {
      copy.children = expandSlots(item.children, parts);
    }
    if (Array.isArray(item.content)) {
      copy.content = /** @type {DomBuilderItem[]} */ (expandSlots(/** @type {TemplateItem[]} */ (item.content), parts));
    }

    result.push(copy);
  });

  return result;
}


/**
 * Costruisce l'intera struttura del componente dentro l'elemento host (svuotato prima) tramite domBuilder:
 * un wrapper principale fisso il cui contenuto è definito da `params.template`.
 *
 * Slot del template disponibili (vedi `TemplateItem`):
 * - `infoSection` → `infoSectionPart()` (testo informativo + input di ricerca)
 * - `resultInfo`  → `resultInfoPart()` (solo testo informativo)
 * - `search`      → `searchPart()` (solo input di ricerca)
 * - `table`       → `tablePart()` (wrapper della tabella + tabella con thead, tbody, tfoot, più la barra del footer)
 * - `caption`     → `captionPart()` (contenitore della caption; parte della barra del footer di `table` se non collocato esplicitamente)
 * - `pagination`  → `paginationPart()` (nav della paginazione; idem)
 *
 * Struttura generata con il template predefinito (`[{ slot: 'infoSection' }, { slot: 'table' }]`):
 * ```
 * section.wrapper[classes.wrapper]
 *   div.infoOuter[classes.infoOuter]
 *     div.info[classes.info]
 *       div.resultInfo
 *       div.search > input[type=search]     (se `search`)
 *   div.tableOuter
 *     div.tableWrapper[classes.tableWrapper]
 *       table#tableId.table[classes.table]
 *         thead / tbody / tfoot             (tfoot se `tfoot`)
 *     div.tableFooter[classes.tableFooter]  (se `caption` o `perPage` > 0)
 *       div.caption                         (se `caption`)
 *       nav.pagination                      (se `perPage` > 0)
 * ```
 *
 * `<tbody>`, `<tfoot>` e paginazione vengono creati vuoti: vedi `renderTbody()`, `renderTfoot()`
 * e `renderPagination()`.
 *
 * @param {JsonTable} jt - L'istanza del componente (elemento host, `params`, `cols`)
 * @returns {JsonTableElements} Riferimenti agli elementi generati
 *
 * @example
 * jt.params.template = [
 *   { className: 'flex gap-2', children: [{ slot: 'search' }, { slot: 'pagination' }] },
 *   { slot: 'table' },   // barra del footer con la sola caption: la paginazione è collocata sopra
 *   { slot: 'resultInfo' }
 * ];
 * const elements = mainBuilder(jt);
 * elements.table; // → HTMLTableElement
 */
export function mainBuilder(jt) {

  const { params } = jt;

  /** @type {JsonTableElements} */
  const elements = {};

  const capId = captionId(params);
  const captionItem = captionPart(jt, elements, capId);
  const paginationItem = paginationPart(jt, elements);

  // parti della barra del footer: rimosse più sotto quando il template le colloca altrove
  /** @type {DomBuilderItem[]} */
  const footerChildren = [captionItem, paginationItem];
  const footerBar = tableFooterPart(jt, elements, footerChildren);

  /** @type {Object<string, DomBuilderItem>} */
  const parts = {
    infoSection: infoSectionPart(params, elements),
    resultInfo: resultInfoPart(params, elements),
    search: searchPart(params, elements),
    caption: captionItem,
    pagination: paginationItem,
    table: tablePart(jt, elements, footerBar, capId)
  };

  const template = typeof params.template === 'function'
    ? params.template(parts, params)
    : params.template;

  const items = Array.isArray(template) ? template : /** @type {TemplateItem[]} */ (defaults.template);
  const usedSlots = collectSlots(items);

  ['caption', 'pagination'].forEach(slot => {
    if (usedSlots.has(slot)) {
      footerChildren.splice(footerChildren.indexOf(parts[slot]), 1);
    }
  });
  footerBar.condition = footerChildren.some(item => item.condition !== false);

  domBuilder([
    {
      tag: 'section',
      className: classnames(styles.wrapper, params.classes.wrapper),
      callback: el => { elements.wrapper = /** @type {HTMLElement} */ (el); },
      children: expandSlots(items, parts)
    }
  ], jt, { emptyParent: true });

  return elements;
}
