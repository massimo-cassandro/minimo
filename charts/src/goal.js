import { parseContainer, getElementFromContainer, waitForContainerSize } from './helpers/chart-utils.js';
import { createTextEl } from './helpers/create-text-element.js';

/**
 * Grafico obiettivo: un triangolo rettangolo disposto orizzontalmente, che mostra la porzione di
 * raggiungimento di un obiettivo. Un cursore sotto il triangolo indica il valore corrente e,
 * facoltativamente, l'area ancora mancante all'obiettivo viene evidenziata con attributi diversi.
 * Va eseguita con `this` legato all'istanza di `MinimoCharts`: normalmente si usa il wrapper `goalChart` di `charts/index.js`.
 * In caso di errore (parametri non validi, dimensioni mancanti) lo registra in console e restituisce `undefined`.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * goalChart(chartInstance, {
 *   debug: false, // info per il debug, FAC
 *   container: '#chart', // selettore o elemento DOM, FAC
 *   svgAttrs: {}, // attributi svg, FAC
 *   width: null, // larghezza, null = container, FAC
 *   height: null, // altezza totale dell'svg, FAC
 *   chartHeight: 80, // altezza del solo triangolo, FAC
 *   rightLabel: null, // etichetta sul lato destro, FAC
 *   rightLabelFontAttrs: { size: 16 }, // font etichetta destra, FAC
 *   rightLabelFontFilePath: null, // file font etichetta destra, FAC
 *   rightLabelRotateCounterClockWise: true, // verso di rotazione etichetta destra, FAC
 *   goalValue: 100, // valore dell'obiettivo, OBBL
 *   currentValue: 0, // valore corrente, FAC
 *   showMissingGoalArea: true, // evidenzia l'area mancante, FAC
 *   goalAreaAttrs: { fill: '#ddd', stroke: '#999', 'stroke-width': 1 }, // attributi triangolo, FAC
 *   missingGoalAttrs: { fill: '#f17575', stroke: '#c00', 'stroke-width': 1 }, // attributi area mancante, FAC
 *   showCurrentValue: false, // mostra il valore sotto il cursore, FAC
 *   currentValueFontAttrs: { size: 16 }, // font valore corrente, FAC
 *   currentValueFontFilePath: null, // file font valore corrente, FAC
 *   cursorSize: 12, // lato del cursore, FAC
 *   cursorAttrs: { fill: '#000' }, // attributi cursore, FAC
 *   currentValueFormatter: value => `${value}%`, // formattazione valore corrente, FAC
 * });
 *
 * @this {import('./helpers/core.js').MinimoCharts}
 * @param {Object} params - Parametri del grafico
 * @param {boolean} [params.debug=false] - Se true aggiunge agli elementi gli attributi `data-debug-info`, utili per il debug (default: false)
 * @param {string|HTMLElement|null} [params.container=null] - Container del grafico (selettore o elemento DOM); se null viene restituito il codice SVG (default: null)
 * @param {Object} [params.svgAttrs={}] - Attributi facoltativi per l'elemento svg (classe, ecc.) (default: {})
 * @param {number|null} [params.width=null] - Larghezza del grafico in px; se null viene usata quella del container. Lo spazio dell'eventuale etichetta destra viene sottratto alla larghezza totale (default: null)
 * @param {number|null} [params.height=null] - Altezza totale dell'svg in px. Se impostata, `chartHeight` viene ignorato e ricavato sottraendo lo spazio di cursore ed etichetta del valore; se null è data dalla somma di `chartHeight` e di tale spazio. Almeno uno tra `height` e `chartHeight` deve essere presente (default: null)
 * @param {number|null} [params.chartHeight=80] - Altezza del solo grafico (il triangolo), senza cursore ed etichette; usata solo se `height` è null (default: 80)
 * @param {string|null} [params.rightLabel=null] - Eventuale etichetta da collocare sul lato destro, ruotata di 90° (default: null)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.rightLabelFontAttrs] - Attributi font dell'etichetta destra (default: { size: 16 })
 * @param {string|null} [params.rightLabelFontFilePath=null] - Percorso del file del font dell'etichetta destra, per la conversione in tracciati (solo Node) (default: null)
 * @param {boolean} [params.rightLabelRotateCounterClockWise=true] - Verso di rotazione dell'etichetta destra: con true viene ruotata di 90°, con false di -90° (default: true)
 * @param {number} params.goalValue - Valore dell'obiettivo
 * @param {number} [params.currentValue=0] - Valore corrente; nel posizionamento del cursore non supera mai `goalValue` (default: 0)
 * @param {boolean} [params.showMissingGoalArea=true] - Se true l'area mancante all'obiettivo viene mostrata secondo gli attributi di `missingGoalAttrs` (default: true)
 * @param {Object} [params.goalAreaAttrs] - Attributi svg.js del triangolo dell'obiettivo (default: { fill: "#ddd", stroke: "#999", "stroke-width": 1 })
 * @param {Object} [params.missingGoalAttrs] - Attributi svg.js della porzione di obiettivo non raggiunta, usati solo se `showMissingGoalArea` è true (default: { fill: "#f17575", stroke: "#c00", "stroke-width": 1 })
 * @param {boolean} [params.showCurrentValue=false] - Mostra il valore corrente sotto il cursore (default: false)
 * @param {import('./helpers/core.js').ChartFontAttrs} [params.currentValueFontAttrs] - Attributi font del valore corrente (default: { size: 16 })
 * @param {string|null} [params.currentValueFontFilePath=null] - Percorso del file del font del valore corrente, per la conversione in tracciati (solo Node) (default: null)
 * @param {number} [params.cursorSize=12] - Lato del quadrato che circoscrive il triangolo del cursore (default: 12)
 * @param {Object} [params.cursorAttrs] - Attributi svg.js del cursore che indica il valore corrente (default: { fill: "#000" })
 * @param {(value: number) => string|number} [params.currentValueFormatter] - Funzione per la formattazione del valore corrente (default: percentuale in formato italiano, con al massimo 2 decimali)
 * @returns {Promise<string|undefined>} Il codice SVG se `container` è null, altrimenti `undefined` (il grafico viene aggiunto al container)
 */
export async function goal({
  /** mostra info utili per il debug */
  debug = false,

  /** container (selettore o elemento DOM), se null viene restituito il codice SVG */
  container = null,

  /** attributi facoltativi per l'svg (classe, ecc) */
  svgAttrs = {},

  /**
    larghezza e altezza del grafico (px),
    Se il container è presente e il parametro `width` è `null`,
    viene utilizzate la larghezza  del container.

    Lo spazio dell'eventuale etichetta orizzontale viene sottratto alla larghezza totale

    L'altezza finale dell'elemento SVG corrisponde a `height`.
    Se `height` è null, viene ricavato dalla somma di `chartHeight` e dallo spazio occupato dal cursore e dall'eventuale etichetta
    Se `chartHeight` è null, è ricavata dalla differenza tra height e spazio cursore, ecc...
    almeno uno dei due valori deve essere presente

  */
  width = null, // null || <value>
  height = null, // <value> || null
  chartHeight = 80, // <value> || null // altezza del solo grafico, senza etichette

  /** eventuale etichetta da collocare sul lato destro */
  rightLabel = null,

  /** attributi font etichetta */
  rightLabelFontAttrs = { size: 16 },

  /** per conversione in tracciati (solo node) */
  rightLabelFontFilePath = null,

  /** rotazione in senso orario (true) o antiorario (false) */
  rightLabelRotateCounterClockWise = true,

  /** obiettivo */
  goalValue,

  /** valore corrente */
  currentValue = 0,

  /** se true l'area mancante all'obiettivo viene mostrata secondi i parametri in missingGoalAttrs */
  showMissingGoalArea = true,

  /** attributi per aree triangolo obiettivo raggiunto e non */

  /** obiettivo raggiunto */
  goalAreaAttrs = {
    fill: '#ddd',
    stroke: '#999',
    'stroke-width': 1
  },

  /** porzione dell'obiettivo non raggiunta, parametri utilizzati solo se `showMissingGoalArea === true` */
  missingGoalAttrs = {
    fill: '#f17575',
    stroke: '#c00',
    'stroke-width': 1
  },

  /** mostra o meno il valore corrispondente al cursore  */
  showCurrentValue = false,

  /** attributi font valore current */
  currentValueFontAttrs = { size: 16 },
  currentValueFontFilePath = null,

  /** lato del quadrato che circoscrive il triangolo del cursore */
  cursorSize = 12,

  /** attributi per il cursore indicatore del valore corrente */
  cursorAttrs = {
    fill: '#000'
  },

  /** funzione per la formattazione valore locale */
  currentValueFormatter = value => (value/100).toLocaleString('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    style: 'percent'
  })

}) {

  const chartInstance = this;


  try {

    // i valori dell'obiettivo sono obbligatori
    if(goalValue == null || currentValue == null) {
      throw `goalValue e/o currentValue mancanti: goalValue: ${goalValue}, currentValue: ${currentValue})`;
    }

    container = getElementFromContainer(container);

    const svgCanvas = chartInstance.createSvgCanvas(container, debug);

    // calcolo altezza cursore ed eventuale etichetta valore corrente

    // calcolo dimensioni cursore + etichetta valore (se presente)
    // il cursore si vede sempre
    const cursorGap = 2; // spazio verticale tra cursore e altri elementi
    let cursorAndLabelHeight = cursorGap + cursorSize;

    // calcolo dimensioni etichetta e aggiunta a svgCanvas
    let currentValueLabelEl = null, currentValueLabelBbox;

    if(showCurrentValue) {
      currentValueLabelEl = await createTextEl(chartInstance, {
        text: currentValueFormatter(currentValue),
        textFill: currentValueFontAttrs.fill?? '#000',
        fontAttr: currentValueFontAttrs,
        fontFilePath: currentValueFontFilePath,
        parentElement: svgCanvas
      });
      currentValueLabelBbox = currentValueLabelEl.bbox();
      cursorAndLabelHeight += cursorGap + currentValueLabelBbox.height;
    }

    // ricalcolo altezza e dimensioni definitive
    /*
      `height` e `width` si riferiscono alle dimensioni complessiva dell'svg (compresi cursori ed etichette)
      `chartHeight` e `chartWidth` a quelle del solo grafico (il triangolo)

      se `height` è definita, `chartHeight` (l'altezza del grafico vero e proprio)
      è ricavata sottraendo `cursorAndLabelHeight` (il valore iniziale di `chartHeight`, se impostato, viene ignorato)

      Se `height` è null, il suo valore è dato dalla somma di `chartHeight` e `cursorAndLabelHeight`

      Se entrambi sono nulli viene inviato un errore

      Entrambi vengono ricalcolati in presenza dell'etichetta destra

      Se `height` non è null, l'altezza svg non viene mai modificata per adattarsi alle dimensioni delle scritte
      se eccedenti lo spazio disponibile
    */

    let heightWasDefined = false; // indica se l'altezza svg è predefinita o meno

    if(height != null) {
      chartHeight = height - cursorAndLabelHeight;
      heightWasDefined = true;
    } else {
      height = chartHeight != null? chartHeight + cursorAndLabelHeight: null;
    }

    // calcolo width
    [, width] = parseContainer({ container: container, width: width, height: height });

    if(!container && (!width || !height)) {
      throw `width e/o height mancanti: width: ${width}, height: ${height} (chartHeight: ${chartHeight})`;
    }

    ({ width, height } = await waitForContainerSize(container, { width, height }, debug));

    // larghezza iniziale grafico
    // al netto del padding orizzontale pari a 1/2 cursore, in modo che sia visibile interamente
    // quando posizionato agli estremi (anche in presenta di etichetta laterale, nel caso quest'ultima sia più alta del grafico)
    let chartWidth = width - cursorSize;


    // calcolo etichetta destra
    // le sue dimensioni (relative all'elemento ruotato) sono considerate nella definizione dell'altezza del'SVG
    // e delle dimesnioni del grafico
    // calcolo coordinate y del grafico

    let rightLabelGroup = null
      ,rightLabel_bbox
      ,chartYtop = 0 // coordinata y superiore del grafico
      ,chartYbottom = height - cursorAndLabelHeight // coordinata y inferiore del grafico
    ;

    if(rightLabel != null) {

      rightLabelGroup = svgCanvas.group() // necessario per la rotazione
        .attr({ 'data-debug-info': debug? 'Gruppo rightLabel' : null });

      const rightLabelEl = await createTextEl(chartInstance, {
        text: rightLabel,
        textFill: rightLabelFontAttrs.fill?? '#000',
        fontAttr: rightLabelFontAttrs,
        fontFilePath: rightLabelFontFilePath,
        parentElement: rightLabelGroup
      });

      // TODO[epic=charts] il nome `rightLabelRotateCounterClockWise` non corrisponde al comportamento: con true la rotazione è di 90° (senso orario in svg.js),
      // come indicato anche nel commento del parametro. Rinominare il parametro o invertire i valori
      rightLabelEl.rotate(rightLabelRotateCounterClockWise? 90 : -90);
      rightLabel_bbox = rightLabelGroup.bbox();
      chartWidth -= rightLabel_bbox.width;

      // altezza svg ricalcolata nel caso la scritta sia più alta del grafico
      // (solo nel caso in cui l'altezza non sia stata predefinita nei parametri)
      if(!heightWasDefined) {
        height = Math.max(height, rightLabel_bbox.height);
      }

      // spazio sotto il grafico ricalcolato nel caso la parte della scritta eccedente
      // il grafico sia maggiore dello spazio cursore
      cursorAndLabelHeight = Math.max(cursorAndLabelHeight, (rightLabel_bbox.height - chartHeight) / 2);

      // ricalcolo `chartYtop` nel caso la scritta sia più alta del grafico
      chartYtop = Math.max(chartYtop, (rightLabel_bbox.height - chartHeight) / 2);

      // chartYtop è sempre sopra (con etichette molto lunghe i valori si invertono)
      if(chartYtop > chartYbottom) {
        const tmp = chartYtop;
        chartYtop = chartYbottom;
        chartYbottom = tmp;
      }
    }

    svgCanvas.viewbox(0, 0, width, height)
      // .size(width, height)
      .attr(svgAttrs);


    // creazione grafico
    svgCanvas.path(
      `M0,${chartYbottom}` + // vertice a sinistra
      `L${chartWidth},${chartYtop}` + // vertice in alto a destra
      `L${chartWidth},${chartYbottom}` + // vertice in basso a destra
      'z'
    )
      .x(cursorSize / 2)
      .attr({
        'data-debug-info': debug? 'Grafico' : null,
        ...goalAreaAttrs
      });

    // posizionamento etichetta destra
    if(rightLabelGroup) {
      rightLabelGroup.move(
        chartWidth + cursorSize,
        (chartHeight - rightLabel_bbox.height) / 2
      );
    }


    // posizione current value (non tiene conto delle dimensioni del cursore)
    // non include il padding orizzontale (spazio cursore)
    // `currentValue` è impostato in modo che non superi `goalValue`
    const currentValuePosition = ((Math.min(goalValue, currentValue) * chartWidth) / goalValue);

    // area obiettivo mancante
    if(showMissingGoalArea && currentValue < goalValue) {
      // angolo opposto al lato destro del triangolo (in radianti)
      const angleRad = Math.atan(chartHeight / chartWidth);

      // coordinata Y superiore del lato sinistro dell'area target non raggiunto
      // (segmento AD nello schema)
      const currentValuePositionTop =
        chartYbottom - (
          (currentValuePosition) * // larghezza porzione obiettivo raggiunto
          Math.tan(angleRad)
        );

      svgCanvas.path(
        `M${currentValuePosition},${currentValuePositionTop}` + // vertice superiore sx
        `L${chartWidth},${chartYtop}` + // vertice in alto a destra
        `L${chartWidth},${chartYbottom}` + // vertice in basso a destra
        `L${currentValuePosition},${chartYbottom}` + // vertice inferiore sx
        'z'
      )
        .dx(cursorSize/2)
        .attr({
          'data-debug-info': debug? 'Area obiettivo mancante' : null,
          ...(missingGoalAttrs?? {})
        });
    }

    // creazione e posizionamento cursore
    svgCanvas.path(`M${cursorSize/2},0 L${cursorSize},${cursorSize} L0,${cursorSize} Z`)
      .attr({
        'data-debug-info': debug? 'Cursore' : null,
        ...(cursorAttrs?? {})
      })
      .move(
        currentValuePosition,
        chartYbottom + cursorGap
      );


    // posizionamento etichetta valore
    if(currentValueLabelEl) {
      const labelX = currentValuePosition - (currentValueLabelBbox.width / 2) + cursorSize / 2;
      currentValueLabelEl.move(
        labelX + currentValueLabelBbox.width > width
          ? width - currentValueLabelBbox.width  // blocca limite dx
          : Math.max(0, labelX),                 // blocca limite sx
        chartYbottom + (cursorGap * 2) + cursorSize
      );
    }

    if(!container) {
      return svgCanvas.svg();
    }


  } catch(e) {
    console.error( 'MinimoCharts / goal →', e ); // eslint-disable-line
  }
}
