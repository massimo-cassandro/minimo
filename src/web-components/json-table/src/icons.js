/*! minimo - json-table: icons */

import checkBold from '../../../icons/check-bold.svg?inline';
import xBold from '../../../icons/x-bold.svg?inline';
import arrowUp from '../../../icons/arrow-up.svg?inline';
import arrowDown from '../../../icons/arrow-down.svg?inline';
import arrowsDownUp from '../../../icons/arrows-down-up.svg?inline';
import caretLeft from '../../../icons/caret-left.svg?inline';
import caretRight from '../../../icons/caret-right.svg?inline';

/** @typedef {import('./defaults.js').IconDef} IconDef */

/** Icona predefinita dei valori `true` (`check-bold` di minimo, markup SVG inline) */
export const boolTrueIcon = checkBold;
/** Icona predefinita dei valori `false` (`x-bold` di minimo) */
export const boolFalseIcon = xBold;
/** Icona predefinita del pulsante di ordinamento, ordinamento crescente attivo (`arrow-up` di minimo) */
export const sortAscArrowIcon = arrowUp;
/** Icona predefinita del pulsante di ordinamento, ordinamento decrescente attivo (`arrow-down` di minimo) */
export const sortDescArrowIcon = arrowDown;
/** Icona predefinita del pulsante di ordinamento, nessun ordinamento attivo (`arrows-down-up` di minimo) */
export const sortNoneArrowIcon = arrowsDownUp;
/** Icona predefinita del pulsante pagina precedente (`caret-left` di minimo) */
export const paginationPrevIcon = caretLeft;
/** Icona predefinita del pulsante pagina successiva (`caret-right` di minimo) */
export const paginationNextIcon = caretRight;

/**
 * Stringhe di markup già analizzate, indicizzate dalla stringa stessa.
 * @type {Map<string, DocumentFragment>}
 */
const fragmentCache = new Map();

/**
 * Risolve la definizione di un'icona in un contenuto utilizzabile da domBuilder (`content`) o da `setContent()`.
 *
 * Le stringhe di markup vengono analizzate una sola volta tramite un `<template>` inerte e clonate a ogni chiamata, così che la
 * stessa icona possa essere inserita in molte celle senza nuova analisi e senza passare dal sanitizer HTML
 * usato da domBuilder per le stringhe di markup (le icone sono configurazione fornita dallo sviluppatore,
 * non dati dell'utente). Anche i nodi DOM vengono clonati, dato che un nodo può stare in un solo posto.
 *
 * @param {IconDef|null|undefined} icon - Definizione dell'icona (vedi `IconDef`)
 * @returns {Node|DomBuilderItem[]|null} Un nodo nuovo (o un array domBuilder), `null` quando `icon` è nullish
 *
 * @example
 * iconContent('<svg …></svg>');                  // → DocumentFragment (clone del markup analizzato)
 * iconContent(document.querySelector('svg'));   // → SVGElement clonato
 * iconContent({ tag: 'span', content: '✓' });   // → [{ tag: 'span', content: '✓' }] (domBuilder array)
 * iconContent(() => '<svg …></svg>');           // → DocumentFragment
 * iconContent(null);                            // → null
 */
export function iconContent(icon) {

  const resolved = typeof icon === 'function' ? icon() : icon;

  if (resolved == null) {
    return null;
  }

  if (resolved instanceof Node) {
    return resolved.cloneNode(true);
  }

  if (typeof resolved === 'string') {
    let fragment = fragmentCache.get(resolved);
    if (!fragment) {
      const tpl = document.createElement('template');
      tpl.innerHTML = resolved.trim();
      fragment = tpl.content;
      fragmentCache.set(resolved, fragment);
    }
    return fragment.cloneNode(true);
  }

  if (typeof resolved === 'object') {
    return [resolved];
  }

  return null;
}
