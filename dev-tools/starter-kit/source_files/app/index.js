/* global process */

import './index.css';
import { innerNav, dismissAlerts } from '@massimo-cassandro/minimo';


innerNav();
dismissAlerts();



if (process.env.NODE_ENV === 'development') {
  import('@massimo-cassandro/minimo/layout-tools');
}
