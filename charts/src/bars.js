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
    è un array di array, in cui ogni subarray contiene i valori di una singola serie di barre
  */
  values: [],

  /** spazio tra una barre e l'altra */
  barsGap: 5,

  /** spazio tra una serie e l'altra */
  seriesGap: 10,

  /** bars top corner radius */
  barsCornerRadius: 6,

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
  min_value: 0,

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
  showXgrid: false, // griglia verticale
  showYgrid: true, // griglia orizzontale
  gridLinesAttrs: default_lines_attrs,

  labelXAttrs: default_font_attrs, // contiene gli attributi fonts (come in MinimoCharts.defaults.font) e l'attributo `fill`
  labelXFontFilePath: null,  // percorso font per textToPath

  labelYAttrs: default_font_attrs, // contiene gli attributi fonts (come in MinimoCharts.defaults.font) e l'attributo `fill`
  labelYFontFilePath: null,  // percorso font per textToPath



  /** colori delle barre */
  data_colors: null,


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
export async function bars(params) {

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

    // =>> legenda
    // costruzione delle opzioni per la legenda
    const legenda_params = {

      ...{
        /** altezza legenda */
        height: 20,

        /** spazio tra gli elementi della legenda */
        elements_gap: 25,

        /** dimensioni delle forme della legenda (NB: solo tondi) */
        circles_radius: 20,

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
    legenda_params.items = params.legenda.items.map((item, idx) => {
      return {
        ...item,
        shape: 'circle',
        attrs: {
          ...(item.attrs?? {}),
          fill: params.data_colors[idx]?? '#666',
        }
      };
    });


    // numero di step dell'asse X
    const stepX_count = params.values.reduce((prev, curr) => Math.max(prev, curr.length), 0) + 1;

    const svgCanvas = chartInstance.createSvgCanvas(params.container, params.debug)
      // .size(params.width, params.height)
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
      legenda: legenda_params,
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
    // Gli argomenti di cartesianAxis sono uguali a quelli di bars
    // con l'aggiunta di quelli calcolati da parseStdAxisOpts
    // non tutti sono necessari ma vengono passati lo stesso per comodità
    const cartesianAxisGroup = await cartesianAxis(chartInstance, {
      ...params,
      xLabelsOnTicks: false, // posiziona l'etichetta al centro di ogni step X
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

    // *********************************
    // =>> disegno barre
    // *********************************

    // calcolo larghezza barre
    const barsWidth = (stepX_size - params.seriesGap - (params.barsGap * (params.values.length - 1))) / params.values.length
      ,barsCornerRadius = Math.min(params.barsCornerRadius, barsWidth / 2) // il reggio dell'angolo non può essere più grandedella barra stessa
    ;


    const barsGroup = svgCanvas.group()
      .attr({ 'data-debug-info': params.debug? 'Gruppo barre' : null });

    let barX = chart_area.left + params.seriesGap / 2;

    for (let thisStepIdx = 0; thisStepIdx < stepX_count; thisStepIdx++) {

      const thisStepValues = params.values.reduce((result, curr) => {
        result.push(curr[thisStepIdx]?? null);
        return result;
      }, []);

      // stampa di ogni barra della serie
      for (let idx = 0; idx < thisStepValues.length; idx++) {
        const itemValue = thisStepValues[idx];
        const isLast = idx === thisStepValues.length - 1;

        if (itemValue != null) {
          // calcolo coordinata Y e altezza assoluta della barra
          const barY = chart_area.top + chart_area.height - (((itemValue - min_value) * chart_area.height) / (max_value - min_value)),
            barH = chart_area.bottom - barY,
            parteVerticaleBarra = barH - barsCornerRadius;
          let path;

          if(parteVerticaleBarra > 0) {

            if(barH <= barsCornerRadius) {

              const altezzaCornerRadius = barH;

              path = `M${barX},${chart_area.bottom}` +
                `q0,-${altezzaCornerRadius} ${barsCornerRadius},-${altezzaCornerRadius}` +
                `h${barsWidth - barsCornerRadius * 2}` +
                `q${barsCornerRadius},0 ${barsCornerRadius},${altezzaCornerRadius}` +
                'z';

            } else {
              path = `M${barX},${chart_area.bottom}` +
                `v-${parteVerticaleBarra}` +
                `q0,-${barsCornerRadius} ${barsCornerRadius},-${barsCornerRadius}` +
                `h${barsWidth - barsCornerRadius * 2}` +
                `q${barsCornerRadius},0 ${barsCornerRadius},${barsCornerRadius}` +
                `v${parteVerticaleBarra}` +
                'z';
            }

            barsGroup.path(path)
              .attr({
                fill: params.data_colors[idx]?? '#666',
                'data-debug-info': params.debug? `value: ${itemValue}` : null
              });
          }
        }

        barX += barsWidth + (isLast ? 0 : params.barsGap);
      }

      barX += params.seriesGap;
    }



    // *********************************
    // =>> Legenda
    // *********************************
    const legendaEl = await legenda(chartInstance, legenda_params);
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
    console.error( 'MinimoCharts / bars →', e ); // eslint-disable-line
  }

}
