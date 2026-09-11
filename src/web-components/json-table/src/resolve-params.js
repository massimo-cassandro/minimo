/*! minimo - json-table: params resolution */

import { defaults } from './defaults.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */

/**
 * Resolves a single parameter, merging the four possible sources.
 *
 * Precedence (highest first):
 * 1. `config` – value passed via `init()`/`reload()`. Present and `!== undefined` always wins;
 *    pass `null` explicitly to skip the HTML attribute and fall back to the defaults.
 * 2. HTML attribute – booleans are auto-parsed when the built-in default is a boolean
 *    (`search`, `search="true"`, `search="1"` → true; `search="false"`, `search="0"` → false);
 *    values starting with `[` or `{` are parsed as JSON (invalid JSON is reported in the
 *    console and ignored, falling back to the defaults).
 * 3. `projectDefaults` – values set via `JsonTable.setDefaults()`.
 * 4. Built-in default (see `defaults.js`).
 *
 * @param {HTMLElement} el - The `<json-table>` element (source of the HTML attributes)
 * @param {Partial<JsonTableParams>|null} config - Config passed via `init()` (default: null)
 * @param {Partial<JsonTableParams>} projectDefaults - Project-wide defaults (default: {})
 * @param {keyof JsonTableParams} name - Parameter name
 * @returns {*} The resolved value
 *
 * @example
 * // <json-table jsonurl="/api/rows.json" search="false"></json-table>
 * getParam(el, { jsonUrl: '/api/other.json' }, {}, 'jsonUrl'); // → '/api/other.json' (config)
 * getParam(el, null, {}, 'search');                             // → false (attribute)
 * getParam(el, null, { tableClass: 'table' }, 'tableClass');    // → 'table' (project defaults)
 * getParam(el, null, {}, 'tableWrapperClass');                  // → 'table-responsive' (built-in default)
 */
export function getParam(el, config = null, projectDefaults = {}, name) {

  // 1. config from script (undefined = key not present → go down one level)
  if (config && config[name] !== undefined) {
    return config[name];
  }

  // 2. HTML attribute
  const attr = el.getAttribute(name);
  if (attr !== null) {
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
        // fall through to the defaults
      }
    } else {
      return attr;
    }
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
 * // → { debug: true, jsonUrl: '/api/rows.json', jsonDataField: 'data', data: null, ... }
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
