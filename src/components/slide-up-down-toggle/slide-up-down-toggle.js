// @ts-check

import * as styles from './slide-up-down-toggle.module.css';

/**
 * @module slide-up-down-toggle
 *
 * Collapse/expand animation driven by CSS — JS only toggles a data attribute
 * and manages a lightweight wrapper element. No pixel measurement anywhere.
 *
 * ─── How it works ─────────────────────────────────────────────────────────────
 *
 * The CSS module uses `interpolate-size: allow-keywords` (height: auto
 * transitions), `allow-discrete` (display: none transition), and
 * `@starting-style` (entry animation from display: none). See the CSS file
 * for a full explanation of each feature.
 *
 * ─── wrap: true (default) ─────────────────────────────────────────────────────
 *
 * JS wraps the target in a generated <div class="slide"> and animates that
 * wrapper. The target element is completely untouched and can have any
 * display value, padding, margin, or flex/grid layout.
 *
 *   // target is free to be flex, have padding, etc.
 *   slideToggle(document.querySelector('#panel'));
 *
 * Initial collapsed state — add data-slide="closed" to the TARGET in HTML
 * before any JS call. The first call transfers it to the generated wrapper:
 *
 *   <div id="panel" data-slide="closed">
 *     <div class="d-flex p-3">…content…</div>
 *   </div>
 *
 * ─── wrap: false ──────────────────────────────────────────────────────────────
 *
 * JS adds the .slide class directly to the target. The target must be a plain
 * block container with no padding, flex or grid of its own. All layout must
 * live on an inner child element.
 *
 *   <!-- target: plain wrapper, no padding -->
 *   <div id="panel" data-slide="closed">
 *     <!-- inner: all layout here -->
 *     <div class="d-flex p-3">…content…</div>
 *   </div>
 *
 *   slideToggle(document.querySelector('#panel'), { wrap: false });
 *
 * ─── Options ──────────────────────────────────────────────────────────────────
 *
 * @typedef {{ wrap?: boolean, duration?: number, callback?: (() => void) | null }} SlideOptions
 *
 *   wrap     {boolean}          default true  — auto-generate wrapper (see above)
 *   duration {number}           ms            — overrides --slide-duration CSS var;
 *                                               if omitted the CSS value is used
 *   callback {() => void|null}  default null  — invoked after the transition ends
 *
 * ─── Return value ─────────────────────────────────────────────────────────────
 *
 * All three functions return a Promise<void> that resolves when the transition ends.
 */

/**
 * Default option values — single source of truth used in every slide function.
 * @type {Required<SlideOptions>}
 */
const DEFAULT_OPTIONS = {
  wrap: true,
  duration: /** @type {any} */ (undefined),
  callback: null,
};

/**
 * Maps each target element to its slide element (generated wrapper or the
 * target itself). Checked on every call so the setup runs only once per target.
 * @type {WeakMap<HTMLElement, HTMLElement>}
 */
const registry = new WeakMap();

/**
 * Returns the slide element for `target`, creating it on the first call.
 *
 * wrap: true  — inserts a <div class="slide"> before the target, moves the
 *               target inside it, and transfers any existing data-slide value.
 *               Resolves after a requestAnimationFrame so the browser paints
 *               the wrapper's initial state before any transition-triggering
 *               attribute change. (offsetHeight forces layout but not a paint —
 *               only rAF guarantees a rendered frame as the transition origin.)
 * wrap: false — adds the .slide class directly to the target. Resolves immediately
 *               since the element was already in the DOM.
 *
 * @param {HTMLElement} target
 * @param {boolean} wrap
 * @returns {Promise<HTMLElement>} the element that carries .slide and data-slide
 */
async function getSlideEl(target, wrap) {
  if (registry.has(target)) return /** @type {HTMLElement} */ (registry.get(target));

  let el;
  if (wrap) {
    el = document.createElement('div');
    el.classList.add(styles.slide);
    // transfer only 'closed' state to the wrapper; 'open' is the default for
    // visible elements and must NOT be set — it would trigger @starting-style
    // on insertion, causing an unwanted height:0 entry animation
    if ('slide' in target.dataset) {
      if (target.dataset.slide === 'closed') el.dataset.slide = 'closed';
      delete target.dataset.slide;
    }
    target.replaceWith(el);
    el.appendChild(target);
    // two nested rAFs are required: the outer one fires before the first paint
    // (wrapper inserted but not yet rendered), the inner one fires after that
    // paint — only then does the browser have a committed "previous style" to
    // use as the transition origin. A single rAF or offsetHeight is not enough
    // because both still execute before the first paint completes.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  } else {
    // read computed display BEFORE adding .slide, which would alter it
    const startsHidden = window.getComputedStyle(target).display === 'none';
    target.classList.add(styles.slide);
    el = target;

    if (startsHidden && !('slide' in target.dataset)) {
      // remove inline display: none so .slide and its [data-slide] rules own visibility;
      // CSS-based display: none from other rules may still conflict — wrap: true avoids this
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
 * Waits for the `height` transition on `el` to complete.
 * Called AFTER the state attribute has been set so the transition is already
 * running; transitionend fires at the end of the animation duration.
 * Optionally sets --slide-duration to override the CSS default.
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
 * Tears down the slide setup for `target`.
 *
 * wrap was true  — removes the generated wrapper and restores the target
 *                  to its original position in the DOM.
 * wrap was false — removes the .slide class and the data-slide attribute
 *                  from the target.
 *
 * In both cases --slide-duration is removed from the slide element.
 *
 * @param {HTMLElement} target
 */
export function disposeSliding(target) {
  if (!registry.has(target)) return;
  const el = /** @type {HTMLElement} */ (registry.get(target));

  el.style.removeProperty('--slide-duration');

  if (el !== target) {
    el.replaceWith(target); // remove wrapper, put target back
  } else {
    target.classList.remove(styles.slide);
    delete target.dataset.slide;
  }

  registry.delete(target);
}

/**
 * Collapses `target`.
 * CSS animates height to 0, then snaps display to none.
 *
 * @param {HTMLElement} target
 * @param {SlideOptions} [options]
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
 * Expands `target`.
 * display snaps to block, then CSS animates height from 0 (via @starting-style) to auto.
 *
 * @param {HTMLElement} target
 * @param {SlideOptions} [options]
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
 * Toggles the collapsed/expanded state of `target`.
 * Reads the current data-slide value on the slide element to decide direction.
 *
 * @param {HTMLElement} target
 * @param {SlideOptions} [options]
 * @returns {Promise<void>}
 */
export async function slideToggle(target, options = {}) {
  const { wrap } = { ...DEFAULT_OPTIONS, ...options };
  const el = await getSlideEl(target, wrap);
  return el.dataset.slide === 'closed'
    ? slideDown(target, options)
    : slideUp(target, options);
}
