/**
 * Strips HTML tags from a string.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function stripTags(str) {
  return (str || '')?.replace(/(<([^>]+)>)/gi, '').trim();
}
