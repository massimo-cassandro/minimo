/*! minimo - json-table: client-side sorting */

/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */
/** @typedef {'asc'|'desc'} SortDir */

/**
 * Whether a sort value counts as "empty" (sorted last in both directions).
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return value == null || value === '' || (typeof value === 'number' && Number.isNaN(value));
}

/**
 * Whether a value is a number or a numeric string.
 * @param {*} value
 * @returns {boolean}
 */
function isNumeric(value) {
  if (typeof value === 'number') {
    return !Number.isNaN(value);
  }
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value));
}


/**
 * Compares two sort values in ascending order: empty values (`null`, `undefined`, `''`, `NaN`)
 * always last, numbers (and numeric strings, when both are numeric) numerically, booleans as
 * 0/1, everything else as strings via `localeCompare` (numeric collation, accent/case insensitive).
 *
 * @param {*} a
 * @param {*} b
 * @param {string} [locale] - Locale used by `localeCompare` (default: browser default)
 * @returns {number} Negative when `a` comes first, positive when `b` comes first, 0 when equal
 *
 * @example
 * compareValues(2, 10);                  // → negative
 * compareValues('file10', 'file2');      // → positive (numeric collation)
 * compareValues('à', 'b', 'it-IT');      // → negative
 * compareValues(null, 'a');              // → positive (empty values last)
 */
export function compareValues(a, b, locale) {

  const emptyA = isEmpty(a);
  const emptyB = isEmpty(b);

  if (emptyA || emptyB) {
    return emptyA === emptyB ? 0 : (emptyA ? 1 : -1);
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  if (isNumeric(a) && isNumeric(b)) {
    return Number(a) - Number(b);
  }

  return String(a).localeCompare(String(b), locale, { numeric: true, sensitivity: 'base' });
}


/**
 * Returns a sorted copy of the parsed rows, by the precomputed `sortValues[key]` of every row.
 * The sort is stable, so rows with equal values keep their original order.
 *
 * @param {ParsedRow[]} rows - Parsed rows (see `parse-rows.js`)
 * @param {string} key - Column key
 * @param {SortDir} dir - Direction
 * @param {string} [locale] - Locale used to compare strings
 * @returns {ParsedRow[]} A new array
 *
 * @example
 * sortRows(state.rows, 'amount', 'desc', 'it-IT');
 */
export function sortRows(rows, key, dir, locale) {

  const sign = dir === 'desc' ? -1 : 1;

  return [...rows].sort((a, b) => {
    const va = a.sortValues[key];
    const vb = b.sortValues[key];
    const cmp = compareValues(va, vb, locale);
    // empty values stay last regardless of the direction
    return (isEmpty(va) || isEmpty(vb)) ? cmp : cmp * sign;
  });
}


/**
 * Next direction in the sort cycle of a column button: none → `asc` → `desc` → none.
 *
 * @param {SortDir|null|undefined} current - Current direction of the column (null = not sorted)
 * @returns {SortDir|null}
 *
 * @example
 * nextSortDir(null);   // → 'asc'
 * nextSortDir('asc');  // → 'desc'
 * nextSortDir('desc'); // → null
 */
export function nextSortDir(current) {
  if (current === 'asc') {
    return 'desc';
  }
  if (current === 'desc') {
    return null;
  }
  return 'asc';
}
