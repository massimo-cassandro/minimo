
import { MinimoCharts } from './src/helpers/core.js';

import { bars } from './src/bars.js';
import { goal } from './src/goal.js';
import { lines } from './src/lines.js';
import { hbars } from './src/hbars.js';
// import { ratingDisplay } from './src/rating-display/index.js';
// import { pie } from './src/charts/pie.js';
// import { signalBars } from './src/charts/signal-bars.js';
// import { radialBars } from './src/charts/radial-bars.js';
// import { settimanaleMensile } from './src/charts/settimanale-mensile.js';
// import { mcn } from './src/charts/mcn.js';


// wrapper

/**
 * Grafico a barre verticali.
 * Per l'elenco completo dei parametri (con esempio di chiamata) vedi `bars` in `./src/bars.js`.
 *
 * @example
 * barsChart(chartInstance, {
 *   container: '#chart',
 *   values: [[10, 20, 30], [15, 5, 25]],
 *   xLabels: ['A', 'B', 'C'],
 *   legenda: { items: [{ text: 'Serie 1' }, { text: 'Serie 2' }] },
 * });
 *
 * @param {MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {Parameters<typeof bars>[0]} params - Parametri del grafico (vedi `bars`)
 * @returns {Promise<string|undefined>} Il codice SVG se `params.container` è null, altrimenti `undefined`
 */
export const barsChart = (chartInstance, params) => bars.call(chartInstance, params);

/**
 * Grafico obiettivo: triangolo che mostra la porzione di raggiungimento di un obiettivo.
 * Per l'elenco completo dei parametri (con esempio di chiamata) vedi `goal` in `./src/goal.js`.
 *
 * @example
 * goalChart(chartInstance, {
 *   container: '#chart',
 *   goalValue: 100,
 *   currentValue: 65,
 *   showCurrentValue: true,
 * });
 *
 * @param {MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {Parameters<typeof goal>[0]} params - Parametri del grafico (vedi `goal`)
 * @returns {Promise<string|undefined>} Il codice SVG se `params.container` è null, altrimenti `undefined`
 */
export const goalChart = (chartInstance, params) => goal.call(chartInstance, params);

/**
 * Grafico a linee.
 * Per l'elenco completo dei parametri (con esempio di chiamata) vedi `lines` in `./src/lines.js`.
 *
 * @example
 * linesChart(chartInstance, {
 *   container: '#chart',
 *   values: [[10, 20, 30], [15, 5, 25]],
 *   xLabels: ['A', 'B', 'C'],
 *   legenda: { items: [{ text: 'Serie 1' }, { text: 'Serie 2' }] },
 * });
 *
 * @param {MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {Parameters<typeof lines>[0]} params - Parametri del grafico (vedi `lines`)
 * @returns {Promise<string|undefined>} Il codice SVG se `params.container` è null, altrimenti `undefined`
 */
export const linesChart = (chartInstance, params) => lines.call(chartInstance, params);

/**
 * Grafico a barre orizzontali.
 * Per l'elenco completo dei parametri (con esempio di chiamata) vedi `hbars` in `./src/hbars.js`.
 *
 * @example
 * hBarsChart(chartInstance, {
 *   container: '#chart',
 *   values: [[10, 20, 30], [15, 5, 25]],
 *   xLabels: ['A', 'B', 'C'],
 *   legenda: { items: [{ text: 'Serie 1' }, { text: 'Serie 2' }] },
 * });
 *
 * @param {MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {Parameters<typeof hbars>[0]} params - Parametri del grafico (vedi `hbars`)
 * @returns {Promise<string|undefined>} Il codice SVG se `params.container` è null, altrimenti `undefined`
 */
export const hBarsChart = (chartInstance, params) => hbars.call(chartInstance, params);
// export const ratingDisplayChart = (chartInstance, params) => ratingDisplay.call(chartInstance, params);

export { MinimoCharts };
