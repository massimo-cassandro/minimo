import { defaults, mergedParams } from './defaults.js';
import { colDefaults } from './parse-cols.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */

/*
  Segnalazione in console (solo in sviluppo, o con `debug: true`) dei parametri non riconosciuti: chiavi sconosciute
  passate a `init()`/`reload()` o a `JsonTable.setDefaults()`, attributi HTML che non corrispondono a nessun
  parametro, chiavi sconosciute di `classes`, `labels`, `serverParams` e delle definizioni delle colonne (`cols`).
  Utile soprattutto per gli errori di digitazione: quando possibile viene suggerito il nome corretto.
*/

/**
 * Attributi HTML globali (o comunque legittimi su `<json-table>`) da non segnalare, oltre a `data-*`, `aria-*` e
 * agli event handler `on*`.
 */
const globalAttrs = new Set([
  'id', 'class', 'style', 'hidden', 'title', 'lang', 'dir', 'tabindex', 'role', 'slot', 'is', 'part', 'exportparts',
  'inert', 'nonce', 'popover', 'autofocus', 'draggable', 'contenteditable', 'spellcheck', 'translate', 'accesskey',
  'enterkeyhint', 'inputmode', 'autocapitalize', 'itemscope', 'itemtype', 'itemprop', 'itemid', 'itemref'
]);

/** Parametri oggetto le cui chiavi sono verificate (`dataTypes` è libero: le chiavi sono i nomi dei tipi) */
const checkedObjects = mergedParams.filter(name => name !== 'dataTypes');

/** Chiavi ammesse nelle definizioni delle colonne */
const colKeys = new Set([...Object.keys(colDefaults), 'type', 'sortValue', 'searchValue']);

/** Avvisi già emessi, per non ripeterli (es. a ogni istanza per `setDefaults()`, o a ogni `reload()`) */
const warned = new Set();


/**
 * True in ambiente di sviluppo (`process.env.NODE_ENV === 'development'`, sostituito da webpack in build).
 * Il try/catch evita il ReferenceError se `process` non è definito (es. script usato senza bundler).
 * @returns {boolean}
 */
export function isDevEnv() {
  try {
    // eslint-disable-next-line no-undef
    return process.env.NODE_ENV === 'development';
  } catch {
    return false;
  }
}


/**
 * Distanza di Levenshtein tra due stringhe (senza distinzione tra maiuscole e minuscole).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function distance(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[b.length];
}


/**
 * Nome più simile a `name` tra quelli ammessi, se abbastanza vicino da essere un probabile errore di digitazione.
 *
 * @param {string} name - Nome non riconosciuto
 * @param {Iterable<string>} known - Nomi ammessi
 * @returns {string|null}
 *
 * @example
 * suggest('perpage', ['perPage', 'search']);    // → 'perPage'
 * suggest('serach', ['perPage', 'search']);     // → 'search'
 * suggest('foo', ['perPage', 'search']);        // → null
 */
export function suggest(name, known) {
  let best = null;
  let bestDist = Infinity;
  for (const candidate of known) {
    const d = distance(name, candidate);
    if (d < bestDist) {
      best = candidate;
      bestDist = d;
    }
  }
  const maxDist = name.length <= 4 ? 1 : 2;
  return bestDist <= maxDist ? best : null;
}


/**
 * Emette (una sola volta per messaggio) l'avviso per una chiave non riconosciuta.
 *
 * @param {string} where - Dove si trova la chiave (es. "init()", "attributo HTML", "labels")
 * @param {string} name - Chiave non riconosciuta
 * @param {Iterable<string>} known - Chiavi ammesse, per il suggerimento
 * @param {HTMLElement} el - L'elemento `<json-table>`, mostrato in console
 * @returns {void}
 */
function warnUnknown(where, name, known, el) {
  const hint = suggest(name, known);
  const message = `[json-table] ${where}: \`${name}\` non riconosciuto, ignorato${hint ? ` (forse \`${hint}\`?)` : ''}`;
  if (warned.has(message)) {
    return;
  }
  warned.add(message);
  // eslint-disable-next-line no-console
  console.warn(message, el);
}


/**
 * Verifica le chiavi di un oggetto di configurazione (`init()`/`reload()` o `setDefaults()`), comprese quelle dei
 * parametri oggetto `classes`, `labels` e `serverParams`.
 *
 * @param {Object<string, *>|null|undefined} source - Oggetto da verificare
 * @param {string} where - Nome della sorgente, per il messaggio
 * @param {HTMLElement} el - L'elemento `<json-table>`
 * @returns {void}
 */
function checkObject(source, where, el) {

  if (!source || typeof source !== 'object') {
    return;
  }

  const known = Object.keys(defaults);

  Object.keys(source).forEach(name => {
    if (!(name in defaults)) {
      warnUnknown(where, name, known, el);
    } else if (checkedObjects.includes(name)) {
      checkNested(source[name], `${where} → ${name}`, name, el);
    }
  });
}


/**
 * Verifica le chiavi di un parametro oggetto (`classes`, `labels`, `serverParams`) rispetto ai default.
 *
 * @param {*} value - Valore del parametro
 * @param {string} where - Nome della sorgente, per il messaggio
 * @param {string} name - Nome del parametro
 * @param {HTMLElement} el - L'elemento `<json-table>`
 * @returns {void}
 */
function checkNested(value, where, name, el) {

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return;
  }

  const builtIn = /** @type {Object<string, *>} */ (defaults[/** @type {keyof JsonTableParams} */ (name)]);
  const known = Object.keys(builtIn);

  Object.keys(value).forEach(key => {
    if (!(key in builtIn)) {
      warnUnknown(where, key, known, el);
    }
  });
}


/**
 * Verifica gli attributi HTML dell'elemento: ogni attributo non globale deve corrispondere (senza distinzione tra
 * maiuscole e minuscole) a un parametro. Per i parametri oggetto passati come JSON vengono verificate anche le chiavi.
 *
 * @param {HTMLElement} el - L'elemento `<json-table>`
 * @returns {void}
 */
function checkAttributes(el) {

  /** @type {Map<string, string>} nome minuscolo → nome del parametro */
  const byLower = new Map(Object.keys(defaults).map(name => [name.toLowerCase(), name]));

  el.getAttributeNames().forEach(attr => {

    if (globalAttrs.has(attr) || attr.startsWith('data-') || attr.startsWith('aria-') || attr.startsWith('on')) {
      return;
    }

    const name = byLower.get(attr);
    if (!name) {
      warnUnknown('attributo HTML', attr, byLower.keys(), el);
      return;
    }

    if (checkedObjects.includes(name)) {
      const raw = (el.getAttribute(attr) ?? '').trim();
      if (raw.startsWith('{')) {
        try {
          checkNested(JSON.parse(raw), `attributo HTML ${attr}`, name, el);
        } catch {
          // JSON non valido: già segnalato da `readAttr()`
        }
      }
    }
  });
}


/**
 * Verifica le chiavi delle definizioni delle colonne (`params.cols` risolto).
 *
 * @param {*} cols - Il parametro `cols` risolto
 * @param {HTMLElement} el - L'elemento `<json-table>`
 * @returns {void}
 */
function checkCols(cols, el) {

  if (!Array.isArray(cols)) {
    return;
  }

  cols.forEach((col, idx) => {
    if (!col || typeof col !== 'object') {
      return;
    }
    Object.keys(col).forEach(key => {
      if (!colKeys.has(key)) {
        warnUnknown(`cols[${idx}]${col.key ? ` (${col.key})` : ''}`, key, colKeys, el);
      }
    });
  });
}


/**
 * Segnala in console (`console.warn`, una sola volta per messaggio) i parametri non riconosciuti, suggerendo
 * il nome corretto quando sembra un errore di digitazione. Controlla:
 * - le chiavi passate a `init()`/`reload()` e a `JsonTable.setDefaults()`
 * - gli attributi HTML dell'elemento (esclusi gli attributi globali, `data-*`, `aria-*` e `on*`)
 * - le chiavi di `classes`, `labels` e `serverParams`, da qualunque sorgente
 * - le chiavi delle definizioni delle colonne (`cols`)
 *
 * Non fa nulla in produzione: viene eseguito solo quando `process.env.NODE_ENV === 'development'` oppure con `debug: true`.
 *
 * @param {HTMLElement} el - L'elemento `<json-table>`
 * @param {JsonTableParams} params - Parametri risolti
 * @param {Partial<JsonTableParams>|null} config - Configurazione passata tramite `init()`/`reload()`
 * @param {Partial<JsonTableParams>} projectDefaults - Default di progetto (`JsonTable.setDefaults()`)
 * @returns {void}
 *
 * @example
 * checkUnknownParams(el, params, { perpage: 10, labels: { serachPlaceholder: 'Cerca' } }, {});
 * // [json-table] init(): `perpage` non riconosciuto, ignorato (forse `perPage`?)
 * // [json-table] init() → labels: `serachPlaceholder` non riconosciuto, ignorato (forse `searchPlaceholder`?)
 */
export function checkUnknownParams(el, params, config, projectDefaults) {

  if (!isDevEnv() && !params.debug) {
    return;
  }

  checkObject(config, 'init()', el);
  checkObject(projectDefaults, 'JsonTable.setDefaults()', el);
  checkAttributes(el);
  checkCols(params.cols, el);
}
