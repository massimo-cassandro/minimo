// @ts-check
/*! minimo - Relative Date */

// Mostra una data in forma relativa rispetto alla data corrente, se entro i limiti impostati.
// Le date relative vengono aggiornate automaticamente ogni minuto.

/**
 * @typedef {object} RelativeDateOptions
 * @property {boolean} [useRelativeTime=true] - Mostra gli orari vicini alla data come "tra xx minuti" (prima) o "adesso" (entro `relativeTimeMinutesAfter`) (default: true)
 * @property {string} [nowString] - Stringa da mostrare quando la data è proprio adesso (default: 'adesso')
 * @property {number} [relativeTimeMinutesBefore] - Minuti prima della data entro i quali mostrare "tra xx minuti" (default: 30)
 * @property {number} [relativeTimeMinutesAfter] - Minuti dopo la data entro i quali mostrare la stringa "adesso" (default: 30)
 * @property {boolean} [relativeTimeShowTime] - Mostra l'orario effettivo accanto alle etichette delle date relative (default: true)
 * @property {string} [relativeTimeShowTimeMarkup] - Markup HTML per la parte dell'orario; `@@time@@` viene sostituito dall'orario localizzato (default: ' <span class="time-info">(alle @@time@@)</span>')
 * @property {boolean} [firstLetterUpperCase] - Mette in maiuscolo la prima lettera della stringa restituita (default: true)
 * @property {Intl.DateTimeFormatOptions} [dateFormat] - Formato per le date non relative (oltre dopodomani) (default: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour12: false, hour: '2-digit', minute: '2-digit' })
 * @property {Intl.DateTimeFormatOptions} [timeFormat] - Formato dell'orario mostrato nelle etichette delle date relative (default: { hour12: false, hour: '2-digit', minute: '2-digit' })
 * @property {string[]} [relativeStrings] - Etichette per ieri / oggi / domani / dopodomani (in ordine cronologico) (default: ['ieri alle', 'oggi alle', 'domani alle', 'dopodomani alle'])
 * @property {string} [locale] - Stringa locale per la formattazione di data/ora (default: 'it-IT')
 */

/**
 * Restituisce la stringa di un elemento HTML `<time>` che mostra la data in forma relativa o assoluta.
 * Le date relative vengono aggiornate automaticamente ogni minuto tramite un `setInterval` condiviso.
 *
 * Il tipo base del parametro qui sotto è volutamente `object` (non `RelativeDateOptions`): TypeScript
 * espande le proprietà `@param` con notazione puntata (necessarie perché IntelliSense dell'editor elenchi
 * ogni proprietà) solo quando il tipo base è il letterale `object`; un typedef con nome darebbe errore (TS8032).
 * @param {Date | string} date - Data da mostrare (oggetto Date o stringa ISO)
 * @param {object} [options={}] (default: {})
 * @param {boolean} [options.useRelativeTime=true] - Mostra gli orari vicini alla data come "tra xx minuti" (prima) o "adesso" (entro `relativeTimeMinutesAfter`) (default: true)
 * @param {string} [options.nowString] - Stringa da mostrare quando la data è proprio adesso (default: 'adesso')
 * @param {number} [options.relativeTimeMinutesBefore] - Minuti prima della data entro i quali mostrare "tra xx minuti" (default: 30)
 * @param {number} [options.relativeTimeMinutesAfter] - Minuti dopo la data entro i quali mostrare la stringa "adesso" (default: 30)
 * @param {boolean} [options.relativeTimeShowTime] - Mostra l'orario effettivo accanto alle etichette delle date relative (default: true)
 * @param {string} [options.relativeTimeShowTimeMarkup] - Markup HTML per la parte dell'orario; `@@time@@` viene sostituito dall'orario localizzato (default: ' <span class="time-info">(alle @@time@@)</span>')
 * @param {boolean} [options.firstLetterUpperCase] - Mette in maiuscolo la prima lettera della stringa restituita (default: true)
 * @param {Intl.DateTimeFormatOptions} [options.dateFormat] - Formato per le date non relative (oltre dopodomani) (default: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour12: false, hour: '2-digit', minute: '2-digit' })
 * @param {Intl.DateTimeFormatOptions} [options.timeFormat] - Formato dell'orario mostrato nelle etichette delle date relative (default: { hour12: false, hour: '2-digit', minute: '2-digit' })
 * @param {string[]} [options.relativeStrings] - Etichette per ieri / oggi / domani / dopodomani (in ordine cronologico) (default: ['ieri alle', 'oggi alle', 'domani alle', 'dopodomani alle'])
 * @param {string} [options.locale] - Stringa locale per la formattazione di data/ora (default: 'it-IT')
 * @returns {string} Elemento HTML `<time>` come stringa
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
 */

// TODO: aggiungere un'opzione per includere l'ora di inizio nelle date relative
// TODO: soluzione alternativa al segnaposto `@@time@@`
// TODO rivalutare l'uso di Intl.RelativeTimeFormat

export function relativeDate(date, options = {}) {

  /** @type {Required<RelativeDateOptions>} */
  const default_options = {
    useRelativeTime: true,
    nowString: 'adesso',
    relativeTimeMinutesBefore: 30,
    relativeTimeMinutesAfter: 30,
    relativeTimeShowTime: true,
    relativeTimeShowTimeMarkup: ' <span class="time-info">(alle @@time@@)</span>',
    firstLetterUpperCase: true,
    dateFormat: {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    },
    timeFormat: {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    },
    relativeStrings: [ // NB: in ordine cronologico
      'ieri alle', 'oggi alle', 'domani alle', 'dopodomani alle'
    ],
    locale: 'it-IT'
  };

  let isRelative = false;

  /**
   * @param {Date | string} dateInput
   * @param {RelativeDateOptions} [overrideOptions={}] (default: {})
   * @returns {string}
   */
  const parseDate = (dateInput, overrideOptions = {}) => {

    const opts = { ...default_options, ...overrideOptions };

    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
      , now = new Date()
      , minutesDiff = (d.getTime() - now.getTime()) / 60000 // differenza tra le due date in minuti
      , daysDiff = (
        new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime() -
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime()
      ) / 86400000
      , rtf = new Intl.RelativeTimeFormat('it', { style: 'long' })
    ;

    /** @type {string} */
    let result;

    if (opts.useRelativeTime && Math.floor(Math.abs(minutesDiff)) === 0) {

      result = opts.nowString;
      isRelative = true;

    } else if (opts.useRelativeTime && (
      (Math.abs(minutesDiff) <= opts.relativeTimeMinutesAfter && minutesDiff < 0) ||
      (minutesDiff > 0 && minutesDiff <= opts.relativeTimeMinutesBefore)
    )) {

      // formatToParts + reduce necessari per eliminare le frazioni decimali dal valore
      const parts = rtf.formatToParts(minutesDiff, 'minute').reduce((acc, curr) => {
        if (curr.type !== 'decimal') { // separatore decimale
          if (curr.type === 'fraction') { // parte frazionaria
            const intPart = acc.find(i => i.type === 'integer');
            if (intPart) intPart.value += `.${curr.value}`;
          } else {
            acc.push(curr);
          }
        }
        return acc;
      }, /** @type {Intl.RelativeTimeFormatPart[]} */ ([]));

      result = parts.map(i => i.type !== 'literal' ? Math.round(+i.value) : i.value).join('') +
        (opts.relativeTimeShowTime ? opts.relativeTimeShowTimeMarkup?.replace('@@time@@', d.toLocaleString(opts.locale, opts.timeFormat)) : '');

      isRelative = true;

    // tra -1 giorno e +2 giorni
    } else if (daysDiff >= -1 && daysDiff <= 2) {

      result = opts.relativeStrings[daysDiff + 1] + ' ' + d.toLocaleString(opts.locale, opts.timeFormat);
      isRelative = daysDiff === 0;

    } else {
      result = d.toLocaleString(opts.locale, opts.dateFormat);
    }

    if (opts.firstLetterUpperCase && result) {
      result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
    }

    return `<time datetime="${d.toISOString()}"${isRelative ? ` data-relative-date-opts="${encodeURIComponent(JSON.stringify(overrideOptions))}"` : ''}>${result}</time>`;

  }; // end parseDate

  const result = parseDate(date, options);

  if (isRelative && !(/** @type {any} */ (window)).relativeDateUpd) {
    /** @type {any} */ (window).relativeDateUpd = true;
    setInterval(() => {
      document.querySelectorAll('time[data-relative-date-opts]').forEach(item => {
        const datetime = item.getAttribute('datetime');
        const optsAttr = /** @type {HTMLElement} */ (item).dataset.relativeDateOpts;
        if (datetime && optsAttr) {
          item.outerHTML = parseDate(datetime, JSON.parse(decodeURIComponent(optsAttr)));
        }
      });
    }, 60000);
  }

  return result;
}
