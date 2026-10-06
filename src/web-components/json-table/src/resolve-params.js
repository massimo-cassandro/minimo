/*! minimo - json-table: params resolution */

import { defaults, mergedParams, jqDatatableModeDefaults } from './defaults.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */

/**
 * Indica se `value` è un oggetto semplice (non null, non un array).
 * @param {*} value
 * @returns {value is Object<string, *>}
 */
function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}


/**
 * Legge e analizza un attributo HTML dell'elemento `<json-table>`.
 *
 * - i booleani vengono convertiti automaticamente quando il default predefinito è un booleano
 *   (`search`, `search="true"`, `search="1"` → true; `search="false"`, `search="0"` → false)
 * - i numeri vengono convertiti automaticamente quando il default predefinito è un numero (`perpage="10"` → 10; un
 *   valore non numerico viene segnalato in console e trattato come attributo mancante)
 * - i valori che iniziano con `[` o `{` vengono letti come JSON (un JSON non valido viene segnalato in
 *   console e trattato come attributo mancante)
 * - ogni altro valore viene restituito come stringa
 *
 * @param {HTMLElement} el - L'elemento `<json-table>`
 * @param {keyof JsonTableParams} name - Nome del parametro (i nomi degli attributi non distinguono maiuscole e minuscole)
 * @returns {*} Il valore analizzato, oppure `undefined` quando l'attributo è mancante o non valido
 *
 * @example
 * // <json-table search="false" cols='[{"key":"id"}]'></json-table>
 * readAttr(el, 'search'); // → false
 * readAttr(el, 'cols');   // → [{ key: 'id' }]
 * readAttr(el, 'perPage'); // → 10 (da perpage="10")
 * readAttr(el, 'caption'); // → undefined
 */
export function readAttr(el, name) {

  const attr = el.getAttribute(name);
  if (attr === null) {
    return undefined;
  }

  const trimmed = attr.trim();

  if (typeof defaults[name] === 'boolean') {
    const lower = trimmed.toLowerCase();
    // stringa vuota = attributo presente senza valore → true (HTML standard)
    return lower !== 'false' && lower !== '0';
  }

  if (typeof defaults[name] === 'number') {
    const num = Number(trimmed);
    if (trimmed === '' || Number.isNaN(num)) {
      // eslint-disable-next-line no-console
      console.error(`[json-table] attributo \`${name}\`: valore numerico non valido (${attr}), viene usato il default`);
      return undefined;
    }
    return num;
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[json-table] attributo \`${name}\`: JSON non valido, valore ignorato (viene usato il default)`, err);
      return undefined;
    }
  }

  return attr;
}


/**
 * Risolve un singolo parametro, unendo le quattro possibili sorgenti.
 *
 * Precedenza (dalla più alta):
 * 1. `config` – valore passato tramite `init()`/`reload()`. Se presente e `!== undefined` vince sempre;
 *    passare `null` esplicitamente per saltare l'attributo HTML e ripiegare sui default.
 * 2. Attributo HTML (vedi `readAttr`).
 * 3. `projectDefaults` – valori impostati con `JsonTable.setDefaults()`.
 * 4. Default predefinito (vedi `defaults.js`).
 *
 * I parametri oggetto elencati in `mergedParams` (`classes`, `labels`, `dataTypes`, `serverParams`) vengono uniti in modo
 * superficiale tra le sorgenti invece di essere sostituiti, così ogni sorgente deve indicare solo le chiavi da sovrascrivere.
 *
 * @param {HTMLElement} el - L'elemento `<json-table>` (sorgente degli attributi HTML)
 * @param {Partial<JsonTableParams>|null} config - Configurazione passata tramite `init()` (default: null)
 * @param {Partial<JsonTableParams>} projectDefaults - Default a livello di progetto (default: {})
 * @param {keyof JsonTableParams} name - Nome del parametro
 * @returns {*} Il valore risolto
 *
 * @example
 * // <json-table jsonurl="/api/rows.json" search="false" classes='{"table":"table"}'></json-table>
 * getParam(el, { jsonUrl: '/api/other.json' }, {}, 'jsonUrl'); // → '/api/other.json' (config)
 * getParam(el, null, {}, 'search');                             // → false (attributo)
 * getParam(el, null, { tableId: 'tbl' }, 'tableId');            // → 'tbl' (default di progetto)
 * getParam(el, null, {}, 'locale');                             // → 'it-IT' (default predefinito)
 * getParam(el, { classes: { sortBtn: 'btn' } }, {}, 'classes');
 * // → { ...defaults.classes, table: 'table', sortBtn: 'btn' } (unito)
 */
export function getParam(el, config = null, projectDefaults = {}, name) {

  const configValue = config ? config[name] : undefined;

  // parametri oggetto uniti: predefinito ← progetto ← attributo ← config
  if (mergedParams.includes(name)) {
    const builtIn = /** @type {Object<string, *>} */ (defaults[name]);
    const projectValue = projectDefaults[name];
    const attrValue = configValue === null ? undefined : readAttr(el, name);
    return {
      ...builtIn,
      ...(isPlainObject(projectValue) ? projectValue : {}),
      ...(isPlainObject(attrValue) ? attrValue : {}),
      ...(isPlainObject(configValue) ? configValue : {})
    };
  }

  // 1. config dallo script (undefined = chiave non presente → scende di un livello)
  if (configValue !== undefined) {
    return configValue;
  }

  // 2. attributo HTML
  const attrValue = readAttr(el, name);
  if (attrValue !== undefined) {
    return attrValue;
  }

  // 3. default di progetto
  if (projectDefaults[name] !== undefined) {
    return projectDefaults[name];
  }

  // 4. default predefinito
  return defaults[name];
}


/**
 * Risolve ogni parametro definito in `defaults.js` (vedi `getParam` per le regole di precedenza).
 *
 * Con `jqDatatableMode` true, `jqDatatableModeDefaults` si inserisce tra i default predefiniti e quelli di progetto:
 * restano quindi prioritari `setDefaults()`, attributi HTML e `init()`.
 *
 * @param {HTMLElement} el - L'elemento `<json-table>`
 * @param {Partial<JsonTableParams>|null} [config=null] - Configurazione passata tramite `init()` (default: null)
 * @param {Partial<JsonTableParams>} [projectDefaults={}] - Project-wide defaults (default: {})
 * @returns {JsonTableParams} L'oggetto completo dei parametri
 *
 * @example
 * const params = resolveParams(el, { jsonUrl: '/api/rows.json', debug: true }, {});
 * // → { debug: true, jsonUrl: '/api/rows.json', jsonDataField: 'data', data: null, cols: [], ... }
 */
export function resolveParams(el, config = null, projectDefaults = {}) {

  // con `jqDatatableMode` i default di modalità si inseriscono sotto quelli di progetto (che restano prioritari)
  if (getParam(el, config, projectDefaults, 'jqDatatableMode') === true) {
    projectDefaults = {
      ...jqDatatableModeDefaults,
      ...projectDefaults,
      serverParams: { ...jqDatatableModeDefaults.serverParams, ...projectDefaults.serverParams }
    };
  }

  const params = Object.fromEntries(
    Object.keys(defaults).map(name => [
      name,
      getParam(el, config, projectDefaults, /** @type {keyof JsonTableParams} */ (name))
    ])
  );

  return /** @type {JsonTableParams} */ (params);
}
