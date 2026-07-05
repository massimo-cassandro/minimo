#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-env node */


import * as fs from 'fs';
import * as path from 'path';

import { log } from './src/print-frame.mjs';

import { parseParams } from './src/parse-params.mjs';
import { default_params } from './src/default-params.mjs';
import { createFavicons } from './src/create-favicons.mjs';
import { init } from './src/init.mjs';

// nome del file di configurazione, se utilizzato
const config_filename = 'create-favicons-cfg.mjs';

try {

  // init: creazione file cfg base
  if(process.argv.indexOf('init') !== -1) {

    init();

  } else {

    let work_dir;
    const dir_param_idx = process.argv.findIndex(el => /^--dir/.test(el) );

    if(dir_param_idx !== -1) {
      [, work_dir] = process.argv[dir_param_idx].split('=');

    } else {
      work_dir = './';
    }

    work_dir = path.resolve(process.cwd(), work_dir) ;


    if(fs.existsSync(path.resolve(work_dir, config_filename))) {

      import(path.resolve(work_dir, config_filename))
        .then((config_params) => {

          const imported_params = [...(Array.isArray(config_params.default)? config_params.default : [config_params.default])];

          imported_params.forEach(params_item => {
            createFavicons(parseParams(params_item, work_dir));
          });

        });

    } else if(default_params.src_img && fs.existsSync(path.resolve(work_dir, default_params.src_img))) {

      createFavicons(parseParams(null, work_dir));

    } else {

      throw new Error( `'${config_filename}' e '${default_params.src_img}' non presenti`);
    }

  }



} catch(err) {
  log('bgRed', `\n ${err} \n`, 'error');
}
