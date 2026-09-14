/*! minimo - json-table: icons */

import checkBold from '../../../icons/check-bold.svg?inline';
import xBold from '../../../icons/x-bold.svg?inline';
import arrowUp from '../../../icons/arrow-up.svg?inline';
import arrowDown from '../../../icons/arrow-down.svg?inline';
import arrowsDownUp from '../../../icons/arrows-down-up.svg?inline';

/** @typedef {import('./defaults.js').IconDef} IconDef */

/** Default icon of `true` values (minimo `check-bold`, inline SVG markup) */
export const boolTrueIcon = checkBold;
/** Default icon of `false` values (minimo `x-bold`) */
export const boolFalseIcon = xBold;
/** Default sort button icon, ascending sort active (minimo `arrow-up`) */
export const sortAscArrowIcon = arrowUp;
/** Default sort button icon, descending sort active (minimo `arrow-down`) */
export const sortDescArrowIcon = arrowDown;
/** Default sort button icon, no sort active (minimo `arrows-down-up`) */
export const sortNoneArrowIcon = arrowsDownUp;

/**
 * Markup strings already parsed, keyed by the string itself.
 * @type {Map<string, DocumentFragment>}
 */
const fragmentCache = new Map();

/**
 * Resolves an icon definition to a content usable by domBuilder (`content`) or `setContent()`.
 *
 * Markup strings are parsed once through an inert `<template>` and cloned on every call, so the
 * same icon can be inserted in many cells without re-parsing and without going through the HTML
 * sanitizer used by domBuilder for markup strings (icons are developer-supplied configuration,
 * not user data). DOM nodes are cloned too, since a node can live in one place only.
 *
 * @param {IconDef|null|undefined} icon - Icon definition (see `IconDef`)
 * @returns {Node|DomBuilderItem[]|null} A fresh node (or domBuilder array), `null` when `icon` is nullish
 *
 * @example
 * iconContent('<svg …></svg>');                  // → DocumentFragment (clone of the parsed markup)
 * iconContent(document.querySelector('svg'));   // → cloned SVGElement
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
