export function datesFromTo(dateIsoString1, dateIsoString2, options={}) {

  const default_options = {
    locale: 'it-IT',
    locale_options: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  };

  options = {...default_options, ...(options??{})};


  if(dateIsoString1 === dateIsoString2) {
    return new Date(dateIsoString1).toLocaleString(options.locale, options.locale_options);

  } else {
    const [y1, m1, d1] = dateIsoString1.substring(0, 10).split('-')
      ,[y2, m2, d2] = dateIsoString2.substring(0, 10).split('-')
    ;

    if(y1 !== y2) {
      return new Date(dateIsoString1).toLocaleString(options.locale, options.locale_options) +
        ' &ndash; ' +
        new Date(dateIsoString2).toLocaleString(options.locale, options.locale_options);

    } else if (m1 !== m2) {

      delete options.locale_options.year;

      return new Date(dateIsoString1).toLocaleString(options.locale, options.locale_options) +
        ' &ndash; ' +
        new Date(dateIsoString2).toLocaleString(options.locale, options.locale_options) +
        ` ${y1}`;

    } else {

      delete options.locale_options.day;

      return `${d1}&ndash;${d2} ` + new Date(dateIsoString1).toLocaleString(options.locale, options.locale_options);
    }

  }

}
