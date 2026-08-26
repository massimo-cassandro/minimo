/* global process */

import './index.css';

import { params } from '@src/params.js';

import '@src/layout.js';

import { imgAreaInit } from '@src/img-area.js';
import { imgControlsInit } from '@src/img-controls.js';
import { imgInfoInit } from '@src/img-info.js';
import { appControlsInit } from '@src/app-controls.js';
import { imgsListInit } from '@src/imgs-list.js';
import { codePanelInit } from '@src/code-panel.js';
import { imgLoadSetup } from '@src/img-load-setup.js';


imgAreaInit();
imgControlsInit();
imgInfoInit();
appControlsInit();
imgsListInit();
codePanelInit();

imgLoadSetup();


if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log(params);
}

// TODO espandi / contrai
// TODO Salvataggio su indexed db automatico
// TODO config "di lavoro": tutti i dati precedenti + peso, miniatura (?) ....?

/* TODO output:
[
  {
    filename
    filetype
    crop: {
      brk1: [x,y,w,h],
      oppure
      brk1: {
        crop: [x,y,w,h],
        cropped size
        cropped ratio
      }
      ...
    }
    opzionali
    original size

  }
]
*/

