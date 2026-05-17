
/**
 * Esegue le operazione di base del domBuilder: assegnazione classi, id ecc...
 */
export function domBuilderBasicSetup (element, domBuilderItem) {

  // classi
  // possibili denominazioni: class o className
  // se presente className, class viene ignorato
  if (domBuilderItem.class && !domBuilderItem.className) {
    domBuilderItem.className = domBuilderItem.class;
  }

  // se item.attrs è un array singolo viene trattato come singolo elemento
  if (domBuilderItem.attrs && Array.isArray(domBuilderItem.attrs) && !Array.isArray(domBuilderItem.attrs[0])) {
    domBuilderItem.attrs = [ domBuilderItem.attrs ];

  // item.attrs può essere un oggetto del tipo {attr_name: attr_value}
  } else if (typeof domBuilderItem.attrs === 'object' && !Array.isArray(domBuilderItem.attrs) && domBuilderItem.attrs !== null) {
    domBuilderItem.attrs = Object.entries(domBuilderItem.attrs);
  }

  // gli attributi booleani non vengono aggiunti se il loro valore è false
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



  (domBuilderItem.attrs ?? []).forEach(attr => {
    if (attr[1] != null && !(boolAttrs.includes(attr[0]) && attr[1]=== false)) {
      element.setAttribute(attr[0], String(attr[1]));
    }
  });

  // assegnazioen classi e id (dopo attrs in modo che le proprietà a livello di oggetto prevalgano)
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
