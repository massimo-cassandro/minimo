/* eslint-disable no-console */

// import * as fs from 'fs';
// import * as path from 'path';
import { log } from './print-frame.mjs';

import { createIco } from './create-ico.mjs';
import { createPng } from './create-png.mjs';
import { createSvg } from './create-svg.mjs';
import { createWebmanifest } from './create-webmanifest.mjs';
import { createSnippet } from './create-snippet.mjs';
import { printResult } from './print-result.mjs';


export async function createFavicons(params) {

  try {

    log('green', 'Creating favicons...');

    await Promise.all([
      await createSvg(params),
      await createPng(params),
      await createIco(params),
      await createWebmanifest(params), // after create png
      await createSnippet(params),
    ])
      .then(result => {
        printResult(params);

      })

  } catch(err) {
    log('bgRed', ` ${err} `, 'error');
  }

}
