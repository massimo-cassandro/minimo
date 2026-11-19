import * as styles from './thead.module.css';

import { classnames } from '../../../utilities/classnames.js';
import { setContent } from './content-utils.js';
import { iconContent } from './icons.js';
import { nextSortDir } from './sorting.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./main-builder.js').JsonTableElements} JsonTableElements */

/** @typedef {'none'|'ascending'|'descending'} SortState */

/**
 * Aggiorna lo stato di ordinamento di un `<th>` ordinabile: attributo `data-jt-sort` (`asc`/`desc`, rimosso quando `none`),
 * attributo `aria-sort` (solo sul criterio principale, vedi `primary`), icona e `title`/`aria-label` del pulsante di
 * ordinamento (entrambi descrivono l'azione del prossimo click, ad es. "ordina in modo decrescente" quando è attivo
 * l'ordinamento crescente).
 *
 * @param {HTMLTableCellElement} th - Il `<th>` generato da `theadPart()`
 * @param {SortState} state - Stato di ordinamento da applicare
 * @param {JsonTableParams} params - Parametri risolti (icone e label)
 * @param {boolean} [primary=true] - Indica se la colonna è il criterio principale: solo in questo caso riceve
 *   `aria-sort`, che le specifiche ARIA prevedono su una sola intestazione per volta (default: true)
 * @returns {void}
 *
 * @example
 * setSortState(th, 'ascending', params);
 * // th[data-jt-sort=asc][aria-sort=ascending], icon → params.sortAscArrowIcon, button title → params.labels.sortDesc
 * setSortState(th, 'descending', params, false);
 * // th[data-jt-sort=desc] senza aria-sort (criterio secondario)
 */
export function setSortState(th, state, params, primary = true) {

  const btn = th.querySelector('button');
  const icon = th.querySelector('[data-jt-sort-icon]');

  if (state === 'none') {
    th.removeAttribute('data-jt-sort');
  } else {
    th.dataset.jtSort = state === 'descending' ? 'desc' : 'asc';
  }

  if (state === 'none' || !primary) {
    th.removeAttribute('aria-sort');
  } else {
    th.setAttribute('aria-sort', state);
  }

  const nextLabel = state === 'none'
    ? params.labels.sortAsc
    : (state === 'ascending' ? params.labels.sortDesc : params.labels.sortNone);

  if (btn) {
    const titleText = (th.querySelector('[data-jt-sort-title]')?.textContent ?? '').trim();
    btn.title = nextLabel ?? '';
    btn.setAttribute('aria-label', titleText ? `${titleText}: ${nextLabel}` : (nextLabel ?? ''));
  }

  if (icon) {
    const iconDef = state === 'none'
      ? params.sortNoneArrowIcon
      : (state === 'ascending' ? params.sortAscArrowIcon : params.sortDescArrowIcon);
    setContent(/** @type {HTMLElement} */ (icon), iconContent(iconDef, params.iconFile, params.iconClass));
  }
}


/**
 * Applica l'ordinamento corrente (`jt.state.sort`) a ogni `<th>` ordinabile del thead: tutte le colonne dei criteri
 * attivi ricevono `data-jt-sort` (`asc`/`desc`, usato dal CSS per evidenziarle) e l'icona corrispondente, le altre
 * vengono riportate a `none`. Come indicato dalle specifiche ARIA, `aria-sort` va su una sola intestazione per volta:
 * lo riceve solo la colonna del primo criterio.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 *
 * @example
 * jt.state.sort = [{ key: 'city', dir: 'asc' }, { key: 'name', dir: 'desc' }];
 * applySortState(jt);
 * // th[data-key=city][data-jt-sort=asc][aria-sort=ascending]
 * // th[data-key=name][data-jt-sort=desc] (senza aria-sort), gli altri th senza data-jt-sort né aria-sort
 */
export function applySortState(jt) {

  const { elements, params, state } = jt;

  if (!elements.thead) {
    return;
  }

  elements.thead.querySelectorAll('th[data-sortable]').forEach(el => {
    const th = /** @type {HTMLTableCellElement} */ (el);
    const idx = state.sort.findIndex(s => s.key === th.dataset.key);
    const sortState = idx === -1 ? 'none' : (state.sort[idx].dir === 'desc' ? 'descending' : 'ascending');
    setSortState(th, sortState, params, idx <= 0);
  });
}


/**
 * Collega il listener `click` delegato al thead: un click su un pulsante di ordinamento fa scorrere
 * l'ordinamento della colonna (nessuno → asc → desc → nessuno, vedi `nextSortDir`, partendo dalla direzione del criterio
 * della colonna anche quando non è il principale) tramite `jt.setSort()`, che sostituisce
 * tutti i criteri attivi (anche quelli di `initialSort`) con la sola colonna cliccata.
 * Il thead non viene ricostruito all'ordinamento, quindi il focus resta sul pulsante cliccato.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 *
 * @example
 * setSortListener(jt); // after mainBuilder(jt)
 */
export function setSortListener(jt) {

  const thead = jt.elements.thead;

  if (!thead) {
    return;
  }

  thead.addEventListener('click', e => {
    const btn = /** @type {HTMLElement|null} */ (
      /** @type {HTMLElement} */ (e.target).closest('button[data-key]')
    );
    if (!btn) {
      return;
    }
    const key = btn.dataset.key ?? '';
    // la direzione corrente è quella del criterio della colonna, anche se non principale (icona coerente col click)
    const current = jt.state.sort.find(s => s.key === key)?.dir ?? null;
    jt.setSort(key, nextSortDir(current));
  });
}


/**
 * Elemento domBuilder per `<thead>`.
 *
 * Generated structure:
 * ```
 * thead > tr
 *   th[scope=col][data-key][headerClass]                                   ← non ordinabile: contenuto = col.title
 *   th.sortable[scope=col][data-key][data-sortable=true][headerClass]      ← ordinabile
 *     button.sortBtn[classes.sortBtn][type=button][data-key][title][aria-label]
 *       span.sortTitle[data-jt-sort-title]  ← col.title
 *       span.sortIcon[data-jt-sort-icon]    ← icona di ordinamento (vedi `setSortState`)
 * ```
 *
 * Il `<thead>` viene memorizzato in `elements.thead`; il listener di ordinamento è collegato da `setSortListener()`.
 *
 * @param {JsonTable} jt - L'istanza del componente (`params`, `cols`)
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([{ tag: 'table', children: [theadPart(jt, elements)] }], host);
 * elements.thead; // → HTMLTableSectionElement
 */
export function theadPart(jt, elements) {

  const { params, cols } = jt;

  return {
    tag: 'thead',
    callback: el => { elements.thead = /** @type {HTMLTableSectionElement} */ (el); },
    children: [
      {
        tag: 'tr',
        children: cols.map(col => ({
          tag: 'th',
          className: classnames(col.headerClass, col.sortable && styles.sortable),
          attrs: {
            scope: 'col',
            'data-key': col.key,
            'data-sortable': col.sortable ? 'true' : null
          },
          content: col.sortable ? null : col.title,
          children: col.sortable
            ? [
              {
                tag: 'button',
                className: classnames(styles.sortBtn, params.classes.sortBtn),
                attrs: { type: 'button', 'data-key': col.key },
                children: [
                  { tag: 'span', className: styles.sortTitle, attrs: { 'data-jt-sort-title': '' }, content: col.title },
                  { tag: 'span', className: styles.sortIcon, attrs: { 'data-jt-sort-icon': '', 'aria-hidden': 'true' } }
                ]
              }
            ]
            : [],
          callback: el => {
            if (col.sortable) {
              setSortState(/** @type {HTMLTableCellElement} */ (el), 'none', params);
            }
          }
        }))
      }
    ]
  };
}
