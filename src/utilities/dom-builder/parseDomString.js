/**
 * Analizza una stringa per estrarre il nome del tag, l'ID, le classi e gli attributi.
 *
 * * Il formato della stringa atteso è:
 *
 * `tag#id.classe1.classe2.classeN(attributo1: valore1, attributo2=valore2) Lorem ipsum`
 *
 * In cui:
 * * `tag` è il nome dell'elemento, se non specificato si assume che sia un `div`
 * * `id` è l'id, facoltativo, da assegnare all'elemento, deve essere preeceduto da `#` e deve essere posizionato subito dopo il tag
 * * `classe1, classe2...` sono le classi, facoltative, devono essere precedute da `.`
 * * `(...)` è il blocco degli attributi, facoltativo. Oltre che dalle parentesi tonde, questa parte può essere delimitata dalle quadre e dalle graffe.
 *   Ogni coppia _nome-valore_ va separata con `:` o `=`. Se presente solo il nome, si assume che il valore sia `true`.
 * * `Lorem ipsum` indica un eventuale contenuto testuale, separato dal blocco precedente da uno spazio
 *
 * Restituisce un oggetto *child* domBuilder
 *
 * Esempio:
 * > p#main-info.info.active{data-id:123,role=button} text content
 *
 * oppure
 * > input#search-field[type=text,disabled]
 *
 * @param {string} domString La stringa DOM Builder da analizzare.
 * @returns {{tagName: string, id: string, classes: string[], attributes: {[key: string]: string}}}
 */

export function parseDomString(domString) {

  // versione con groups
  // const regex = new RegExp(
  //   /^(?<tag>[a-zA-Z]+)?/.source +                // tag
  //   /(?:#(?<id>[a-zA-Z0-9_-]+))?/.source +        // id
  //   /(?<classes>(?:\.[a-zA-Z0-9_-]+)*)?/.source + // classi
  //   /(?<attrs>[([{].*?[)\]}])?/.source +          // attrs
  //   /(?: +(?<content>.*))?$/.source               // content
  // );

  const regex = new RegExp(
    /^([a-zA-Z]+)?/.source +            // tag
    /(?:#([a-zA-Z0-9_-]+))?/.source +   // id
    /((?:\.[a-zA-Z0-9_-]+)*)?/.source + // classi
    /([([{].*?[)\]}])?/.source +        // attrs
    /(?: +(.*))?$/.source               // content
  );

  const matches = domString.match(regex);


  if (!matches) {
    return null;
  }

  // Nuovi gruppi di cattura (match array):
  // [0]: intera stringa
  // [1]: Tag
  // [2]: ID
  // [3]: Classi
  // [4]: Attributi (raw)
  // [5]: content

  const tag = (matches[1] || 'div').toLowerCase(),
    id = matches[2]?.trim() || null,
    classes = matches[3] ? matches[3].slice(1).split('.').map(c => c.trim()) : [],
    rawAttrs = matches[4]?.trim() || null,
    content =  matches[5]?.trim() || null
  ;

  // versione con uso di `groups`
  // const tag = (matches.groups.tag || 'div').toLowerCase(),
  //   id = matches.groups.id?.trim() || null,
  //   classes = matches.groups.classes? matches[3].slice(1).split('.').map(c => c.trim()) : [],
  //   rawAttrs = matches.groups.attrs?.trim() || null,
  //   content =  matches.groups.content?.trim() || null
  // ;

  const attrs = {};
  if (rawAttrs) {
    const attrsContent = rawAttrs.substring(1, rawAttrs.length - 1);
    const attrPairs = attrsContent.split(/\s*,\s*/);

    attrPairs.forEach(pair => {
      if (!pair) return;
      if (pair.includes('=') || pair.includes(':')) {
        const parts = pair.split(/[:=]/, 2),
          name = parts[0]?.trim(),
          value = parts[1] != null ? parts[1].trim() : true;

        attrs[name] = value;

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
