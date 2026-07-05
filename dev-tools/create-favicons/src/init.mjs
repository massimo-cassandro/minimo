/* eslint-env node */

import { URL } from 'url';
import * as fs from 'fs';


import { printFrame } from './print-frame.mjs';
import { remove_homedir_string } from './remove-homedir-string.mjs';

export function init() {
  // const __filename = new URL('', import.meta.url).pathname;
  // Will contain trailing slash
  const src_dir = new URL('.', import.meta.url).pathname,
    cfg_sample_file = process.cwd() + '/create-favicons-cfg.mjs';

  if(fs.existsSync(cfg_sample_file)) {
    throw `${cfg_sample_file} già presente`;
  }


  let default_params = fs.readFileSync(src_dir + './default-params.mjs', 'UTF8');

  const start_string = '/*** INIT START ***/',
    end_string = '/*** INIT END ***/',
    init_start_text = fs.readFileSync(src_dir +'./init-start-text.txt', 'utf8');



  default_params = default_params.substring(
    default_params.indexOf(start_string) + start_string.length, //from
    default_params.indexOf(end_string)
  );

  fs.writeFileSync(
    cfg_sample_file,
    init_start_text.trim() + '\n\n' +
    'const params = [{\n' +
    default_params +
    '\n}];\n\n' +
    'export default params;'
  );

  printFrame({
    strings: [
      {string: '** CREATE-FAVICONS **', color: 'yellow', bold: true,},
      {string: 'File di configurazione di generato:', color: 'green'},
      {string: remove_homedir_string(cfg_sample_file), color: 'bgGreen'},
    ],
    frameColor: 'green',
    frameType: 'double'
  });
}
