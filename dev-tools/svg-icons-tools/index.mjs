#!/usr/bin/env node
import * as process from 'process';
import * as fs from 'fs';
import * as path from 'path';

import { init } from './src/init.mjs';
import { homedir_path_to_tilde } from './src/homedir-path-to-tilde.mjs';
// import default_config from './src/default-config.mjs';
import { configManager } from './src/config-manager.mjs';
import { start } from './src/start.mjs';
import { printResult } from './src/print-result.mjs';

try {

  // init: creazione file cfg base
  if(process.argv.indexOf('init') !== -1) {

    init(process.cwd());

  } else {

    let config_file = './svg-icons-tools.config.mjs';


    if(process.argv.indexOf('--config') !== -1) {
      config_file = path.resolve(process.cwd(), process.argv[process.argv.indexOf('--config') + 1].trim());
    }

    if(!config_file) {
      throw new Error('Missing config file path');
    }

    config_file = new URL(config_file, import.meta.url).pathname;
    const work_dir = path.dirname(config_file);

    if(!fs.existsSync(config_file)) {
      throw new Error(`Config file not found: ${homedir_path_to_tilde(config_file)}`);
    }

    import(config_file).then((custom_cfg) => {

      configManager.updCfg({ ...custom_cfg.default, work_dir: work_dir});

      start();
    });

  }

} catch(err) {
  printResult(err, 'error');
}
