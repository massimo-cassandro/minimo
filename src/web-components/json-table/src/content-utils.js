
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
 * Legge il valore di una cella del body. Nelle colonne ripetute su più `<tr>` (`col._subRows`, vedi `parse-cols.js`)
 * un valore array fornisce un elemento per ogni `<tr>`, mentre un valore non array viene ripetuto.
 * Se la colonna definisce `parse`, il valore è quello restituito dalla funzione (`undefined` lascia il valore grezzo).
 *
 * @param {Object} row - Oggetto riga
 * @param {{key: string, _subRows: boolean, parse?: import('./defaults.js').ColParse|null}} col - Colonna analizzata
 * @param {number} [subIdx=0] - Indice del `<tr>` all'interno del record (default: 0)
 * @returns {*}
 *
 * @example
 * getCellValue({ a: ['x', 'y'] }, { key: 'a', _subRows: true }, 1);  // → 'y'
 * getCellValue({ a: ['x', 'y'] }, { key: 'a', _subRows: false }, 1); // → ['x', 'y']
 * getCellValue({ a: 1 }, { key: 'a', _subRows: false, parse: row => row.a + 1 }); // → 2
 */
export function getCellValue(row, col, subIdx = 0) {
  const parsed = typeof col.parse === 'function' ? col.parse(row, subIdx) : undefined;

  if (parsed !== undefined) {
    return parsed;
  }

  const value = getNestedValue(row, col.key);
  return col._subRows && Array.isArray(value) ? value[subIdx] : value;
}


/**
 * Restituisce tutti i valori di una colonna per un record, da usare per ricerca e aggregati: nelle colonne
 * ripetute su più `<tr>` (`col._subRows`) con valore array uno per elemento, altrimenti uno solo.
 *
 * @param {Object} row - Oggetto riga
 * @param {{key: string, _subRows: boolean, parse?: import('./defaults.js').ColParse|null}} col - Colonna analizzata
 * @returns {Array<*>}
 *
 * @example
 * getCellValues({ a: ['x', 'y'] }, { key: 'a', _subRows: true });  // → ['x', 'y']
 * getCellValues({ a: ['x', 'y'] }, { key: 'a', _subRows: false }); // → [['x', 'y']]
 */
export function getCellValues(row, col) {
  const value = getNestedValue(row, col.key);

  return col._subRows && Array.isArray(value)
    ? value.map((_, subIdx) => getCellValue(row, col, subIdx))
    : [getCellValue(row, col)];
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
