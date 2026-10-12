
import { params } from './params.js';

import * as styles from './code-panel.module.css';

export function codePanelInit(){

  params.codePanelWrapper.classList.add(styles.codePanelWrapper);
  params.codePanelWrapper.innerText = 'codePanelWrapper';
}

// TODO prettier
