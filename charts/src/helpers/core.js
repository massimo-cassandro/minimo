import { default_colors } from './default-chart-colors.js';
import { createSvgCanvas } from './create-svg-canvas.js';

/**
 * Attributi dei font utilizzati per i testi dei grafici.
 * Corrispondono agli attributi accettati dal metodo `font()` di svg.js, con l'aggiunta di `fill`.
 * @typedef {Object} ChartFontAttrs
 * @property {number} [size] - Dimensione del testo in px (default: 14)
 * @property {number|string} [weight] - Peso del font (default: 400)
 * @property {string} [fill] - Colore del testo (default: "#999")
 * @property {string} [family] - Famiglia del font
 * @property {string} [stretch] - Valore di `font-stretch`
 * @property {string} [style] - Valore di `font-style`
 * @property {string} [variant] - Valore di `font-variant`
 */

/**
 * Funzione che crea l'elemento SVG radice su cui disegnare il grafico.
 * Viene eseguita con `this` legato all'istanza di `MinimoCharts`.
 * @callback CreateSvgCanvasFn
 * @param {string|HTMLElement|null} [container] - Container del grafico (selettore o elemento DOM)
 * @param {boolean} [debug] - Se true aggiunge la classe `debug` all'svg
 * @returns {import('@svgdotjs/svg.js').Svg} L'elemento SVG radice
 */

/**
 * Istanza condivisa dai grafici: contiene le impostazioni di default (colori e font),
 * la funzione di creazione dell'svg e un contenitore di parametri condivisi tra più grafici.
 * Va passata come primo argomento alle funzioni dei grafici (`barsChart`, `linesChart`, ecc.).
 *
 * @example
 * const chartInstance = new MinimoCharts({
 *   defaults: {
 *     colors: ['#2387e2', '#fc1484'],
 *     font: { size: 12, fill: '#333' },
 *   },
 * });
 *
 * barsChart(chartInstance, { container: '#chart', values: [[10, 20, 30]] });
 */
export class MinimoCharts {

  /**
   * @param {Object} [customParams] - Impostazioni personalizzate (default: {})
   * @param {Object} [customParams.defaults] - Valori di default condivisi da tutti i grafici dell'istanza
   * @param {string[]} [customParams.defaults.colors] - Colori delle serie di dati (default: i colori di `default_colors`)
   * @param {ChartFontAttrs} [customParams.defaults.font] - Attributi dei font, uniti a quelli di default (default: { size: 14, weight: 400, fill: "#999" })
   * @param {boolean} [customParams.debug] - Se true aggiunge la classe `debug` a tutti gli svg creati (default: false)
   * @param {CreateSvgCanvasFn} [customParams.createSvgCanvas] - Funzione alternativa per la creazione dell'svg, es. `createSvgCanvasNode` per l'uso con Node (default: `createSvgCanvas`)
   * @param {boolean} [customParams.textToPath] - Se true i testi vengono convertiti in tracciati (solo Node, richiede `opentype.js` e il percorso del file del font nei parametri `*FontFilePath` dei grafici) (default: false)
   */
  constructor(customParams = {}) {

    /**
     * Valori di default condivisi da tutti i grafici dell'istanza
     * @type {{colors: string[], font: ChartFontAttrs}}
     */
    this.defaults = {
      colors: customParams.defaults?.colors ?? Object.values(default_colors),
      font: {
        size: 14,
        weight: 400,
        fill: '#999',
        ...customParams.defaults?.font
      }
    };

    /**
     * Se true aggiunge la classe `debug` a tutti gli svg creati
     * @type {boolean}
     */
    this.debug = customParams.debug ?? false;

    /**
     * Se true i testi vengono convertiti in tracciati (vedi `createTextEl`)
     * @type {boolean}
     */
    this.textToPath = customParams.textToPath ?? false;

    /**
     * Crea l'elemento SVG radice del grafico
     * @type {CreateSvgCanvasFn}
     */
    this.createSvgCanvas = (customParams.createSvgCanvas ?? createSvgCanvas).bind(this);

    /**
     * Parametri condivisi tra grafici nella stessa applicazione
     * @type {Object<string, any>}
     */
    this.sharedParams = {};
  }

  /**
   * Registra un parametro condiviso tra i grafici della stessa istanza.
   * @param {string} key - Nome del parametro
   * @param {any} [value=null] - Valore da registrare (default: null)
   * @returns {void}
   */
  setSharedParams(key, value = null) { this.sharedParams[key] = value; }

  /**
   * Restituisce un parametro condiviso registrato con `setSharedParams`.
   * @param {string} key - Nome del parametro
   * @returns {any} Il valore registrato, `undefined` se assente
   */
  getSharedParams(key) { return this.sharedParams[key]; }
}
