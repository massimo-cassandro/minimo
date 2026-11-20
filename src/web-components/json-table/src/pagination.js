
import * as styles from './pagination.module.css';

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
 * Pulsante di scorrimento della finestra delle pagine (sostituisce i puntini di sospensione): `dir` indica la direzione,
 * `start` è la prima pagina della finestra che verrà mostrata e `end` l'ultima.
 * @typedef {{ jump: 'back'|'forward', start: number, end: number }} PageJump
 */

/**
 * Normalizza il numero di pulsanti della finestra (almeno 1).
 * @param {number} size
 * @returns {number}
 */
function windowSize(size) {
  return Math.max(1, Math.floor(Number(size) || 1));
}


/**
 * Limita la prima pagina della finestra all'intervallo valido: la finestra non comprende mai la prima e l'ultima
 * pagina, sempre visibili a parte (da 2 a `totPages - size`).
 *
 * @param {number} start - Prima pagina della finestra richiesta
 * @param {number} totPages - Numero totale di pagine
 * @param {number} size - Numero di pulsanti della finestra
 * @returns {number}
 */
function clampWindowStart(start, totPages, size) {
  return Math.min(Math.max(2, start), Math.max(2, totPages - size));
}


/**
 * Calcola la prima pagina della finestra dei pulsanti dopo un cambio di pagina, a partire dalla finestra precedente:
 * - senza finestra precedente (`prevStart` null) la finestra viene centrata sulla pagina corrente
 * - sulla prima o sull'ultima pagina la finestra viene accostata al relativo estremo
 * - se la pagina corrente è fuori dalla finestra, questa viene spostata del minimo necessario per includerla
 * - altrimenti la finestra resta invariata
 *
 * @param {number|null} prevStart - Prima pagina della finestra precedente, oppure null
 * @param {number} current - Pagina corrente (da 1)
 * @param {number} totPages - Numero totale di pagine
 * @param {number} size - Numero di pulsanti della finestra
 * @returns {number}
 *
 * @example
 * windowStartFor(null, 30, 50, 10); // → 26 (finestra 26–35, centrata su 30)
 * windowStartFor(26, 36, 50, 10);   // → 27 (finestra 27–36)
 * windowStartFor(26, 50, 50, 10);   // → 40 (finestra 40–49, accostata all'ultima pagina)
 */
export function windowStartFor(prevStart, current, totPages, size) {

  const n = windowSize(size);
  let start;

  if (prevStart == null) {
    start = current - Math.floor((n - 1) / 2);
  } else if (current <= 1) {
    start = 2;
  } else if (current >= totPages) {
    start = totPages - n;
  } else if (current < prevStart) {
    start = current;
  } else if (current > prevStart + n - 1) {
    start = current - n + 1;
  } else {
    start = prevStart;
  }

  return clampWindowStart(start, totPages, n);
}


/**
 * Costruisce l'elenco dei pulsanti da mostrare nella navigazione: la prima e l'ultima pagina più una finestra di
 * `size` pagine consecutive che parte da `start`. Le pagine omesse tra la prima pagina e la finestra, e tra la finestra e
 * l'ultima, sono rappresentate da un `PageJump` (pulsante "…") che fa scorrere la finestra di `size` posizioni
 * nella relativa direzione, senza superare i limiti. Quando il salto nasconderebbe una sola pagina, viene mostrata quella
 * pagina al suo posto. Con al massimo `size + 2` pagine vengono mostrate tutte.
 *
 * @param {number} totPages - Numero totale di pagine
 * @param {number} [size=10] - Numero di pulsanti della finestra (default: 10)
 * @param {number} [start=2] - Prima pagina della finestra, limitata all'intervallo valido (default: 2)
 * @returns {Array<number|PageJump>}
 *
 * @example
 * pageList(3, 10);       // → [1, 2, 3]
 * pageList(12, 10);      // → [1, 2, …, 12]  (tutte)
 * pageList(50, 10, 2);   // → [1, 2, …, 11, { jump: 'forward', start: 12, end: 21 }, 50]
 * pageList(50, 10, 12);  // → [1, { jump: 'back', start: 2, end: 11 }, 12, …, 21, { jump: 'forward', start: 22, end: 31 }, 50]
 * pageList(50, 10, 3);   // → [1, 2, 3, …, 12, { jump: 'forward', … }, 50]  (pagina 2 mostrata al posto del salto)
 * pageList(50, 10, 45);  // → [1, { jump: 'back', start: 30, end: 39 }, 40, …, 49, 50]  (finestra limitata a 40–49)
 */
export function pageList(totPages, size = 10, start = 2) {

  const n = windowSize(size);

  if (totPages <= n + 2) {
    return Array.from({ length: totPages }, (_, i) => i + 1);
  }

  const first = clampWindowStart(start, totPages, n);
  const last = first + n - 1;

  /** @type {Array<number|PageJump>} */
  const items = [1];

  if (first === 3) {
    items.push(2);
  } else if (first > 3) {
    const jumpStart = clampWindowStart(first - n, totPages, n);
    items.push({ jump: 'back', start: jumpStart, end: jumpStart + n - 1 });
  }

  for (let p = first; p <= last; p++) {
    items.push(p);
  }

  if (last === totPages - 2) {
    items.push(totPages - 1);
  } else if (last < totPages - 2) {
    const jumpStart = clampWindowStart(first + n, totPages, n);
    items.push({ jump: 'forward', start: jumpStart, end: jumpStart + n - 1 });
  }

  items.push(totPages);

  return items;
}


/**
 * Finestra dei pulsanti di ogni istanza: prima pagina, più pagina corrente e numero di pagine con cui è stata calcolata
 * (quando cambiano, la finestra viene ricalcolata con `windowStartFor()`).
 * @type {WeakMap<JsonTable, { start: number, page: number, totPages: number }>}
 */
const pageWindows = new WeakMap();


/**
 * Prima pagina della finestra dei pulsanti per lo stato corrente, ricalcolata quando la pagina corrente o il numero
 * di pagine sono cambiati dall'ultimo rendering; lo scorrimento con i pulsanti "…" non cambia pagina e quindi
 * viene mantenuto.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {number}
 */
function currentWindowStart(jt) {

  const { state, params } = jt;
  const prev = pageWindows.get(jt);

  let start;
  if (prev && prev.totPages === state.totPages && prev.page === state.page) {
    start = prev.start;
  } else {
    start = windowStartFor(prev && prev.totPages === state.totPages ? prev.start : null, state.page, state.totPages, params.paginationButtons);
  }

  pageWindows.set(jt, { start, page: state.page, totPages: state.totPages });
  return start;
}


/**
 * Sostituisce i segnaposto (`{page}`, `{start}`, `{end}`) di un'etichetta di paginazione.
 * @param {string|undefined} label
 * @param {Record<string, number>} values
 * @param {string} locale
 * @returns {string}
 */
function fillLabel(label, values, locale) {
  return String(label ?? '').replace(/\{(page|start|end)\}/g, (match, key) => (
    key in values ? values[key].toLocaleString(locale) : match
  ));
}


/**
 * Pagina richiesta da un pulsante `data-page` (`prev`, `next` o numero di pagina).
 * @param {string|undefined} target
 * @param {number} page - Pagina corrente
 * @returns {number}
 */
function requestedPage(target, page) {
  return target === 'prev' ? page - 1 : (target === 'next' ? page + 1 : Number(target));
}


/**
 * Elemento domBuilder del `<nav>` della paginazione (slot del template `pagination`), renderizzato solo quando
 * `params.perPage` è > 0. Il `<nav>` viene memorizzato in `elements.pagination` e riceve un listener
 * `click` delegato sui suoi pulsanti: quelli di pagina chiamano `jt.goToPage()`, quelli "…" fanno scorrere la finestra
 * dei pulsanti di `params.paginationButtons` posizioni senza cambiare pagina. Il contenuto viene renderizzato da
 * `renderPagination()` e l'intero `<nav>` è nascosto quando c'è una sola pagina.
 *
 * Struttura generata (vedi `renderPagination`):
 * ```
 * nav.pagination[classes.pagination][aria-label=labels.paginationAriaLabel]
 *   ul.paginationList
 *     li.paginationItem > button.paginationBtn[classes.paginationBtn][data-page=prev][aria-label][title] > icon
 *     li.paginationItem > button.paginationBtn[data-page=1][aria-label="Vai a pagina 1"] 1
 *     li.paginationItem > button.paginationBtn.paginationJump[data-jump=back][data-window=2][aria-label] …
 *     li.paginationItem > button.paginationBtn[data-page=12][aria-current=page] 12     ← pagina corrente
 *     li.paginationItem > button.paginationBtn.paginationJump[data-jump=forward][data-window=22][aria-label] …
 *     li.paginationItem > button.paginationBtn[data-page=50] 50
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
          /** @type {HTMLElement} */ (e.target).closest('button[data-page], button[data-jump]')
        );
        if (!btn || btn.hasAttribute('disabled') || btn.getAttribute('aria-current') === 'page') {
          return;
        }

        if (btn.dataset.jump) {
          const { state } = jt;
          pageWindows.set(jt, { start: Number(btn.dataset.window), page: state.page, totPages: state.totPages });
          renderPagination(jt, `jump-${btn.dataset.jump}`);
          return;
        }

        const target = btn.dataset.page;
        jt.goToPage(requestedPage(target, jt.state.page), target);
      });
    }
  };
}


/**
 * Elemento domBuilder della navigazione rapida del blocco info (slot del template `infoPagination`, incluso
 * nella parte `infoSection` tra il testo informativo e la ricerca): due pulsanti, pagina precedente e successiva, con
 * le icone `paginationPrevIcon`/`paginationNextIcon`. Renderizzato solo quando `params.perPage` è > 0, nascosto quando
 * c'è una sola pagina; lo stato dei pulsanti viene aggiornato da `renderPagination()`.
 *
 * Struttura generata:
 * ```
 * div.infoPagination[classes.infoPagination][role=group][aria-label=labels.infoPaginationAriaLabel]
 *   ul.paginationList
 *     li.paginationItem > button.paginationBtn.paginationArrow[classes.paginationBtn][data-page=prev] > icon
 *     li.paginationItem > button.paginationBtn.paginationArrow[classes.paginationBtn][data-page=next] > icon
 * ```
 *
 * L'elemento viene memorizzato in `elements.infoPagination`.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @param {JsonTableElements} elements - Oggetto che raccoglie gli elementi generati (modificato)
 * @returns {DomBuilderItem}
 *
 * @example
 * domBuilder([infoPaginationPart(jt, elements)], host);
 * elements.infoPagination; // → HTMLElement, quando params.perPage > 0
 */
export function infoPaginationPart(jt, elements) {

  const { params } = jt;
  const { labels } = params;
  const btnClass = classnames(styles.paginationBtn, styles.paginationArrow, params.classes.paginationBtn);

  /** @type {(target: string, label: string, icon: import('./defaults.js').IconDef) => DomBuilderItem} */
  const arrowBtn = (target, label, icon) => ({
    tag: 'li',
    className: styles.paginationItem,
    children: [
      {
        tag: 'button',
        className: btnClass,
        attrs: { type: 'button', 'data-page': target, 'aria-label': label, title: label },
        content: iconContent(icon, params.iconFile, params.iconClass)
      }
    ]
  });

  return {
    condition: params.perPage > 0,
    className: classnames(styles.infoPagination, params.classes.infoPagination),
    attrs: { role: 'group', 'aria-label': labels.infoPaginationAriaLabel, hidden: '' },
    callback: el => {
      const group = /** @type {HTMLElement} */ (el);
      elements.infoPagination = group;

      group.addEventListener('click', e => {
        const btn = /** @type {HTMLElement|null} */ (
          /** @type {HTMLElement} */ (e.target).closest('button[data-page]')
        );
        if (!btn || btn.hasAttribute('disabled')) {
          return;
        }
        // nessun focusTarget: il focus resta su questo pulsante, non passa alla navigazione sotto la tabella
        jt.goToPage(requestedPage(btn.dataset.page, jt.state.page));
      });
    },
    children: [
      {
        tag: 'ul',
        className: styles.paginationList,
        children: [
          arrowBtn('prev', labels.prevPage ?? '', params.paginationPrevIcon),
          arrowBtn('next', labels.nextPage ?? '', params.paginationNextIcon)
        ]
      }
    ]
  };
}


/**
 * Aggiorna la navigazione rapida del blocco info (`elements.infoPagination`): nascosta con una sola pagina,
 * pulsanti disabilitati sulla prima/ultima pagina. Se il pulsante con il focus viene disabilitato, il focus passa all'altro.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 */
function renderInfoPagination(jt) {

  const { elements, state } = jt;
  const group = elements.infoPagination;

  if (!group) {
    return;
  }

  group.hidden = state.totPages <= 1;

  const prev = /** @type {HTMLButtonElement|null} */ (group.querySelector('button[data-page="prev"]'));
  const next = /** @type {HTMLButtonElement|null} */ (group.querySelector('button[data-page="next"]'));
  const focused = [prev, next].find(btn => btn && btn === document.activeElement);

  if (prev) {
    prev.disabled = state.page <= 1;
  }
  if (next) {
    next.disabled = state.page >= state.totPages;
  }

  if (focused?.disabled) {
    [prev, next].find(btn => btn && !btn.disabled)?.focus();
  }
}


/**
 * Renderizza l'elenco delle pagine dentro `elements.pagination` a partire dallo stato corrente (`page`, `totPages`) e
 * dalla finestra dei pulsanti (vedi `pageList()`), sostituendo il contenuto precedente; il `<nav>` è nascosto quando c'è
 * una sola pagina. Aggiorna anche la navigazione rapida del blocco info (`elements.infoPagination`).
 *
 * Quando `focusTarget` è indicato (il `data-page` del pulsante che ha causato il cambio: `'prev'`, `'next'` o un numero
 * di pagina, oppure `'jump-back'`/`'jump-forward'` per i pulsanti "…") il focus viene spostato sul corrispondente nuovo
 * pulsante, oppure, quando quello non è più disponibile, sul pulsante della pagina corrente o sul primo pulsante
 * della finestra, così che gli utenti da tastiera non perdano la loro posizione.
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

  renderInfoPagination(jt);

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
  const windowStart = currentWindowStart(jt);

  /** @type {(target: string, label: string, icon: import('./defaults.js').IconDef, disabled: boolean) => DomBuilderItem} */
  const arrowBtn = (target, label, icon, disabled) => ({
    tag: 'li',
    className: styles.paginationItem,
    children: [
      {
        tag: 'button',
        className: classnames(btnClass, styles.paginationArrow),
        attrs: { type: 'button', 'data-page': target, 'aria-label': label, title: label, disabled: disabled ? '' : null },
        content: iconContent(icon, params.iconFile, params.iconClass)
      }
    ]
  });

  domBuilder([
    {
      tag: 'ul',
      className: styles.paginationList,
      children: [
        arrowBtn('prev', labels.prevPage ?? '', params.paginationPrevIcon, state.page <= 1),

        ...pageList(state.totPages, params.paginationButtons, windowStart).map(item => {

          if (typeof item === 'object') {
            const label = fillLabel(item.jump === 'back' ? labels.prevPages : labels.nextPages, item, locale);
            return {
              tag: 'li',
              className: styles.paginationItem,
              children: [
                {
                  tag: 'button',
                  className: classnames(btnClass, styles.paginationJump),
                  attrs: { type: 'button', 'data-jump': item.jump, 'data-window': item.start, 'aria-label': label, title: label },
                  content: '…'
                }
              ]
            };
          }

          const label = fillLabel(item === state.page ? labels.currentPage : labels.pageTitle, { page: item }, locale);
          return {
            tag: 'li',
            className: styles.paginationItem,
            children: [
              {
                tag: 'button',
                className: btnClass,
                attrs: {
                  type: 'button',
                  'data-page': item,
                  'aria-current': item === state.page ? 'page' : null,
                  'aria-label': label,
                  title: label
                },
                content: item.toLocaleString(locale)
              }
            ]
          };
        }),

        arrowBtn('next', labels.nextPage ?? '', params.paginationNextIcon, state.page >= state.totPages)
      ]
    }
  ], nav, { emptyParent: true });

  if (focusTarget != null) {
    const selector = focusTarget.startsWith('jump-')
      ? `button[data-jump="${focusTarget.slice(5)}"]`
      : `button[data-page="${focusTarget}"]:not([disabled])`;
    const wanted = /** @type {HTMLButtonElement|null} */ (nav.querySelector(selector));
    const current = /** @type {HTMLButtonElement|null} */ (nav.querySelector('button[aria-current="page"]'));
    const firstInWindow = /** @type {HTMLButtonElement|null} */ (nav.querySelector(`button[data-page="${windowStart}"]`));
    (wanted ?? current ?? firstInWindow)?.focus();
  }
}
