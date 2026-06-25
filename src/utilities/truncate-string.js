
// @ts-check

/**
 * Truncates a string to the desired length adding an option suffix
 * from https://www.codegrepper.com/code-examples/javascript/javascript+truncate+string+full+word
 *
 * @param {string} str - string yo be truncated
 * @param {number} maxLength - truncated string max length
 * @param {string} suffix
 * @returns {string|undefined} truncated string, or undefined if str is falsy
 *
 */

export function truncateString(str, maxLength, suffix) {

  suffix = suffix || '…';
  if(str) {
    return str.length < maxLength ? str :
      `${str.substring(0, str.substring(0, maxLength - suffix.length).lastIndexOf(' '))}${suffix}`;
  }
}
