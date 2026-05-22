import { textToSvgPath } from './svg-text-to-path.js';
import { SVG, Text } from '@svgdotjs/svg.js';

export async function createTextEl (chartInstance, {
  text,
  textFill = '#000',
  fontAttr = {},
  fontFilePath = null,
  parentElement = null, // se null viene restituito l'elemento generato (text o path)
  textToPath = false, // bypassa l'impostazione globale, per usi particolari
}) {

  let textEl;


  if(text == null) {
    throw '`createTextEl`: missing `text`';
  }

  // Utilizza i defaults dell'istanza (grazie al bind nel costruttore)
  // Se fontAttr è nullo, usa un oggetto vuoto per evitare errori di spread
  fontAttr = { ...chartInstance.defaults.font, ...(fontAttr ?? {}), fill: textFill };

  if(chartInstance.textToPath || textToPath) {

    if(!fontFilePath) {
      throw `‘createTextEl’: missing ‘fontFilePath’ for text ‘${text}’`;
    }

    // Qui recuperiamo sia il tracciato che la stringa SVG (come nel tuo originale)
    const { pathData, pathElementString } = await textToSvgPath(fontFilePath, text, fontAttr.size ?? 16);

    if(parentElement) {
      textEl = parentElement.path(pathData);
    } else {
      // Nota: utilizzando path con pathData direttamente su SVG() a volte dà errore in svg.js 3.x
      textEl = SVG(pathElementString);
    }

    textEl.attr({ fill: textFill });

  } else {
    // Modalità testo standard (non tracciato)
    if(parentElement) {
      textEl = parentElement.plain(text);
    } else {
      textEl = new Text().plain(text);
    }

    textEl.font(fontAttr).attr({ lengthAdjust: 'spacingAndGlyphs' });
  }

  return textEl;
}
