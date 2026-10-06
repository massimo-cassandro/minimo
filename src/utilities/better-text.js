// @ts-check
/*! minimo - Better Text */


/*
  Particelle/articoli italiani (più alcuni termini inglesi e toponomastici) di cui viene
  imposta la capitalizzazione e dopo i quali gli spazi vengono trasformati in spazi non
  separabili. Portati a livello di modulo insieme alle regex/lookup costruite qui sotto, dato
  che nulla di tutto ciò dipende dagli argomenti della funzione e in precedenza veniva
  ricostruito a ogni singola chiamata di betterText().
*/
const PARTICELLE = [
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

  // termini toponomastici
  'C.so', 'Corso', 'Via', 'P.za', 'Piazza', 'L.go', 'Largo', 'V.le', 'Viale',
  'De', 'San', 'c/o', 'Loc.',

  // inglese
  'the', 'a', 'an', 'at', 'out', 'of',

  // parole usate nei geonames
  'isola', 'isole'
];

// corrisponde a una particella seguita da uno o più spazi, da trasformare in spazi non separabili
export const NBSP_AFTER_PARTICLE_REGEX =new RegExp('\\b(' + PARTICELLE.join('|') + ')\\b +', 'gmi');

// corrisponde a qualsiasi particella indipendentemente dal maiuscolo/minuscolo, per imporne la capitalizzazione esatta in un solo passaggio
const PARTICLE_CASING_REGEX = new RegExp('\\b(' + PARTICELLE.join('|') + ')\\b', 'gmi');

// particella in minuscolo → sua capitalizzazione esatta, per il replacer usato con PARTICLE_CASING_REGEX
const PARTICLE_CASING_MAP = new Map(PARTICELLE.map(term => [term.toLowerCase(), term]));

/**
 * Migliora una stringa di testo correggendo la spaziatura della punteggiatura, gli spazi
 * multipli, le virgolette tipografiche, gli spazi non separabili dopo le particelle/articoli
 * italiani e, opzionalmente, imponendo la capitalizzazione esatta di parole personalizzate.
 * Le particelle vengono forzate alla capitalizzazione elencata, tranne all'inizio del testo
 * dove la prima lettera è maiuscola.
 *
 * @param {string} str - stringa da elaborare
 * @param {string[]} [custom_words] - elenco di parole di cui va mantenuta la capitalizzazione esatta (es. `['iPhone', 'macOS']`) (default: [])
 * @returns {string} stringa elaborata, oppure stringa vuota se l'input è falsy
 */
export function betterText(str, custom_words = []) {

  if(str) {
    str = str.trim();

    /*
      punteggiatura: rimuove lo spazio prima, garantisce un solo spazio dopo
      NOTA: deve essere eseguito prima di qualsiasi sostituzione di entità HTML per evitare conflitti con `;`
      (?!$): negative lookahead per saltare la punteggiatura a fine stringa
    */
    str = str.replace(/ +(,|;|\.|:|!|\?)/g, '$1');
    str = str.replace(/(,|;|\.|:|!|\?)(?!$) +/g, '$1 ');

    /*
      aggiunge lo spazio mancante dopo , ; ! ? quando seguiti direttamente da una lettera o da una virgoletta;
      le cifre vengono saltate di proposito (decimali come 1,5), così come . e : (abbreviazioni, orari, URL)
    */
    str = str.replace(/([,;!?])(?=[\p{L}"'“‘])/gu, '$1 ');

    // comprime spazi e tabulazioni multipli (inclusi gli spazi non separabili)
    str = str.replace(/[ \t\u00A0]+/g, ' ');

    // virgolette tipografiche
    str = str.replace(/(^| )"/g, '$1“')   // virgolette doppie di apertura
      .replace(/"/g, '”')                  // virgolette doppie rimanenti → chiusura
      .replace(/(^| )'/g, '$1‘')           // virgolette singole di apertura
      .replace(/'/g, '’')                  // virgolette singole rimanenti e apostrofi
    ;

    // rimuove lo spazio dopo l'apostrofo preceduto da articoli elisi (l', un', d', all', ...)
    str = str.replace(/((^| )(l|un|d|all|dell|nell|sull)('|')) /gi, '$1' );

    // sostituisce gli spazi normali con spazi non separabili dopo le particelle/articoli italiani
    str = str.replace(NBSP_AFTER_PARTICLE_REGEX, function (match) {
      return match.replace(/ +/g, '\u00A0');
    });

    // impone la capitalizzazione esatta di ogni particella in un solo passaggio;
    // una particella all'inizio del testo (eventualmente dopo una virgoletta di apertura) viene messa in maiuscolo
    str = str.replace(PARTICLE_CASING_REGEX, (match, _p1, offset, whole) => {
      const exact = PARTICLE_CASING_MAP.get(match.toLowerCase()) ?? match;
      return /^[“‘]?$/.test(whole.slice(0, offset))
        ? exact.charAt(0).toUpperCase() + exact.slice(1)
        : exact;
    });

    // mette in maiuscolo la prima lettera dopo ! ? e i puntini di sospensione (... o …), eventualmente dopo una virgoletta di apertura;
    // viene eseguito dopo la capitalizzazione delle particelle così che una maiuscola non venga annullata per particelle come "e" o "di"
    str = str.replace(/([!?]|\.{3}|…) +([“‘]?)(\p{Ll})/gu, (_match, punct, quote, letter) =>
      `${punct} ${quote}${letter.toUpperCase()}`
    );

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
