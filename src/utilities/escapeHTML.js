const ESCAPE_MAP = {
  '&'  : '&amp;',
  '"'  : '&quot;',
  '\'' : '&#039;',
  '<'  : '&lt;',
  '>'  : '&gt;'
};
const UNESCAPE_MAP = Object.fromEntries(Object.entries(ESCAPE_MAP).map(([k, v]) => [v, k]));

const ESCAPE_RE = /[&"'<>]/g;
const UNESCAPE_RE = /&amp;|&quot;|&#039;|&lt;|&gt;/g;

export const escapeHTML = str => str?.replace(ESCAPE_RE, m => ESCAPE_MAP[m]) ?? '';
export const unescapeHTML = str => str?.replace(UNESCAPE_RE, m => UNESCAPE_MAP[m]) ?? '';
