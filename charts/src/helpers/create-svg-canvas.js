import { SVG } from '@svgdotjs/svg.js';


export function createSvgCanvas(container, debug = false) {

  try {

    const chartInstance = this;

    if(!container) {
      throw 'Missing container';
    }

    const svgCanvas = SVG().addTo(container);

    if(debug || chartInstance.debug) {
      svgCanvas.addClass('debug');
    }
    return svgCanvas;

  } catch(e) {
    console.error( 'Charts → createSvgCanvas', e ); // eslint-disable-line
  }

}
