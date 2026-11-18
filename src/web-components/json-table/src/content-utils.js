
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
 * Con `asHtml` una stringa viene sempre trattata come markup, anche senza `<`: serve per i risultati di
 * `resolveMustache`, in cui i valori con escape (es. `&amp;`) non devono essere mostrati alla lettera.
 *
 * @param {HTMLElement} el - Elemento di destinazione (svuotato prima)
 * @param {CellContent|(() => CellContent)} content - Contenuto da impostare
 * @param {boolean} [asHtml=false] - Tratta sempre le stringhe come markup (default: false)
 * @returns {void}
 *
 * @example
 * setContent(td, 'plain text');
 * setContent(td, 'a <strong>bold</strong> text');
 * setContent(td, 1234);
 * setContent(td, document.createElement('span'));
 * setContent(td, [{ tag: 'a', attrs: { href: '#' }, content: 'link' }]);
 * setContent(td, null); // → cella vuota
 * setContent(td, 'Rossi &amp; Figli', true); // → testo "Rossi & Figli"
 */
export function setContent(el, content, asHtml = false) {

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

  if (!asHtml && !text.includes('<')) {
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
 * Esegue l'escape dei caratteri speciali HTML (`&`, `<`, `>`, `"`, `'`), così che il valore possa essere inserito
 * in un markup, anche all'interno di un attributo, senza essere interpretato.
 *
 * @param {*} value - Valore da convertire (convertito con `String()`)
 * @returns {string}
 *
 * @example
 * escapeHtml('<img src=x onerror="alert(1)">'); // → '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
 * escapeHtml('Rossi & Figli');                  // → 'Rossi &amp; Figli'
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => /** @type {Record<string, string>} */ ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'
  })[ch]);
}


/**
 * Indica se un valore è "vero" per le sezioni mustache (`[[#key]]`): sono falsi `null`, `undefined`, `false`, `''`,
 * `0`, `NaN` e gli array vuoti; ogni altro valore (compresa la stringa `'0'`) è vero.
 *
 * @param {*} value
 * @returns {boolean}
 *
 * @example
 * isMustacheTruthy([]);  // → false
 * isMustacheTruthy('0'); // → true
 */
export function isMustacheTruthy(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}


/** Segnaposti `[[…]]` di un template mustache. */
const MUSTACHE_TAG = /\[\[(.*?)\]\]/g;

/** Prefisso dei segnaposti icona (`[[@icon:nome classi]]`). */
const ICON_TAG_PREFIX = '@icon:';


/**
 * Analizza il contenuto di un segnaposto `[[…]]`.
 *
 * @param {string} raw - Testo tra `[[` e `]]`
 * @returns {{ kind: 'open'|'inverted'|'close'|'raw'|'icon'|'value', key: string }}
 */
function parseMustacheTag(raw) {
  const tag = raw.trim();

  if (tag.startsWith(ICON_TAG_PREFIX)) {
    return { kind: 'icon', key: tag.slice(ICON_TAG_PREFIX.length).trim() };
  }

  /** @type {Record<string, 'open'|'inverted'|'close'|'raw'>} */
  const sigils = { '#': 'open', '^': 'inverted', '/': 'close', '&': 'raw' };
  const kind = sigils[tag.charAt(0)];

  return kind ? { kind, key: tag.slice(1).trim() } : { kind: 'value', key: tag };
}


/**
 * Risolve un template in stile mustache con i valori di una riga (chiavi annidate ammesse):
 *
 * - `[[key]]`: valore con escape HTML (`&`, `<`, `>`, `"`, `'`)
 * - `[[& key]]`: valore così com'è, senza escape (da usare solo per markup affidabile)
 * - `[[#key]]…[[/key]]`: contenuto mostrato se il valore è vero, vedi `isMustacheTruthy`
 * - `[[^key]]…[[/key]]`: contenuto mostrato se il valore è falso (`null`, `undefined`, `false`, `''`, `0`, array vuoto)
 * - `[[@icon:nome classe1 classe2]]`: segnaposto `<span data-jt-icon="nome classe1 classe2"></span>`, da sostituire
 *   con l'icona dopo l'inserimento nel DOM (vedi `replaceIconPlaceholders` in `icons.js`)
 *
 * Le sezioni sono solo condizioni: non iterano sugli array e non cambiano il contesto (le chiavi si riferiscono sempre
 * alla riga). Sono ammesse sezioni annidate. I valori `null`/`undefined` vengono sostituiti con `nullAs`, inserito
 * senza escape (è configurazione, non un dato). Gli errori di struttura (sezioni non chiuse o chiuse male) non
 * interrompono la risoluzione e vengono segnalati da `checkMustache`.
 *
 * @param {string} tpl - Stringa del template
 * @param {Object} row - Oggetto riga
 * @param {string} [nullAs=''] - Sostituto dei valori null/undefined (default: '')
 * @returns {string} Markup risultante
 *
 * @example
 * resolveMustache('<a href="/users/[[id]]">[[name]]</a>', { id: 12, name: 'Mario & C.' });
 * // → '<a href="/users/12">Mario &amp; C.</a>'
 * resolveMustache('[[& html]]', { html: '<b>ok</b>' });               // → '<b>ok</b>'
 * resolveMustache('[[owner.name]]', { owner: null }, '—');            // → '—'
 * resolveMustache('[[#active]]sì[[/active]][[^active]]no[[/active]]', { active: 0 }); // → 'no'
 * resolveMustache('[[@icon:check text-success]]', {});
 * // → '<span data-jt-icon="check text-success"></span>'
 */
export function resolveMustache(tpl, row, nullAs = '') {

  let out = '';
  let last = 0;
  let visible = true;

  /** @type {Array<{ key: string, parentVisible: boolean }>} */
  const stack = [];

  for (const match of tpl.matchAll(MUSTACHE_TAG)) {

    if (visible) {
      out += tpl.slice(last, match.index);
    }
    last = /** @type {number} */ (match.index) + match[0].length;

    const { kind, key } = parseMustacheTag(match[1]);

    if (kind === 'open' || kind === 'inverted') {
      const truthy = isMustacheTruthy(getNestedValue(row, key));
      stack.push({ key, parentVisible: visible });
      visible = visible && (kind === 'open' ? truthy : !truthy);
      continue;
    }

    if (kind === 'close') {
      // chiude la sezione corrispondente (e quelle interne non chiuse); una chiusura senza apertura viene ignorata
      const idx = stack.findLastIndex(section => section.key === key);
      if (idx !== -1) {
        visible = stack[idx].parentVisible;
        stack.length = idx;
      }
      continue;
    }

    if (!visible) {
      continue;
    }

    if (kind === 'icon') {
      out += `<span data-jt-icon="${escapeHtml(key)}"></span>`;
      continue;
    }

    const value = getNestedValue(row, key);
    out += value == null ? nullAs : (kind === 'raw' ? String(value) : escapeHtml(value));
  }

  if (visible) {
    out += tpl.slice(last);
  }

  return out;
}


/**
 * Verifica la struttura delle sezioni di un template mustache (vedi `resolveMustache`) e restituisce la descrizione
 * degli errori: sezioni non chiuse, chiuse con una chiave diversa o chiusure senza apertura, segnaposti vuoti.
 * Viene usata una sola volta per colonna (vedi `parseCols`), così che gli avvisi non vengano ripetuti per ogni riga.
 *
 * @param {string} tpl - Stringa del template
 * @returns {string[]} Elenco degli errori (vuoto se il template è corretto)
 *
 * @example
 * checkMustache('[[#a]]x[[/a]]');  // → []
 * checkMustache('[[#a]]x');        // → ['sezione `a` non chiusa']
 * checkMustache('[[#a]]x[[/b]]');  // → ['chiusura `[[/b]]` senza sezione aperta corrispondente', 'sezione `a` non chiusa']
 */
export function checkMustache(tpl) {

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const stack = [];

  for (const match of tpl.matchAll(MUSTACHE_TAG)) {

    const { kind, key } = parseMustacheTag(match[1]);

    if (!key) {
      errors.push(`segnaposto \`${match[0]}\` senza chiave`);
      continue;
    }

    if (kind === 'open' || kind === 'inverted') {
      stack.push(key);

    } else if (kind === 'close') {
      const idx = stack.lastIndexOf(key);

      if (idx === -1) {
        errors.push(`chiusura \`${match[0]}\` senza sezione aperta corrispondente`);

      } else {
        stack.splice(idx).slice(1).forEach(inner => {
          errors.push(`sezione \`${inner}\` non chiusa prima di \`${match[0]}\``);
        });
      }
    }
  }

  stack.forEach(key => errors.push(`sezione \`${key}\` non chiusa`));

  return errors;
}
