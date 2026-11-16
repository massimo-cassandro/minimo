import { G } from '@svgdotjs/svg.js';
import { createTextEl } from './create-text-element.js';

/**
 * Voce della legenda.
 * @typedef {Object} LegendaItem
 * @property {'line'|'circle'} [shape] - Forma che accompagna il testo della voce (default: "line")
 * @property {Object} [attrs] - Attributi svg.js della forma (default: {})
 * @property {string} [text] - Testo della voce (default: "__label__")
 */

/**
 * Costruisce la legenda di un grafico: un gruppo svg.js con le voci disposte in orizzontale,
 * ognuna composta da una forma (linea o cerchio) e dal relativo testo.
 * Se è impostato `max_width` e le voci non ci stanno su una sola riga, vengono distribuite su più righe,
 * ognuna centrata rispetto alla più larga (una voce più larga di `max_width` occupa comunque una riga da sola).
 * Il gruppo restituito non è aggiunto ad alcun svg e va posizionato da chi lo richiede:
 * va costruito prima del calcolo dell'area del grafico, in modo da conoscerne l'altezza effettiva (`bbox().height`).
 * In caso di errore (es. `items` vuoto) lo registra in console e rilancia l'errore.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * await legenda(chartInstance, { // istanza di MinimoCharts, OBBL
 *   height: 20, // altezza di ogni riga della legenda, FAC
 *   elements_gap: 20, // spazio orizzontale tra le voci, FAC
 *   rows_gap: 8, // spazio verticale tra le righe, FAC
 *   max_width: null, // larghezza massima, oltre la quale si va a capo, FAC
 *   lines_width: 20, // lunghezza delle forme `line`, FAC
 *   circles_radius: 20, // diametro delle forme `circle`, FAC
 *   fontAttrs: null, // attributi font dei testi, FAC
 *   fontFilePath: null, // percorso file font (solo textToPath), FAC
 *   items: [{ shape: 'line', attrs: {}, text: 'Serie 1' }], // voci della legenda, OBBL
 * });
 *
 * @param {import('./core.js').MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {Object} params - Parametri della legenda
 * @param {number} [params.height=20] - Altezza di ogni riga della legenda in px (default: 20)
 * @param {number} [params.elements_gap=20] - Spazio orizzontale tra una voce e l'altra (default: 20)
 * @param {number} [params.rows_gap=8] - Spazio verticale tra una riga e l'altra (default: 8)
 * @param {number|null} [params.max_width=null] - Larghezza massima della legenda in px; se superata le voci vanno a capo. Con null la legenda è sempre su una riga (default: null)
 * @param {number} [params.lines_width=20] - Lunghezza delle forme di tipo `line` (default: 20)
 * @param {number} [params.circles_radius=20] - Dimensione delle forme di tipo `circle`; nonostante il nome corrisponde al diametro (default: 20)
 * @param {import('./core.js').ChartFontAttrs|null} [params.fontAttrs=null] - Attributi svg.js dei font dei testi; se null vengono usati quelli di default dell'istanza (default: null)
 * @param {string|null} [params.fontFilePath=null] - Percorso del file del font, per la conversione dei testi in tracciati (default: null)
 * @param {LegendaItem[]} params.items - Voci della legenda, almeno una (default: [])
 * @returns {Promise<import('@svgdotjs/svg.js').G>} Il gruppo svg.js della legenda
 */
export async function legenda(chartInstance, {

  /** altezza di ogni riga della legenda */
  height = 20,

  /** spazio orizzontale tra gli elementi della legenda */
  elements_gap = 20,

  /** spazio verticale tra le righe della legenda */
  rows_gap = 8,

  /** larghezza massima (null: nessun limite, una sola riga) */
  max_width = null,

  /** dimensioni delle forme della legenda */
  lines_width = 20,
  circles_radius = 20,

  /** attributi svg.js dei font del testo della legenda (null utilizza default) */
  fontAttrs = null,

  /** percorso font file per textToPath */
  fontFilePath = null,

  /** elementi della legenda */
  items = [],


}) {

  /**
   * elementi di default di items
   * @type {LegendaItem}
   */
  const items_defaults = {

    shape: 'line', // line || circle
    attrs: {}, // attributi svg.js di shape
    text: '__label__', // testo della voce
  };

  try {


    if(!items.length) {
      throw 'nessuna voce in `items`';
    }

    items = items.map(i => ({...items_defaults, ...i}));

    const legendaGroup = new G();

    /**
     * righe della legenda: ogni riga contiene le voci (gruppo svg.js e posizione x all'interno della riga)
     * e la larghezza complessiva della riga
     * @type {Array<{voci: Array<{group: G, x: number}>, width: number}>}
     */
    const rows = [{ voci: [], width: 0 }];

    for await (const voce of items) {

      // ogni voce viene costruita a partire da x = 0 e posizionata in seguito, una volta nota la riga di appartenenza
      const thisGroup = legendaGroup.group();
      let x = 0;

      if(voce.shape === 'line') {

        thisGroup.line(
          0, height  / 2,
          lines_width, height  / 2
        )
          .attr(voce.attrs?? {});
        x = lines_width;

      } else if (voce.shape === 'circle') {
        thisGroup.circle(circles_radius)
          .attr(voce.attrs?? {})
          .move(0, (height - circles_radius) / 2);

        x = circles_radius;

      } else {
        throw `parametro 'shape' non corretto in una delle voci (${voce.shape})`;
      }

      // testo
      const labelEl = await createTextEl(chartInstance, {
          text: voce.text?? '',
          textFill: fontAttrs?.fill?? '#000',
          fontAttr: fontAttrs?? {},
          fontFilePath: fontFilePath,
          parentElement: thisGroup
        }),
        labelBbox = labelEl.bbox();

      labelEl.move(x + 5, (height - labelBbox.height) / 2);

      // larghezza della voce e assegnazione alla riga
      const voceBbox = thisGroup.bbox(),
        voceWidth = voceBbox.x + voceBbox.width;

      let currentRow = rows[rows.length - 1],
        voceX = currentRow.voci.length? currentRow.width + elements_gap : 0;

      // a capo se la voce supera la larghezza massima (solo se la riga contiene già altre voci)
      if(max_width != null && currentRow.voci.length && voceX + voceWidth > max_width) {
        currentRow = { voci: [], width: 0 };
        rows.push(currentRow);
        voceX = 0;
      }

      currentRow.voci.push({ group: thisGroup, x: voceX });
      currentRow.width = voceX + voceWidth;
    }

    // posizionamento delle voci: ogni riga è centrata rispetto alla più larga
    const maxRowWidth = Math.max(...rows.map(r => r.width));

    rows.forEach((row, rowIdx) => {
      const rowOffsetX = (maxRowWidth - row.width) / 2,
        rowY = rowIdx * (height + rows_gap);

      row.voci.forEach(({ group, x }) => {
        if(x + rowOffsetX || rowY) {
          group.dmove(x + rowOffsetX, rowY);
        }
      });
    });

    return legendaGroup;

  } catch(e) {
    console.error( 'MinimoCharts → legenda', e ); // eslint-disable-line
    throw e;
  }

}
