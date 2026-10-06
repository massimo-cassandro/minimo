
// @ts-check
/*! minimo - Truncate String */

/**
 * Tronca una stringa alla lunghezza desiderata aggiungendo un suffisso opzionale
 * da https://www.codegrepper.com/code-examples/javascript/javascript+truncate+string+full+word
 *
 * @param {string} str - stringa da troncare
 * @param {number} maxLength - lunghezza massima della stringa troncata
 * @param {string} suffix (default: '…')
 * @returns {string|undefined} stringa troncata, oppure undefined se str è falsy
 *
 */

export function truncateString(str, maxLength, suffix) {

  suffix = suffix || '…';
  if(str) {
    return str.length < maxLength ? str :
      `${str.substring(0, str.substring(0, maxLength - suffix.length).lastIndexOf(' '))}${suffix}`;
  }
}
