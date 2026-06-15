const characters_to_escape = {
  '&': '&amp;',
  '"': '&quot;',
  '\'': '&#039;',
  '<': '&lt;',
  '>': '&gt;'
};
export function escapeHTML(str) {
  const regexp = new RegExp(`[${Object.keys(characters_to_escape).join('')}]`, 'g');
  return str?.replace(regexp, m => characters_to_escape[m])?? '';
}

export function unescapeHTML(str) {
  const regexp = new RegExp(Object.values(characters_to_escape).join('|'), 'g'),
    entities_to_unescape = Object.fromEntries(Object.entries(characters_to_escape).map(a => a.reverse()));

  return str?.replace(regexp, m => entities_to_unescape[m] )?? '';
}
