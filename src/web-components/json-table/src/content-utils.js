
import { domBuilder } from '../../../utilities/dom-builder/dom-builder.js';

/** @typedef {import('./defaults.js').CellContent} CellContent */

/**
 * Sostituisce il contenuto di `el` con `content`, accettando ogni forma di contenuto usata dal
 * componente (vedi `CellContent`): un Node viene aggiunto così com'è, un array domBuilder viene costruito dentro
 * l'elemento, una stringa/numero viene impostato come testo oppure, se contiene `<`, come markup sanificato
 * (`Element.setHTML` dove supportato, altrimenti `innerHTML`, in modo coerente con domBuilder).
 * La configurazione vuota del sanitizer passata a `setHTML` mantiene gli attributi `class`, `id`, `style` e `data-*`,
 * che la configurazione predefinita del browser rimuove, mentre il contenuto non sicuro (script,
 * gestori di eventi, URL `javascript:`) viene sempre eliminato.
 * Una funzione viene invocata e il suo risultato usato. `null`/`undefined` svuotano l'elemento.
 *
 * @param {HTMLElement} el - Elemento di destinazione (svuotato prima)
 * @param {CellContent|(() => CellContent)} content - Contenuto da impostare
 * @returns {void}
 *
 * @example
 * setContent(td, 'plain text');
 * setContent(td, 'a <strong>bold</strong> text');
 * setContent(td, 1234);
 * setContent(td, document.createElement('span'));
 * setContent(td, [{ tag: 'a', attrs: { href: '#' }, content: 'link' }]);
 * setContent(td, null); // → cella vuota
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
    el.setHTML(text, { sanitizer: {} });

  } else {
    el.innerHTML = text;
  }
}


/**
 * Legge un valore da un oggetto tramite un percorso di chiavi separate da punti.
 * Restituisce `undefined` quando una chiave intermedia non esiste.
 *
 * @param {Object|null|undefined} obj - Oggetto sorgente
 * @param {string} path - Chiave o percorso separato da punti
 * @returns {*}
 *
 * @example
 * getNestedValue({ owner: { name: 'Mario' } }, 'owner.name'); // → 'Mario'
 * getNestedValue({ name: 'Mario' }, 'name');                  // → 'Mario'
 * getNestedValue({ name: 'Mario' }, 'owner.name');            // → undefined
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce(
    (acc, key) => (acc == null ? undefined : /** @type {Object<string, *>} */ (acc)[key]),
    /** @type {*} */ (obj)
  );
}


/**
 * Risolve un template in stile mustache: ogni segnaposto `[[key]]` viene sostituito con il
 * corrispondente valore della riga (chiavi annidate ammesse); i segnaposto che risultano `null`/`undefined`
 * vengono sostituiti con `nullAs`. Utile per la configurazione senza JS tramite attributi HTML.
 *
 * @param {string} tpl - Stringa del template
 * @param {Object} row - Oggetto riga
 * @param {string} [nullAs=''] - Sostituto dei valori null/undefined (default: '')
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
