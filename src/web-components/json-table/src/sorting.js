
/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */
/** @typedef {'asc'|'desc'} SortDir */

/**
 * Indica se un valore di ordinamento conta come "vuoto" (ordinato per ultimo in entrambe le direzioni).
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return value == null || value === '' || (typeof value === 'number' && Number.isNaN(value));
}

/**
 * Indica se un valore è un numero o una stringa numerica.
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
 * Confronta due valori di ordinamento in ordine crescente: i valori vuoti (`null`, `undefined`, `''`, `NaN`)
 * sempre per ultimi, i numeri (e le stringhe numeriche, quando entrambi sono numerici) in modo numerico, i booleani come
 * 0/1, tutto il resto come stringhe tramite `localeCompare` (collazione numerica, senza distinzione di accenti/maiuscole).
 *
 * @param {*} a
 * @param {*} b
 * @param {string} [locale] - Locale usato da `localeCompare` (default: quello del browser)
 * @returns {number} Negativo quando `a` viene prima, positivo quando `b` viene prima, 0 quando sono uguali
 *
 * @example
 * compareValues(2, 10);                  // → negativo
 * compareValues('file10', 'file2');      // → positivo (collazione numerica)
 * compareValues('à', 'b', 'it-IT');      // → negative
 * compareValues(null, 'a');              // → positivo (valori vuoti per ultimi)
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
 * Restituisce una copia ordinata delle righe analizzate, in base al `sortValues[key]` precalcolato di ogni riga.
 * I criteri vengono applicati in sequenza: il secondo decide solo tra righe uguali per il primo, e così via.
 * L'ordinamento è stabile, quindi le righe uguali per tutti i criteri mantengono l'ordine originale.
 *
 * @param {ParsedRow[]} rows - Righe analizzate (vedi `parse-rows.js`)
 * @param {import('./defaults.js').SortDef[]} sort - Criteri di ordinamento, in ordine di priorità
 * @param {string} [locale] - Locale usato per confrontare le stringhe
 * @returns {ParsedRow[]} Un nuovo array
 *
 * @example
 * sortRows(state.rows, [{ key: 'city', dir: 'asc' }, { key: 'amount', dir: 'desc' }], 'it-IT');
 */
export function sortRows(rows, sort, locale) {

  return [...rows].sort((a, b) => {
    for (const { key, dir } of sort) {
      const va = a.sortValues[key];
      const vb = b.sortValues[key];
      const cmp = compareValues(va, vb, locale);
      if (cmp !== 0) {
        // i valori vuoti restano per ultimi indipendentemente dalla direzione
        return (isEmpty(va) || isEmpty(vb) || dir !== 'desc') ? cmp : -cmp;
      }
    }
    return 0;
  });
}


/**
 * Direzione successiva nel ciclo di ordinamento del pulsante di una colonna: nessuna → `asc` → `desc` → nessuna.
 *
 * @param {SortDir|null|undefined} current - Direzione corrente della colonna (null = non ordinata)
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
