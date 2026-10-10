
/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */

/**
 * Normalizza un termine di ricerca: senza spazi ai bordi, in minuscolo, diviso in parole (separate da spazi).
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
 * Filtra le righe analizzate per un termine di ricerca: ogni parola del termine deve essere contenuta nel
 * `searchText` della riga (precalcolato da `parse-rows.js` dalle colonne ricercabili; senza distinzione tra maiuscole e minuscole).
 * Un termine vuoto restituisce l'array originale.
 *
 * @param {ParsedRow[]} rows - Righe analizzate
 * @param {string} term - Termine di ricerca
 * @returns {ParsedRow[]}
 *
 * @example
 * filterRows(state.rows, 'mario 2024'); // righe il cui searchText contiene sia 'mario' sia '2024'
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
 * Collega il listener `input` all'input di ricerca (`elements.searchInput`, quando presente):
 * la ricerca viene eseguita tramite `jt.setSearch()` dopo `params.searchDebounce` millisecondi
 * dall'ultima pressione di un tasto. L'id del timer in sospeso viene memorizzato in `jt._searchTimer` così che
 * `destroy()` possa cancellarlo.
 *
 * @param {JsonTable} jt - L'istanza del componente
 * @returns {void}
 *
 * @example
 * setSearchListener(jt); // dopo mainBuilder(jt)
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
