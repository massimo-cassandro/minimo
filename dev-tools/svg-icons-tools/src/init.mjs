
import * as fs from 'fs';
import * as path from 'path';
// import process from 'process';

import { printResult } from './print-result.mjs';
import { homedir_path_to_tilde } from './homedir-path-to-tilde.mjs';

export function init(work_dir) {

  const source_dir = new URL('.', import.meta.url).pathname;

  // create dest dir
  const dest = path.join(work_dir, 'svg-icons-tools');
  if(fs.existsSync(dest)) {
    throw `${homedir_path_to_tilde(dest)} already exists`;
  }
  fs.mkdirSync(dest);

  // copy cfg file
  const cfg_file = path.join(dest, '/svg-icons-tools.config.mjs');

  fs.copyFileSync(
    path.join(source_dir, '/default-config.mjs'),
    cfg_file
  );

  // copy tpl file
  const target_demo_file =  path.join(dest, 'symbols-demo-tpl.html');
  fs.copyFileSync(
    path.join(source_dir, 'symbols-demo-tpl.html'),
    target_demo_file
  );

  printResult('SVG-ICONS-TOOLS', 'success');
  printResult('Created config file: ' + homedir_path_to_tilde(cfg_file));
  printResult('Created symbols demo file: ' + homedir_path_to_tilde(target_demo_file) + '\n\n');
}
