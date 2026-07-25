// elaborazione dati grafico, costruzione coordinate paths e punti

export function pathsSetup(cfg) {

  // coordinate dei punti dei vari set di dati
  // array delle varie serie di punti che saranno poi utilizzate per costruire gli elementi del grafico
  // ogni elemento dell'array contiene le coordinate x,y di ogni punto
  cfg.coords = {
    budget_standard: [],
    budget_positivo: [],
    budget_negativo: [],
    consolidato: [],
    consolidato_forecast: [],
    consolidato_prec: []
  };

  // step iniziale o 1 se skipWeek0 = true e modo = 'settimanale'
  const firstStep = (cfg.skipWeek0 && cfg.isSettimanale)? 1 : 0

    // conversione valori in coordinate Y relative al grafico
    ,valueToY = (value) => {
      // la coordinata y è ricavata dalla proporzione con il valore massimo e altezza del grafico
      // arrotondata a 4 cifre decimali

      // return  chart_area.top + chart_area.height - ((value * chart_area.height) / max_value);
      return Math.round(
        (cfg.chart_area.top + cfg.chart_area.height - ((value * cfg.chart_area.height) / cfg.max_value)) * 1e4
      ) / 1e4;

    }
  ;

  // valore x iniziale
  let x = cfg.chart_area.left;

  for (let thisStep = firstStep; thisStep <= cfg.stepX_count; thisStep++) {

    const dataItem = cfg.chartData.filter(row => row[cfg.isSettimanale? 'w' : 'm'] === thisStep )[0] ?? {};

    /**
      {
        w: <num>,   // numero settimana (se settimanale)
        m: <num>,   // numero mese (se mensile)

        s: <num>,   // valore scenario standard
        p: <num>,   // valore scenario positivo
        n: <num>,   // valore scenario negativo
        c: <num>,   // valore consolidato anno corrente (può essere null)
        cp: <num>,   // valore consolidato anno precedente
        cf: <num>    // valore consolidato forecast (può non essere presente o null)
      }
    */

    // ['s', 'p', 'n', 'c', 'cp', 'cf'].forEach(k => {
    //   if(dataItem[k] != null) {
    //     cfg.coords.budget_standard.push([x, valueToY(dataItem[k] ?? 0)]);
    //   }
    // });

    if(dataItem.p != null) cfg.coords.budget_positivo.push([x, valueToY(dataItem.p)]);
    if(dataItem.n != null) cfg.coords.budget_negativo.push([x, valueToY(dataItem.n)]);
    if(dataItem.s != null) cfg.coords.budget_standard.push([x, valueToY(dataItem.s)]);
    if(dataItem.c != null) cfg.coords.consolidato.push([x, valueToY(dataItem.c)]);
    if(dataItem.cf != null) cfg.coords.consolidato_forecast.push([x, valueToY(dataItem.cf)]);
    if(dataItem.cp != null) cfg.coords.consolidato_prec.push([x, valueToY(dataItem.cp)]);

    x += +cfg.stepX_size;
    x = +x.toFixed(4);

  } // end for step x

  return cfg;
}
