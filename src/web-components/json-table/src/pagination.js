/*! minimo - json-table: pagination */

import * as styles from '../json-table-component.module.css';
import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../../utilities/classnames.js';
import { iconContent } from './icons.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Number of pages needed to show `count` rows, `perPage` per page (at least 1).
 * `perPage` <= 0 means no pagination: a single page.
 *
 * @param {number} count - Number of rows
 * @param {number} perPage - Rows per page
 * @returns {number}
 *
 * @example
 * calcTotPages(101, 25); // → 5
 * calcTotPages(0, 25);   // → 1
 * calcTotPages(101, 0);  // → 1
 */
export function calcTotPages(count, perPage) {
  if (!(perPage > 0)) {
    return 1;
  }
  return Math.max(1, Math.ceil(count / perPage));
}


/**
 * Builds the list of page numbers to show in the navigation: the current page with `delta`
 * pages on each side (the window is widened near the edges so that it keeps a constant size),
 * plus the first and the last page; `null` marks a gap (ellipsis). When the gap would hide a
 * single page, that page is shown instead of the ellipsis.
 *
 * @param {number} current - Current page (1-based)
 * @param {number} totPages - Total number of pages
 * @param {number} [delta=2] - Pages on each side of the current one (default: 2)
 * @returns {Array<number|null>}
 *
 * @example
 * pageList(1, 3);       // → [1, 2, 3]
 * pageList(1, 10);      // → [1, 2, 3, 4, 5, null, 10]
 * pageList(6, 12);      // → [1, null, 4, 5, 6, 7, 8, null, 12]
 * pageList(5, 10);      // → [1, 2, 3, 4, 5, 6, 7, null, 10]  (page 2 shown instead of an ellipsis hiding it alone)
 * pageList(10, 10);     // → [1, null, 6, 7, 8, 9, 10]
 * pageList(4, 10, 1);   // → [1, 2, 3, 4, 5, null, 10]
 */
export function pageList(current, totPages, delta = 2) {

  const side = Math.max(0, Math.floor(delta));
  const width = side * 2 + 1;

  if (totPages <= width + 2) {
    return Array.from({ length: totPages }, (_, i) => i + 1);
  }

  let min = Math.max(1, current - side);
  let max = Math.min(totPages, current + side);

  // keep the window size constant near the edges
  while (max - min + 1 < width) {
    if (min > 1) {
      min--;
    } else if (max < totPages) {
      max++;
    } else {
      break;
    }
  }

  /** @type {Array<number|null>} */
  const pages = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  if (min === 3) {
    pages.unshift(1, 2);
  } else if (min > 3) {
    pages.unshift(1, null);
  } else if (min === 2) {
    pages.unshift(1);
  }

  if (max === totPages - 2) {
    pages.push(totPages - 1, totPages);
  } else if (max < totPages - 2) {
    pages.push(null, totPages);
  } else if (max === totPages - 1) {
    pages.push(totPages);
  }

  return pages;
}


/**
 * Replaces the `{page}` placeholder of a pagination label.
 * @param {string|undefined} label
 * @param {number} page
 * @param {string} locale
 * @returns {string}
 */
function pageLabel(label, page, locale) {
  return String(label ?? '').replace(/\{page\}/g, page.toLocaleString(locale));
}


/**
 * domBuilder item of the pagination `<nav>` (template slot `pagination`), rendered only when
 * `params.perPage` is > 0. The `<nav>` is stored in `elements.pagination` and gets a delegated
 * `click` listener on its buttons, which calls `jt.goToPage()`. The content (page list) is
 * rendered by `renderPagination()` and the whole `<nav>` is hidden when there is a single page.
 *
 * Generated structure (see `renderPagination`):
 * ```
 * nav.pagination[classes.pagination][aria-label=labels.paginationAriaLabel]
 *   ul.paginationList
 *     li.paginationItem > button.paginationBtn[classes.paginationBtn][data-page=prev][aria-label][title] > icon
 *     li.paginationItem > button.paginationBtn[data-page=1][aria-label="Vai a pagina 1"] 1
 *     li.paginationItem > button.paginationBtn[data-page=2][aria-current=page] 2      ← current page
 *     li.paginationItem > span.paginationEllipsis …
 *     li.paginationItem > button.paginationBtn[data-page=next] > icon
 * ```
 *
 * @param {JsonTable} jt - The component instance
 * @param {JsonTableElements} elements - Object collecting the generated elements (mutated)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([paginationPart(jt, elements)], host);
 * elements.pagination; // → HTMLElement (nav), when params.perPage > 0
 */
export function paginationPart(jt, elements) {

  const { params } = jt;

  return {
    tag: 'nav',
    condition: params.perPage > 0,
    className: classnames(styles.pagination, params.classes.pagination),
    attrs: { 'aria-label': params.labels.paginationAriaLabel, hidden: '' },
    callback: el => {
      const nav = /** @type {HTMLElement} */ (el);
      elements.pagination = nav;

      nav.addEventListener('click', e => {
        const btn = /** @type {HTMLElement|null} */ (
          /** @type {HTMLElement} */ (e.target).closest('button[data-page]')
        );
        if (!btn || btn.hasAttribute('disabled') || btn.getAttribute('aria-current') === 'page') {
          return;
        }
        const target = btn.dataset.page;
        const { page } = jt.state;
        const requested = target === 'prev' ? page - 1 : (target === 'next' ? page + 1 : Number(target));
        jt.goToPage(requested, target);
      });
    }
  };
}


/**
 * Renders the page list inside `elements.pagination` from the current state (`page`, `totPages`),
 * replacing the previous content; the `<nav>` is hidden when there is a single page.
 *
 * When `focusTarget` is given (the `data-page` of the button that triggered the change:
 * `'prev'`, `'next'` or a page number) the focus is moved to the corresponding new button, or
 * to the current page button when that one is no longer available, so that keyboard users do
 * not lose their position.
 *
 * @param {JsonTable} jt - The component instance
 * @param {string|null} [focusTarget=null] - `data-page` of the button to focus after the rendering (default: null)
 * @returns {void}
 *
 * @example
 * renderPagination(jt);         // after `jt.state` has been updated
 * renderPagination(jt, 'next'); // same, moving the focus to the "next" button
 */
export function renderPagination(jt, focusTarget = null) {

  const { params, elements, state } = jt;
  const nav = elements.pagination;

  if (!nav) {
    return;
  }

  if (state.totPages <= 1) {
    nav.hidden = true;
    nav.replaceChildren();
    return;
  }

  nav.hidden = false;

  const btnClass = classnames(styles.paginationBtn, params.classes.paginationBtn);
  const { labels, locale } = params;

  /** @type {(target: string, label: string, icon: import('./defaults.js').IconDef, disabled: boolean) => DomBuilderItem} */
  const arrowBtn = (target, label, icon, disabled) => ({
    tag: 'li',
    className: styles.paginationItem,
    children: [
      {
        tag: 'button',
        className: classnames(btnClass, styles.paginationArrow),
        attrs: { type: 'button', 'data-page': target, 'aria-label': label, title: label, disabled: disabled ? '' : null },
        content: iconContent(icon)
      }
    ]
  });

  domBuilder([
    {
      tag: 'ul',
      className: styles.paginationList,
      children: [
        arrowBtn('prev', labels.prevPage ?? '', params.paginationPrevIcon, state.page <= 1),

        ...pageList(state.page, state.totPages, params.paginationDelta).map(page => ({
          tag: 'li',
          className: styles.paginationItem,
          children: [
            page === null
              ? { tag: 'span', className: styles.paginationEllipsis, attrs: { 'aria-hidden': 'true' }, content: '…' }
              : {
                tag: 'button',
                className: btnClass,
                attrs: {
                  type: 'button',
                  'data-page': page,
                  'aria-current': page === state.page ? 'page' : null,
                  'aria-label': pageLabel(page === state.page ? labels.currentPage : labels.pageTitle, page, locale),
                  title: pageLabel(page === state.page ? labels.currentPage : labels.pageTitle, page, locale)
                },
                content: page.toLocaleString(locale)
              }
          ]
        })),

        arrowBtn('next', labels.nextPage ?? '', params.paginationNextIcon, state.page >= state.totPages)
      ]
    }
  ], nav, { emptyParent: true });

  if (focusTarget != null) {
    const wanted = /** @type {HTMLButtonElement|null} */ (nav.querySelector(`button[data-page="${focusTarget}"]:not([disabled])`));
    const current = /** @type {HTMLButtonElement|null} */ (nav.querySelector('button[aria-current="page"]'));
    (wanted ?? current)?.focus();
  }
}
