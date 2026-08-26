// @ts-check
/*! minimo - Relative Date */

// Displays a date in relative form to the current date if within the set limits.
// Relative dates are automatically updated every minute.

/**
 * @typedef {object} RelativeDateOptions
 * @property {boolean} [useRelativeTime=true] - Show times near the date as "in xx minutes" (before) or "now" (within `relativeTimeMinutesAfter`) (default: true)
 * @property {string} [nowString] - String to display when the date is right now (default: 'adesso')
 * @property {number} [relativeTimeMinutesBefore] - Minutes before the date within which to show "in xx minutes" (default: 30)
 * @property {number} [relativeTimeMinutesAfter] - Minutes after the date within which to show the now string (default: 30)
 * @property {boolean} [relativeTimeShowTime] - Show the actual time alongside relative date labels (default: true)
 * @property {string} [relativeTimeShowTimeMarkup] - HTML markup for the time portion; `@@time@@` is replaced with the localized time string (default: ' <span class="time-info">(alle @@time@@)</span>')
 * @property {boolean} [firstLetterUpperCase] - Capitalize the first letter of the returned string (default: true)
 * @property {Intl.DateTimeFormatOptions} [dateFormat] - Format for non-relative dates (beyond day after tomorrow) (default: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour12: false, hour: '2-digit', minute: '2-digit' })
 * @property {Intl.DateTimeFormatOptions} [timeFormat] - Format for time displayed in relative date labels (default: { hour12: false, hour: '2-digit', minute: '2-digit' })
 * @property {string[]} [relativeStrings] - Labels for yesterday / today / tomorrow / day after tomorrow (in chronological order) (default: ['ieri alle', 'oggi alle', 'domani alle', 'dopodomani alle'])
 * @property {string} [locale] - Locale string for date/time formatting (default: 'it-IT')
 */

/**
 * Returns an HTML `<time>` element string displaying the date in relative or absolute form.
 * Relative dates are auto-refreshed every minute via a shared `setInterval`.
 *
 * The base param type below is intentionally `object` (not `RelativeDateOptions`): TypeScript only
 * expands dotted `@param` properties (needed for editor IntelliSense to list each property) when
 * the base type is the literal `object`; a named typedef there would error (TS8032).
 * @param {Date | string} date - Date to display (Date object or ISO string)
 * @param {object} [options={}] (default: {})
 * @param {boolean} [options.useRelativeTime=true] - Show times near the date as "in xx minutes" (before) or "now" (within `relativeTimeMinutesAfter`) (default: true)
 * @param {string} [options.nowString] - String to display when the date is right now (default: 'adesso')
 * @param {number} [options.relativeTimeMinutesBefore] - Minutes before the date within which to show "in xx minutes" (default: 30)
 * @param {number} [options.relativeTimeMinutesAfter] - Minutes after the date within which to show the now string (default: 30)
 * @param {boolean} [options.relativeTimeShowTime] - Show the actual time alongside relative date labels (default: true)
 * @param {string} [options.relativeTimeShowTimeMarkup] - HTML markup for the time portion; `@@time@@` is replaced with the localized time string (default: ' <span class="time-info">(alle @@time@@)</span>')
 * @param {boolean} [options.firstLetterUpperCase] - Capitalize the first letter of the returned string (default: true)
 * @param {Intl.DateTimeFormatOptions} [options.dateFormat] - Format for non-relative dates (beyond day after tomorrow) (default: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour12: false, hour: '2-digit', minute: '2-digit' })
 * @param {Intl.DateTimeFormatOptions} [options.timeFormat] - Format for time displayed in relative date labels (default: { hour12: false, hour: '2-digit', minute: '2-digit' })
 * @param {string[]} [options.relativeStrings] - Labels for yesterday / today / tomorrow / day after tomorrow (in chronological order) (default: ['ieri alle', 'oggi alle', 'domani alle', 'dopodomani alle'])
 * @param {string} [options.locale] - Locale string for date/time formatting (default: 'it-IT')
 * @returns {string} HTML `<time>` element as a string
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
 */

// TODO: Add option to include start time in relative dates
// TODO: alternative solution in place of `@@time@@` placeholder
// TODO reconsider and evaluate the use of Intl.RelativeTimeFormat Intl.RelativeTimeFormat

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
    relativeStrings: [ // NB: in chronological order
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
      , minutesDiff = (d.getTime() - now.getTime()) / 60000 // difference between the two dates in minutes
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

      // formatToParts + reduce needed to strip decimal fractions from the value
      const parts = rtf.formatToParts(minutesDiff, 'minute').reduce((acc, curr) => {
        if (curr.type !== 'decimal') { // decimal separator
          if (curr.type === 'fraction') { // fractional part
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

    // between -1 day and +2 days
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
