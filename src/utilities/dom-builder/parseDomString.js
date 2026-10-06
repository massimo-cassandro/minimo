// compilato una sola volta al caricamento del modulo, dato che il pattern non cambia tra le chiamate
const DOM_STRING_REGEX = new RegExp(
  /^([a-zA-Z][a-zA-Z0-9-]*)?/.source +    // tag (accetta anche i nomi dei web component)
  /((?:[#.][a-zA-Z0-9_-]+)*)?/.source +   // id e classi, in qualsiasi ordine
  /([([{].*?[)\]}])?/.source +            // attributi
  /(?: +(.*))?$/.source                   // contenuto
);

/**
 * Analizza una stringa per estrarne nome del tag, ID, classi e attributi.
 *
 * Formato atteso della stringa:
 *
 * `tag#id.class1.class2.classN(attr1: val1, attr2=val2) text content`
 *
 * Dove:
 * * `tag` è il nome dell'elemento; se omesso vale `div`
 * * `#id` è l'id opzionale dell'elemento, preceduto da `#`
 * * `.class1, .class2...` sono classi CSS opzionali, ciascuna preceduta da `.`
 * * i token `#id` e `.class` possono comparire in qualsiasi ordine e alternati (es. `.class1#id.class2`)
 * * `(...)` è il blocco opzionale degli attributi; si possono usare anche `[...]` o `{...}`.
 *   Ogni coppia nome–valore è separata da `:` o `=`. Un nome senza valore vale `true`.
 * * Il contenuto testuale segue dopo uno spazio
 *
 * Restituisce un oggetto figlio di domBuilder.
 *
 * Esempi:
 * > p#main-info.info.active{data-id:123,role=button} text content
 *
 * > input#search-field[type=text,disabled]
 *
 * @param {string} domString - La stringa domBuilder da analizzare.
 * @returns {{tag: string, id: string|null, className: string, attrs: Object<string, string|true>, content: string|null}|null}
 */
export function parseDomString(domString) {

  const matches = domString.match(DOM_STRING_REGEX);


  if (!matches) {
    return null;
  }

  // Indici dei gruppi di cattura:
  // [0]: corrispondenza completa
  // [1]: tag
  // [2]: id e classi (es. "#id.class1.class2" oppure ".class1#id.class2")
  // [3]: attributi grezzi
  // [4]: contenuto

  const idAndClasses = matches[2] || '',
    idMatch = idAndClasses.match(/#([a-zA-Z0-9_-]+)/),
    classMatches = [...idAndClasses.matchAll(/\.([a-zA-Z0-9_-]+)/g)];

  const tag = (matches[1] || 'div').toLowerCase(),
    id = idMatch?.[1] || null,
    classes = classMatches.map(m => m[1]),
    rawAttrs = matches[3]?.trim() || null,
    content =  matches[4]?.trim() || null
  ;

  /** @type {Record<string, string | true>} */
  const attrs = {};
  if (rawAttrs) {
    const attrsContent = rawAttrs.substring(1, rawAttrs.length - 1);
    const attrPairs = attrsContent.split(/\s*,\s*/);

    attrPairs.forEach(pair => {
      if (!pair) return;
      if (pair.includes('=') || pair.includes(':')) {
        const parts = pair.split(/[:=]/, 2),
          name = parts[0]?.trim() ?? '',
          value = parts[1] != null ? parts[1].trim() : true;

        if (name) {
          attrs[name] = value;
        }

      } else {

        attrs[pair.trim()] = true;
      }
    });
  }

  return {
    tag: tag,
    id: id,
    className: classes?.join(' '),
    attrs: attrs,
    content: content
  };
}
