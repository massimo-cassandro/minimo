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

  /**
    valori minimi e massimi per l'asse Y, se null vengono calcolati automaticamente.
    Il calcolo automatico di min_value usa 0 come soglia massima, per far sì che le
    barre partano da 0 quando i dati sono tutti positivi, estendendo il minimo verso
    il basso solo se sono presenti valori negativi
  */
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
  labelYFormatter: etiValue =>  (Math.ceil(etiValue / 1e3) || 0) // `|| 0` normalizza -0 (altrimenti mostrato come "-0")
    .toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) +
    (etiValue > 0? '\u2009K' : ''), // \u2009: thin space (https://www.compart.com/en/unicode/U+2009)

};

/**
 * Grafico a barre verticali: categorie sull'asse X, valori sull'asse Y.
 * Ogni sub-array di `values` è una serie; le barre con lo stesso indice sono raggruppate nella stessa categoria.
 * Gestisce i valori negativi: le barre partono dalla linea dello zero.
 * Va eseguita con `this` legato all'istanza di `MinimoCharts`: normalmente si usa il wrapper `barsChart` di `charts/index.js`.
 * In caso di errore (parametri non validi, dimensioni mancanti) lo registra in console e restituisce `undefined`.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * barsChart(chartInstance, {
 *   debug: false, // info per il debug, FAC
 *   container: '#chart', // selettore o elemento DOM, FAC
 *   width: null, // larghezza, null = container, FAC
 *   height: 300, // altezza, null = container, FAC
 *   svgAttrs: {}, // attributi svg, FAC
 *   values: [[10, 20, 30]], // una serie per ogni sub-array, OBBL
 *   barsGap: 5, // spazio tra le barre, FAC
 *   seriesGap: 10, // spazio tra i gruppi, FAC
 *   barsCornerRadius: 6, // raggio angoli barre, FAC
 *   xLabels: ['A', 'B', 'C'], // etichette di categoria, FAC
 *   padding: 10, // spazio attorno al bordo, FAC
 *   stepY_count: 4, // suddivisioni asse valori, FAC
 *   ticksLength: 8, // lunghezza ticks, FAC
 *   legenda: { items: [{ text: 'Serie 1' }] }, // legenda (`items`), OBBL
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
 *   showXgrid: false, // griglia verticale, FAC
 *   showYgrid: true, // griglia orizzontale, FAC
 *   gridLinesAttrs: { stroke: '#999', 'stroke-width': 1 }, // attributi griglia, FAC
 *   labelXAttrs: { size: 14, weight: 400, fill: '#999' }, // font etichette di categoria, FAC
 *   labelXFontFilePath: null, // file font etichette di categoria, FAC
 *   labelYAttrs: { size: 14, weight: 400, fill: '#999' }, // font etichette dei valori, FAC
 *   labelYFontFilePath: null, // file font etichette dei valori, FAC
 *   data_colors: null, // colori, null = default istanza, FAC
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
 * @param {Array<Array<number|null>>} params.values - Valori numerici delle barre: array di array, in cui ogni sub-array contiene i valori di una singola serie di barre (i valori null non vengono disegnati) (default: [])
 * @param {number} [params.barsGap] - Spazio tra una barra e l'altra, all'interno dello stesso gruppo di categoria (default: 5)
 * @param {number} [params.seriesGap] - Spazio tra un gruppo di categoria e l'altro (default: 10)
 * @param {number} [params.barsCornerRadius] - Raggio degli angoli delle barre sul lato lontano dallo zero; viene ridotto se supera metà dello spessore della barra (default: 6)
 * @param {Array<string|number>} [params.xLabels] - Etichette di categoria, una per ogni gruppo di barre; sono posizionate sull'asse X (default: [])
 * @param {number} [params.padding] - Spazio extra attorno al bordo (default: 10)
 * @param {number} [params.stepY_count] - Numero di suddivisioni dell'asse Y; può variare se i valori attraversano lo zero (default: 4)
 * @param {number} [params.ticksLength] - Lunghezza dei ticks in px (default: 8)
 * @param {Object} params.legenda - Opzioni della legenda, sempre mostrata: `items` è obbligatorio. Chiavi: `height` (20), `elements_gap` (25), `circles_radius` (20), `fontAttrs`, `fontFilePath` e `items`, array di oggetti di cui basta impostare `text`: `shape` è sempre `circle` e il colore è ricavato da `data_colors` (default: {})
 * @param {number} [params.yAxisLabelWidth] - Larghezza dell'area delle etichette dell'asse Y (default: 60)
 * @param {number} [params.xAxisLabelHeight] - Altezza dell'area delle etichette dell'asse X (default: 50)
 * @param {string|null} [params.yAxisTitle] - Titolo dell'asse Y (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.yAxisTitleAttrs] - Attributi font del titolo dell'asse Y (default: { size: 18, weight: 400, fill: "#999" })
 * @param {string|null} [params.yAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse Y (solo textToPath) (default: null)
 * @param {string|null} [params.xAxisTitle] - Titolo dell'asse X (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.xAxisTitleAttrs] - Attributi font del titolo dell'asse X (default: { size: 18, weight: 400, fill: "#999" })
 * @param {string|null} [params.xAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse X (solo textToPath) (default: null)
 * @param {number|null} [params.max_value] - Valore massimo dell'asse Y; se null viene calcolato dai dati (default: null)
 * @param {number|null} [params.min_value] - Valore minimo dell'asse Y; se null viene calcolato dai dati: 0 se sono tutti positivi (le barre partono da 0), altrimenti il valore minimo effettivo (default: null)
 * @param {Object} [params.axisAttrs] - Attributi svg.js delle linee degli assi, es. `{ stroke: '#414141', 'stroke-width': 1, class: 'xxxx' }` (default: linee grigie (#999) di spessore 2)
 * @param {Object} [params.ticksAttrs] - Attributi svg.js dei ticks (default: linee grigie (#999) di spessore 1)
 * @param {boolean} [params.showXgrid] - Mostra la griglia verticale, in corrispondenza dei ticks dell'asse X (default: false)
 * @param {boolean} [params.showYgrid] - Mostra la griglia orizzontale, in corrispondenza dei ticks dell'asse Y (default: true)
 * @param {Object} [params.gridLinesAttrs] - Attributi svg.js delle linee della griglia (default: linee grigie (#999) di spessore 1)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.labelXAttrs] - Attributi font (come in `MinimoCharts.defaults.font`, incluso `fill`) delle etichette dell'asse X (default: { size: 14, weight: 400, fill: "#999" })
 * @param {string|null} [params.labelXFontFilePath] - Percorso del file del font delle etichette dell'asse X (solo textToPath) (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.labelYAttrs] - Attributi font (come in `MinimoCharts.defaults.font`, incluso `fill`) delle etichette dell'asse Y (default: { size: 14, weight: 400, fill: "#999" })
 * @param {string|null} [params.labelYFontFilePath] - Percorso del file del font delle etichette dell'asse Y (solo textToPath) (default: null)
 * @param {string[]|null} [params.data_colors] - Colori delle serie di barre; se null vengono usati i colori di default dell'istanza (`chartInstance.defaults.colors`) (default: null)
 * @param {(value: number) => string|number} [params.labelYFormatter] - Funzione per formattare le etichette dell'asse Y; quella di default assume che il valore sia numerico (default: migliaia arrotondate per eccesso, con suffisso K)
 * @returns {Promise<string|undefined>} Il codice SVG se `container` è null, altrimenti `undefined` (il grafico viene aggiunto al container)
 */
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

    // calcolo automatico di min_value: 0 se i dati sono tutti positivi,
    // altrimenti il valore minimo effettivo (per includere le barre negative nell'area del grafico)
    if(params.min_value == null) {
      params.min_value = Math.min(0, ...flatValues.filter(v => v != null));
    }

    // container
    let containerElement;
    [containerElement, params.width, params.height] = parseContainer({ container: params.container, width: params.width, height: params.height });

    if(!containerElement && (!params.width || !params.height)) {
      throw `width e/o height mancanti: width: ${params.width}, height: ${params.height}`;
    }

    ({ width: params.width, height: params.height } = await waitForContainerSize(containerElement, { width: params.width, height: params.height }, params.debug));

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
    // TODO[epic=charts] `legenda.items` è di fatto obbligatorio: con il default `legenda: {}` questa riga va in errore.
    // Gestire l'assenza di `items` (omettere la legenda, come in lines con `legenda: null`) o segnalare un errore esplicito
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
      stepY_count,
      stepY_value,
      stepY_size,
      stepX_size,
      zero_y
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
        stepY_count,
        stepY_value,
        stepY_size,
        stepX_size,
        stepX_count,
        zero_y
      }
    });

    svgCanvas.add(cartesianAxisGroup);

    // *********************************
    // =>> disegno barre
    // *********************************

    // calcolo larghezza barre
    const barsWidth = (stepX_size - params.seriesGap - (params.barsGap * (params.values.length - 1))) / params.values.length
      // il raggio dell'angolo non può essere più grande della barra stessa, né negativo
      // (barsWidth può risultare negativo se seriesGap/barsGap non lasciano spazio sufficiente per tutte le serie)
      ,barsCornerRadius = Math.max(0, Math.min(params.barsCornerRadius, barsWidth / 2))
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
          // valori negativi: la barra scende dalla linea dello zero verso il basso,
          // invece di crescere dal basso verso l'alto
          const isNegative = itemValue < 0,
            // calcolo coordinata Y del valore e altezza assoluta della barra,
            // usando come baseline la linea dello zero (zero_y) invece del fondo del grafico
            itemY = chart_area.top + chart_area.height - (((itemValue - min_value) * chart_area.height) / (max_value - min_value)),
            barTop = isNegative? zero_y : itemY,
            barBottom = isNegative? itemY : zero_y,
            barH = barBottom - barTop,
            parteVerticaleBarra = barH - barsCornerRadius;
          let path;

          if(parteVerticaleBarra > 0) {

            if(barH <= barsCornerRadius) {

              const altezzaCornerRadius = barH;

              path = isNegative
                // angoli arrotondati in basso (lato lontano dallo zero), spigolo vivo in alto
                ? `M${barX},${barTop}` +
                  `q0,${altezzaCornerRadius} ${barsCornerRadius},${altezzaCornerRadius}` +
                  `h${barsWidth - barsCornerRadius * 2}` +
                  `q${barsCornerRadius},0 ${barsCornerRadius},-${altezzaCornerRadius}` +
                  'z'
                // angoli arrotondati in alto (lato lontano dallo zero), spigolo vivo in basso
                : `M${barX},${barBottom}` +
                  `q0,-${altezzaCornerRadius} ${barsCornerRadius},-${altezzaCornerRadius}` +
                  `h${barsWidth - barsCornerRadius * 2}` +
                  `q${barsCornerRadius},0 ${barsCornerRadius},${altezzaCornerRadius}` +
                  'z';

            } else {
              path = isNegative
                ? `M${barX},${barTop}` +
                  `v${parteVerticaleBarra}` +
                  `q0,${barsCornerRadius} ${barsCornerRadius},${barsCornerRadius}` +
                  `h${barsWidth - barsCornerRadius * 2}` +
                  `q${barsCornerRadius},0 ${barsCornerRadius},-${barsCornerRadius}` +
                  `v-${parteVerticaleBarra}` +
                  'z'
                : `M${barX},${barBottom}` +
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
