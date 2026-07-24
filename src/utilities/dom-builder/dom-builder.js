/*! minimo - DOM Builder */
import { domBuilderBasicSetup } from './domBuilderBasicSetup.js';
import { parseDomString } from './parseDomString.js';

// TODO multi-line string syntax where each line maps to an element
// TODO same as above with optional nesting via indentation

/**
 * @typedef {Object} DomBuilderItem
 * @property {string | string[]} [tag='div'] - HTML tag name or array of nested tags (each is parent of the next). Also `tagName`.
 * @property {string | string[]} [tagName='div'] - Alias for `tag`.
 * @property {string | string[]} [className] - CSS class(es): a single string or an array (falsy values filtered out).
 * @property {string | string[]} [class] - Alias for `className`.
 * @property {string | null} [id] - Unique element ID.
 * @property {[string, *] | [string, *][] | Object<string, *>} [attrs] - Attributes: a `[name, value]` pair, array of pairs, or `{name: value}` object.
 * @property {string | number | Function | Element | DomBuilderItem[] | null} [content] - Element content.
 *   A string or number is set as plain text (`textContent`) unless it contains `<`, in which case it is
 *   treated as markup: sanitized and inserted via the native Sanitizer API (`Element.setHTML`) where
 *   supported, falling back to raw `innerHTML` on browsers without it.
 * @property {boolean} [condition=true] - When false, the element is skipped.
 * @property {function(HTMLElement): void} [callback] - Callback invoked after the element is created.
 * @property {Array<DomBuilderItem|string>} [children] - Configuration array for child elements. Accepts strings (shorthand per `parseDomString`) and/or configuration objects.
 */

/**
 * domBuilder
 * Builds a DOM structure from a configuration array.
 *
 * Parses an array of configuration objects to create HTML elements.
 *
 * **Configuration structure format (structureArray):**
 *
 * ```javascript
 * structure = [
 *   '#mainContainer.container',
 *   'p#main-info.info.active{data-id:123,role=button} Lorem ipsum',
 *   {
 *     tag: 'div' | ['.divClass', 'h2#id', 'table.class1', 'thead', 'tr.class2.class3(attr1: attrValue)'], // also tagName
 *     className: 'xxx' | ['class1', 'class2'], // also `class`
 *     id: 'element-id',
 *     attrs: [attr_name, attr_value] | [[...], [...]] | {name: value},
 *     content: 'xxx' | 'xxx <strong>yyy</strong>' | 123 | domBuilder Array | function | Element, // see DomBuilderItem.content above
 *     condition: true | false,
 *     callback: el => ...,
 *     children: [...]
 *   },
 *   'div.class[data-xxx: value]',
 *   '.another-div',
 *   'p#paragraph',
 *   '...',
 *   { ... }
 * ]
 * ```
 *
 * IDs and classes can be specified either as top-level object keys or inside the `attrs` object.
 * When both are present, top-level properties take precedence.
 *
 * A shorthand string syntax is also available, built according to `parseDomString` conventions.
 * See `parseDomString` for details.
 *
 * The shorthand syntax does not support `content`, `callback`, `condition`, or `children`; use the object syntax for those.
 *
 * The shorthand can also be used for the `tag` property in object syntax.
 * When `tag` is an array, each element becomes the parent of the next one. Any other object properties
 * (className, callback, etc.) are applied only to the last element in the array.
 * When shorthand string and object-level properties conflict (classes, id, or attributes),
 * object-level properties take precedence.
 *
 * @function domBuilder
 * @param {Array<DomBuilderItem|string>} [structureArray=[]] - Configuration array. Accepts strings (shorthand per `parseDomString`) and/or configuration objects.
 * @param {HTMLElement} [parent] - Parent element the structure is attached to (see `options.insertMode`).
 * @param {Object} [options={}] - Configuration options.
 * @param {boolean} [options.emptyParent=false] - When true, the parent element is emptied before building.
 * @param {'append'|'before'|'after'} [options.insertMode='append'] - How each root element of `structureArray` is attached to `parent`: `append` inserts it as a child (default), `before`/`after` insert it as a previous/next sibling of `parent`, preserving `structureArray` order. Only applies to the elements produced by this call — nested `domBuilder` calls (`content`, `children`) always append.
 * @returns {HTMLElement|null} The first created element, or null if nothing was created.
 */
export function domBuilder(structureArray = [], parent, options = {}) {

  options = {
    emptyParent: false,
    insertMode: 'append',
    ...options
  };

  if(parent && options.emptyParent) {
    parent.innerHTML = '';
  }

  // For the default 'append' insert mode, root-level siblings are accumulated into a
  // DocumentFragment and attached to `parent` with a single appendChild at the end,
  // instead of one appendChild per sibling. 'before'/'after' modes need `target` to stay
  // the real, live parent node throughout the loop for anchor resolution (see afterAnchors
  // below), so batching is skipped for those.
  const useFragment = !!parent && options.insertMode === 'append';

  /** @type {HTMLElement | DocumentFragment | null} */
  let target = useFragment ? document.createDocumentFragment() : (parent ?? null);

  /** @type {Map<HTMLElement | DocumentFragment, HTMLElement>} tracks, for `insertMode: 'after'`, the last inserted sibling per parent node */
  const afterAnchors = new Map();

  /** @type {HTMLElement | null} */
  let mainElement = null;
  /** @type {HTMLElement} */
  let el;
  /** @type {HTMLElement | DocumentFragment | null} */
  let grand_parent = null;

  structureArray.forEach(inputItem => {

    /** @type {DomBuilderItem | null} */
    let item;
    if (inputItem != null && typeof inputItem === 'string' && inputItem !== '') {
      item = parseDomString(inputItem);
    } else {
      item = /** @type {DomBuilderItem} */ (inputItem);
    }

    // console.log(item);

    if (item != null && (item.condition ?? true)) {

      const safeItem = item; // const binding so TypeScript tracks non-null type in nested closures

      // when tag is an array, create a series of nested elements;
      // the last one receives the remaining object properties
      if (Array.isArray(safeItem.tag)) {

        grand_parent = target;
        const tags = /** @type {string[]} */ (safeItem.tag);

        tags.forEach((tagItem, idx) => {

          const isLast = idx === tags.length - 1;
          const parsedItem = parseDomString(tagItem) ?? { tag: 'div', id: undefined, className: '', attrs: {}, content: undefined };

          // for the last element, merge with the object's own options; object-level properties take precedence
          if(isLast) {
            safeItem.attrs = {...parsedItem.attrs ?? {}, ...safeItem.attrs ?? {}};
          }
          el = domBuilderBasicSetup(
            document.createElement(parsedItem.tag || 'div'),
            {...parsedItem, ...(isLast ? safeItem : {})}
          );

          if (!isLast) { // the last element is handled by the standard path below
            if (target) {
              target.appendChild(el);
            }
            target = el;
          }

        });

      } else {
        el = domBuilderBasicSetup(
          document.createElement(/** @type {string} */ (safeItem.tag) ?? 'div'),
          safeItem
        );
      }


      if (safeItem.content != null) {

        if (Array.isArray(safeItem.content)) {
          // build directly into `el` (instead of passing no parent) so that every item of
          // the array is actually inserted, not just the first one returned as `mainElement`
          domBuilder(safeItem.content, el);

        } else {

          /** @type {string | Element | null} */
          let content = null;
          if (typeof safeItem.content === 'function') {
            content = safeItem.content();

          } else if (safeItem.content != null) {
            content = String(safeItem.content);
          }

          if (content instanceof Element) {
            el.appendChild(content);

          } else if (content != null) {

            if (!content.includes('<')) {
              // plain text: no HTML parsing needed, textContent is faster and safe by construction
              el.textContent = content;

            } else if (typeof el.setHTML === 'function') {
              // markup: sanitize via the native Sanitizer API, stripping <script>, event handler
              // attributes, javascript: URLs, etc. while still allowing harmless formatting tags
              // (<strong>, <em>, <a>, ...)
              el.setHTML(content);

            } else {
              // Sanitizer API not supported by this browser: fall back to the historical,
              // unsanitized behavior
              el.innerHTML = content;
            }
          }
        }
      }


      if (safeItem.children != null && !Array.isArray(safeItem.children)) {
        // eslint-disable-next-line no-console
        console.error('[domBuilder]: `item.children` must be an array → ' + safeItem.children);
      }
      if (safeItem.children && Array.isArray(safeItem.children)) {
        domBuilder(safeItem.children, el, {emptyParent: false});
      }

      if (mainElement == null) {
        mainElement = el;
      }

      if (target) {
        if (options.insertMode === 'before') {
          const anchor = /** @type {HTMLElement} */ (target);
          anchor.parentNode?.insertBefore(el, anchor);

        } else if (options.insertMode === 'after') {
          const anchor = afterAnchors.get(/** @type {HTMLElement} */ (target)) ?? /** @type {HTMLElement} */ (target);
          anchor.parentNode?.insertBefore(el, anchor.nextSibling);
          afterAnchors.set(/** @type {HTMLElement} */ (target), el);

        } else {
          target.appendChild(el);
        }
      }

      // TODO callbacks that act on the element's children may not run when no parent is set
      if (safeItem.callback && typeof safeItem.callback === 'function') {
        safeItem.callback(el);
      }

      if (grand_parent) {
        target = grand_parent;
      }
    }

  });

  if (useFragment && parent && target) {
    parent.appendChild(target);
  }

  return mainElement;
}
