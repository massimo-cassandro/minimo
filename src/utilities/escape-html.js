/*! minimo - Escape HTML */
/** @type {Record<string, string>} */
const ESCAPE_MAP = {
  '&'  : '&amp;',
  '"'  : '&quot;',
  '\'' : '&#039;',
  '<'  : '&lt;',
  '>'  : '&gt;'
};
/** @type {Record<string, string>} */
const UNESCAPE_MAP = Object.fromEntries(Object.entries(ESCAPE_MAP).map(([k, v]) => [v, k]));

const ESCAPE_RE = /[&"'<>]/g;
const UNESCAPE_RE = /&amp;|&quot;|&#039;|&lt;|&gt;/g;

/**
 * Esegue l'escape dei caratteri HTML speciali di una stringa.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export const escapeHTML = str => str?.replace(ESCAPE_RE, m => ESCAPE_MAP[m]) ?? '';

/**
 * Riconverte le entità HTML nei caratteri originali.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export const unescapeHTML = str => str?.replace(UNESCAPE_RE, m => UNESCAPE_MAP[m]) ?? '';
