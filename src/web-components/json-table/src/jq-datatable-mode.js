/*
  Modulo opzionale `jqDatatableMode`: compatibilità con il formato server-side di jQuery DataTables.

  Caricato automaticamente (`import()` dinamico, chunk separato) dalle tabelle con `jqDatatableMode` attivo. Per evitare
  la richiesta aggiuntiva al primo caricamento lo si può includere nel bundle con un import statico:

    import '@massimo-cassandro/minimo/json-table/jq-datatable-mode';

  All'importazione il modulo si registra in `jq-mode-registry.js`.
*/

import { registerJqMode } from './jq-mode-registry.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./get-data.js').ServerRequest} ServerRequest */

/**
 * Funzioni del modulo, usate dal core tramite `getJqMode()`.
 * @typedef {Object} JqDatatableMode
 * @property {Partial<JsonTableParams>} defaults - Default di modalità (vedi `jqDatatableModeDefaults`)
 * @property {(projectDefaults: Partial<JsonTableParams>) => Partial<JsonTableParams>} applyDefaults - Vedi `applyJqDefaults`
 * @property {typeof appendJqColumns} appendColumns - Vedi `appendJqColumns`
 * @property {typeof jqSortValues} sortValues - Vedi `jqSortValues`
 * @property {typeof jqPagingValues} pagingValues - Vedi `jqPagingValues`
 */


/**
 * Default sostitutivi applicati quando `jqDatatableMode` è true (vedi `resolveParams`). Si inseriscono tra i default predefiniti
 * e quelli di `setDefaults()`. `serverParams` viene unito in modo superficiale come di consueto.
 *
 * In questa modalità `buildServerUrl` invia inoltre `draw=1`, `length=-1` e `start=0` con `perPage` 0 (vedi `jqPagingValues`), `columns[i][name|searchable|orderable]` e, per
 * `order[i][column]`, l'indice della colonna (non la chiave), con un `order[i]` per ogni criterio di ordinamento.
 *
 * @type {Partial<JsonTableParams>}
 *
 * @example
 * {
 *   jsonDataField: 'data',
 *   totRecField: 'recordsTotal',
 *   filteredRecField: 'recordsFiltered',
 *   serverSide: true,
 *   serverParams: { page: null, start: 'start', perPage: 'length', sort: 'order[{i}][column]', dir: 'order[{i}][dir]', search: 'search[value]' }
 * }
 */
export const jqDatatableModeDefaults = {
  jsonDataField: 'data',
  totRecField: 'recordsTotal',
  filteredRecField: 'recordsFiltered',
  serverSide: true,
  serverParams: {
    page: null,
    start: 'start',
    perPage: 'length',
    sort: 'order[{i}][column]',
    dir: 'order[{i}][dir]',
    search: 'search[value]'
  }
};


/**
 * Inserisce i default di modalità sotto quelli di progetto (`setDefaults()`), che restano prioritari; `serverParams`
 * viene unito chiave per chiave.
 *
 * @param {Partial<JsonTableParams>} projectDefaults - Default di progetto
 * @returns {Partial<JsonTableParams>} Nuovo oggetto dei default
 *
 * @example
 * applyJqDefaults({ perPage: 50, serverParams: { search: 'q' } });
 * // → { ...jqDatatableModeDefaults, perPage: 50, serverParams: { ...jqDatatableModeDefaults.serverParams, search: 'q' } }
 */
export function applyJqDefaults(projectDefaults) {
  return {
    ...jqDatatableModeDefaults,
    ...projectDefaults,
    serverParams: { ...jqDatatableModeDefaults.serverParams, ...projectDefaults.serverParams }
  };
}


/**
 * Campi di `searchFields` da inviare come colonne aggiuntive di `columns[i]`, esclusi i duplicati e quelli che coincidono
 * con la `key` di una colonna visualizzata ricercabile. I nomi vengono inviati così come sono (la regola `tabella.nome` della
 * modalità server-side standard non si applica).
 * @param {NonNullable<ServerRequest['cols']>} cols - Colonne visualizzate
 * @param {string[]|null} [searchFields=null] - Campi aggiuntivi (default: null)
 * @returns {string[]}
 *
 * @example
 * buildJqExtraCols([{ key: 'zona', searchable: true }, { key: 'note', searchable: false }], ['zona', 'comune', 'note']);
 * // → ['comune', 'note']
 */
export function buildJqExtraCols(cols, searchFields = null) {
  const searchableKeys = new Set(cols.filter(col => col.searchable).map(col => col.key));
  return [...new Set(searchFields ?? [])].filter(field => !searchableKeys.has(field));
}


/**
 * Aggiunge alla richiesta i parametri di jQuery DataTables: `draw=1` e `columns[i][name|searchable|orderable]` per ogni
 * colonna visualizzata, seguite dalle colonne aggiuntive di `searchFields` (`searchable=true`, `orderable=false`), come le
 * colonne `visible: false` di jQuery DataTables. Le colonne aggiuntive seguono quelle visualizzate, quindi gli indici di
 * `order[i][column]` restano validi. `searchable`/`orderable` sono inviati come stringhe `"true"`/`"false"`.
 *
 * @param {(name: string, value: string|number|boolean) => void} set - Imposta un parametro della query string
 * @param {NonNullable<ServerRequest['cols']>} cols - Colonne visualizzate
 * @param {string[]|null} [searchFields=null] - Campi aggiuntivi (default: null)
 * @returns {void}
 */
export function appendJqColumns(set, cols, searchFields = null) {
  set('draw', 1);

  cols.forEach((col, idx) => {
    set(`columns[${idx}][name]`, col.key);
    set(`columns[${idx}][searchable]`, col.searchable);
    set(`columns[${idx}][orderable]`, col.sortable);
  });

  buildJqExtraCols(cols, searchFields).forEach((field, idx) => {
    const n = cols.length + idx;
    set(`columns[${n}][name]`, field);
    set(`columns[${n}][searchable]`, true);
    set(`columns[${n}][orderable]`, false);
  });
}


/**
 * Valori di ordinamento inviati per ogni criterio: l'indice della colonna tra quelle visualizzate (`order[i][column]`).
 * @param {NonNullable<ServerRequest['cols']>} cols - Colonne visualizzate
 * @param {ServerRequest['sort']} sortDefs - Criteri di ordinamento
 * @returns {number[][]} Un array (con un solo indice) per ogni criterio
 *
 * @example
 * jqSortValues([{ key: 'id' }, { key: 'name' }], [{ key: 'name', dir: 'asc' }]); // → [[1]]
 */
export function jqSortValues(cols, sortDefs) {
  return sortDefs.map(({ key }) => [cols.findIndex(col => col.key === key)]);
}


/**
 * Valori di `start` e `length` (nomi predefiniti) della richiesta. Con `perPage` 0 (nessuna paginazione) vengono inviati
 * `length=-1` e `start=0`: nel protocollo server-side di jQuery DataTables -1 indica "tutte le righe" (è ciò che inviava
 * `paging: false`), mentre 0 viene trattato dai backend compatibili come limite zero (nessuna riga).
 * @param {number} page - Pagina richiesta (da 1)
 * @param {number} perPage - Righe per pagina (0 = nessuna paginazione)
 * @returns {{ start: number, length: number }}
 *
 * @example
 * jqPagingValues(3, 25); // → { start: 50, length: 25 }
 * jqPagingValues(1, 0);  // → { start: 0, length: -1 }
 */
export function jqPagingValues(page, perPage) {
  return perPage > 0
    ? { start: (page - 1) * perPage, length: perPage }
    : { start: 0, length: -1 };
}


registerJqMode({
  defaults: jqDatatableModeDefaults,
  applyDefaults: applyJqDefaults,
  appendColumns: appendJqColumns,
  sortValues: jqSortValues,
  pagingValues: jqPagingValues
});
