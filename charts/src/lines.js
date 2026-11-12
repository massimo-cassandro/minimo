import { parseStdAxisOpts } from './helpers/parse-std-axis-opts.js';
import { parseContainer, waitForContainerSize } from './helpers/chart-utils.js';
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
  // TODO[epic=charts] il valore 'auto' di `height` descritto qui sopra non è implementato: implementarlo o eliminarlo dal commento
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

  // aggiiunge un attributo data-title in corrispondenza dei punti
  // TODO[epic=charts] `addValuesTitle` al momento non ha effetto: l'attributo `data-title` è commentato nel ciclo dei punti (vedi sotto)
  addValuesTitle: true,

  /**
    Funzione per formattare le etichette dei valori dell'asse Y.
    Null per nessuna eleborazione.
    La funzione di default assume che il valore sia di tipo numerico
  */
  labelYFormatter: etiValue =>  (Math.ceil(etiValue / 1e3) || 0) // `|| 0` normalizza -0 (altrimenti mostrato come "-0")
    .toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) +
    (etiValue > 0? '\u2009K' : ''), // \u2009: thin space (https://www.compart.com/en/unicode/U+2009)

};

/**
 * Grafico a linee: una linea per ogni sub-array di `values`, con un punto per ogni valore.
 * Va eseguita con `this` legato all'istanza di `MinimoCharts`: normalmente si usa il wrapper `linesChart` di `charts/index.js`.
 * In caso di errore (parametri non validi, dimensioni mancanti) lo registra in console e restituisce `undefined`.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * linesChart(chartInstance, {
 *   debug: false, // info per il debug, FAC
 *   container: '#chart', // selettore o elemento DOM, FAC
 *   width: null, // larghezza, null = container, FAC
 *   height: 300, // altezza, null = container, FAC
 *   svgAttrs: {}, // attributi svg, FAC
 *   values: [[10, 20, 30]], // una serie per ogni linea, OBBL
 *   xLabels: ['A', 'B', 'C'], // etichette di categoria, FAC
 *   padding: 10, // spazio attorno al bordo, FAC
 *   stepY_count: 4, // suddivisioni asse valori, FAC
 *   ticksLength: 8, // lunghezza ticks, FAC
 *   legenda: { items: [{ text: 'Serie 1' }] }, // legenda, null per ometterla, FAC
 *   yAxisLabelWidth: 60, // larghezza etichette a sinistra, FAC
 *   xAxisLabelHeight: 50, // altezza etichette in basso, FAC
 *   yAxisTitle: null, // titolo asse a sinistra, FAC
 *   yAxisTitleAttrs: { size: 18, weight: 400, fill: '#999' }, // font titolo a sinistra, FAC
 *   yAxisTitleFontFilePath: null, // file font titolo a sinistra, FAC
 *   xAxisTitle: null, // titolo asse in basso, FAC
 *   xAxisTitleAttrs: { size: 18, weight: 400, fill: '#999' }, // font titolo in basso, FAC
 *   xAxisTitleFontFilePath: null, // file font titolo in basso, FAC
 *   max_value: null, // massimo, null = automatico, FAC
 *   min_value: null, // minimo, null = automatico, FAC
 *   axisAttrs: { stroke: '#999', 'stroke-width': 2 }, // attributi assi, FAC
 *   ticksAttrs: { stroke: '#999', 'stroke-width': 1 }, // attributi ticks, FAC
 *   showXgrid: true, // griglia verticale, FAC
 *   showYgrid: true, // griglia orizzontale, FAC
 *   gridLinesAttrs: { stroke: '#999', 'stroke-width': 1 }, // attributi griglia, FAC
 *   labelXAttrs: { size: 14, weight: 400, fill: '#999' }, // font etichette di categoria, FAC
 *   labelXFontFilePath: null, // file font etichette di categoria, FAC
 *   labelYAttrs: { size: 14, weight: 400, fill: '#999' }, // font etichette dei valori, FAC
 *   labelYFontFilePath: null, // file font etichette dei valori, FAC
 *   data_lines_attrs: { 'stroke-width': 2 }, // attributi linee dati, FAC
 *   data_points_attrs: { r: 4 }, // attributi punti, FAC
 *   data_colors: null, // colori, null = default istanza, FAC
 *   data_lines_widths: null, // spessori linee, FAC
 *   addValuesTitle: true, // data-title sui punti, FAC
 *   labelYFormatter: value => value.toLocaleString('it-IT'), // formattazione etichette dei valori, FAC
 * });
 *
 * @this {import('./helpers/core.js').MinimoCharts}
 * @param {Object} params - Parametri del grafico
 * @param {boolean} [params.debug] - Se true aggiunge agli elementi gli attributi `data-debug-info`, utili per il debug (default: false)
 * @param {string|HTMLElement|null} [params.container] - Container del grafico (selettore o elemento DOM); se null viene restituito il codice SVG (default: null)
 * @param {number|null} [params.width] - Larghezza del grafico in px; se null viene usata quella del container. Se non è impostata né ricavabile viene generato un errore. NB: il padding del container rientra nelle dimensioni del grafico, è preferibile non impostarlo (default: null)
 * @param {number|null} [params.height] - Altezza del grafico in px; se null viene usata quella del container. Se non è impostata né ricavabile viene generato un errore (default: 300)
 * @param {Object} [params.svgAttrs] - Attributi facoltativi per l'elemento svg (classe, ecc.) (default: {})
 * @param {Array<Array<number|null>>} params.values - Valori numerici delle linee: array di array, in cui ogni sub-array contiene i valori di una singola linea (i valori null vengono ignorati). L'ordine di rappresentazione segue quello dell'array: l'ultima serie è disegnata per ultima, sopra le altre (default: [])
 * @param {Array<string|number>} [params.xLabels] - Etichette corrispondenti ai vari valori, posizionate sull'asse X (default: [])
 * @param {number} [params.padding] - Spazio extra attorno al bordo (default: 10)
 * @param {number} [params.stepY_count] - Numero di suddivisioni dell'asse Y; può variare se i valori attraversano lo zero (default: 4)
 * @param {number} [params.ticksLength] - Lunghezza dei ticks in px (default: 8)
 * @param {Object|null} [params.legenda] - Opzioni della legenda; con null la legenda non viene mostrata, altrimenti `items` è obbligatorio. Chiavi: `height` (20), `elements_gap` (25), `lines_width` (20), `fontAttrs`, `fontFilePath` e `items`, array di oggetti di cui basta impostare `text`: `shape` è sempre `line` e `attrs` è ricavato dagli attributi delle linee dati (default: {})
 * @param {number} [params.yAxisLabelWidth] - Larghezza dell'area delle etichette dell'asse Y (default: 60)
 * @param {number} [params.xAxisLabelHeight] - Altezza dell'area delle etichette dell'asse X (default: 50)
 * @param {string|null} [params.yAxisTitle] - Titolo dell'asse Y (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.yAxisTitleAttrs] - Attributi font del titolo dell'asse Y (default: { size: 18, weight: 400, fill: "#999" })
 * @param {string|null} [params.yAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse Y (solo textToPath) (default: null)
 * @param {string|null} [params.xAxisTitle] - Titolo dell'asse X (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.xAxisTitleAttrs] - Attributi font del titolo dell'asse X (default: { size: 18, weight: 400, fill: "#999" })
 * @param {string|null} [params.xAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse X (solo textToPath) (default: null)
 * @param {number|null} [params.max_value] - Valore massimo dell'asse Y; se null viene calcolato dai dati (default: null)
 * @param {number|null} [params.min_value] - Valore minimo dell'asse Y; se null viene calcolato dai dati (default: null)
 * @param {Object} [params.axisAttrs] - Attributi svg.js delle linee degli assi, es. `{ stroke: '#414141', 'stroke-width': 1, class: 'xxxx' }` (default: linee grigie (#999) di spessore 2)
 * @param {Object} [params.ticksAttrs] - Attributi svg.js dei ticks (default: linee grigie (#999) di spessore 1)
 * @param {boolean} [params.showXgrid] - Mostra la griglia verticale, in corrispondenza dei ticks dell'asse X (default: true)
 * @param {boolean} [params.showYgrid] - Mostra la griglia orizzontale, in corrispondenza dei ticks dell'asse Y (default: true)
 * @param {Object} [params.gridLinesAttrs] - Attributi svg.js delle linee della griglia (default: linee grigie (#999) di spessore 1)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.labelXAttrs] - Attributi font (come in `MinimoCharts.defaults.font`, incluso `fill`) delle etichette dell'asse X (default: { size: 14, weight: 400, fill: "#999" })
 * @param {string|null} [params.labelXFontFilePath] - Percorso del file del font delle etichette dell'asse X (solo textToPath) (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.labelYAttrs] - Attributi font (come in `MinimoCharts.defaults.font`, incluso `fill`) delle etichette dell'asse Y (default: { size: 14, weight: 400, fill: "#999" })
 * @param {string|null} [params.labelYFontFilePath] - Percorso del file del font delle etichette dell'asse Y (solo textToPath) (default: null)
 * @param {Object|Object[]} [params.data_lines_attrs] - Attributi svg.js delle linee dati. Se è un oggetto ne viene letto solo `stroke-width`, come spessore di default; se è un array, ogni elemento contiene gli attributi della linea con lo stesso indice. Il colore (`stroke`) è sempre ricavato da `data_colors` (default: linee di spessore 2)
 * @param {Object} [params.data_points_attrs] - Attributi svg.js dei cerchi aggiunti a ogni punto delle linee (NB: non aggiungere `cx` o `cy`). `r` può essere un numero (uguale per tutti i punti) o un array, in cui ogni valore si applica alla linea con lo stesso indice (default: { r: 4 })
 * @param {string[]|null} [params.data_colors] - Colori delle linee; se null vengono usati i colori di default dell'istanza (`chartInstance.defaults.colors`) (default: null)
 * @param {Array<number|null>|null} [params.data_lines_widths] - Spessori delle linee: array in cui ogni valore si applica alla linea con lo stesso indice; i valori null o undefined, o l'intero parametro null, corrispondono a `data_lines_attrs['stroke-width']` (in sua mancanza a 1) (default: null)
 * @param {boolean} [params.addValuesTitle] - Aggiunge un attributo `data-title` in corrispondenza dei punti (al momento non attivo, vedi TODO nel codice) (default: true)
 * @param {(value: number) => string|number} [params.labelYFormatter] - Funzione per formattare le etichette dell'asse Y; quella di default assume che il valore sia numerico (default: migliaia arrotondate per eccesso, con suffisso K)
 * @returns {Promise<string|undefined>} Il codice SVG se `container` è null, altrimenti `undefined` (il grafico viene aggiunto al container)
 */
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
    let containerElement;
    [containerElement, params.width, params.height] = parseContainer({ container: params.container, width: params.width, height: params.height });

    if(!containerElement && (!params.width || !params.height)) {
      throw `width e/o height mancanti: width: ${params.width}, height: ${params.height}`;
    }

    ({ width: params.width, height: params.height } = await waitForContainerSize(containerElement, { width: params.width, height: params.height }, params.debug));

    // =>> ricalcolo data_lines_attrs (utilizzato anche per le linee della legenda)
    const default_line_width = params.data_lines_attrs['stroke-width']?? 1;

    // TODO[epic=charts] se `data_lines_attrs` è un oggetto (come nel default) ne viene usato solo `stroke-width`:
    // `params.data_lines_attrs[idx]` è undefined e gli altri attributi vengono ignorati. Applicare l'oggetto a tutte le linee
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
    if(params.legenda != null) {

      params.legenda = {

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


        ...(params.legenda??[])
      };

      // legenda.items (elementi della legenda)
      // il ciclo viene eseguito su params.data_lines_attrs per essere certi che il numero di elementi coincida
      // è utilizzato in ordine inverso in modo che il primo elmento della legenda corrisponda alla linea in primo piano
      params.legenda.items = params.data_lines_attrs.toReversed().map((line_attr, idx) => {
        // TODO[epic=charts] `legenda.items` è di fatto obbligatorio se `legenda` non è null: con il default `legenda: {}` questa riga va in errore.
        // Usare un array vuoto in assenza di `items`, o segnalare un errore esplicito
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
    }


    // numero di step dell'asse X
    const stepX_count = params.values.reduce((prev, curr) => Math.max(prev, curr.length), 0);

    const svgCanvas = chartInstance.createSvgCanvas(params.container, params.debug)
      .size(params.width, params.height)
      .viewbox(0, 0, params.width, params.height)
      .attr({...params.svgAttrs});

    /*
      L'ultimo punto di ogni linea cade sul limite destro della chart area:
      se il padding è inferiore al raggio massimo dei punti, il cerchio verrebbe tagliato dal bordo dell'svg.
      In tal caso il padding destro viene portato al raggio massimo.
    */
    const radii = Array.isArray(params.data_points_attrs.r)
      ? params.data_points_attrs.r
      : [params.data_points_attrs.r];
    const maxPointRadius = Math.max(0, ...radii.map(r => Number(r) || 0));
    const paddingRight = Math.max(params.padding, maxPointRadius);

    // pre-elaborazione e calcolo di alcuni elementi (chartArea)
    // nuove variabili definite da parseStdAxisOpts
    const {
      max_value,
      min_value,
      chart_area,
      stepY_count,
      stepY_value,
      stepY_size,
      stepX_size,
      zero_y
    } = parseStdAxisOpts({
      max_value: params.max_value,
      min_value: params.min_value,
      values: flatValues,
      legenda: params.legenda,
      padding: params.padding,
      padding_right: paddingRight,
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
        stepY_count,
        stepY_value,
        stepY_size,
        stepX_size,
        stepX_count,
        zero_y
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
        // i valori null vengono ignorati

        if(pointValue != null) {

          const x = chart_area.left + stepX_size * pointIdx,
            y = chart_area.top + chart_area.height - (((pointValue - min_value) * chart_area.height) / (max_value - min_value));

          coords.push([x,y]);
        }
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
            'data-debug-info': params.debug? `Valore: ${params.values[idx][coord_idx]}` : null,
            // 'data-title': params.addValuesTitle? params.values[idx][coord_idx] : null // TODO ricontrollare correttezza indici
          });
      });


    });


    // =>> Legenda
    if(params.legenda) {
      const legendaEl = await legenda(chartInstance, params.legenda);
      legendaEl.attr({ 'data-cfg.debug-info': params.debug? 'Legenda' : null });
      const legendaBbox = legendaEl.bbox();

      legendaEl.dmove(
        (params.width - legendaBbox.width) / 2,
        params.padding
      );
      legendaEl.y(params.padding);

      legendaEl.x((params.width - legendaBbox.width) / 2);

      svgCanvas.add(legendaEl);
    }


    if(!params.container) {
      return svgCanvas.svg();
    }


  } catch(e) {
    console.error( '[MinimoCharts → lines]', e ); // eslint-disable-line
  }

}
