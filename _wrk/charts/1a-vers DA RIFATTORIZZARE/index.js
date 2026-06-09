// NB: i grafici non utilizzati in questa verione della brochure sono disabilitati

import { pie } from './src/charts/pie.js';
// import { hbars } from './src/charts/hbars.js';
import { signalBars } from './src/charts/signal-bars.js';
import { ratingDisplay } from './src/charts/rating-display.js';
// import { radialBars } from './src/charts/radial-bars.js';
import { settimanaleMensile } from './src/charts/settimanale-mensile.js';
import { mcn } from './src/charts/mcn.js';
import { lines } from './src/charts/lines.js';
import { bars } from './src/charts/bars.js';

import { utils } from './src/chart-utils.js';
import { default_colors } from './src/default-chart-colors.js';
import { createSvgCanvas } from './src/create-svg-canvas.js';
import { createTextEl } from './src/create-text-element.js';

import { legenda } from './src/components/legenda.js';
import { cartesianAxis } from './src/components/cartesian-axis.js';

class AdaCharts {

  constructor(customParams = {}) {

    this.defaults??= {};

    this.defaults.colors = customParams.defaults?.colors?? Object.values(default_colors);

    this.defaults.font = {

      // pattern per defaults.font
      // i valori commentati sono quelli di default
      // se non vanno modificati, non serve impostarli
      ...{
        // family: 'sans-serif',
        // size: 14,
        // stretch: 'normal',
        // style: 'normal',
        // variant: 'normal',
        // weight: 400
      },
      ...(customParams.defaults?.font?? {})
    };


    /** se true converte i font in tracciati */
    // NB: non usare per versioni browser (usa node)
    this.textToPath = customParams.textToPath?? false;

    this.debug = customParams.debug?? false;

    // istanza svgjs per web
    this.createSvgCanvas = customParams.createSvgCanvas?? createSvgCanvas;

    // parametri generati condivisi
    this.sharedParams = {};
  }

  setSharedParams(key, value = null) {
    this.sharedParams[key] = value;
  }

  getSharedParams(key) {
    return this.sharedParams[key];
  }

}

AdaCharts.prototype.utils = utils;
AdaCharts.prototype.createTextEl = createTextEl;
AdaCharts.prototype.legenda = legenda;
AdaCharts.prototype.cartesianAxis = cartesianAxis;


AdaCharts.prototype.pie = pie;
// AdaCharts.prototype.hbars = hbars;
AdaCharts.prototype.signalBars = signalBars;
AdaCharts.prototype.ratingDisplay = ratingDisplay;
// AdaCharts.prototype.radialBars = radialBars;
AdaCharts.prototype.settimanaleMensile = settimanaleMensile;
AdaCharts.prototype.mcn = mcn;
AdaCharts.prototype.lines = lines;
AdaCharts.prototype.bars = bars;


export { AdaCharts };


// esportazione singoli metodi
// https://cube.dev/blog/how-to-build-tree-shakeable-javascript-libraries
// https://www.freecodecamp.org/news/what-is-a-pure-function-in-javascript-acb887375dfe/
// export const barsChart = /* #__PURE__ */ AdaCharts.bars;
