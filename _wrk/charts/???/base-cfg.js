// parametri di configurazione

export default function () {

  const cfg = {

    asseY_steps             : 4,     // suddivisioni asse y
    legenda           : {
      h                     : 25,     // altezza spazio legenda
      lines_width           : 20,     // larghezza righe legenda
      circles_radius        : 8,     // raggio legenda aree
      text_gap              : 4,     // spazio tra il simbolo e il testo
      text_dy               : 4,
      elements_gap          : 20      // spazio tra gli elementi della legenda
    },

    eti_asseY_width         : 60, // spazio etichette asse y
    eti_asseX_height        : 30, // spazio etichette asse x (grafico settimanale)
    padding                 : 10,      // spazio extra attorno al bordo

    // altezza o larghezza ticks (secondo l'orientamento)
    ticks                   : 5,

    // spazio tra le barre dello stesso gruppo negli istogrammi
    bar_gap                 : 3,

    // margine dx e sx tra ogni gruppo di barre dalla sezione
    bar_margin              : 6,

    // altezza aggiuntiva delle aree di evidenziazione dei mesi (solo g. settimanale)
    months_bg_extra_height  : 30
  };

  return cfg;
}


// =>> chart area
// coordinate del rettangolo interno all'svg entro cui viene disegnato il grafico
// i lati sx e inferiore corrispondono agli assi
// la variabile cfg.chart_area contiene le distanze dal bordo dei 4 lati del rettangolo
// e le dimensioni dei lati
export function setChartArea(cfg, svgWidth, svgHeight) {
  return {
    top       : cfg.legenda.h + cfg.padding,
    right     : svgWidth - cfg.padding,
    bottom    : svgHeight - cfg.eti_asseX_height - cfg.padding,
    left      : cfg.eti_asseY_width + cfg.padding,
    width     : svgWidth - (cfg.padding * 2) - cfg.eti_asseY_width,
    height    : svgHeight - (cfg.padding * 2) - cfg.legenda.h - cfg.eti_asseX_height
  };
}

// console.log(cfg.chart_area);

// =>> conversione valori in coordinate relative al grafico
export function valueToYCoord(value, cfg) {
  // la coordinata y è ricavata dalla proporzione con il valore massimo e altezza del grafico
  // => cfg.max_value : cfg.chart_area.height = value  : y
  // arrotondata a 4 cifre decimali

  if(value == null) {
    return 0;
  }
  return  Math.round((cfg.chart_area.top + cfg.chart_area.height - ((value * cfg.chart_area.height) / cfg.max_value)) * 1e4) / 1e4;
}
