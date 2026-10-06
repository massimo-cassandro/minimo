// @ts-check
/*! minimo - Slide Up/Down Toggle */

import * as styles from './slide-up-down-toggle.module.css';

/**
 * @module slide-up-down-toggle
 *
 * Animazione di chiusura/apertura gestita via CSS — il JS si limita a commutare un attributo data
 * e a gestire un leggero elemento wrapper. Nessuna misurazione in pixel.
 *
 * ─── Come funziona ────────────────────────────────────────────────────────────
 *
 * Il CSS module usa `interpolate-size: allow-keywords` (transizioni verso height: auto),
 * `allow-discrete` (transizione di display: none) e
 * `@starting-style` (animazione di ingresso da display: none). Vedi il file CSS
 * per una spiegazione completa di ciascuna funzionalità.
 *
 * ─── wrap: true (default) ─────────────────────────────────────────────────────
 *
 * Il JS racchiude il target in un <div class="slide"> generato e anima quel
 * wrapper. L'elemento target resta del tutto intatto e può avere qualsiasi
 * valore di display, padding, margin o layout flex/grid.
 *
 *   // il target può essere flex, avere padding, ecc.
 *   slideToggle(document.querySelector('#panel'));
 *
 * Stato iniziale chiuso — aggiungere data-slide="closed" al TARGET nell'HTML
 * prima di qualsiasi chiamata JS. La prima chiamata lo trasferisce al wrapper generato:
 *
 *   <div id="panel" data-slide="closed">
 *     <div class="d-flex p-3">…content…</div>
 *   </div>
 *
 * ─── wrap: false ──────────────────────────────────────────────────────────────
 *
 * Il JS aggiunge la classe .slide direttamente al target. Il target deve essere un semplice
 * contenitore block, senza padding, flex o grid propri. Tutto il layout deve
 * stare su un elemento figlio interno.
 *
 *   <!-- target: semplice wrapper, senza padding -->
 *   <div id="panel" data-slide="closed">
 *     <!-- interno: tutto il layout va qui -->
 *     <div class="d-flex p-3">…content…</div>
 *   </div>
 *
 *   slideToggle(document.querySelector('#panel'), { wrap: false });
 *
 * ─── Opzioni ──────────────────────────────────────────────────────────────────
 *
 * @typedef {{ wrap?: boolean, duration?: number, callback?: (() => void) | null }} SlideOptions
 *
 *   wrap     {boolean}          default true  — genera automaticamente il wrapper (vedi sopra)
 *   duration {number}           ms            — sovrascrive la variabile CSS --slide-duration;
 *                                               se omesso viene usato il valore CSS
 *   callback {() => void|null}  default null  — invocata al termine della transizione
 *
 * Mantenuto qui come riferimento: le tre funzioni esportate qui sotto ridichiarano queste stesse proprietà
 * come voci `@param` con notazione puntata e tipo base `object` invece di `SlideOptions`, dato che TypeScript
 * espande le proprietà `@param` con notazione puntata (necessarie perché IntelliSense dell'editor elenchi
 * ogni proprietà) solo quando il tipo base è il letterale `object`; un typedef con nome darebbe errore (TS8032).
 *
 * ─── Valore restituito ────────────────────────────────────────────────────────
 *
 * Tutte e tre le funzioni restituiscono una Promise<void> che si risolve al termine della transizione.
 */

/**
 * Valori di default delle opzioni — unica fonte di verità usata in ogni funzione slide.
 * @type {Required<SlideOptions>}
 */
const DEFAULT_OPTIONS = {
  wrap: true,
  duration: /** @type {any} */ (undefined),
  callback: null,
};

/**
 * Associa ogni elemento target al proprio elemento slide (wrapper generato o il
 * target stesso). Controllato a ogni chiamata così che il setup venga eseguito una sola volta per target.
 * @type {WeakMap<HTMLElement, HTMLElement>}
 */
const registry = new WeakMap();

/**
 * Restituisce l'elemento slide per `target`, creandolo alla prima chiamata.
 *
 * wrap: true  — inserisce un <div class="slide"> prima del target, sposta il
 *               target al suo interno e trasferisce l'eventuale valore data-slide esistente.
 *               Si risolve dopo un requestAnimationFrame così che il browser disegni
 *               lo stato iniziale del wrapper prima di qualsiasi cambio di
 *               attributo che attivi la transizione. (offsetHeight forza il layout ma non il paint —
 *               solo rAF garantisce un frame renderizzato come origine della transizione.)
 * wrap: false — aggiunge la classe .slide direttamente al target. Si risolve subito
 *               dato che l'elemento era già nel DOM.
 *
 * @param {HTMLElement} target
 * @param {boolean} wrap
 * @returns {Promise<HTMLElement>} l'elemento che porta .slide e data-slide
 */
async function getSlideEl(target, wrap) {
  if (registry.has(target)) return /** @type {HTMLElement} */ (registry.get(target));

  let el;
  if (wrap) {
    el = document.createElement('div');
    el.classList.add(styles.slide);
    /*
      trasferisce al wrapper solo lo stato 'closed'; 'open' è il default per gli
      elementi visibili e NON va impostato — attiverebbe @starting-style
      all'inserimento, causando un'animazione di ingresso indesiderata da height:0
    */
    if ('slide' in target.dataset) {
      if (target.dataset.slide === 'closed') el.dataset.slide = 'closed';
      delete target.dataset.slide;
    }
    target.replaceWith(el);
    el.appendChild(target);
    /*
      servono due rAF annidati: quello esterno scatta prima del primo paint
      (wrapper inserito ma non ancora renderizzato), quello interno scatta dopo quel
      paint — solo allora il browser ha uno "stile precedente" consolidato da
      usare come origine della transizione. Un solo rAF o offsetHeight non basta
      perché entrambi vengono comunque eseguiti prima del completamento del primo paint.
    */
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  } else {
    // legge il display calcolato PRIMA di aggiungere .slide, che lo altererebbe
    const startsHidden = window.getComputedStyle(target).display === 'none';
    target.classList.add(styles.slide);
    el = target;

    if (startsHidden && !('slide' in target.dataset)) {
      // rimuove il display: none inline così che .slide e le sue regole [data-slide] gestiscano la visibilità;
      // un display: none basato su CSS da altre regole potrebbe comunque confliggere — wrap: true lo evita
      if (target.style.display === 'none') {
        target.style.removeProperty('display');
      }
      target.dataset.slide = 'closed';
    }
  }

  registry.set(target, el);
  return el;
}

/**
 * Attende il completamento della transizione di `height` su `el`.
 * Chiamata DOPO l'impostazione dell'attributo di stato, così che la transizione sia già
 * in corso; transitionend scatta alla fine della durata dell'animazione.
 * Facoltativamente imposta --slide-duration per sovrascrivere il default CSS.
 *
 * @param {HTMLElement} el
 * @param {number | undefined} duration
 * @returns {Promise<void>}
 */
async function awaitHeight(el, duration) {
  if (duration !== undefined) {
    el.style.setProperty('--slide-duration', `${duration}ms`);
  }
  await /** @type {Promise<void>} */ (new Promise(resolve => {
    /** @param {TransitionEvent} e */
    const handler = (e) => {
      if (e.propertyName === 'height') {
        el.removeEventListener('transitionend', handler);
        resolve();
      }
    };
    el.addEventListener('transitionend', handler);
  }));
}

/**
 * Smonta il setup slide per `target`.
 *
 * wrap era true  — rimuove il wrapper generato e riporta il target
 *                  nella sua posizione originale nel DOM.
 * wrap era false — rimuove la classe .slide e l'attributo data-slide
 *                  dal target.
 *
 * In entrambi i casi --slide-duration viene rimosso dall'elemento slide.
 *
 * @param {HTMLElement} target
 */
export function disposeSliding(target) {
  if (!registry.has(target)) return;
  const el = /** @type {HTMLElement} */ (registry.get(target));

  el.style.removeProperty('--slide-duration');

  if (el !== target) {
    el.replaceWith(target); // rimuove il wrapper, rimette il target al suo posto
  } else {
    target.classList.remove(styles.slide);
    delete target.dataset.slide;
  }

  registry.delete(target);
}

/**
 * Chiude `target`.
 * Il CSS anima height fino a 0, poi imposta di scatto display su none.
 *
 * @param {HTMLElement} target
 * @param {object} [options] (default: {})
 * @param {boolean} [options.wrap=true] - genera automaticamente un wrapper `<div class="slide">` attorno a `target` (vedi la documentazione del modulo sopra); se `false`, la classe `.slide` viene aggiunta direttamente a `target` (default: true)
 * @param {number} [options.duration] - sovrascrive la variabile CSS `--slide-duration` (ms); se omesso viene usato il valore CSS.
 * @param {(() => void) | null} [options.callback] - invocata al termine della transizione (default: null)
 * @returns {Promise<void>}
 */
export async function slideUp(target, options = {}) {
  const { wrap, duration, callback } = { ...DEFAULT_OPTIONS, ...options };
  const el = await getSlideEl(target, wrap);
  el.dataset.slide = 'closed';
  await awaitHeight(el, duration);
  callback?.();
}

/**
 * Apre `target`.
 * display passa di scatto a block, poi il CSS anima height da 0 (tramite @starting-style) ad auto.
 *
 * @param {HTMLElement} target
 * @param {object} [options] (default: {})
 * @param {boolean} [options.wrap=true] - genera automaticamente un wrapper `<div class="slide">` attorno a `target` (vedi la documentazione del modulo sopra); se `false`, la classe `.slide` viene aggiunta direttamente a `target` (default: true)
 * @param {number} [options.duration] - sovrascrive la variabile CSS `--slide-duration` (ms); se omesso viene usato il valore CSS.
 * @param {(() => void) | null} [options.callback] - invocata al termine della transizione (default: null)
 * @returns {Promise<void>}
 */
export async function slideDown(target, options = {}) {
  const { wrap, duration, callback } = { ...DEFAULT_OPTIONS, ...options };
  const el = await getSlideEl(target, wrap);
  el.dataset.slide = 'open';
  await awaitHeight(el, duration);
  callback?.();
}

/**
 * Commuta lo stato chiuso/aperto di `target`.
 * Legge il valore data-slide corrente sull'elemento slide per decidere la direzione.
 *
 * @param {HTMLElement} target
 * @param {object} [options] (default: {})
 * @param {boolean} [options.wrap=true] - genera automaticamente un wrapper `<div class="slide">` attorno a `target` (vedi la documentazione del modulo sopra); se `false`, la classe `.slide` viene aggiunta direttamente a `target` (default: true)
 * @param {number} [options.duration] - sovrascrive la variabile CSS `--slide-duration` (ms); se omesso viene usato il valore CSS.
 * @param {(() => void) | null} [options.callback] - invocata al termine della transizione (default: null)
 * @returns {Promise<void>}
 */
export async function slideToggle(target, options = {}) {
  const { wrap } = { ...DEFAULT_OPTIONS, ...options };
  const el = await getSlideEl(target, wrap);
  return el.dataset.slide === 'closed'
    ? slideDown(target, options)
    : slideUp(target, options);
}
