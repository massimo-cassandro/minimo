// prima elaborazione e controlli delle impostazioni comuni a tutti i grafici con assi
// NB non nel prototypoe della classe, va importato dove richiesto
/*
  l'argomento params è un oggetto che deve contenere i parametri con cui vengono effettuati i vari calcoli:
    width, height, ecc... (vedi default)

    values è un array flat contentente tutti i valori da rappresentare

  restituisce un offetto `parsed` con i nuovi parametri calcolati
*/

export function parseStdAxisOpts(params = {} ) {

  try {



    const parsed = {};

    // default
    params = {
      max_value: null,
      min_value: null,
      values: [], // array flat dei valori per il calcolo di maxValues e minValues, qualora fossero null
      legenda: null,
      padding: 0, // spazio intorno ai bordi del grafico
      width: null, // width e height non possono essere null, vanno verificate prima
      height: null,
      eti_asseX_height: null, // non può essere null, va verificato prima
      eti_asseY_width: null, // non può essere null, va verificato prima
      stepY_count: null, // non può essere null, va verificato prima
      stepX_count: null, // non può essere null, va verificato prima
      ticksLength: 0,

      ...params
    };

    ['width', 'height', 'eti_asseX_height', 'eti_asseY_width', 'stepY_count', 'stepX_count', 'ticksLength']
      .forEach(key => {
        if(params[key] == null) {
          throw `‘${key}’ non può essere null`;
        }
      });



    // =>> PARAMETRI  calcolati
    //---------------

    // calcolo valore massimo dei dati se non già impostato in precedenza
    if(params.max_value == null) {
      parsed.max_value = Math.max(0, ...params.values.flat());
    } else {
      parsed.max_value = params.max_value;
    }

    // calcolo valore minimo dei dati se non già impostato in precedenza
    if(params.min_value == null) {
      parsed.min_value = Math.min(parsed.max_value, ...params.values.flat().filter(v => v != null));
    } else {
      parsed.min_value = params.min_value;
    }

    const legenda_height = params.legenda.height?? 0;
    const gap_legenda = legenda_height? 10 : 0; // spazio tra legenda e grafico

    // =>> chart area
    // coordinate e dimensioni del rettangolo interno all'svg entro cui viene disegnato il grafico
    // i lati sx e inferiore corrispondono agli assi
    parsed.chart_area = {
      top       : legenda_height + gap_legenda + params.padding, // coordinata y superiore
      right     : params.width - params.padding, // coordinata x dx
      bottom    : params.height - params.eti_asseX_height - params.ticksLength - params.padding, // coordinata y inferiore
      left      : params.eti_asseY_width + params.ticksLength + params.padding // coordinata x sx
    };
    parsed.chart_area.width = parsed.chart_area.right - parsed.chart_area.left;
    parsed.chart_area.height = parsed.chart_area.bottom - parsed.chart_area.top;

    // valore di ogni step asse y
    // (usato per il calcolo delle etichette dell'asse Y)
    parsed.stepY_value = (parsed.max_value - parsed.min_value) / params.stepY_count;

    // lunghezza di ogni step asse y
    parsed.stepY_size = parsed.chart_area.height / params.stepY_count;


    parsed.stepX_size = parsed.chart_area.width / (params.stepX_count - 1);


    return parsed;

  } catch(e) {
    console.error( 'MinimoCharts → parseStdOpts', e ); // eslint-disable-line
  }
}
