
/** @typedef {import('../json-table-component.js').JsonTable} JsonTable */
/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */

/**
 * Restituisce l'elemento `<form>` indicato dal parametro `filterForm` (id oppure elemento).
 * @param {JsonTableParams['filterForm']} value - Valore del parametro
 * @returns {HTMLFormElement|null} Il form, oppure `null` quando il parametro non è impostato o non corrisponde a un form
 *   (in questo caso con un errore in console)
 *
 * @example
 * resolveFilterForm('filtri-clienti'); // → <form id="filtri-clienti">
 * resolveFilterForm(null);             // → null
 */
export function resolveFilterForm(value) {

  if (value == null || value === '') {
    return null;
  }

  const form = typeof value === 'string' ? document.getElementById(value) : value;

  if (!(form instanceof HTMLFormElement)) {
    // eslint-disable-next-line no-console
    console.error('[json-table] `filterForm`: il valore non corrisponde a un elemento <form>, parametro ignorato', value);
    return null;
  }

  return form;
}


/**
 * Legge i valori di un form di filtro: i campi vuoti e i file vengono scartati, i campi con lo stesso nome
 * (checkbox, select multiple) producono valori ripetuti. Con `submitter` viene incluso anche il nome/valore del pulsante
 * che ha inviato il form (se ha un `name`).
 *
 * @param {HTMLFormElement} form - Il form
 * @param {HTMLElement|null} [submitter=null] - Pulsante che ha inviato il form (default: null)
 * @returns {URLSearchParams}
 *
 * @example
 * // <form><input name="anno" value="2025"><input name="cliente" value=""></form>
 * readFilterForm(form).toString(); // → 'anno=2025'
 */
export function readFilterForm(form, submitter = null) {

  const filters = new URLSearchParams();

  new FormData(form, submitter).forEach((value, key) => {
    if (typeof value === 'string' && value !== '') {
      filters.append(key, value);
    }
  });

  return filters;
}


/**
 * Segnala in console i campi del form di filtro con lo stesso nome di un parametro di `serverParams` (in modalità
 * server-side): il valore del form verrebbe sovrascritto da quello inviato dalla tabella.
 *
 * @param {URLSearchParams} filters - Valori del form
 * @param {JsonTableParams} params - Parametri risolti
 * @returns {void}
 */
function warnCollisions(filters, params) {

  if (!params.serverSide) {
    return;
  }

  const reserved = Object.values(params.serverParams ?? {})
    .filter(/** @returns {name is string} */ name => typeof name === 'string' && name !== '');

  new Set(filters.keys()).forEach(key => {
    const collides = reserved.some(name => name.includes('{i}')
      ? key.startsWith(name.slice(0, name.indexOf('{i}')))
      : name === key);

    if (collides) {
      // eslint-disable-next-line no-console
      console.warn(`[json-table] \`filterForm\`: il campo \`${key}\` ha lo stesso nome di un parametro di \`serverParams\` e verrà sovrascritto`);
    }
  });
}


/**
 * Collega il form indicato da `filterForm` al componente:
 * - legge i valori correnti del form, usati già nella prima richiesta (`jt._filters`)
 * - al `submit` blocca l'invio del form, ne legge i valori e chiama `jt._applyFilters()`
 * - al `reset` (dopo che il form è stato azzerato) fa lo stesso con i valori iniziali del form
 *
 * Un eventuale collegamento precedente viene rimosso (`jt._filterFormController`).
 *
 * @param {JsonTable} jt - L'istanza del componente (con `params` già risolti)
 * @returns {void}
 *
 * @example
 * bindFilterForm(jt); // in `_load()`, dopo la risoluzione dei parametri
 */
export function bindFilterForm(jt) {

  jt._filterFormController?.abort();
  jt._filterFormController = null;
  jt._filters = null;

  const form = resolveFilterForm(jt.params.filterForm);
  if (!form) {
    return;
  }

  const controller = new AbortController();
  jt._filterFormController = controller;

  /** @type {(filters: URLSearchParams) => URLSearchParams} */
  const checked = filters => {
    warnCollisions(filters, jt.params);
    return filters;
  };

  jt._filters = checked(readFilterForm(form));

  form.addEventListener('submit', e => {
    e.preventDefault();
    jt._applyFilters(checked(readFilterForm(form, /** @type {SubmitEvent} */ (e).submitter)));
  }, { signal: controller.signal });

  form.addEventListener('reset', e => {
    // l'evento precede l'azzeramento dei campi: i valori vanno letti dopo
    setTimeout(() => {
      if (!e.defaultPrevented && !controller.signal.aborted) {
        jt._applyFilters(checked(readFilterForm(form)));
      }
    });
  }, { signal: controller.signal });
}
