
/** @typedef {import('./dom-builder.js').DomBuilderItem} DomBuilderItem */

/**
 * Applies basic domBuilder configuration to an element: classes, id, and attributes.
 * @param {HTMLElement} element - The element to configure.
 * @param {DomBuilderItem} domBuilderItem - The domBuilder configuration object.
 * @returns {HTMLElement}
 */
export function domBuilderBasicSetup (element, domBuilderItem) {

  // class aliases: accept both `class` and `className`; `className` takes precedence
  if (domBuilderItem.class && !domBuilderItem.className) {
    domBuilderItem.className = domBuilderItem.class;
  }

  // normalize attrs: a single flat array is treated as a single [name, value] pair
  if (domBuilderItem.attrs && Array.isArray(domBuilderItem.attrs) && !Array.isArray(domBuilderItem.attrs[0])) {
    domBuilderItem.attrs = [ domBuilderItem.attrs ];

  // attrs can also be a plain object: {attr_name: attr_value}
  } else if (typeof domBuilderItem.attrs === 'object' && !Array.isArray(domBuilderItem.attrs) && domBuilderItem.attrs !== null) {
    domBuilderItem.attrs = Object.entries(domBuilderItem.attrs);
  }

  // boolean attributes are omitted when their value is explicitly false
  const boolAttrs = [
    'allowfullscreen',
    'async',
    'autocomplete',
    'autofocus',
    'autoplay',
    'border',
    'checked',
    'compact',
    'contenteditable',
    'controls',
    'default',
    'loop',
    'defer',
    'disabled',
    'formnovalidate',
    'hidden',
    'inert',
    'ismap',
    'multiple',
    'muted',
    'novalidate',
    'open',
    'readonly',
    'required',
    'reversed',
    'selected',
    'spellcheck',
    'translate'
  ];



  (/** @type {[string, unknown][]} */ (domBuilderItem.attrs ?? [])).forEach(attr => {
    if (attr[1] != null && !(boolAttrs.includes(attr[0]) && attr[1]=== false)) {
      element.setAttribute(attr[0], String(attr[1]));
    }
  });

  // assign classes and id after attrs so object-level properties take precedence
  if(domBuilderItem.className) {
    element.className = Array.isArray(domBuilderItem.className)
      ? domBuilderItem.className.filter(Boolean).join(' ')
      : domBuilderItem.className;
  }
  if(domBuilderItem.id) {
    element.id = domBuilderItem.id;
  }

  return element;

}
