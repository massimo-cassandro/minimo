/*! minimo - Sentence Case */
/**
 * Converte una stringa in sentence case (prima lettera maiuscola, il resto minuscolo).
 * @param {string | null | undefined} str
 * @returns {string | null | undefined}
 */
export function sentenceCase(str) {
  if(str) {
    return  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
  }
  return str;
}
