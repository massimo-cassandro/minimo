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

    // createWebmanifest legge i png generati da createPng per calcolarne l'hash:
    // deve quindi essere eseguito solo a scrittura completata
    await createPng(params);

    const tasks = [
      createIco(params),
      createWebmanifest(params),
      createSnippet(params),
    ];

    if (params.generate_svg_favicon) {
      tasks.push(createSvg(params));
    }

    await Promise.all(tasks)
      .then(result => {
        printResult(params);

      })

  } catch(err) {
    log('bgRed', ` ${err} `, 'error');
  }

}
