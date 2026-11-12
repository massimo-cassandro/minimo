
import { MinimoCharts } from './src/helpers/core.js';

import { barsChart } from './src/bars.js';
import { goalChart } from './src/goal.js';
import { linesChart } from './src/lines.js';
import { hBarsChart } from './src/hbars.js';
// import { ratingDisplay } from './src/rating-display/index.js';
// import { pie } from './src/charts/pie.js';
// import { signalBars } from './src/charts/signal-bars.js';
// import { radialBars } from './src/charts/radial-bars.js';
// import { settimanaleMensile } from './src/charts/settimanale-mensile.js';
// import { mcn } from './src/charts/mcn.js';


// wrapper
// I wrapper (`barsChart`, `goalChart`, ecc.) sono definiti nei rispettivi file sorgente, insieme al JSDoc completo
// dei parametri: in questo modo il tooltip di VSCode mostra l'elenco completo anche importandoli da qui.
export { barsChart, goalChart, linesChart, hBarsChart };
// export const ratingDisplayChart = (chartInstance, params) => ratingDisplay.call(chartInstance, params);

export { MinimoCharts };
