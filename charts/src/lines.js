import { parseStdAxisOpts } from './helpers/parse-std-axis-opts.js';
import { parseContainer } from './helpers/chart-utils.js';
import { cartesianAxis } from './helpers/cartesian-axis.js';
import { legenda } from './helpers/legenda.js';


const default_lines_attrs = {
  stroke: '#999',
  'stroke-width': 1,
  'shape-rendering': 'crispEdges',
  'stroke-linecap': 'round',
  fill: 'none'
};

const default_font_attrs = {
  // family: 'sans-serif',
  size: 14,
  // stretch: 'normal',
  // style: 'normal',
  // variant: 'normal',
  weight: 400,
  fill: '#999'
};

const default_params = {

  /** mostra info utili per il debug */
  debug: false,

  /** container (selettore o elemento DOM), se null viene restituito il codice SVG */
  container: null,

  /**
    larghezza e altezza del grafico (px),
    Se il container è presente e i parametro `width` e `height` sono `null`,
    vengono utilizzate le dimensioni  del container.
    Se uno dei due valori non è impostato o ricavabile, viene generato un errore.
    NB: il padding del container viene considerato nelle dimensioni del grafico,
    è preferibile non impostarlo.
    Il valore 'auto' di height fa sì che l'altezza dell'svg sia calcolata sulla base
    del numero di barre e dei valori `barsGap` e `barsHeight`
  */
  width: null, // null || <value>
  height: 300, // <value> || null || 'auto'

  /** attributi facoltativi per l'svg (classe, ecc) */
  svgAttrs: {},

  /**
    valori numerici per la definizione delle linee
    è un array di array, in cui ogni subarray contiene i valori di una singola linea
    l'ordine di rapprsentazione delle linee segue il loro ordine nell'array,
    ovvero l'ultima serie corrisponde alla linea rappresentata per ultima e quindi sopra le altre
  */
  values: [],

  /**
    etichette corrispondenti ai vari valori. Sono posizionate sull'asse X
  */
  xLabels: [],

  /**  spazio extra attorno al bordo */
  padding: 10,

  /**  suddivisioni asse Y */
  stepY_count: 4,

  /**  px, altezza o larghezza ticks (secondo l'orientamento) */
  ticksLength: 8,

  /**
    opzioni  per legenda come da componente legenda sono impostati automaticamente)
    NB: l'elemento `items` viene generato dinamicamente:
      `shape` è sempre impostato su line
      `attrs` è ricavato dagli attributi delle linee dati

    Per utilizzare le impostazioni di default, è sufficiente impostare i valori `items.text`
  */
  legenda: {},

  /**
    larghezza area etichette asse y
  */
  yAxisLabelWidth: 60,

  /**  altezza area etichette asse x */
  xAxisLabelHeight: 50,

  /** titoli assi */
  yAxisTitle: null,
  yAxisTitleAttrs: {...default_font_attrs, size: 18},
  yAxisTitleFontFilePath: null,

  xAxisTitle: null,
  xAxisTitleAttrs: {...default_font_attrs, size: 18},
  xAxisTitleFontFilePath: null,

  /** valori minimi e massimi per l'asse Y, se null vengono calcolati automaticamente */
  max_value: null,
  min_value: null,

  /**
    classi e attributi dei vari elementi.
    Per gli attributi, ogni variabile è un oggetto di attributi svg.js, es =

    {
      stroke: '#414141',
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',
      class: 'xxxx'
    }

  */
  axisAttrs: {...default_lines_attrs, 'stroke-width': 2},
  ticksAttrs: default_lines_attrs,

  /**
    griglia assi x e y, in corrispondenza dei ticks
  */
  showXgrid: true, // griglia verticale
  showYgrid: true, // griglia orizzontale
  gridLinesAttrs: default_lines_attrs,

  labelXAttrs: default_font_attrs, // contiene gli attributi fonts (come in MinimoCharts.defaults.font) e l'attributo `fill`
  labelXFontFilePath: null,  // percorso font per textToPath

  labelYAttrs: default_font_attrs, // contiene gli attributi fonts (come in MinimoCharts.defaults.font) e l'attributo `fill`
  labelYFontFilePath: null,  // percorso font per textToPath

  /**
    attributi delle varie linee dati
    se l'oggetto `pointsAttrs`, dove presente, non è vuoto,
    viene aggiunto un cerchio ad ogni punto della linea
    (NB non aggiungere `cx` o cy`)
    il valore `r` può essere un numero (valore uguale per tutti i punti) o un array
    in cui ogni valore si apllica alla linea con lo stesso indice
  */
  data_lines_attrs: {
    ...default_lines_attrs,
    'stroke-width': 2
  },

  data_points_attrs: {
    r: 4
  },

  /** colori delle linee */
  data_colors: null,

  /**
    spessori delle linee
    Se null, viene utilizzato per tutte le linee il valore definito in data_lines_attrs,
    altrimenti è un array, in cui ogni valore corrisponde allo spessore da assegnare
    alla linea con lo stesso indice.
    I valori `undefined` o `null` vengono ricondotti al default `data_lines_attrs['stroke-width']`
    (in sua mancanza a `1`)
  */
  data_lines_widths: null,



  /**
    Funzione per formattare le etichette dei valori dell'asse Y.
    Null per nessuna eleborazione.
    La funzione di default assume che il valore sia di tipo numerico
  */
  labelYFormatter: etiValue =>  Math.ceil(etiValue / 1e3)
    .toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) +
    (etiValue > 0? '\u2009K' : ''), // \u2009: thin space (https://www.compart.com/en/unicode/U+2009)

};
export async function lines(params) {

  const chartInstance = this;

  params = {...default_params, ...params};
  params.data_colors??= chartInstance.defaults.colors;

  try {

    // controllo values
    params.values.forEach(subarray => {
      if(!Array.isArray(subarray)) {
        throw 'L’elemento `values` deve essere un array di soli array';
      }
    });

    const flatValues = params.values.flat(); // utilizzato anche in seguito
    if(flatValues.filter(v => isNaN(v)).length) {
      throw 'Tutti i valori dei sub-array di `values` devono essere numerici';
    }


    // container
    [, params.width, params.height] = parseContainer({ container: params.container, width: params.width, height: params.height });

    if(!params.width || !params.height) {
      throw `width e/o height mancanti: width: ${params.width}, height: ${params.height}`;
    }

    // =>> ricalcolo data_lines_attrs (utilizzato anche per le linee della legenda)
    const default_line_width = params.data_lines_attrs['stroke-width']?? 1;

    // il ciclo è basato su params.values per essere certi che il numero di elementi coincida
    params.data_lines_attrs = params.values.map((_, idx) => {
      const thisColor = params.data_colors[idx],
        thisLineWidth = (params.data_lines_widths??[])[idx]?? default_line_width;

      return {
        ...default_lines_attrs,
        ...params.data_lines_attrs[idx]?? {},
        stroke: thisColor,
        'stroke-width': thisLineWidth
      };
    });


    // =>> legenda
    // costruzione delle opzioni per la legenda
    const opts_legenda = {

      ...{
        /** altezza legenda */
        height: 20,

        /** spazio tra gli elementi della legenda */
        elements_gap: 25,

        /** dimensioni delle forme della legenda (NB: solo linee) */
        lines_width: 20,

        /** attributi svg.js dei font del testo della legenda (null utilizza default) */
        fontAttrs: {
          fill: '#333',
          'font-size': 14,
          'font-weight': 400
        },
        fontFilePath: null,
      },

      ...params.legenda
    };

    // legenda.items (elementi della legenda)
    // il ciclo viene eseguito su params.data_lines_attrs per essere certi che il numero di elementi coincida
    // è utilizzato in ordine inverso in modo che il primo elmento della legenda corrisponda alla linea in primo piano
    opts_legenda.items = params.data_lines_attrs.toReversed().map((line_attr, idx) => {
      const thisLegendaItem = params.legenda.items.toReversed()[idx]?? {};
      return {
        ...thisLegendaItem,
        shape: 'line',
        attrs: {
          ...(thisLegendaItem.attrs?? {}),
          ...line_attr
        }
      };
    });


    // numero di step dell'asse X
    const stepX_count = params.values.reduce((prev, curr) => Math.max(prev, curr.length), 0);

    const svgCanvas = chartInstance.createSvgCanvas(params.container, params.debug)
      .size(params.width, params.height)
      .viewbox(0, 0, params.width, params.height)
      .attr({...params.svgAttrs});

    // pre-elaborazione e calcolo di alcuni elementi (chartArea)
    // nuove variabili definite da parseStdAxisOpts
    const {
      max_value,
      min_value,
      chart_area,
      stepY_value,
      stepY_size,
      stepX_size
    } = parseStdAxisOpts({
      max_value: params.max_value,
      min_value: params.min_value,
      values: flatValues,
      legenda: opts_legenda,
      padding: params.padding,
      width: params.width,
      height: params.height,
      eti_asseX_height: params.xAxisLabelHeight,
      eti_asseY_width: params.yAxisLabelWidth,
      stepY_count: params.stepY_count,
      stepX_count: stepX_count,
      ticksLength: params.ticksLength,
    }); // elaborazione standard

    // =>> costruzione assi e griglia.
    // Gli argomenti di cartesianAxis sono uguali a quelli di lines
    // con l'aggiunta di quelli calcolati da parseStdAxisOpts
    // non tutti sono necessari ma vengono passati lo stesso per comodità
    const cartesianAxisGroup = await cartesianAxis(chartInstance, {
      ...params,
      ...{
        max_value,
        min_value,
        chart_area,
        stepY_value,
        stepY_size,
        stepX_size,
        stepX_count
      }
    });

    svgCanvas.add(cartesianAxisGroup);


    // =>> disegno linee
    const linesGroup = svgCanvas.group()
      .attr({ 'data-debug-info': params.debug? 'Gruppo Linee' : null });

    params.values.forEach((lineDataArray, idx) => {
      const thisLineGroup = linesGroup.group()
          .attr({ 'data-debug-info': params.debug? `Gruppo Linea ${idx}` : null }),
        coords = []; // array delle coordinate


      lineDataArray.forEach((pointValue, pointIdx) => {
        // trasformazione valore in coordinate

        const x = chart_area.left + stepX_size * pointIdx,
          y = chart_area.top + chart_area.height - (((pointValue - min_value) * chart_area.height) / (max_value - min_value));

        coords.push([x,y]);
      });

      thisLineGroup.polyline(coords).attr(params.data_lines_attrs[idx]);

      // punti
      const radius = Array.isArray(params.data_points_attrs.r)
        ? params.data_points_attrs.r[idx]
        : params.data_points_attrs.r;

      coords.forEach((point, coord_idx) => {

        thisLineGroup.circle()
          .attr({
            ...params.data_points_attrs,
            r: radius,
            fill: params.data_lines_attrs[idx].stroke,
            cx: point[0],
            cy: point[1],
            'data-debug-info': params.debug? `Valore: ${params.values[idx][coord_idx]}` : null
          });
      });


    });


    // =>> Legenda
    const legendaEl = await legenda(chartInstance, opts_legenda);
    legendaEl.attr({ 'data-cfg.debug-info': params.debug? 'Legenda' : null });
    const legendaBbox = legendaEl.bbox();

    legendaEl.dmove(
      (params.width - legendaBbox.width) / 2,
      params.padding
    );
    legendaEl.y(params.padding);

    legendaEl.x((params.width - legendaBbox.width) / 2);

    svgCanvas.add(legendaEl);


    if(!params.container) {
      return svgCanvas.svg();
    }


  } catch(e) {
    console.error( '[MinimoCharts → lines]', e ); // eslint-disable-line
  }

}
