/*! minimo - DOM Builder */
import { domBuilderBasicSetup } from './domBuilderBasicSetup.js';
import { parseDomString } from './parseDomString.js';
import { createDomElement, normalizeNamespace } from './resolveNamespace.js';

// TODO sintassi stringa multi-riga in cui ogni riga corrisponde a un elemento
// TODO come sopra, con nidificazione opzionale tramite indentazione

/**
 * @typedef {Object} DomBuilderItem
 * @property {string | string[]} [tag='div'] - Nome del tag o array di tag annidati (ciascuno è il genitore del successivo). Anche `tagName`. La grafia viene conservata, necessaria per i tag SVG come `linearGradient` (default: 'div')
 * @property {string | string[]} [tagName='div'] - Alias di `tag` (default: 'div')
 * @property {string | string[]} [className] - Classe/i CSS: una singola stringa o un array (i valori falsy vengono scartati).
 * @property {string | string[]} [class] - Alias di `className`.
 * @property {string | string[]} [classname] - Alias di `className`.
 * @property {string | null} [id] - ID univoco dell'elemento.
 * @property {[string, *] | [string, *][] | Object<string, *>} [attrs] - Attributi: una coppia `[name, value]`, un array di coppie o un oggetto `{name: value}`.
 * @property {string | number | Function | Node | DomBuilderItem[] | null} [content] - Contenuto dell'elemento.
 *   Una stringa o un numero viene impostato come testo semplice (`textContent`), a meno che contenga `<`:
 *   in tal caso viene trattato come markup, sanificato e inserito tramite la Sanitizer API nativa
 *   (`Element.setHTML`) dove supportata, con ripiego su `innerHTML` grezzo nei browser che non la hanno.
 *   Un `Node` (un `Element`, un `DocumentFragment`, ...) viene aggiunto così com'è, direttamente o
 *   restituito da una funzione.
 *   Il markup viene letto nel contesto dell'elemento: dentro un `svg` diventa SVG. Attenzione: la Sanitizer API
 *   rimuove `<use>` anche con `sanitizer: {}` (fa parte della baseline di sicurezza del browser), quindi per le
 *   icone SVG va usata la sintassi a oggetto (`{ tag: 'use', attrs: { href: '...' } }`), oppure `sanitizeContent: false`.
 * @property {boolean} [sanitizeContent=true] - Se false, il `content` stringa con markup viene inserito con `innerHTML`
 *   senza sanificazione (conserva anche `<use>`). Da usare solo con contenuto sicuro: gli `<script>` inseriti non vengono
 *   eseguiti, ma gli attributi di evento (`onerror`, `onload`, ...) sì. Vale solo per l'elemento su cui è impostato,
 *   non viene ereditato dai figli (default: true)
 * @property {'html' | 'svg' | 'math' | string} [namespace] - Namespace dell'elemento: un alias (`'html'`, `'svg'`, `'math'`)
 *   o un URI completo. Se presente ha la precedenza sulla risoluzione automatica; i figli lo ereditano tramite il
 *   namespace del genitore. Con `tag` array si applica al primo elemento della catena (gli altri lo ereditano).
 *   Un valore non valido produce un `console.error` e l'elemento viene creato in HTML.
 *   Non disponibile nella sintassi abbreviata a stringa (default: assente, risoluzione automatica)
 * @property {string | number} [text] - Scorciatoia per un nodo di testo letterale: inserisce un nodo `Text` semplice (mai
 *   interpretato come markup) al posto di un elemento, così da poter essere fratello dei tag negli array
 *   `children`/`content`. Mutuamente esclusivo con `tag`/`content`/`children`: quando è impostato (e `tag` è assente),
 *   ogni altra proprietà tranne `condition` e `callback` viene ignorata.
 * @property {boolean} [condition=true] - Se false, l'elemento (o il nodo di testo) viene saltato (default: true)
 * @property {((el: Element|Text) => void) | null} [callback] - Callback invocata dopo la creazione dell'elemento (o del nodo di testo).
 * @property {Array<DomBuilderItem|string|Node>} [children] - Array di configurazione degli elementi figli. Accetta stringhe (scorciatoia secondo `parseDomString`), oggetti di configurazione e/o `Node` (un `Element`, un `DocumentFragment`, ...) inseriti così come sono.
 */

/**
 * domBuilder
 * Costruisce una struttura DOM a partire da un array di configurazione.
 *
 * Analizza un array di oggetti di configurazione per creare elementi HTML.
 *
 * **Formato della struttura di configurazione (structureArray):**
 *
 * ```javascript
 * structure = [
 *   '#mainContainer.container',
 *   'p#main-info.info.active{data-id:123,role=button} Lorem ipsum',
 *   {
 *     tag: 'div' | ['.divClass', 'h2#id', 'table.class1', 'thead', 'tr.class2.class3(attr1: attrValue)'], // anche tagName
 *     className: 'xxx' | ['class1', 'class2'], // anche `class`
 *     id: 'element-id',
 *     attrs: [attr_name, attr_value] | [[...], [...]] | {name: value},
 *     content: 'xxx' | 'xxx <strong>yyy</strong>' | 123 | domBuilder Array | function | Node, // vedi DomBuilderItem.content sopra
 *     condition: true | false,
 *     callback: el => ...,
 *     children: [...]
 *   },
 *   'div.class[data-xxx: value]',
 *   '.another-div',
 *   'p#paragraph',
 *   '...',
 *   { ... }
 * ]
 * ```
 *
 * Per mescolare testo letterale e tag come fratelli nello stesso elemento (es. `Lorem <strong>ipsum</strong> dolor`),
 * usare la scorciatoia `text` in `children`/`content`, dato che una semplice stringa viene sempre interpretata come tag
 * (vedi `parseDomString`), mai come nodo di testo:
 *
 * ```javascript
 * children: [
 *   { text: 'Lorem ' },
 *   { tag: 'strong', content: 'ipsum' },
 *   { text: ' dolor' }
 * ]
 * ```
 *
 * ID e classi possono essere indicati come chiavi di primo livello dell'oggetto oppure dentro l'oggetto `attrs`.
 * Quando sono presenti entrambi, le proprietà di primo livello hanno la precedenza.
 *
 * È disponibile anche una sintassi abbreviata a stringa, costruita secondo le convenzioni di `parseDomString`.
 * Vedi `parseDomString` per i dettagli.
 *
 * La sintassi abbreviata non supporta `content`, `callback`, `condition` o `children`; per questi usare la sintassi a oggetto.
 *
 * La sintassi abbreviata può essere usata anche per la proprietà `tag` nella sintassi a oggetto.
 * Quando `tag` è un array, ogni elemento diventa il genitore del successivo. Tutte le altre proprietà dell'oggetto
 * (className, callback, ecc.) vengono applicate solo all'ultimo elemento dell'array.
 * Quando la stringa abbreviata e le proprietà a livello di oggetto sono in conflitto (classi, id o attributi),
 * le proprietà a livello di oggetto hanno la precedenza.
 *
 * **Namespace (SVG / MathML)**
 *
 * Gli elementi vengono creati nel namespace corretto, così che SVG e MathML vengano disegnati dal browser.
 * Per ogni elemento, nell'ordine:
 * 1. `item.namespace`, se presente;
 * 2. `svg` usa sempre il namespace SVG e `math` sempre quello MathML, qualunque sia il genitore;
 * 3. gli altri elementi prendono il namespace del genitore effettivo (nessuna lista di tag: `a`, `title`, `script`,
 *    `style` esistono sia in HTML sia in SVG e conta solo il contesto), tranne nei punti che riportano all'HTML:
 *    figli di `foreignObject`, figli di `mi`/`mo`/`mn`/`ms`/`mtext` (tranne `mglyph` e `malignmark`) e figli di
 *    `annotation-xml` con `encoding` `text/html` o `application/xhtml+xml`;
 * 4. senza genitore, `options.namespace` se presente, altrimenti HTML.
 *
 * Il genitore effettivo è `parent` (con `insertMode` `before`/`after` è `parent.parentNode`), l'elemento precedente
 * nella catena `tag: [...]` e l'elemento stesso per `children` e `content` array.
 * Gli elementi HTML vengono creati con `document.createElement`, gli altri con `document.createElementNS`.
 * La sintassi abbreviata a stringa non supporta `namespace`: usa solo la risoluzione automatica.
 *
 * @function domBuilder
 * @param {Array<DomBuilderItem|string|Node>} [structureArray=[]] - Array di configurazione. Accetta stringhe (scorciatoia secondo `parseDomString`), oggetti di configurazione e/o `Node` (un `Element`, un `DocumentFragment`, ...) inseriti così come sono; ogni oggetto di configurazione supporta:
 * - `tag` / `tagName` {string | string[]} - Nome del tag HTML, o array di tag annidati (ciascuno è il genitore del successivo). Default `'div'`.
 * - `className` / `class` / `classname` {string | string[]} - Classe/i CSS: una singola stringa o un array (i valori falsy vengono scartati).
 * - `id` {string | null} - ID univoco dell'elemento.
 * - `attrs` {[string, *] | [string, *][] | Object<string, *>} - Attributi: una coppia `[name, value]`, un array di coppie o un oggetto `{name: value}`.
 * - `content` {string | number | Function | Node | DomBuilderItem[] | null} - Contenuto dell'elemento. Una stringa/numero viene impostato come `textContent`, a meno che contenga `<`: in tal caso viene sanificato e inserito come markup (`Element.setHTML`, con ripiego su `innerHTML`). Un `Node` (`Element`, `DocumentFragment`, ...), passato direttamente o restituito da una funzione, viene aggiunto così com'è.
 * - `sanitizeContent` {boolean} - Se false, il markup di `content` viene inserito con `innerHTML` senza sanificazione (solo con contenuto sicuro; non ereditato dai figli). Default `true`.
 * - `namespace` {'html' | 'svg' | 'math' | string} - Namespace esplicito (alias o URI completo), con precedenza sulla risoluzione automatica; ereditato dai figli. Default: assente (risoluzione automatica).
 * - `text` {string | number} - Scorciatoia per un nodo di testo letterale: inserisce un nodo `Text` semplice (mai interpretato come markup) come fratello degli altri elementi, al posto di un elemento. Mutuamente esclusivo con `tag`/`content`/`children`.
 * - `condition` {boolean} - Se false, l'elemento (o il nodo di testo) viene saltato. Default `true`.
 * - `callback` {(function(HTMLElement|Text): void) | null} - Invocata dopo la creazione dell'elemento (o del nodo di testo).
 * - `children` {Array<DomBuilderItem|string|Node>} - Array di configurazione degli elementi figli (stesso formato, annidato; accetta anche `Node` inseriti così come sono).
 *
 * ID e classi possono essere indicati come chiavi di primo livello dell'oggetto o dentro `attrs`; le proprietà di primo livello hanno la precedenza (default: [])
 * @param {Element | null} [parent] - Elemento genitore a cui viene agganciata la struttura (vedi `options.insertMode`).
 * @param {Object} [options={}] - Opzioni di configurazione (default: {})
 * @param {boolean} [options.emptyParent=false] - Se true, l'elemento genitore viene svuotato prima della costruzione (default: false)
 * @param {'append'|'prepend'|'before'|'after'} [options.insertMode='append'] - Come ogni elemento radice di `structureArray` viene agganciato a `parent`: `append` lo inserisce come ultimo figlio (default), `prepend` come primo figlio, `before`/`after` lo inseriscono come fratello precedente/successivo di `parent`. In ogni modalità l'ordine di `structureArray` viene mantenuto. Si applica solo agli elementi prodotti da questa chiamata — le chiamate annidate a `domBuilder` (`content`, `children`) fanno sempre append (default: 'append')
 * @param {boolean} [options.debug=false] - Se true, scrive `structureArray` in console dopo che ogni elemento stringa è stato analizzato con `parseDomString` (cioè l'array elaborato effettivamente usato per costruire il DOM) (default: false)
 * @param {'html'|'svg'|'math'|string} [options.namespace] - Namespace iniziale (alias o URI completo) usato quando manca il genitore effettivo, ad esempio per costruire più fratelli SVG senza genitore. Non si applica quando il genitore c'è, né agli elementi `svg`/`math` o con `namespace` esplicito (default: assente, cioè HTML)
 * @returns {HTMLElement|null} Il primo elemento creato, oppure null se non è stato creato nulla. Il tipo dichiarato è `HTMLElement` per comodità, ma per gli elementi SVG o MathML il valore restituito è un `SVGElement` o un `MathMLElement`.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * domBuilder([ // array di configurazione, FAC
 *   {
 *     tag: 'div', // tag o array di tag annidati (alias `tagName`), FAC
 *     className: undefined, // classe/i (alias `class`, `classname`), FAC
 *     id: undefined, // id dell'elemento, FAC
 *     attrs: undefined, // attributi: coppia, array di coppie o oggetto, FAC
 *     content: undefined, // testo, markup, Node, funzione o array domBuilder, FAC
 *     sanitizeContent: true, // sanifica il markup di `content`, FAC
 *     namespace: undefined, // 'html' | 'svg' | 'math' | URI (default: automatico), FAC
 *     text: undefined, // nodo di testo letterale al posto dell'elemento, FAC
 *     condition: true, // se false l'elemento viene saltato, FAC
 *     callback: undefined, // callback(el) dopo la creazione, FAC
 *     children: undefined, // array di configurazione dei figli, FAC
 *   }
 * ], parent, { // elemento genitore, FAC
 *   emptyParent: false, // svuota il genitore prima della costruzione, FAC
 *   insertMode: 'append', // 'append' | 'prepend' | 'before' | 'after', FAC
 *   debug: false, // log in console dell'array elaborato, FAC
 *   namespace: undefined, // namespace iniziale senza genitore (default: HTML), FAC
 * });
 *
 * @example
 * // icona SVG con `use`: `svg` è sempre nel namespace SVG, `title` e `use` lo ereditano
 * domBuilder([{
 *   tag: 'svg',
 *   className: 'icon',
 *   children: [
 *     { tag: 'title', content: 'Carica' },
 *     { tag: 'use', attrs: { href: 'icons.svg#cloud' } }
 *   ]
 * }], container);
 *
 * @example
 * // frammento SVG senza genitore e senza `svg` come radice
 * const use = domBuilder([{ tag: 'use', namespace: 'svg', attrs: { href: 'icons.svg#cloud' } }]);
 *
 * // più fratelli SVG senza genitore
 * domBuilder(['path.a', 'circle.b'], null, { namespace: 'svg' });
 */


export function domBuilder(/** @type {Array<DomBuilderItem|string|Node>} */ structureArray = [], parent, options = {}) {

  options = {
    emptyParent: false,
    insertMode: 'append',
    debug: false,
    ...options
  };

  if(parent && options.emptyParent) {
    parent.innerHTML = '';
  }

  /*
    Per le modalità di inserimento 'append'/'prepend', i fratelli di primo livello vengono accumulati in un
    DocumentFragment e agganciati a `parent` con un solo appendChild/insertBefore alla
    fine, invece di una chiamata per fratello. Le modalità 'before'/'after' richiedono che `target` resti
    il vero nodo genitore attivo per tutto il ciclo per la risoluzione dell'ancora (vedi afterAnchors
    più sotto), quindi per queste il raggruppamento viene saltato.
  */
  const useFragment = !!parent && (options.insertMode === 'append' || options.insertMode === 'prepend');

  /** @type {Element | DocumentFragment | null} */
  let target = useFragment ? document.createDocumentFragment() : (parent ?? null);

  /*
    Genitore effettivo degli elementi radice, usato per risolverne il namespace: non `target`, che può essere
    il DocumentFragment di raggruppamento (privo di namespace), ma `parent`, oppure il suo genitore con
    `before`/`after`, dove gli elementi diventano fratelli di `parent`
  */
  const rootParent = !parent ? null
    : (options.insertMode === 'before' || options.insertMode === 'after') ? parent.parentNode : parent;

  // namespace iniziale in assenza di genitore effettivo
  const fallbackNs = normalizeNamespace(options.namespace, 'options.namespace');

  /** @type {Map<Element | DocumentFragment, Node>} tiene traccia, per `insertMode: 'after'`, dell'ultimo fratello inserito per ogni nodo genitore */
  const afterAnchors = new Map();

  /** @type {HTMLElement | null} */
  let mainElement = null;
  /** @type {HTMLElement} */
  let el;

  /** @type {Array<DomBuilderItem|null>} */
  const elaboratedStructureArray = [];

  structureArray.forEach(inputItem => {

    // Un Node DOM (Element, DocumentFragment, ...) passato direttamente: inserito così com'è,
    // saltando del tutto la creazione dell'elemento e l'analisi della configurazione.
    if (inputItem instanceof Node) {

      elaboratedStructureArray.push(/** @type {DomBuilderItem} */ (/** @type {unknown} */ (inputItem)));

      if (target) {
        if (options.insertMode === 'before') {
          const anchor = /** @type {HTMLElement} */ (target);
          anchor.parentNode?.insertBefore(inputItem, anchor);

        } else if (options.insertMode === 'after') {
          const anchor = afterAnchors.get(/** @type {HTMLElement} */ (target)) ?? /** @type {HTMLElement} */ (target);
          anchor.parentNode?.insertBefore(inputItem, anchor.nextSibling);
          afterAnchors.set(/** @type {HTMLElement} */ (target), inputItem);

        } else {
          target.appendChild(inputItem);
        }
      }

      if (mainElement == null && inputItem instanceof Element) {
        mainElement = /** @type {HTMLElement} */ (inputItem);
      }

      return;
    }

    /** @type {DomBuilderItem | null} */
    let item;
    if (inputItem != null && typeof inputItem === 'string' && inputItem !== '') {
      item = parseDomString(inputItem);
    } else {
      item = /** @type {DomBuilderItem} */ (inputItem);
    }

    elaboratedStructureArray.push(item);

    if (item != null && (item.condition ?? true)) {

      const safeItem = item; // binding const così che TypeScript tracci il tipo non nullo nelle closure annidate

      // scorciatoia `{ text: '...' }`: un nodo Text letterale, mai interpretato come markup, inserito
      // al posto di un elemento così da poter essere fratello dei tag negli array `children`/`content`
      if (safeItem.tag == null && (typeof safeItem.text === 'string' || typeof safeItem.text === 'number')) {

        const textNode = document.createTextNode(String(safeItem.text));

        if (target) {
          if (options.insertMode === 'before') {
            const anchor = /** @type {HTMLElement} */ (target);
            anchor.parentNode?.insertBefore(textNode, anchor);

          } else if (options.insertMode === 'after') {
            const anchor = afterAnchors.get(/** @type {HTMLElement} */ (target)) ?? /** @type {HTMLElement} */ (target);
            anchor.parentNode?.insertBefore(textNode, anchor.nextSibling);
            afterAnchors.set(/** @type {HTMLElement} */ (target), textNode);

          } else {
            target.appendChild(textNode);
          }
        }

        if (safeItem.callback && typeof safeItem.callback === 'function') {
          safeItem.callback(textNode);
        }

        return;
      }

      // namespace esplicito dell'elemento (con `tag` array, del primo elemento della catena)
      const itemNs = normalizeNamespace(safeItem.namespace, 'item.namespace');

      /*
        Con `tag` array: primo elemento della catena (inserito in `target` secondo `insertMode` al posto di `el`)
        ed elemento che deve contenere `el`
      */
      /** @type {Element | null} */
      let chainRoot = null;
      /** @type {Element | null} */
      let chainParent = null;

      // quando tag è un array, crea una serie di elementi annidati;
      // l'ultimo riceve le restanti proprietà dell'oggetto
      if (Array.isArray(safeItem.tag)) {

        const tags = /** @type {string[]} */ (safeItem.tag);

        tags.forEach((tagItem, idx) => {

          const isLast = idx === tags.length - 1;
          const parsedItem = parseDomString(tagItem) ?? { tag: 'div', id: undefined, className: '', attrs: {}, content: undefined };

          // per l'ultimo elemento, unisce con le opzioni proprie dell'oggetto; le proprietà a livello di oggetto hanno la precedenza
          if(isLast) {
            safeItem.attrs = {...parsedItem.attrs ?? {}, ...safeItem.attrs ?? {}};
          }
          el = domBuilderBasicSetup(
            /** @type {HTMLElement} */ (createDomElement(
              parsedItem.tag || 'div',
              idx === 0 ? rootParent : chainParent,
              idx === 0 ? itemNs : null,
              fallbackNs
            )),
            {...parsedItem, ...(isLast ? safeItem : {})}
          );

          if (!isLast) { // l'ultimo elemento viene gestito dal percorso standard qui sotto
            if (chainParent) {
              chainParent.appendChild(el);
            } else {
              chainRoot = el;
            }
            chainParent = el;
          }

        });

      } else {
        el = domBuilderBasicSetup(
          /** @type {HTMLElement} */ (createDomElement(
            /** @type {string} */ (safeItem.tag) ?? 'div',
            rootParent,
            itemNs,
            fallbackNs
          )),
          safeItem
        );
      }


      if (safeItem.content != null) {

        if (Array.isArray(safeItem.content)) {
          // costruisce direttamente dentro `el` (invece di non passare alcun genitore) così che ogni elemento
          // dell'array venga effettivamente inserito, non solo il primo restituito come `mainElement`
          domBuilder(safeItem.content, el);

        } else {

          /** @type {string | Node | null} */
          let content = null;
          if (typeof safeItem.content === 'function') {
            content = safeItem.content();

          } else if (safeItem.content instanceof Node) {
            content = safeItem.content;

          } else if (safeItem.content != null) {
            content = String(safeItem.content);
          }

          if (content instanceof Node) {
            // Element, DocumentFragment, Text, ... aggiunti così come sono (i figli di un
            // DocumentFragment vengono spostati dentro `el`, svuotando il fragment, come da comportamento nativo del DOM)
            el.appendChild(content);

          } else if (content != null) {

            if (!content.includes('<')) {
              // testo semplice: non serve il parsing HTML, textContent è più veloce e sicuro per costruzione
              el.textContent = content;

            } else if (safeItem.sanitizeContent === false) {
              // sanificazione disattivata esplicitamente: contenuto ritenuto sicuro (es. SVG con <use>)
              el.innerHTML = content;

            } else if (typeof el.setHTML === 'function') {
              /* markup: sanifica tramite la Sanitizer API nativa, eliminando <script>, attributi
                 di gestione eventi, URL javascript:, ecc. pur consentendo i tag di formattazione innocui
                 (<strong>, <em>, <a>, ...).
                 La configurazione vuota del sanitizer mantiene ogni elemento/attributo che non rientra nella
                 baseline non sicura integrata: senza di essa la configurazione predefinita del browser rimuove anche
                 gli attributi `class`, `id`, `style` e `data-*` (osservato in Chrome 152), rompendo qualsiasi
                 stringa di markup che si affidi alle classi CSS */
              el.setHTML(content, { sanitizer: {} });

            } else {
              // Sanitizer API non supportata da questo browser: ripiega sul comportamento storico,
              // non sanificato
              el.innerHTML = content;
            }
          }
        }
      }


      if (safeItem.children != null && !Array.isArray(safeItem.children)) {
        // eslint-disable-next-line no-console
        console.error('[domBuilder]: `item.children` must be an array → ' + safeItem.children);
      }
      if (safeItem.children && Array.isArray(safeItem.children)) {
        domBuilder(safeItem.children, el, {emptyParent: false});
      }

      if (mainElement == null) {
        mainElement = el;
      }

      // con `tag` array, `el` va dentro la catena e in `target` viene inserito il primo elemento della catena
      if (chainParent) {
        chainParent.appendChild(el);
      }
      const rootNode = chainRoot ?? el;

      if (target) {
        if (options.insertMode === 'before') {
          const anchor = /** @type {HTMLElement} */ (target);
          anchor.parentNode?.insertBefore(rootNode, anchor);

        } else if (options.insertMode === 'after') {
          const anchor = afterAnchors.get(/** @type {HTMLElement} */ (target)) ?? /** @type {HTMLElement} */ (target);
          anchor.parentNode?.insertBefore(rootNode, anchor.nextSibling);
          afterAnchors.set(/** @type {HTMLElement} */ (target), rootNode);

        } else {
          target.appendChild(rootNode);
        }
      }

      // TODO le callback che agiscono sui figli dell'elemento potrebbero non essere eseguite quando non è impostato alcun parent
      if (safeItem.callback && typeof safeItem.callback === 'function') {
        safeItem.callback(el);
      }
    }

  });

  if (options.debug) {
    // eslint-disable-next-line no-console
    console.log('[domBuilder] structureArray:', elaboratedStructureArray);
  }

  if (useFragment && parent && target) {
    if (options.insertMode === 'prepend') {
      parent.insertBefore(target, parent.firstChild);
    } else {
      parent.appendChild(target);
    }
  }

  return mainElement;
}
