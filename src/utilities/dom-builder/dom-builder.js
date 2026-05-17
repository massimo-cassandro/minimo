import { domBuilderBasicSetup } from './domBuilderBasicSetup.js';
import { parseDomString } from './parseDomString.js';

// TODO sintassi stringa su più righe in cui ogni riga corrisponde ad un elemento
// TODO sintassi stringa come il precedente, ma con possibilità di indicare una nidificazione (indent?)

/**
 * domBuilder
 * Costruisce una struttura DOM a partire da un array di configurazione.
 *
 * La funzione analizza un array di oggetti di configurazione per creare elementi HTML.
 *
 * **Formato della Struttura di Configurazione (structureArray):**
 *
 * L'array `structureArray` può contenere stringhe (con sintassi abbreviata) e/o oggetti di configurazione:
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
 *     content: 'xxx' | 123 | function | Element,
 *     condition: true | false,
 *     callback: el => ...,
 *     children: [...]
 *   },
 *   'div.class[data-xxx: value]',
 *   '.another-div',
 *   'p#paragraph''
 *   '...',
 *   { ... }
 * ]
 * ```
 *
 * id e classi possono essere specificati sia chiave dell'oggetto di configurazione che all'interno dell'oggetto `attrs`
 * In caso di conflitto, prevalgono quelli indicati al livello principale.
 *
 * È inoltre possibile utilizzare una versione "abbreviata" utilizzando una stringa costruita secondo la sintassi di `parseDomString`.
 * Vedi `parseDomString` per altre in.formazioni.
 *
 * Questo tipo di sintassi non prevede la possibilità di definire `content`, `callback`, `condition` e `children`: in questi casi è necessario utilizzare la sintassi di base.
 *
 * La sintassi abbreviata può essere utilizzata anche con l'elemento `tag` della sintassi ad oggetti.
 * È possibile definirlo come array in cui ogni elemento corrisponde al genitore del successivo. Eventuali altre proprietà dell'oggetto
 * (className, callback, ecc.) vengono applicate solo all'ultimo elemento dell'array.
 * In caso di conflitto tra classi, id o attributi indicati nella stringa e quelli indicati nell'oggetto
 * prevalgono questi ultimi.
 *
 * @function domBuilder
 * @param {Array<Object|string>} [structureArray=[]] - Array di configurazione degli elementi. Può contenere stringhe (con sintassi abbreviata secondo `parseDomString`) e/o oggetti di configurazione.
 * @param {string|Array<string>} [structureArray[].tag='div'] - Nome del tag HTML (es. 'div', 'p') o array di tag nidificati (es. ['div.container', 'section', 'article']).
 * @param {string|Array<string>} [structureArray[].tagName='div'] - Alias di tag
 * @param {string|Array<string>} [structureArray[].className] - Classe/i CSS: stringa singola o array di classi, in quest'ultimo caso, i valori *falsy* vengopno rimossi.
 * @param {string|Array<string>} [structureArray[].class] - Alias di className.
 * @param {string} [structureArray[].id] - ID univoco dell'elemento.
 * @param {Array<[string, *]>|Array<Array<[string, *]>>|Object<string, *>} [structureArray[].attrs] - Attributi: coppia `[name, value]`, array di coppie o oggetto `{name: value}`.
 * @param {string|number|Function|Element} [structureArray[].content] - Contenuto dell'elemento: stringa, numero, funzione che restituisce contenuto, o HTMLElement.
 * @param {boolean} [structureArray[].condition=true] - Se false, l'elemento non viene generato.
 * @param {Function} [structureArray[].callback] - Callback invocata quando l'elemento viene creato; riceve l'elemento come argomento.
 * @param {Array<Object>} [structureArray[].children] - Array di configurazione per elementi figlio.
 * @param {HTMLElement} [parent] - Elemento genitore al quale appendere la struttura.
 * @param {Object} [options={}] - Opzioni di configurazione.
 * @param {boolean} [options.emptyParent=true] - Se true, l'element parent indicato viene svuotato prima di procedere con ciclo builder
 * @returns {HTMLElement|null} Il primo elemento creato, o null se nessun elemento è stato creato.
 */


export function domBuilder(structureArray = [], parent, options = {}) {

  options = {
    emptyParent: false,
    ...options
  };

  let mainElement = null, el, grand_parent = null;

  if(parent && options.emptyParent) {
    parent.innerHTML = '';
  }

  structureArray.forEach(item => {

    if(item != null && typeof item === 'string' && item !== '') {
      item = parseDomString(item);
    }

    // console.log(item);

    if (item != null && (item.condition ?? true)) {


      // se tag è un array, vengono creati una serie di elementi nidificati
      // l'ultimo è quello a cui vengono applicate le altre proprietà dell'oggetto in esame
      if (Array.isArray(item.tag)) {

        grand_parent = parent;

        item.tag.forEach((tagItem, idx) => {

          const isLast = idx === item.tag.length - 1;
          const parsedItem = parseDomString(tagItem);

          // nel caso dell'ultimo elemento, merge con le opzioni dell'oggetto
          // con precedenza alle proprietà di quest'ultimo
          if(isLast) {
            item.attrs = {...parsedItem.attrs??{}, ...item.attrs??{}};
          }
          el = domBuilderBasicSetup(
            document.createElement(parsedItem.tag || 'div'),
            {...parsedItem, ...(isLast? item??{} : {})}
          );

          if (!isLast) { // l'ultimo elemento è gestito dalla procedura "standard"
            if (parent) {
              parent.appendChild(el);
            }
            parent = el;
          }

        });

      } else {
        el = domBuilderBasicSetup(
          document.createElement(item.tag ?? 'div'),
          item
        );
      }


      if (item.content != null) {

        let content = '';
        if (typeof item.content === 'function') {
          content = item.content();

        } else if (item.content != null) {
          content = String(item.content);
        }

        if (content instanceof Element) {
          el.appendChild(content);

        } else {
          el.innerHTML = content;
        }
      }


      if (item.children != null && !Array.isArray(item.children)) {
        // eslint-disable-next-line no-console
        console.error('Error: `item.children` must be an array → ' + item.children);
      }
      if (item.children && Array.isArray(item.children)) {
        domBuilder(item.children, el, {emptyParent: false});
      }

      if (mainElement == null) {
        mainElement = el;
      }

      if (parent) {
        parent.appendChild(el);
      }

      // TODO callback che includano azioni relatuvi ai children dell'elemento potrebbero bìnon essere eseguiti in assenza di parent
      if (item.callback && typeof item.callback === 'function') {
        item.callback(el);
      }

      if (grand_parent) {
        parent = grand_parent;
      }
    } // end if ((item.condition ?? true) && item != null)

  }); // end forEach

  return mainElement;
}


