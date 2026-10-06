
// gli attributi booleani vengono omessi quando il loro valore è esplicitamente false;
// dichiarati una sola volta a livello di modulo (Set per lookup O(1)) dato che l'elenco non cambia tra le chiamate
const boolAttrs = new Set([
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
]);

/**
 * Applica a un elemento la configurazione di base di domBuilder: classi, id e attributi.
 * @param {HTMLElement} element - L'elemento da configurare.
 * @param {DomBuilderItem} domBuilderItem - L'oggetto di configurazione di domBuilder.
 * @returns {HTMLElement}
 */
export function domBuilderBasicSetup (element, domBuilderItem) {

  // alias delle classi: accetta `class` e `classname`; `className` ha la precedenza su entrambi
  if (domBuilderItem.class && !domBuilderItem.className) {
    domBuilderItem.className = domBuilderItem.class;
  }
  if (domBuilderItem.classname && !domBuilderItem.className) {
    domBuilderItem.className = domBuilderItem.classname;
  }

  // normalizza attrs: un singolo array piatto viene trattato come una singola coppia [name, value]
  if (domBuilderItem.attrs && Array.isArray(domBuilderItem.attrs) && !Array.isArray(domBuilderItem.attrs[0])) {
    domBuilderItem.attrs = [ domBuilderItem.attrs ];

  // attrs può essere anche un oggetto semplice: {attr_name: attr_value}
  } else if (typeof domBuilderItem.attrs === 'object' && !Array.isArray(domBuilderItem.attrs) && domBuilderItem.attrs !== null) {
    domBuilderItem.attrs = Object.entries(domBuilderItem.attrs);
  }

  (/** @type {[string, unknown][]} */ (domBuilderItem.attrs ?? [])).forEach(attr => {
    if (attr[1] != null && !(boolAttrs.has(attr[0]) && attr[1] === false)) {
      element.setAttribute(attr[0], String(attr[1]));
    }
  });

  // assegna classi e id dopo attrs così che le proprietà a livello di oggetto abbiano la precedenza
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
