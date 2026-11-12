import { SVG, Text } from '@svgdotjs/svg.js';

/**
 * Crea un elemento di testo svg.js.
 * Se `chartInstance.textToPath` è attivo (uso con Node) il testo viene convertito in un tracciato
 * tramite `opentype.js`, e `fontFilePath` diventa obbligatorio; altrimenti viene creato un normale elemento `<text>`.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * await createTextEl(chartInstance, { // istanza di MinimoCharts, OBBL
 *   text: 'Etichetta', // testo da rappresentare, OBBL
 *   textFill: '#000', // colore del testo, FAC
 *   fontAttr: {}, // attributi del font, FAC
 *   fontFilePath: null, // percorso del file del font (solo textToPath), FAC
 *   parentElement: null, // elemento svg.js a cui aggiungere il testo, FAC
 * });
 *
 * @param {import('./core.js').MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {Object} params - Parametri del testo
 * @param {string|number} params.text - Testo da rappresentare
 * @param {string} [params.textFill='#000'] - Colore del testo, prevale su `fontAttr.fill` (default: "#000")
 * @param {import('./core.js').ChartFontAttrs} [params.fontAttr={}] - Attributi del font, uniti a `chartInstance.defaults.font` (default: {})
 * @param {string|null} [params.fontFilePath=null] - Percorso del file del font, obbligatorio se `chartInstance.textToPath` è attivo (default: null)
 * @param {import('@svgdotjs/svg.js').Container|null} [params.parentElement=null] - Elemento svg.js a cui aggiungere il testo; se null l'elemento viene creato senza essere aggiunto al documento (default: null)
 * @returns {Promise<import('@svgdotjs/svg.js').Element>} L'elemento creato (testo o tracciato)
 * @throws {string} Se `text` è assente, o se `fontFilePath` è assente con `textToPath` attivo
 */
export async function createTextEl (chartInstance, {
  text,
  textFill = '#000',
  fontAttr = {},
  fontFilePath = null,
  parentElement = null,
}) {

  /** @type {import('@svgdotjs/svg.js').Element} */
  let textEl;

  if(text == null) {
    throw '`createTextEl`: missing `text`';
  }

  text = String(text);

  fontAttr = { ...chartInstance.defaults.font, ...(fontAttr ?? {}), fill: textFill };

  if(chartInstance.textToPath) {

    if(!fontFilePath) {
      throw `'createTextEl': missing 'fontFilePath' for text '${text}'`;
    }

    const { textToSvgPath } = await import('../node-helpers/svg-text-to-path.js');

    const { pathData, pathElementString } = await textToSvgPath(fontFilePath, text, fontAttr.size ?? 16);

    if(parentElement) {
      textEl = parentElement.path(pathData);
    } else {
      textEl = /** @type {import('@svgdotjs/svg.js').Element} */ (SVG(pathElementString));
    }

    textEl.attr({ fill: textFill });

  } else {
    if(parentElement) {
      textEl = parentElement.plain(text);
    } else {
      textEl = new Text().plain(text);
    }

    textEl.font(fontAttr).attr({ lengthAdjust: 'spacingAndGlyphs' });
  }

  return textEl;
}
