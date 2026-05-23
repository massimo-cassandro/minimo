import { MinimoCharts } from '@minimoCharts/index.js';

import { barsTest } from './src/bars-test.js';
import { goalTest } from './src/goal-test.js';
import { linesTest } from './src/lines-test.js';

// import { ratingDisplayTest } from '../../../_wrk/charts/test/test-src/rating-display-test.js';
// import { pieTest } from './src/pie-test.js';
// import { hBarsTest } from './src/hbars-test.js';
// import { signalBarsTest } from './src/signal-bars-test.js';
// import { radialBarsTest } from './src/radial-bars-test.js';
// import { settimanaleMensileTest } from './src/settimanale-mensile-test.js';


export async function chartsDemo(){

  // // show debug
  // const cookieSet = document.cookie?.match(/useDebug=1/)?? null,
  //   debugBtn = document.getElementById('show-debug-btn');

  // document.documentElement.classList.toggle('show-debug', cookieSet);
  // debugBtn.checked = cookieSet;

  // debugBtn.addEventListener('click', e => {
  //   document.documentElement.classList.toggle('show-debug', e.target.checked);
  //   document.cookie = 'useDebug=' + (e.target.checked? 1 : 0);
  // }, false);



  const chartInstance = new MinimoCharts();


  await barsTest(chartInstance);
  await goalTest(chartInstance);
  await linesTest(chartInstance);

  // await ratingDisplayTest(chartInstance);
  // pieTest(cfg);
  // hBarsTest(cfg);
  // signalBarsTest(cfg);
  // radialBarsTest(cfg);
  // settimanaleMensileTest(cfg);
  // await mcnTest(cfg);
  // await linesTest(cfg);

}
