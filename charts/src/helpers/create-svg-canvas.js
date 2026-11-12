import { SVG } from '@svgdotjs/svg.js';

/**
 * Crea l'elemento SVG radice del grafico e lo aggiunge al container (uso nel browser).
 * È la funzione di default di `MinimoCharts`, che la esegue con `this` legato all'istanza;
 * per l'uso con Node va sostituita con `createSvgCanvasNode`.
 * In caso di errore (es. container mancante) lo registra in console e rilancia l'errore.
 *
 * @this {import('./core.js').MinimoCharts}
 * @param {string|HTMLElement|null} [container] - Container del grafico (selettore o elemento DOM), obbligatorio
 * @param {boolean} [debug=false] - Se true (o se è true `debug` dell'istanza) aggiunge la classe `debug` all'svg (default: false)
 * @returns {import('@svgdotjs/svg.js').Svg} L'elemento SVG radice
 */
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
    throw e;
  }

}
