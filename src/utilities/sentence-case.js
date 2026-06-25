/**
 * Converts a string to sentence case (first letter uppercase, rest lowercase).
 * @param {string | null | undefined} str
 * @returns {string | null | undefined}
 */
export function sentenceCase(str) {
  if(str) {
    return  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
  }
  return str;
}
