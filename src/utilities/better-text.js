// @ts-check

/**
 * Improves a text string by fixing punctuation spacing, multiple spaces,
 * typographic quotes, non-breaking spaces after Italian particles/articles,
 * and optionally enforcing the exact casing of custom words.
 *
 * @param {string} str - input string to process
 * @param {string[]} custom_words - list of words whose exact casing must be preserved (e.g. `['iPhone', 'macOS']`)
 * @returns {string} processed string, or empty string if input is falsy
 */
export function betterText(str, custom_words = []) {

  const particelle = [
    'e', 'ed',
    'di', 'a', 'da', 'in', 'per', 'con', 'su', 'per', 'tra', 'fra',
    'il', 'lo', 'la', 'i', 'gli', 'le',
    'un', 'uno', 'una',
    'del', 'dello', 'della', 'dei', 'degli', 'delle',
    'al', 'allo', 'alla', 'ai', 'agli', 'alle',
    'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
    'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
    'col', 'collo', 'colla', 'con', 'coi', 'cogli', 'colle',
    'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',

    // topographic terms
    'C.so', 'Corso', 'Via', 'P.za', 'Piazza', 'L.go', 'Largo', 'V.le', 'Viale',
    'De', 'San', 'c/o', 'Loc.',

    // English
    'the', 'a', 'an', 'at', 'out', 'of',

    // words used in geonames
    'isola', 'isole'
  ];

  if(str) {
    str = str.trim();

    // punctuation: remove space before, ensure single space after
    // NOTE: must run before any HTML entity replacements to avoid conflicts with `;`
    // (?!$): negative lookahead to skip punctuation at end of string
    str = str.replace(/ +(,|;|\.|:|!|\?)/g, '$1');
    str = str.replace(/(,|;|\.|:|!|\?)(?!$) +/g, '$1 ');

    // collapse multiple spaces and tabs (including non-breaking spaces)
    str = str.replace(/[ \t\u00A0]+/g, ' ');

    // typographic quotes
    str = str.replace(/(^| )"/g, '$1“')   // opening double quotes
      .replace(/"/g, '”')                  // remaining double quotes → closing
      .replace(/(^| )'/g, '$1‘')           // opening single quotes
      .replace(/'/g, '’')                  // remaining single quotes and apostrophes
    ;

    // remove space after apostrophe preceded by elided articles (l', un', d', all', ...)
    str = str.replace(/((^| )(l|un|d|all|dell|nell|sull)('|')) /gi, '$1' );

    // replace regular spaces with non-breaking spaces after Italian particles/articles
    var re = new RegExp('\\b(' + particelle.join('|') + ')\\b +', 'gmi');
    str = str.replace(re, function (match) {
      return match.replace(/ +/g, '\u00A0');
    });

    // enforce exact casing of each particle
    particelle.forEach(term => {
      const re = new RegExp('\\b(' + term + ')\\b', 'gmi');
      str = str.replace(re, term);
    });

    if(custom_words.length) {
      custom_words.forEach(item => {
        str = str.replace(new RegExp(`\\b${item}\\b`, 'gi'), item);
      });
    }
  } else {
    str = '';
  }
  return str;
}
