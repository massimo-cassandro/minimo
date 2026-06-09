// mostra una data in forma relativa a quella corrente se entro i limiti impostati
// le date relative sono aggiornate automaticamente ogni minuto


export default function (date, options = {}) {

  // date: data da elaborare (oggetto date o stringa iso)
  // opts oggetto per la personalizzazione del risultato

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat

  // TODO opzione aggiunta ora di inizio nelle date relative

  const default_options = {

    // se true mostra gli orari in prossimità della data come `tra xx minuti` (prima)
    // e `adesso` (se entro `minutesAfter`)
    useRelativeTime: true,

    // adesso
    nowString: 'adesso',

    // minuti prima della data entro i quali mostrare `tra xx minuti`
    relativeTimeMinutesBefore: 30,

    //minuti dopo la data entro i quali mostrare `adesso`
    relativeTimeMinutesAfter: 30,

    // mostra l'ora effettiva nelle date relative
    relativeTimeShowTime: true,

    // Markup da mostrare nelle date relative se `relativeTimeShowTime === true`
    // `@@time@@` viene sotituito con l'ota nel locale impostato
    relativeTimeShowTimeMarkup: ' <span class="time-info">(alle @@time@@)</span>',

    // La prima parola della stringa restituita ha l'iniziale maiuscola?
    firstLetterUpperCase: true,

    // formato data non relativa (oltre 'dopodomani')
    dateFormat: {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour12: false,
      hour:'2-digit',
      minute:'2-digit'
    },

    // formato ora date relative
    timeFormat: {
      hour12: false,
      hour:'2-digit',
      minute:'2-digit'
    },

    relativeStrings: [ // NB: in ordine temporale
      'ieri alle', 'oggi alle', 'domani alle', 'dopodomani alle'
    ],

    locale: 'it-IT'

  };

  let isRelative = false;

  const parseDate = (date, options = {}) => {

    const opts = {...default_options, ...options};

    const d = typeof date === 'string'? new Date(date) : date
      ,now = new Date()
      ,minutesDiff = (d.getTime() - now.getTime())/60000 // differenza tra le due date in minuti
      ,daysDiff = (new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0) -
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))/86400000
      ,rtf = new Intl.RelativeTimeFormat('it', { style: 'long' })


    ;

    let result;

    if (opts.useRelativeTime && Math.floor(Math.abs(minutesDiff)) === 0) {

      result = opts.nowString;
      isRelative = true;

    } else if(opts.useRelativeTime && (
      (Math.abs(minutesDiff) <= opts.relativeTimeMinutesAfter && minutesDiff < 0) ||
      (minutesDiff > 0 && minutesDiff <= opts.relativeTimeMinutesBefore)
    )) {

      // utilizzo di formatToParts e reduce necessario per eliminare porzioni decimali nel valore
      let parts = rtf.formatToParts( minutesDiff, 'minute').reduce((result, curr) => {
        if(curr.type !== 'decimal') { // separatore

          if(curr.type === 'fraction') { // parte decimale
            result.find(i => i.type === 'integer').value += `.${curr.value}`;
          } else {
            result.push(curr);
          }
        }
        return result;
      }, []);

      result = parts.map(i => i.type !== 'literal'? Math.round(+i.value) : i.value ).join('')+
        (opts.relativeTimeShowTime? opts.relativeTimeShowTimeMarkup?.replace('@@time@@', d.toLocaleString(opts.locale, opts.timeFormat)) : '');

      isRelative = true;

    // tra -1 giorno e +2 giorni
    } else if(daysDiff >= -1 && daysDiff <= 2) {

      result = opts.relativeStrings[daysDiff+1] + ' ' + d.toLocaleString(opts.locale, opts.timeFormat);
      isRelative = daysDiff === 0;

    } else {
      result = d.toLocaleString(opts.locale, opts.dateFormat);
    }

    if(opts.firstLetterUpperCase) {
      result = result.at(0).toUpperCase() + result.substring(1).toLowerCase();
    }

    return `<time datetime="${d.toISOString()}"${isRelative? ` data-relative-date-opts="${encodeURIComponent(JSON.stringify(options))}"` : ''}>${result}</time>`;

  }; // end parseDate

  const result = parseDate(date, options);


  if(isRelative && !Window.relativeDateUpd) {
    Window.relativeDateUpd = true;
    setInterval(() => {

      document.querySelectorAll('time[data-relative-date-opts]').forEach(item => {
        item.outerHTML = parseDate(item.getAttribute('datetime'), JSON.parse(decodeURIComponent(item.dataset.relativeDateOpts)));
      });
    }, 60000);
  }

  return result;
}
