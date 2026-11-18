
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

/** Messaggi già segnalati in console da `warnOnce`. */
const warned = new Set();

/**
 * Scrive un avviso in console una sola volta per messaggio (le funzioni di questo modulo sono invocate per ogni cella).
 * @param {string} message
 * @returns {void}
 */
function warnOnce(message) {
  if (!warned.has(message)) {
    warned.add(message);
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}

/** Prefisso delle definizioni di icona che fanno riferimento al file sprite (`'@icon:nome classi'`). */
export const ICON_PREFIX = '@icon:';


/**
 * Crea un'icona dal file sprite indicato da `iconFile`: `<svg class="{iconClass} …" aria-hidden="true"><use href="{iconFile}#nome"></use></svg>`.
 * L'elemento è costruito via DOM, quindi non passa dal sanitizer HTML (che, a seconda del browser, rimuove `<use>`).
 * La classe `iconClass` (di default `icon`, vedi `src/css/icons.css` di minimo) è sempre presente; `spec` può aggiungere
 * altre classi dopo il nome.
 *
 * @param {string} spec - Nome dell'icona (id del `<symbol>` nello sprite), seguito da eventuali classi separate da spazi
 * @param {string|null|undefined} iconFile - URL del file sprite (parametro `iconFile`)
 * @param {string|null} [iconClass='icon'] - Classe/i di base dell'icona (parametro `iconClass`); `null`/`''` = nessuna (default: 'icon')
 * @returns {SVGSVGElement|null} L'elemento SVG, oppure `null` (con un avviso in console) se manca `iconFile` o il nome
 *
 * @example
 * spriteIcon('check text-success', '/build/icons.svg');
 * // → <svg class="icon text-success" aria-hidden="true" focusable="false"><use href="/build/icons.svg#check"></use></svg>
 */
export function spriteIcon(spec, iconFile, iconClass = 'icon') {

  const [name, ...classes] = String(spec).trim().split(/\s+/);

  if (!name) {
    warnOnce('[json-table] icona `@icon:` senza nome: icona ignorata');
    return null;
  }

  if (!iconFile) {
    warnOnce(`[json-table] icona \`@icon:${name}\`: parametro \`iconFile\` non impostato, icona ignorata`);
    return null;
  }

  const ns = 'http://www.w3.org/2000/svg';
  const svg = /** @type {SVGSVGElement} */ (document.createElementNS(ns, 'svg'));
  const className = [iconClass, ...classes].filter(Boolean).join(' ');
  if (className) {
    svg.setAttribute('class', className);
  }
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `${iconFile}#${name}`);
  svg.appendChild(use);

  return svg;
}


/**
 * Sostituisce i segnaposti `<span data-jt-icon="nome classi">` generati da `resolveMustache` (`[[@icon:…]]`) con le icone
 * costruite da `spriteIcon`. Va invocata dopo `setContent`: i segnaposti superano il sanitizer (gli attributi `data-*`
 * vengono conservati), l'SVG no. Senza `iconFile` i segnaposti vengono rimossi.
 *
 * @param {Element} el - Elemento che contiene i segnaposti
 * @param {string|null|undefined} iconFile - URL del file sprite (parametro `iconFile`)
 * @param {string|null} [iconClass='icon'] - Classe/i di base dell'icona (parametro `iconClass`) (default: 'icon')
 * @returns {void}
 *
 * @example
 * setContent(td, resolveMustache('[[@icon:check]] [[name]]', row), true);
 * replaceIconPlaceholders(td, params.iconFile, params.iconClass);
 */
export function replaceIconPlaceholders(el, iconFile, iconClass = 'icon') {
  el.querySelectorAll('[data-jt-icon]').forEach(placeholder => {
    const icon = spriteIcon(placeholder.getAttribute('data-jt-icon') ?? '', iconFile, iconClass);
    if (icon) {
      placeholder.replaceWith(icon);
    } else {
      placeholder.remove();
    }
  });
}


/**
 * Risolve la definizione di un'icona in un contenuto utilizzabile da domBuilder (`content`) o da `setContent()`.
 *
 * Le stringhe che iniziano con `@icon:` (es. `'@icon:check text-success'`) generano un'icona del file sprite `iconFile`
 * (vedi `spriteIcon`). Le altre stringhe (markup o testo semplice, es. `'B'`) vengono analizzate una sola volta tramite
 * un `<template>` inerte e clonate a ogni chiamata, così che la stessa icona possa essere inserita in molte celle senza
 * nuova analisi e senza passare dal sanitizer HTML usato da domBuilder per le stringhe di markup (le icone sono
 * configurazione fornita dallo sviluppatore, non dati dell'utente). Anche i nodi DOM vengono clonati, dato che un nodo
 * può stare in un solo posto.
 *
 * @param {IconDef|null|undefined} icon - Definizione dell'icona (vedi `IconDef`)
 * @param {string|null} [iconFile=null] - URL del file sprite, usato dalle stringhe `@icon:` (default: null)
 * @param {string|null} [iconClass='icon'] - Classe/i di base delle icone `@icon:` (default: 'icon')
 * @returns {Node|DomBuilderItem[]|null} Un nodo nuovo (o un array domBuilder), `null` quando `icon` è nullish
 *
 * @example
 * iconContent('<svg …></svg>');                  // → DocumentFragment (clone del markup analizzato)
 * iconContent('B');                              // → DocumentFragment (nodo di testo)
 * iconContent('@icon:check', '/build/icons.svg'); // → <svg class="icon"><use href="/build/icons.svg#check"></use></svg>
 * iconContent(document.querySelector('svg'));   // → SVGElement clonato
 * iconContent({ tag: 'span', content: '✓' });   // → [{ tag: 'span', content: '✓' }] (domBuilder array)
 * iconContent(() => '<svg …></svg>');           // → DocumentFragment
 * iconContent(null);                            // → null
 */
export function iconContent(icon, iconFile = null, iconClass = 'icon') {

  const resolved = typeof icon === 'function' ? icon() : icon;

  if (resolved == null) {
    return null;
  }

  if (resolved instanceof Node) {
    return resolved.cloneNode(true);
  }

  if (typeof resolved === 'string') {

    if (resolved.trimStart().startsWith(ICON_PREFIX)) {
      return spriteIcon(resolved.trimStart().slice(ICON_PREFIX.length), iconFile, iconClass);
    }

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
