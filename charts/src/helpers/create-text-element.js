import { SVG, Text } from '@svgdotjs/svg.js';

export async function createTextEl (chartInstance, {
  text,
  textFill = '#000',
  fontAttr = {},
  fontFilePath = null,
  parentElement = null,
}) {

  let textEl;

  if(text == null) {
    throw '`createTextEl`: missing `text`';
  }

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
      textEl = SVG(pathElementString);
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
