/*! minimo - json-table: content utilities */

import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';

/** @typedef {import('./defaults.js').CellContent} CellContent */

/**
 * Replaces the content of `el` with `content`, accepting every content form used by the
 * component (see `CellContent`): a Node is appended as-is, a domBuilder array is built inside
 * the element, a string/number is set as text or, when it contains `<`, as sanitized markup
 * (`Element.setHTML` where supported, `innerHTML` otherwise, consistently with domBuilder).
 * A function is invoked and its result used. `null`/`undefined` empty the element.
 *
 * @param {HTMLElement} el - Target element (emptied first)
 * @param {CellContent|(() => CellContent)} content - Content to set
 * @returns {void}
 *
 * @example
 * setContent(td, 'plain text');
 * setContent(td, 'a <strong>bold</strong> text');
 * setContent(td, 1234);
 * setContent(td, document.createElement('span'));
 * setContent(td, [{ tag: 'a', attrs: { href: '#' }, content: 'link' }]);
 * setContent(td, null); // → empty cell
 */
export function setContent(el, content) {

  const resolved = typeof content === 'function' ? content() : content;

  if (resolved == null) {
    el.replaceChildren();
    return;
  }

  if (resolved instanceof Node) {
    el.replaceChildren(resolved);
    return;
  }

  if (Array.isArray(resolved)) {
    domBuilder(resolved, el, { emptyParent: true });
    return;
  }

  const text = String(resolved);

  if (!text.includes('<')) {
    el.textContent = text;

  } else if (typeof el.setHTML === 'function') {
    el.setHTML(text);

  } else {
    el.innerHTML = text;
  }
}


/**
 * Reads a value from an object through a dot-separated key path.
 * Returns `undefined` when an intermediate key does not exist.
 *
 * @param {Object|null|undefined} obj - Source object
 * @param {string} path - Key or dot-separated path
 * @returns {*}
 *
 * @example
 * getNestedValue({ owner: { name: 'Mario' } }, 'owner.name'); // → 'Mario'
 * getNestedValue({ name: 'Mario' }, 'name');                  // → 'Mario'
 * getNestedValue({ name: 'Mario' }, 'owner.name');            // → undefined
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}


/**
 * Resolves a mustache-like template: every `[[key]]` placeholder is replaced with the
 * corresponding row value (nested keys allowed); placeholders resolving to `null`/`undefined`
 * are replaced with `nullAs`. Useful for the js-free configuration via HTML attributes.
 *
 * @param {string} tpl - Template string
 * @param {Object} row - Row object
 * @param {string} [nullAs=''] - Replacement of null/undefined values (default: '')
 * @returns {string}
 *
 * @example
 * resolveMustache('<a href="/users/[[id]]">[[name]]</a>', { id: 12, name: 'Mario' });
 * // → '<a href="/users/12">Mario</a>'
 * resolveMustache('[[owner.name]]', { owner: null }, '—'); // → '—'
 */
export function resolveMustache(tpl, row, nullAs = '') {
  return tpl.replace(/\[\[(.*?)\]\]/g, (_, key) => {
    const value = getNestedValue(row, key.trim());
    return value == null ? nullAs : String(value);
  });
}
