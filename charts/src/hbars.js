// barre orizzontali — analogo di bars.js con assi invertiti:
// categorie sull'asse verticale (a sinistra), valori sull'asse orizzontale (in basso)

import { parseStdAxisOpts } from './helpers/parse-std-axis-opts.js';
import { normalizeLegacyLabelParams, parseContainer, waitForContainerSize } from './helpers/chart-utils.js';
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
  */
  width: null, // null || <value>
  height: 300, // <value> || null

  /** attributi facoltativi per l'svg (classe, ecc) */
  svgAttrs: {},

  /**
    valori numerici per la definizione delle barre
    è un array di array, in cui ogni subarray contiene i valori di una singola serie di barre
  */
  values: [],

  /** spazio tra una barra e l'altra, all'interno dello stesso gruppo di categoria */
  barsGap: 5,

  /** spazio tra un gruppo di categoria e l'altro */
  seriesGap: 10,

  /** bars corner radius (lato esterno, lontano dallo zero) */
  barsCornerRadius: 6,

  /**
    etichette di categoria, una per ogni gruppo di barre. Sono posizionate sull'asse verticale (a sinistra)
  */
  xLabels: [],

  /**  spazio extra attorno al bordo */
  padding: 10,

  /**  suddivisioni asse dei valori (in basso) */
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
    larghezza area etichette di categoria (asse verticale, a sinistra)
  */
  yAxisLabelWidth: 60,

  /**  altezza area etichette dell'asse dei valori (in basso) */
  xAxisLabelHeight: 50,

  /** titoli assi: yAxisTitle → asse categorie (a sinistra), xAxisTitle → asse valori (in basso) */
  yAxisTitle: null,
  yAxisTitleAttrs: {...default_font_attrs, size: 18},
  yAxisTitleFontFilePath: null,

  xAxisTitle: null,
  xAxisTitleAttrs: {...default_font_attrs, size: 18},
  xAxisTitleFontFilePath: null,

  /**
    valori minimi e massimi per l'asse dei valori, se null vengono calcolati automaticamente.
    Il calcolo automatico di min_value usa 0 come soglia massima, per far sì che le
    barre partano da 0 quando i dati sono tutti positivi, estendendo il minimo verso
    sinistra solo se sono presenti valori negativi
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
    griglia: showXgrid → griglia orizzontale (asse categorie), showYgrid → griglia verticale (asse valori)
  */
  showXgrid: false,
  showYgrid: true,
  gridLinesAttrs: default_lines_attrs,

  xLabelAttrs: default_font_attrs, // etichette di categoria (a sinistra)
  xLabelFontFilePath: null,  // percorso font per textToPath

  yLabelAttrs: default_font_attrs, // etichette dell'asse dei valori (in basso)
  yLabelFontFilePath: null,  // percorso font per textToPath



  /** colori delle barre */
  data_colors: null,


  /**
    Funzione per formattare le etichette dell'asse dei valori (in basso).
    Null per nessuna eleborazione.
    La funzione di default assume che il valore sia di tipo numerico
  */
  yLabelFormatter: (/** @type {number} */ etiValue) =>  (Math.ceil(etiValue / 1e3) || 0) // `|| 0` normalizza -0 (altrimenti mostrato come "-0")
    .toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) +
    (etiValue > 0? '\u2009K' : ''), // \u2009: thin space (https://www.compart.com/en/unicode/U+2009)

};

/**
 * Grafico a barre orizzontali, analogo di `bars` con assi invertiti:
 * categorie sull'asse verticale (a sinistra), valori sull'asse orizzontale (in basso).
 * NB: i parametri mantengono i nomi di `bars`: `xLabels`, `xLabel*` e `showXgrid` si riferiscono alle categorie,
 * `stepY_count`, `yLabel*` e `showYgrid` ai valori; `xAxis*` e `yAxis*` indicano invece la posizione (in basso / a sinistra).
 * In caso di errore (parametri non validi, dimensioni mancanti) lo registra in console e restituisce `undefined`.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * hBarsChart(chartInstance, {
 *   axisAttrs: { stroke: '#999', 'stroke-width': 2 }, // attributi assi, FAC
 *   barsCornerRadius: 6, // raggio angoli barre, FAC
 *   barsGap: 5, // spazio tra le barre, FAC
 *   container: '#chart', // selettore o elemento DOM, FAC
 *   data_colors: null, // colori, null = default istanza, FAC
 *   debug: false, // info per il debug, FAC
 *   gridLinesAttrs: { stroke: '#999', 'stroke-width': 1 }, // attributi griglia, FAC
 *   height: 300, // altezza, null = container, FAC
 *   legenda: { items: [{ text: 'Serie 1' }] }, // legenda (`items`), OBBL
 *   max_value: null, // massimo, null = automatico, FAC
 *   min_value: null, // minimo, null = automatico, FAC
 *   padding: 10, // spazio attorno al bordo, FAC
 *   seriesGap: 10, // spazio tra i gruppi, FAC
 *   showXgrid: false, // griglia orizzontale, FAC
 *   showYgrid: true, // griglia verticale, FAC
 *   stepY_count: 4, // suddivisioni asse valori, FAC
 *   svgAttrs: {}, // attributi svg, FAC
 *   ticksAttrs: { stroke: '#999', 'stroke-width': 1 }, // attributi ticks, FAC
 *   ticksLength: 8, // lunghezza ticks, FAC
 *   values: [[10, 20, 30]], // una serie per ogni sub-array, OBBL
 *   width: null, // larghezza, null = container, FAC
 *   xAxisLabelHeight: 50, // altezza etichette in basso, FAC
 *   xAxisTitle: null, // titolo asse in basso, FAC
 *   xAxisTitleAttrs: { size: 18, weight: 400, fill: '#999' }, // font titolo in basso, FAC
 *   xAxisTitleFontFilePath: null, // file font titolo in basso, FAC
 *   xLabelAttrs: { size: 14, weight: 400, fill: '#999' }, // font etichette di categoria, FAC
 *   xLabelFontFilePath: null, // file font etichette di categoria, FAC
 *   xLabels: ['A', 'B', 'C'], // etichette di categoria, FAC
 *   yAxisLabelWidth: 60, // larghezza etichette a sinistra, FAC
 *   yAxisTitle: null, // titolo asse a sinistra, FAC
 *   yAxisTitleAttrs: { size: 18, weight: 400, fill: '#999' }, // font titolo a sinistra, FAC
 *   yAxisTitleFontFilePath: null, // file font titolo a sinistra, FAC
 *   yLabelAttrs: { size: 14, weight: 400, fill: '#999' }, // font etichette dei valori, FAC
 *   yLabelFontFilePath: null, // file font etichette dei valori, FAC
 *   yLabelFormatter: value => value.toLocaleString('it-IT'), // formattazione etichette dei valori, FAC
 * });
 *
 * @param {import('./helpers/core.js').MinimoCharts} chartInstance - Istanza di `MinimoCharts`
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
 * @param {Array<string|number>} [params.xLabels] - Etichette di categoria, una per ogni gruppo di barre; sono posizionate sull'asse verticale, a sinistra (default: [])
 * @param {number} [params.padding] - Spazio extra attorno al bordo (default: 10)
 * @param {number} [params.stepY_count] - Numero di suddivisioni dell'asse dei valori (in basso); può variare se i valori attraversano lo zero (default: 4)
 * @param {number} [params.ticksLength] - Lunghezza dei ticks in px (default: 8)
 * @param {Partial<Parameters<typeof legenda>[1]>} params.legenda - Opzioni della legenda, sempre mostrata: `items` è obbligatorio. Chiavi: `height` (20), `elements_gap` (25), `circles_radius` (20), `fontAttrs`, `fontFilePath` e `items`, array di oggetti di cui basta impostare `text`: `shape` è sempre `circle` e il colore è ricavato da `data_colors` (default: {})
 * @param {number} [params.yAxisLabelWidth] - Larghezza dell'area delle etichette di categoria (asse verticale, a sinistra) (default: 60)
 * @param {number} [params.xAxisLabelHeight] - Altezza dell'area delle etichette dell'asse dei valori (in basso) (default: 50)
 * @param {string|null} [params.yAxisTitle] - Titolo dell'asse delle categorie (a sinistra) (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.yAxisTitleAttrs] - Attributi font del titolo dell'asse delle categorie (default: { size: 18, weight: 400, fill: "#999" })
 * @param {string|null} [params.yAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse delle categorie (solo textToPath) (default: null)
 * @param {string|null} [params.xAxisTitle] - Titolo dell'asse dei valori (in basso) (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.xAxisTitleAttrs] - Attributi font del titolo dell'asse dei valori (default: { size: 18, weight: 400, fill: "#999" })
 * @param {string|null} [params.xAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse dei valori (solo textToPath) (default: null)
 * @param {number|null} [params.max_value] - Valore massimo dell'asse dei valori (in basso); se null viene calcolato dai dati (default: null)
 * @param {number|null} [params.min_value] - Valore minimo dell'asse dei valori (in basso); se null viene calcolato dai dati: 0 se sono tutti positivi (le barre partono da 0), altrimenti il valore minimo effettivo (default: null)
 * @param {Object} [params.axisAttrs] - Attributi svg.js delle linee degli assi, es. `{ stroke: '#414141', 'stroke-width': 1, class: 'xxxx' }` (default: linee grigie (#999) di spessore 2)
 * @param {Object} [params.ticksAttrs] - Attributi svg.js dei ticks (default: linee grigie (#999) di spessore 1)
 * @param {boolean} [params.showXgrid] - Mostra la griglia orizzontale (asse delle categorie) (default: false)
 * @param {boolean} [params.showYgrid] - Mostra la griglia verticale (asse dei valori) (default: true)
 * @param {Object} [params.gridLinesAttrs] - Attributi svg.js delle linee della griglia (default: linee grigie (#999) di spessore 1)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.xLabelAttrs] - Attributi font (come in `MinimoCharts.defaults.font`, incluso `fill`) delle etichette di categoria (a sinistra) (default: { size: 14, weight: 400, fill: "#999" })
 * @param {string|null} [params.xLabelFontFilePath] - Percorso del file del font delle etichette di categoria (solo textToPath) (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.yLabelAttrs] - Attributi font (come in `MinimoCharts.defaults.font`, incluso `fill`) delle etichette dell'asse dei valori (in basso) (default: { size: 14, weight: 400, fill: "#999" })
 * @param {string|null} [params.yLabelFontFilePath] - Percorso del file del font delle etichette dell'asse dei valori (in basso) (solo textToPath) (default: null)
 * @param {string[]|null} [params.data_colors] - Colori delle serie di barre; se null vengono usati i colori di default dell'istanza (`chartInstance.defaults.colors`) (default: null)
 * @param {(value: number) => string|number} [params.yLabelFormatter] - Funzione per formattare le etichette dell'asse dei valori (in basso); quella di default assume che il valore sia numerico (default: migliaia arrotondate per eccesso, con suffisso K)
 * @returns {Promise<string|undefined>} Il codice SVG se `container` è null, altrimenti `undefined` (il grafico viene aggiunto al container)
 */
export function hBarsChart(chartInstance, params) {
  return hbars.call(chartInstance, params);
}

/**
 * Implementazione di `hBarsChart`, a cui si rimanda per la descrizione e l'elenco completo dei parametri.
 * Va eseguita con `this` legato all'istanza di `MinimoCharts`: normalmente si usa `hBarsChart`.
 *
 * @this {import('./helpers/core.js').MinimoCharts}
 * @param {Parameters<typeof hBarsChart>[1]} userParams - Parametri del grafico (vedi `hBarsChart`)
 * @returns {Promise<string|undefined>} Il codice SVG se `container` è null, altrimenti `undefined` (il grafico viene aggiunto al container)
 */
export async function hbars(userParams) {

  const chartInstance = this;

  // `userParams` resta distinto da `params` perché quest'ultimo assuma il tipo risultante dall'unione con i default
  const params = {...default_params, ...normalizeLegacyLabelParams(userParams)}; // fallback per i vecchi nomi `labelX*` e `labelY*`
  const data_colors = params.data_colors?? chartInstance.defaults.colors;

  try {

    // controllo values
    params.values.forEach(subarray => {
      if(!Array.isArray(subarray)) {
        throw 'L’elemento `values` deve essere un array di soli array';
      }
    });

    const flatValues = params.values.flat(); // utilizzato anche in seguito
    if(flatValues.filter(v => isNaN(/** @type {number} */ (v))).length) {
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
    const userLegenda = /** @type {Partial<Parameters<typeof legenda>[1]>} */ (params.legenda);

    /** @type {Parameters<typeof legenda>[1]} */
    const legenda_params = {

      ...{
        /** altezza legenda */
        height: 20,

        /** spazio tra gli elementi della legenda */
        elements_gap: 25,

        /** dimensioni delle forme della legenda (NB: solo tondi) */
        circles_radius: 20,

        /** attributi svg.js dei font del testo della legenda (null utilizza default) */
        fontAttrs: /** @type {import('./helpers/core.js').ChartFontAttrs} */ ({
          fill: '#333',
          'font-size': 14,
          'font-weight': 400
        }),
        fontFilePath: null,
      },

      ...userLegenda,
      items: [] // impostato qui sotto
    };


    // legenda.items (elementi della legenda)
    // TODO[epic=charts] `legenda.items` è di fatto obbligatorio: con il default `legenda: {}` questa riga va in errore.
    // Gestire l'assenza di `items` (omettere la legenda, come in lines con `legenda: null`) o segnalare un errore esplicito
    legenda_params.items = /** @type {import('./helpers/legenda.js').LegendaItem[]} */ (userLegenda.items).map((item, idx) => {
      return {
        ...item,
        shape: /** @type {'circle'} */ ('circle'),
        attrs: {
          ...(item.attrs?? {}),
          fill: data_colors[idx]?? '#666',
        }
      };
    });


    // numero di step dell'asse delle categorie
    const stepX_count = params.values.reduce((prev, curr) => Math.max(prev, curr.length), 0) + 1;

    const svgCanvas = chartInstance.createSvgCanvas(params.container, params.debug)
      .viewbox(0, 0, params.width, params.height)
      .attr({...params.svgAttrs});


    // pre-elaborazione e calcolo di alcuni elementi (chartArea)
    // nuove variabili definite da parseStdAxisOpts (orientation:'horizontal':
    // stepY_* si riferiscono all'asse dei valori (X), stepX_* all'asse delle categorie (Y))
    const {
      max_value,
      min_value,
      chart_area,
      stepY_count,
      stepY_value,
      stepY_size,
      stepX_size,
      zero_y: zero_x
    } = parseStdAxisOpts({
      orientation: 'horizontal',
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
    // Gli argomenti di cartesianAxis sono uguali a quelli di hbars
    // con l'aggiunta di quelli calcolati da parseStdAxisOpts
    // non tutti sono necessari ma vengono passati lo stesso per comodità
    const cartesianAxisGroup = await cartesianAxis(chartInstance, {
      ...params,
      orientation: 'horizontal',
      xLabelsOnTicks: false, // posiziona l'etichetta di categoria al centro di ogni step
      ...{
        // ripetute perché assumano il tipo `number` (in `params` sono dichiarate `number|null`)
        width: params.width,
        height: params.height,
        max_value,
        min_value,
        chart_area,
        stepY_count,
        stepY_value,
        stepY_size,
        stepX_size,
        stepX_count,
        zero_y: zero_x
      }
    });

    svgCanvas.add(cartesianAxisGroup);

    // *********************************
    // =>> disegno barre
    // *********************************

    // calcolo altezza (spessore) barre
    const barsHeight = (stepX_size - params.seriesGap - (params.barsGap * (params.values.length - 1))) / params.values.length
      // il raggio dell'angolo non può essere più grande dello spessore della barra stessa, né negativo
      // (barsHeight può risultare negativo se seriesGap/barsGap non lasciano spazio sufficiente per tutte le serie,
      // frequente qui perché l'asse delle categorie è vincolato all'altezza del grafico, spesso più stretta della larghezza)
      ,barsCornerRadius = Math.max(0, Math.min(params.barsCornerRadius, barsHeight / 2))
    ;


    const barsGroup = svgCanvas.group()
      .attr({ 'data-debug-info': params.debug? 'Gruppo barre' : null });

    let barY = chart_area.top + params.seriesGap / 2;

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
          // valori negativi: la barra si estende dalla linea dello zero verso sinistra,
          // invece di crescere da sinistra verso destra
          const isNegative = itemValue < 0,
            // calcolo coordinata X del valore, usando come baseline la linea dello zero (zero_x)
            // invece del margine sinistro del grafico. Nessuna inversione: l'asse X cresce verso destra
            itemX = chart_area.left + (((itemValue - min_value) * chart_area.width) / (max_value - min_value)),
            barLeft = isNegative? itemX : zero_x,
            barRight = isNegative? zero_x : itemX,
            barW = barRight - barLeft,
            parteOrizzontaleBarra = barW - barsCornerRadius;
          let path;

          if(parteOrizzontaleBarra > 0) {

            if(barW <= barsCornerRadius) {

              const larghezzaCornerRadius = barW;

              path = isNegative
                // angoli arrotondati a sinistra (lato lontano dallo zero), spigolo vivo a destra
                ? `M${zero_x},${barY}` +
                  `q-${larghezzaCornerRadius},0 -${larghezzaCornerRadius},${barsCornerRadius}` +
                  `v${barsHeight - barsCornerRadius * 2}` +
                  `q0,${barsCornerRadius} ${larghezzaCornerRadius},${barsCornerRadius}` +
                  'z'
                // angoli arrotondati a destra (lato lontano dallo zero), spigolo vivo a sinistra
                : `M${zero_x},${barY}` +
                  `q${larghezzaCornerRadius},0 ${larghezzaCornerRadius},${barsCornerRadius}` +
                  `v${barsHeight - barsCornerRadius * 2}` +
                  `q0,${barsCornerRadius} -${larghezzaCornerRadius},${barsCornerRadius}` +
                  'z';

            } else {
              path = isNegative
                ? `M${zero_x},${barY}` +
                  `h-${parteOrizzontaleBarra}` +
                  `q-${barsCornerRadius},0 -${barsCornerRadius},${barsCornerRadius}` +
                  `v${barsHeight - barsCornerRadius * 2}` +
                  `q0,${barsCornerRadius} ${barsCornerRadius},${barsCornerRadius}` +
                  `h${parteOrizzontaleBarra}` +
                  'z'
                : `M${zero_x},${barY}` +
                  `h${parteOrizzontaleBarra}` +
                  `q${barsCornerRadius},0 ${barsCornerRadius},${barsCornerRadius}` +
                  `v${barsHeight - barsCornerRadius * 2}` +
                  `q0,${barsCornerRadius} -${barsCornerRadius},${barsCornerRadius}` +
                  `h-${parteOrizzontaleBarra}` +
                  'z';
            }

            barsGroup.path(path)
              .attr({
                fill: data_colors[idx]?? '#666',
                'data-debug-info': params.debug? `value: ${itemValue}` : null
              });
          }
        }

        barY += barsHeight + (isLast ? 0 : params.barsGap);
      }

      barY += params.seriesGap;
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
    console.error( 'MinimoCharts / hbars →', e ); // eslint-disable-line
  }

}
