import * as styles from './spinner.module.css';

// The spinner class depends on the spinner type in use; the corresponding CSS file must be included.
// TODO: system for configuring the spinner type to allow multiple spinner types in the same project

/**
 * Returns the HTML markup for a loading spinner.
 * @returns {string}
 */
export function spinner() {
  return `<div class="${styles.spinnerWrapper}"><div class="spinner">Loading...</div></div>`;
}
