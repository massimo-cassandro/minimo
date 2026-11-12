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
 * Il gruppo restituito non è aggiunto ad alcun svg e va posizionato da chi lo richiede.
 * In caso di errore (es. `items` vuoto) lo registra in console e rilancia l'errore.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * await legenda(chartInstance, { // istanza di MinimoCharts, OBBL
 *   height: 20, // altezza della legenda, FAC
 *   elements_gap: 20, // spazio tra le voci, FAC
 *   lines_width: 20, // lunghezza delle forme `line`, FAC
 *   circles_radius: 20, // diametro delle forme `circle`, FAC
 *   fontAttrs: null, // attributi font dei testi, FAC
 *   fontFilePath: null, // percorso file font (solo textToPath), FAC
 *   items: [{ shape: 'line', attrs: {}, text: 'Serie 1' }], // voci della legenda, OBBL
 * });
 *
 * @param {import('./core.js').MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {Object} params - Parametri della legenda
 * @param {number} [params.height=20] - Altezza della legenda in px (default: 20)
 * @param {number} [params.elements_gap=20] - Spazio tra una voce e l'altra (default: 20)
 * @param {number} [params.lines_width=20] - Lunghezza delle forme di tipo `line` (default: 20)
 * @param {number} [params.circles_radius=20] - Dimensione delle forme di tipo `circle`; nonostante il nome corrisponde al diametro (default: 20)
 * @param {import('./core.js').ChartFontAttrs|null} [params.fontAttrs=null] - Attributi svg.js dei font dei testi; se null vengono usati quelli di default dell'istanza (default: null)
 * @param {string|null} [params.fontFilePath=null] - Percorso del file del font, per la conversione dei testi in tracciati (default: null)
 * @param {LegendaItem[]} params.items - Voci della legenda, almeno una (default: [])
 * @returns {Promise<import('@svgdotjs/svg.js').G>} Il gruppo svg.js della legenda
 */
export async function legenda(chartInstance, {

  /** altezza legenda */
  height = 20,

  /** spazio tra gli elementi della legenda */
  elements_gap = 20,

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


    let x = 0; // posizionamento x
    for await (const voce of items) {

      const thisGroup = legendaGroup.group();

      if(voce.shape === 'line') {

        thisGroup.line(
          x, height  / 2,
          x + lines_width, height  / 2
        )
          .attr(voce.attrs?? {});
        x = x + lines_width;

      } else if (voce.shape === 'circle') {
        thisGroup.circle(circles_radius)
          .attr(voce.attrs?? {})
          .move(x, (height - circles_radius) / 2);

        x = x + circles_radius;

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

      x = legendaGroup.bbox().width + elements_gap;
    }

    return legendaGroup;

  } catch(e) {
    console.error( 'MinimoCharts → legenda', e ); // eslint-disable-line
    throw e;
  }

}
