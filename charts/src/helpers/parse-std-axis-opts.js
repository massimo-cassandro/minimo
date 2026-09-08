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


    // TODO eti_asseX_height e eti_asseY_width capire se è possibile inserire un calcolo dinamico delle dimensioni
    //     mettere quindi auto (o null) come default che innesci il calcolo automatico
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

      /**
        'vertical' (barre/linee verticali, default): l'asse dei valori è l'asse Y, l'asse delle categorie è l'asse X.
        'horizontal' (barre orizzontali): l'asse dei valori è l'asse X, l'asse delle categorie è l'asse Y.
        Influisce solo sul calcolo geometrico di stepY_size/zero_y/stepX_size (vedi sotto),
        non sul calcolo "nice zero" di min_value/max_value/stepY_count, che è indipendente dall'orientamento
      */
      orientation: 'vertical',

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

    // se i valori attraversano lo zero (min negativo, max positivo), min_value/max_value/stepY_count
    // vengono ricalcolati in modo che tutti gli step della griglia abbiano la stessa dimensione
    // e che lo zero coincida esattamente con una delle suddivisioni (invece di cadere a metà tra due step)
    let stepY_count = params.stepY_count;

    if(parsed.min_value < 0 && parsed.max_value > 0) {
      const rawStep = (parsed.max_value - parsed.min_value) / stepY_count,
        positive_steps = Math.max(1, Math.round(parsed.max_value / rawStep)),
        step = parsed.max_value / positive_steps,
        negative_steps = Math.max(1, Math.ceil(Math.abs(parsed.min_value) / step));

      parsed.max_value = positive_steps * step;
      parsed.min_value = -negative_steps * step;
      stepY_count = positive_steps + negative_steps;
    }
    parsed.stepY_count = stepY_count;

    const legenda_height = params.legenda?.height?? 0;
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

    // valore di ogni step dell'asse dei valori
    // (usato per il calcolo delle etichette)
    parsed.stepY_value = (parsed.max_value - parsed.min_value) / stepY_count;

    const isHorizontal = params.orientation === 'horizontal';

    // lunghezza di ogni step dell'asse dei valori e dell'asse delle categorie:
    // con orientamento verticale l'asse dei valori è l'asse Y (chart_area.height) e quello delle
    // categorie è l'asse X (chart_area.width); con orientamento orizzontale i ruoli sono invertiti
    parsed.stepY_size = (isHorizontal? parsed.chart_area.width : parsed.chart_area.height) / stepY_count;
    parsed.stepX_size = (isHorizontal? parsed.chart_area.height : parsed.chart_area.width) / (params.stepX_count - 1);

    // coordinata corrispondente al valore 0 (asse Y con orientamento verticale, asse X con orientamento orizzontale)
    // utile quando min_value è negativo: la baseline delle barre viene disegnata in corrispondenza
    // dello zero invece che del valore minimo
    let raw_zero_y;
    if(isHorizontal) {
      // l'asse X cresce naturalmente verso destra (nessuna inversione necessaria, a differenza dell'asse Y)
      raw_zero_y = parsed.chart_area.left +
        (((0 - parsed.min_value) * parsed.chart_area.width) / (parsed.max_value - parsed.min_value));
      parsed.zero_y = Math.max(parsed.chart_area.left, Math.min(parsed.chart_area.right, raw_zero_y));
    } else {
      raw_zero_y = parsed.chart_area.top + parsed.chart_area.height -
        (((0 - parsed.min_value) * parsed.chart_area.height) / (parsed.max_value - parsed.min_value));
      parsed.zero_y = Math.min(parsed.chart_area.bottom, Math.max(parsed.chart_area.top, raw_zero_y));
    }

    return parsed;

  } catch(e) {
    console.error( 'MinimoCharts → parseStdOpts', e ); // eslint-disable-line
  }
}
