/*
  Registro del modulo opzionale `jqDatatableMode` (compatibilità con il formato server-side di jQuery DataTables).

  Il modulo `jq-datatable-mode.js` non fa parte del core: viene caricato con un `import()` dinamico solo quando una tabella
  ha `jqDatatableMode` attivo (webpack lo separa in un chunk a parte), oppure incluso nel bundle con un import statico
  (`import '@massimo-cassandro/minimo/json-table/jq-datatable-mode'`). In entrambi i casi, all'importazione, si registra qui.
*/

/** @typedef {import('./jq-datatable-mode.js').JqDatatableMode} JqDatatableMode */

/** @type {JqDatatableMode|null} */
let jqMode = null;

/** @type {Promise<JqDatatableMode>|null} */
let loading = null;


/**
 * Registra il modulo `jqDatatableMode` (invocata da `jq-datatable-mode.js` all'importazione).
 * @param {JqDatatableMode} api - Funzioni del modulo
 * @returns {void}
 */
export function registerJqMode(api) {
  jqMode = api;
}


/**
 * Restituisce il modulo `jqDatatableMode`, se già caricato.
 * @returns {JqDatatableMode|null}
 */
export function getJqMode() {
  return jqMode;
}


/**
 * Restituisce il modulo `jqDatatableMode`, caricandolo se necessario (una sola richiesta anche con più tabelle).
 * Se il caricamento fallisce la promessa viene rifiutata e un tentativo successivo riprova.
 *
 * @returns {Promise<JqDatatableMode>}
 *
 * @example
 * const jq = await loadJqMode();
 */
export function loadJqMode() {
  if (jqMode) {
    return Promise.resolve(jqMode);
  }

  loading ??= import(/* webpackChunkName: "json-table-jq-mode" */ './jq-datatable-mode.js')
    .then(() => /** @type {JqDatatableMode} */ (jqMode))
    .catch(err => {
      loading = null;
      throw err;
    });

  return loading;
}
