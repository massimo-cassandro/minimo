/*! minimo - Strip Tags */
/**
 * Rimuove i tag HTML da una stringa.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function stripTags(str) {
  return (str || '')?.replace(/(<([^>]+)>)/gi, '').trim();
}
