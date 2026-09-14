/*! minimo - json-table: params resolution */

import { defaults, mergedParams } from './defaults.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */

/**
 * Whether `value` is a plain object (not null, not an array).
 * @param {*} value
 * @returns {value is Object<string, *>}
 */
function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}


/**
 * Reads and parses an HTML attribute of the `<json-table>` element.
 *
 * - booleans are auto-parsed when the built-in default is a boolean
 *   (`search`, `search="true"`, `search="1"` → true; `search="false"`, `search="0"` → false)
 * - values starting with `[` or `{` are parsed as JSON (invalid JSON is reported in the
 *   console and treated as a missing attribute)
 * - every other value is returned as a string
 *
 * @param {HTMLElement} el - The `<json-table>` element
 * @param {keyof JsonTableParams} name - Parameter name (attribute names are case-insensitive)
 * @returns {*} The parsed value, or `undefined` when the attribute is missing or invalid
 *
 * @example
 * // <json-table search="false" cols='[{"key":"id"}]'></json-table>
 * readAttr(el, 'search'); // → false
 * readAttr(el, 'cols');   // → [{ key: 'id' }]
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
    // empty string = attribute present without value → true (standard HTML)
    return lower !== 'false' && lower !== '0';
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
 * Resolves a single parameter, merging the four possible sources.
 *
 * Precedence (highest first):
 * 1. `config` – value passed via `init()`/`reload()`. Present and `!== undefined` always wins;
 *    pass `null` explicitly to skip the HTML attribute and fall back to the defaults.
 * 2. HTML attribute (see `readAttr`).
 * 3. `projectDefaults` – values set via `JsonTable.setDefaults()`.
 * 4. Built-in default (see `defaults.js`).
 *
 * Object params listed in `mergedParams` (`classes`, `labels`, `dataTypes`) are shallow-merged
 * across the sources instead of being replaced, so every source only needs the keys to override.
 *
 * @param {HTMLElement} el - The `<json-table>` element (source of the HTML attributes)
 * @param {Partial<JsonTableParams>|null} config - Config passed via `init()` (default: null)
 * @param {Partial<JsonTableParams>} projectDefaults - Project-wide defaults (default: {})
 * @param {keyof JsonTableParams} name - Parameter name
 * @returns {*} The resolved value
 *
 * @example
 * // <json-table jsonurl="/api/rows.json" search="false" classes='{"table":"table"}'></json-table>
 * getParam(el, { jsonUrl: '/api/other.json' }, {}, 'jsonUrl'); // → '/api/other.json' (config)
 * getParam(el, null, {}, 'search');                             // → false (attribute)
 * getParam(el, null, { tableId: 'tbl' }, 'tableId');            // → 'tbl' (project defaults)
 * getParam(el, null, {}, 'locale');                             // → 'it-IT' (built-in default)
 * getParam(el, { classes: { sortBtn: 'btn' } }, {}, 'classes');
 * // → { ...defaults.classes, table: 'table', sortBtn: 'btn' } (merged)
 */
export function getParam(el, config = null, projectDefaults = {}, name) {

  const configValue = config ? config[name] : undefined;

  // merged object params: built-in ← project ← attribute ← config
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

  // 1. config from script (undefined = key not present → go down one level)
  if (configValue !== undefined) {
    return configValue;
  }

  // 2. HTML attribute
  const attrValue = readAttr(el, name);
  if (attrValue !== undefined) {
    return attrValue;
  }

  // 3. project defaults
  if (projectDefaults[name] !== undefined) {
    return projectDefaults[name];
  }

  // 4. built-in default
  return defaults[name];
}


/**
 * Resolves every parameter defined in `defaults.js` (see `getParam` for the precedence rules).
 *
 * @param {HTMLElement} el - The `<json-table>` element
 * @param {Partial<JsonTableParams>|null} [config=null] - Config passed via `init()` (default: null)
 * @param {Partial<JsonTableParams>} [projectDefaults={}] - Project-wide defaults (default: {})
 * @returns {JsonTableParams} The complete params object
 *
 * @example
 * const params = resolveParams(el, { jsonUrl: '/api/rows.json', debug: true }, {});
 * // → { debug: true, jsonUrl: '/api/rows.json', jsonDataField: 'data', data: null, cols: [], ... }
 */
export function resolveParams(el, config = null, projectDefaults = {}) {

  const params = Object.fromEntries(
    Object.keys(defaults).map(name => [
      name,
      getParam(el, config, projectDefaults, /** @type {keyof JsonTableParams} */ (name))
    ])
  );

  return /** @type {JsonTableParams} */ (params);
}
