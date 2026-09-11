/*! minimo - json-table: info section */

import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */
/** @typedef {import('../../../utilities/dom-builder/dom-builder.js').DomBuilderItem} DomBuilderItem */

/**
 * Builds the domBuilder configuration of the info section (info text + search input).
 *
 * Generated structure:
 * ```
 * div.infoOuter[outerInfoExtraClass]
 *   div.info[infoExtraClass]
 *     div.resultInfo                       ← info text (see `update-info.js`)
 *     div.search > input[type=search]      ← only if `params.search` is true
 * ```
 *
 * References to the generated elements are stored in `elements`
 * (`infoOuter`, `info`, `resultInfo`, `searchInput`).
 *
 * TODO listener sull'input di ricerca: da impostare quando verrà implementata la ricerca
 *
 * @param {JsonTableParams} params - Resolved params
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
 * @returns {DomBuilderItem[]} domBuilder items to be used as children of the main wrapper
 *
 * @example
 * const elements = {};
 * domBuilder([{ tag: 'section', children: [...infoSection(params, elements)] }], host);
 * elements.searchInput; // → HTMLInputElement (when params.search is true)
 */
export function infoSection(params, elements) {

  return [
    {
      className: classnames(styles.infoOuter, params.outerInfoExtraClass),
      callback: el => { elements.infoOuter = /** @type {HTMLElement} */ (el); },
      children: [
        {
          className: classnames(styles.info, params.infoExtraClass),
          callback: el => { elements.info = /** @type {HTMLElement} */ (el); },
          children: [
            {
              className: styles.resultInfo,
              attrs: { 'aria-live': 'polite' },
              callback: el => { elements.resultInfo = /** @type {HTMLElement} */ (el); }
            },
            {
              condition: params.search,
              className: styles.search,
              children: [
                {
                  tag: 'input',
                  className: params.searchInputClass,
                  attrs: {
                    type: 'search',
                    title: params.searchInputTitle,
                    placeholder: params.searchInputPlaceholder,
                    'aria-label': params.searchInputAriaLabel
                  },
                  callback: el => { elements.searchInput = /** @type {HTMLInputElement} */ (el); }
                }
              ]
            }
          ]
        }
      ]
    }
  ];
}
