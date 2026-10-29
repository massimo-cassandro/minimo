
/**
 * Converte una stringa di markup (HTML o SVG, es. un svg importato con `?inline`) in elemento,
 * da usare, ad esempio, nei `children` di domBuilder, dove le stringhe sono interpretate come tag.
 *
 * Se il markup contiene più elementi radice, restituisce un array di elementi.
 *
 * Il markup viene analizzato con un `<template>` inerte, senza sanificazione: usarlo solo con
 * contenuto sicuro (asset del progetto, non dati dell'utente).
 *
 *
 * @param {string} markup - Markup con uno o più elementi radice (i nodi di testo tra gli elementi vengono ignorati)
 * @param {Object<string, string>} [attrs={}] - Attributi da impostare su ogni elemento radice (default: {})
 * @returns {Element|Element[]|null} L'elemento radice, un array di elementi se le radici sono più di una, oppure null se il markup non contiene elementi
 *
 * @example
 * markupToElement(calendarIcon, { 'aria-hidden': 'true', focusable: 'false' }); // → SVGSVGElement
 * markupToElement('<span class="badge">nuovo</span>');                         // → HTMLSpanElement
 * markupToElement('<li>uno</li><li>due</li>');                                 // → [HTMLLIElement, HTMLLIElement]
 */
export function markupToElement(markup, attrs = {}) {

  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();

  const elements = [...tpl.content.children];
  elements.forEach(el => {
    Object.entries(attrs ?? {}).forEach(([name, value]) => el.setAttribute(name, value));
  });

  if (!elements.length) {
    return null;
  }

  return elements.length === 1 ? elements[0] : elements;
}
