/*! minimo - json-table: info section parts */

import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/**
 * domBuilder item of the info text container (template slot `resultInfo`).
 *
 * Generated structure: `div.resultInfo[classes.resultInfo][aria-live=polite]`; the content is
 * set by `update-info.js`. The element is stored in `elements.resultInfo`.
 *
 * @param {JsonTableParams} params - Resolved params
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
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
 * domBuilder item of the search input (template slot `search`), rendered only when
 * `params.search` is true.
 *
 * Generated structure: `div.search[classes.search] > input[type=search][classes.searchInput]`.
 * The input is stored in `elements.searchInput`.
 *
 * TODO listener sull'input di ricerca: step 3
 *
 * @param {JsonTableParams} params - Resolved params
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([searchPart(params, elements)], host);
 * elements.searchInput; // → HTMLInputElement (when params.search is true)
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
 * domBuilder item of the whole info section (template slot `infoSection`): info text + search input.
 *
 * Generated structure:
 * ```
 * div.infoOuter[classes.infoOuter]
 *   div.info[classes.info]
 *     div.resultInfo                       ← resultInfoPart()
 *     div.search > input[type=search]      ← searchPart(), only if `params.search` is true
 * ```
 *
 * References to the generated elements are stored in `elements`
 * (`infoOuter`, `info`, `resultInfo`, `searchInput`).
 *
 * @param {JsonTableParams} params - Resolved params
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
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
