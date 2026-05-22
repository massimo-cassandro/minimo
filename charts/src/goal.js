// mostra un triangolo rettangolo disposto orizzontalmente che mostra
// la porzione di raggiungimento di un obiettivo

import { parseContainer, getElementFromContainer } from './helpers/chart-utils.js';
import { createTextEl } from './helpers/create-text-element.js';

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


    if(!width || !height) {
      throw `width e/o height mancanti: width: ${width}, height: ${height} (chartHeight: ${chartHeight})`;
    }

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
