
/**
 * Restituisce il numero della settimana corrente
 * se la prima settimana ha meno di 4 gg e viene quindi assegnata all'ultima dell'anno precedente
 * i giorni relativi vengono aggiunti alla prima settimana (che così ha più di 7 giorni)
 * discorso analogo per l'ultima settimana
 *
 * @param {date} date
 * @param {number} year
 * @returns Number
 */


export function getWeekOfDate({date = new Date(), year = null}) {

  // se year è null, si considera quello della data indicata
  if(year == null) {
    year = date.getFullYear();
  }

  // se la data non è nell'anno indicato, viene restituito null
  if(date.getFullYear() !== year) {
    return null;
  }

  const dateMonth = date.getMonth(); // necessario congelarlo, date viene modificata più volte

  date.setHours(0, 0, 0, 0);

  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  let week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  let currentWeek =  1 + Math.round(
    ((date.getTime() - week1.getTime()) / 86400e3 - 3 + (week1.getDay() + 6) % 7) / 7
  );

  // prima settimana con meno di 4 giorni, normalmente sarebbe calcolata nell'anno precedente
  // ma in questo caso i giorni relativi vengono aggiunti alla prima settimana del nuovo anno
  if(currentWeek >= 52 && dateMonth === 0) {
    currentWeek = 1;
  }

  return currentWeek;

}


/**
 * Restituisce le date di inizio e fine della settimana dell'anno dati
 *
 * @param {number} week
 * @param {number} year
 * @returns Array
 */
export function getDatesOfWeek(week, year) {
  if(week) {

    let startDay, endDay;

    const jan1 = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
      , jan1DayOfTheWeek = jan1.getDay()
      // primo lunedì dell'anno
      , daysToFirstMonday = jan1DayOfTheWeek === 1? 0 : jan1DayOfTheWeek === 0? 1 :  8 - jan1DayOfTheWeek
      , firstMonday = daysToFirstMonday === 0 ? jan1 : new Date(+jan1 + daysToFirstMonday * 86400e3)
      , dec31 = new Date(Date.UTC(year, 11, 31))
      , lastDayOfThisWeek = new Date(+firstMonday + ((week - 1) * 7 * 86400e3) + (86400e3 * 6) )
      , __weeks = 52 // ricavato dalla 'array dati, qui è usato un valore fittizio
    ;

    // console.log('jan1', jan1.toUTCString());
    // console.log('jan1DayOfTheWeek', jan1DayOfTheWeek);
    // console.log('daysToFirstMonday', daysToFirstMonday);
    // console.log('firstMonday', firstMonday.toUTCString());
    // console.log('dec31', dec31.toUTCString());
    // console.log('lastDayOfThisWeek', lastDayOfThisWeek.toUTCString());


    // forza il primo giorno della prima settimana al 1 gennaio anche se non è lunedì
    if(week === 1) {
      startDay = jan1;
    } else {
      startDay = new Date(firstMonday.valueOf());
      startDay = new Date(startDay.setDate(startDay.getDate() + 7 * (week - 2)));
    }

    // prima settimana con più di 4 gg, viene considerata a se stante
    endDay = new Date(startDay.valueOf());
    if(week === 1 && jan1DayOfTheWeek < 5) {
      endDay = new Date(endDay.setDate(endDay.getDate() + 7 - jan1DayOfTheWeek));
    } else {
      endDay = new Date(endDay.setDate(endDay.getDate() + 6));
    }

    // forza l'ultmo giorno dell'ultima settimana al 31 dic anche se non è domenica
    if(endDay.getFullYear() > year || week === __weeks) {
      endDay = dec31;
    }



    // nel caso in cui la settimana sia la prima o l'ultima,viene restituito un terzo elemento
    // a indicare, rispettivamente, se 1 gennaio corrisponde all'inizione reale della 1a settimana
    // o se 31 dic corrisponde all'ultimo giorno dell'ultima settimana

    if(week === 1) {
      return [startDay, endDay, +firstMonday === +jan1];

    } else if (week === __weeks) {
      return [startDay, endDay, +dec31 === +lastDayOfThisWeek];

    } else {
      return [startDay, endDay];
    }

  } else {
    return null;
  }


}
