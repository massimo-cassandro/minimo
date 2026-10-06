/*! minimo - json-table: pagination */

import * as styles from '../json-table-component.module.css';
import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../../utilities/classnames.js';
import { iconContent } from './icons.js';

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/**
 * Numero di pagine necessarie per mostrare `count` righe, `perPage` per pagina (almeno 1).
 * `perPage` <= 0 significa nessuna paginazione: una sola pagina.
 *
 * @param {number} count - Numero di righe
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
 * Costruisce l'elenco dei numeri di pagina da mostrare nella navigazione: la pagina corrente con `delta`
 * pagine per lato (la finestra viene allargata vicino ai bordi in modo da mantenere una dimensione costante),
 * più la prima e l'ultima pagina; `null` indica un salto (puntini di sospensione). Quando il salto nasconderebbe una
 * sola pagina, viene mostrata quella pagina al posto dei puntini.
 *
 * @param {number} current - Pagina corrente (da 1)
 * @param {number} totPages - Numero totale di pagine
 * @param {number} [delta=2] - Pagine per lato rispetto alla corrente (default: 2)
 * @returns {Array<number|null>}
 *
 * @example
 * pageList(1, 3);       // → [1, 2, 3]
 * pageList(1, 10);      // → [1, 2, 3, 4, 5, null, 10]
 * pageList(6, 12);      // → [1, null, 4, 5, 6, 7, 8, null, 12]
 * pageList(5, 10);      // → [1, 2, 3, 4, 5, 6, 7, null, 10]  (pagina 2 mostrata al posto dei puntini che la nasconderebbero da sola)
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

  // mantiene costante la dimensione della finestra vicino ai bordi
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
 * Sostituisce il segnaposto `{page}` di un'etichetta di paginazione.
 * @param {string|undefined} label
 * @param {number} page
 * @param {string} locale
 * @returns {string}
 */
function pageLabel(label, page, locale) {
  return String(label ?? '').replace(/\{page\}/g, page.toLocaleString(locale));
}


/**
 * Elemento domBuilder del `<nav>` della paginazione (slot del template `pagination`), renderizzato solo quando
 * `params.perPage` è > 0. Il `<nav>` viene memorizzato in `elements.pagination` e riceve un listener
 * `click` delegato sui suoi pulsanti, che chiama `jt.goToPage()`. Il contenuto (elenco delle pagine) viene
 * renderizzato da `renderPagination()` e l'intero `<nav>` è nascosto quando c'è una sola pagina.
 *
 * Struttura generata (vedi `renderPagination`):
 * ```
 * nav.pagination[classes.pagination][aria-label=labels.paginationAriaLabel]
 *   ul.paginationList
 *     li.paginationItem > button.paginationBtn[classes.paginationBtn][data-page=prev][aria-label][title] > icon
 *     li.paginationItem > button.paginationBtn[data-page=1][aria-label="Vai a pagina 1"] 1
 *     li.paginationItem > button.paginationBtn[data-page=2][aria-current=page] 2      ← pagina corrente
 *     li.paginationItem > span.paginationEllipsis …
 *     li.paginationItem > button.paginationBtn[data-page=next] > icon
 * ```
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([paginationPart(jt, elements)], host);
 * elements.pagination; // → HTMLElement (nav), quando params.perPage > 0
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
 * Renderizza l'elenco delle pagine dentro `elements.pagination` a partire dallo stato corrente (`page`, `totPages`),
 * sostituendo il contenuto precedente; il `<nav>` è nascosto quando c'è una sola pagina.
 *
 * Quando `focusTarget` è indicato (il `data-page` del pulsante che ha causato il cambio:
 * `'prev'`, `'next'` o un numero di pagina) il focus viene spostato sul corrispondente nuovo pulsante, oppure
 * sul pulsante della pagina corrente quando quello non è più disponibile, così che gli utenti da tastiera
 * non perdano la loro posizione.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {string|null} [focusTarget=null] - `data-page` del pulsante a cui dare il focus dopo il rendering (default: null)
 * @returns {void}
 *
 * @example
 * renderPagination(jt);         // dopo l'aggiornamento di `jt.state`
 * renderPagination(jt, 'next'); // come sopra, spostando il focus sul pulsante "avanti"
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
