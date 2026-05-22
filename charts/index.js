
import { MinimoCharts } from './src/helpers/core.js';

import { bars } from './src/bars.js';
import { goal } from './src/goal.js';
import { ratingDisplay } from './src/rating-display/index.js';
// import { pie } from './src/charts/pie.js';
// import { hbars } from './src/charts/hbars.js';
// import { signalBars } from './src/charts/signal-bars.js';
// import { radialBars } from './src/charts/radial-bars.js';
// import { settimanaleMensile } from './src/charts/settimanale-mensile.js';
// import { mcn } from './src/charts/mcn.js';
// import { lines } from './src/charts/lines.js';


// wrapper
export const barsChart = (chartInstance, params) => bars.call(chartInstance, params);
export const goalChart = (chartInstance, params) => goal.call(chartInstance, params);
export const ratingDisplayChart = (chartInstance, params) => ratingDisplay.call(chartInstance, params);

export { MinimoCharts };
