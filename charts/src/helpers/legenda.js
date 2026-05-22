import { G } from '@svgdotjs/svg.js';
import { createTextEl } from './create-text-element.js';

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
    elementi di default di items
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
          .attr(voce.attrs);
        x = x + lines_width;

      } else if (voce.shape === 'circle') {
        thisGroup.circle(circles_radius)
          .attr(voce.attrs)
          .move(x, (height - circles_radius) / 2);

        x = x + circles_radius;

      } else {
        throw `parametro 'shape' non corretto in una delle voci (${voce.shape})`;
      }

      // testo
      const labelEl = await createTextEl(chartInstance, {
          text: voce.text,
          textFill: fontAttrs.fill?? '#000',
          fontAttr: fontAttrs,
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
  }

}
