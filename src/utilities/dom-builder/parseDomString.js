/**
 * Parses a string to extract tag name, ID, classes, and attributes.
 *
 * Expected string format:
 *
 * `tag#id.class1.class2.classN(attr1: val1, attr2=val2) text content`
 *
 * Where:
 * * `tag` is the element name; defaults to `div` if omitted
 * * `#id` is the optional element id; must immediately follow the tag
 * * `.class1, .class2...` are optional CSS classes, each preceded by `.`
 * * `(...)` is the optional attribute block; can also use `[...]` or `{...}`.
 *   Each name–value pair is separated by `:` or `=`. A bare name (no value) defaults to `true`.
 * * Text content follows after a space
 *
 * Returns a domBuilder child object.
 *
 * Examples:
 * > p#main-info.info.active{data-id:123,role=button} text content
 *
 * > input#search-field[type=text,disabled]
 *
 * @param {string} domString - The domBuilder string to parse.
 * @returns {{tag: string, id: string|null, className: string, attrs: Object<string, string|true>, content: string|null}|null}
 */

export function parseDomString(domString) {

  // version using named capture groups (kept for reference)
  // const regex = new RegExp(
  //   /^(?<tag>[a-zA-Z][a-zA-Z0-9-]*)?/.source +    // tag
  //   /(?:#(?<id>[a-zA-Z0-9_-]+))?/.source +        // id
  //   /(?<classes>(?:\.[a-zA-Z0-9_-]+)*)?/.source + // classes
  //   /(?<attrs>[([{].*?[)\]}])?/.source +          // attrs
  //   /(?: +(?<content>.*))?$/.source               // content
  // );


// FIX: does not work when id follows classes: <TAG>.<CLASS>#<ID>; id must precede classes

  const regex = new RegExp(
    /^([a-zA-Z][a-zA-Z0-9-]*)?/.source +  // tag (also accepts web component names)
    /(?:#([a-zA-Z0-9_-]+))?/.source +     // id
    /((?:\.[a-zA-Z0-9_-]+)*)?/.source +   // classes
    /([([{].*?[)\]}])?/.source +          // attrs
    /(?: +(.*))?$/.source                 // content
  );

  const matches = domString.match(regex);


  if (!matches) {
    return null;
  }

  // Capture group indices:
  // [0]: full match
  // [1]: tag
  // [2]: id
  // [3]: classes
  // [4]: raw attributes
  // [5]: content

  const tag = (matches[1] || 'div').toLowerCase(),
    id = matches[2]?.trim() || null,
    classes = matches[3] ? matches[3].slice(1).split('.').map(c => c.trim()) : [],
    rawAttrs = matches[4]?.trim() || null,
    content =  matches[5]?.trim() || null
  ;

  // version using named capture groups (kept for reference)
  // const tag = (matches.groups.tag || 'div').toLowerCase(),
  //   id = matches.groups.id?.trim() || null,
  //   classes = matches.groups.classes? matches[3].slice(1).split('.').map(c => c.trim()) : [],
  //   rawAttrs = matches.groups.attrs?.trim() || null,
  //   content =  matches.groups.content?.trim() || null
  // ;

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
