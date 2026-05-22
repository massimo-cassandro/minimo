import { default_colors } from './default-chart-colors.js';
import { createSvgCanvas } from './create-svg-canvas.js';

export class MinimoCharts {
  constructor(customParams = {}) {
    this.defaults = {
      colors: customParams.defaults?.colors ?? Object.values(default_colors),
      font: {
        size: 14,
        weight: 400,
        fill: '#999',
        ...customParams.defaults?.font
      }
    };


    this.debug = customParams.debug ?? false;
    this.createSvgCanvas = (customParams.createSvgCanvas ?? createSvgCanvas).bind(this);

    this.sharedParams = {}; // per condivisione parametri tra grafici nella stessa applicazione
  }

  setSharedParams(key, value = null) { this.sharedParams[key] = value; }
  getSharedParams(key) { return this.sharedParams[key]; }
}
