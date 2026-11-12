
import { createSVGWindow } from 'svgdom';
import { SVG, registerWindow } from '@svgdotjs/svg.js';

// "@svgdotjs/svg.js": "^3.2.4",
//     "svgdom": "^0.1.21"


// https://svgjs.dev/docs/3.2/getting-started/
// https://github.com/svgdotjs/svgdom#readme


/**
 * Crea l'elemento SVG radice del grafico per l'uso con applicazioni Node (di default non utilizzata).
 * Dove necessario rimpiazza la funzione `createSvgCanvas` di default, passandola al costruttore di `MinimoCharts`.
 * Richiede il package `svgdom` (da installare a parte), che fornisce `window` e `document` a svg.js.
 * Non utilizza i parametri `container` e `debug` della funzione di default: i grafici vanno creati
 * con `container: null`, in modo che restituiscano il codice SVG.
 *
 * @example
 * const chartInstance = new MinimoCharts({
 *   createSvgCanvas: createSvgCanvasNode,
 * });
 *
 * @returns {import('@svgdotjs/svg.js').Svg} L'elemento SVG radice
 */
export function createSvgCanvasNode() {

  // restituisce una window con un document e un nodo radice svg
  const window = createSVGWindow();
  const document = window.document;

  // registra window e document
  registerWindow(window, document);

  // create svgCanvas
  const svgCanvas = SVG(document.documentElement);

  return svgCanvas;
}
