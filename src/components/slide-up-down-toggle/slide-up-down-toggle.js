// @ts-check

/**
 * @module slide-up-down-toggle
 *
 * Collapse/expand animation driven entirely by CSS — no pixel measurement in JS.
 *
 * Requires the companion CSS file (`slide-up-down-toggle.css`) which uses
 * `interpolate-size: allow-keywords` to enable `height: auto` transitions.
 * Elements must carry the `data-slide` attribute; set it to `"closed"` for the
 * initial collapsed state instead of `display: none`.
 *
 * Usage:
 *   <div data-slide="closed">…</div>   ← initially collapsed
 *   <div data-slide>…</div>            ← initially expanded
 */

/**
 * Waits for the `height` transition to complete on `target`.
 * Sets `--slide-duration` if a numeric `duration` is provided,
 * falling back to whatever the CSS declares.
 *
 * @param {HTMLElement} target
 * @param {number | undefined} duration
 * @returns {Promise<void>}
 */
function awaitHeight(target, duration) {
  if (duration !== undefined) {
    target.style.setProperty('--slide-duration', `${duration}ms`);
  }
  return new Promise(resolve => {
    /** @param {TransitionEvent} e */
    const handler = (e) => {
      if (e.propertyName === 'height') {
        target.removeEventListener('transitionend', handler);
        resolve();
      }
    };
    target.addEventListener('transitionend', handler);
  });
}

/**
 * Removes the `data-slide` attribute and the `--slide-duration` override,
 * restoring the element to its original stylesheet-defined state.
 * @param {HTMLElement} target
 */
export function disposeSliding(target) {
  delete target.dataset.slide;
  target.style.removeProperty('--slide-duration');
}

/**
 * Collapses an element to zero height via CSS transition.
 * Sets `data-slide="closed"` which the companion CSS uses to apply `height: 0`.
 *
 * @param {HTMLElement} target
 * @param {number} [duration] - Override duration in ms; if omitted uses `--slide-duration` from CSS.
 * @param {(() => void) | null} [callback=null] - Invoked after the transition completes.
 * @returns {Promise<void>}
 */
export async function slideUp(target, duration, callback = null) {
  const done = awaitHeight(target, duration);
  target.dataset.slide = 'closed';
  await done;
  callback?.();
}

/**
 * Expands an element to its intrinsic height via CSS transition.
 * Sets `data-slide="open"` which removes the `height: 0` constraint,
 * letting CSS animate to `height: auto` via `interpolate-size: allow-keywords`.
 *
 * @param {HTMLElement} target
 * @param {number} [duration] - Override duration in ms; if omitted uses `--slide-duration` from CSS.
 * @param {(() => void) | null} [callback=null] - Invoked after the transition completes.
 * @returns {Promise<void>}
 */
export async function slideDown(target, duration, callback = null) {
  const done = awaitHeight(target, duration);
  target.dataset.slide = 'open';
  await done;
  callback?.();
}

/**
 * Toggles the collapsed/expanded state of an element.
 *
 * @param {HTMLElement} target
 * @param {number} [duration] - Override duration in ms; if omitted uses `--slide-duration` from CSS.
 * @param {(() => void) | null} [callback=null] - Invoked after the transition completes.
 * @returns {Promise<void>}
 */
export function slideToggle(target, duration, callback = null) {
  return target.dataset.slide === 'closed'
    ? slideDown(target, duration, callback)
    : slideUp(target, duration, callback);
}
