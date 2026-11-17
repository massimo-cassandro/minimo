
/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./parse-rows.js').ParsedRow} ParsedRow */
/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').SearchField} SearchField */

/**
 * Normalizza e valida il parametro `searchFields` in base alla modalità:
 *
 * - una stringa (tipicamente da attributo HTML) viene divisa sulle virgole: `'nome, cognome'` → `['nome', 'cognome']`
 * - sono ammesse stringhe non vuote e, solo in modalità client-side, funzioni `row => valore`; in modalità server-side
 *   le funzioni vengono scartate con un avviso (il server riceve solo nomi di campi)
 * - con `jqDatatableMode` (server-side) il parametro viene ignorato con un avviso
 * - un valore di tipo diverso, o una voce non valida, viene segnalato in console e scartato
 *
 * @param {*} value - Valore risolto di `searchFields`
 * @param {Pick<JsonTableParams, 'serverSide'|'jqDatatableMode'>} params - Parametri risolti (`serverSide` è la modalità effettiva)
 * @returns {SearchField[]|null} L'array normalizzato, oppure `null` se vuoto o non applicabile
 *
 * @example
 * normalizeSearchFields('codice, comuni.nome', { serverSide: true, jqDatatableMode: false }); // → ['codice', 'comuni.nome']
 * normalizeSearchFields(['note', row => row.tags], { serverSide: false, jqDatatableMode: false }); // → ['note', ƒ]
 * normalizeSearchFields(['note', row => row.tags], { serverSide: true, jqDatatableMode: false });  // → ['note'] (con avviso)
 * normalizeSearchFields(null, { serverSide: false, jqDatatableMode: false });                      // → null
 */
export function normalizeSearchFields(value, params) {
  /* eslint-disable no-console */
  if (value == null || value === '') {
    return null;
  }

  const list = typeof value === 'string'
    ? value.split(',').map(field => field.trim()).filter(Boolean)
    : value;

  if (!Array.isArray(list)) {
    console.warn('[json-table] `searchFields` deve essere un array (o una stringa con i campi separati da virgola): parametro ignorato');
    return null;
  }

  if (params.serverSide && params.jqDatatableMode) {
    console.warn('[json-table] `searchFields` non ha effetto con `jqDatatableMode`: parametro ignorato');
    return null;
  }

  const fields = list.filter(field => {
    if (typeof field === 'string' && field.trim()) {
      return true;
    }
    if (typeof field === 'function') {
      if (params.serverSide) {
        console.warn('[json-table] `searchFields`: le funzioni non hanno effetto in modalità server-side (il server riceve solo nomi di campi): voce ignorata');
        return false;
      }
      return true;
    }
    console.warn('[json-table] `searchFields`: ogni voce deve essere una stringa non vuota o una funzione: voce ignorata', field);
    return false;
  }).map(field => (typeof field === 'string' ? field.trim() : field));

  return fields.length ? fields : null;
  /* eslint-enable no-console */
}


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
 * `searchText` della riga (precalcolato da `parse-rows.js` dalle colonne ricercabili e da `searchFields`; senza distinzione tra
 * maiuscole e minuscole).
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
