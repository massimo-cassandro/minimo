/* global process */

import './index.css';
import { innerNav, dismissAlerts } from '@massimo-cassandro/minimo';


innerNav();
dismissAlerts();



if (process.env.NODE_ENV === 'development') {
  // indicatore del breakpoint, con le custom media del progetto
  Promise.all([
    import('@massimo-cassandro/minimo/layout-tools'),
    import('@css/custom-media.js'),
  ]).then(([{ layoutTools }, customMedia]) => layoutTools({ customMedia }));
}
