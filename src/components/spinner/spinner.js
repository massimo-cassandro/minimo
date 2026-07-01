import * as _spinnerCss from './spinner.module.css';
const styles = /** @type {Record<string, string>} */ (/** @type {any} */ (_spinnerCss).default ?? _spinnerCss);

// The spinner class depends on the spinner type in use; the corresponding CSS file must be included.
// TODO: system for configuring the spinner type to allow multiple spinner types in the same project

/**
 * Returns the HTML markup for a loading spinner.
 * @returns {string}
 */
export function spinner() {
  return `<div class="${styles.spinnerWrapper}"><div class="spinner">Loading...</div></div>`;
}
