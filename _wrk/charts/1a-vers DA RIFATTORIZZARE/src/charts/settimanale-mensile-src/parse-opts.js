// prima elaborazione e controlli delle impostazioni

import { getWeekOfDate } from '../../week-utils.js';


export function parseOpts(cfg) {

  try {

    if(+cfg.width < 100 || +cfg.height < 100) {
      throw '`width` e/o `height` mancanti o di dimensioni insufficienti (devono essere maggiori di 99px)';
    }

    if(!['settimanale', 'mensile'].includes(cfg.modo)) {
      throw `‘modo’ deve essere ‘settimanale’ o ‘mensile’ (valore attuale: ‘${cfg.modo}’)`;
    }
    cfg.isSettimanale = cfg.modo === 'settimanale';


    // =>> PARAMETRI  calcolati
    //---------------

    // solo settimanale
    if(cfg.isSettimanale) {

      // calcolo max_value (tiene conto della eventuale esclusione della settimana zero)
      cfg.max_value = cfg.chartData.filter(row => cfg.skipWeek0? row.w > 0 : true).reduce((prev, curr) => {
        return Math.max(prev, ...Object.values(curr));
      }, 0);

      // aggiustamento `eti_asseX_cfg.height` per fare spazio alle etichette con il nome dei mesi
      cfg.eti_asseX_height *= 2.2;
    }

    cfg.currentWeek = getWeekOfDate({year: cfg.anno});
    cfg.currentMonth = new Date().getMonth() + 1; // base 1

    // primo dell'anno
    cfg.jan1 = new Date(Date.UTC(cfg.anno, 0, 1));
    cfg.jan1DayOfTheWeek = cfg.jan1.getDay();

    // il numero di settimane dell'anno non include la settimana 0, se presente,
    // che indica il riporto anno precedente.
    // se il 31 dicembre è prima di giovedì, viene considerato nella prima settimana dell'anno successivo
    // e il numero di settimane dell'anno è 52
    cfg.dec31WeekNum = getWeekOfDate({date: new Date(cfg.anno, 11, 31), year: cfg.anno});
    cfg.weeks = cfg.dec31WeekNum === 1? 52 : cfg.dec31WeekNum;

    cfg.mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    // larghezza ogni step dell'asse X (= 1 settimana o mese)
    if(cfg.isSettimanale) {
      cfg.stepX_count = cfg.weeks + (cfg.skipWeek0? 0 : 1);
    } else {
      cfg.stepX_count = 12;
    }


    return cfg;

  } catch(e) {
    console.error( 'AdaCharts → andamentoAnnuale → parseOpts', e ); // eslint-disable-line
  }
}
