/*! minimo - json-table: client-side search */

/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */

/**
 * Normalizes a search term: trimmed, lowercased, split into words (whitespace separated).
 * @param {string|null|undefined} term
 * @returns {string[]}
 *
 * @example
 * searchWords('  Mario  Rossi '); // → ['mario', 'rossi']
 * searchWords('');                // → []
 */
export function searchWords(term) {
  return String(term ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
}


/**
 * Filters the parsed rows by a search term: every word of the term must be contained in the
 * row `searchText` (precomputed by `parse-rows.js` from the searchable columns; case-insensitive).
 * An empty term returns the original array.
 *
 * @param {ParsedRow[]} rows - Parsed rows
 * @param {string} term - Search term
 * @returns {ParsedRow[]}
 *
 * @example
 * filterRows(state.rows, 'mario 2024'); // rows whose searchText contains both 'mario' and '2024'
 * filterRows(state.rows, '');           // → state.rows
 */
export function filterRows(rows, term) {

  const words = searchWords(term);

  if (!words.length) {
    return rows;
  }

  return rows.filter(parsed => words.every(word => parsed.searchText.includes(word)));
}


/**
 * Attaches the `input` listener to the search input (`elements.searchInput`, when present):
 * the search is executed through `jt.setSearch()` after `params.searchDebounce` milliseconds
 * from the last keystroke. The pending timer id is stored in `jt._searchTimer` so that
 * `destroy()` can clear it.
 *
 * @param {JsonTable} jt - The component instance
 * @returns {void}
 *
 * @example
 * setSearchListener(jt); // after mainBuilder(jt)
 */
export function setSearchListener(jt) {

  const input = jt.elements.searchInput;

  if (!input) {
    return;
  }

  input.addEventListener('input', () => {
    clearTimeout(jt._searchTimer);
    jt._searchTimer = setTimeout(() => {
      jt.setSearch(input.value);
    }, Math.max(0, Number(jt.params.searchDebounce) || 0));
  });
}
