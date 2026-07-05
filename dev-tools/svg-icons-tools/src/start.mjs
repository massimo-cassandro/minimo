import { svg_to_symbols } from './svg-to-symbols.mjs';
import { svg_to_jsx } from './svg-to-jsx.mjs';
import { svg_to_optimized } from './svg-to-optimized.mjs';
import { svg_to_scss } from './svg-to-scss.mjs';
// import * as fs from 'fs';
// import { configManager } from './config-manager.mjs';

import { printResult } from './print-result.mjs';

export async function start() {


  printResult('SVG-ICONS-TOOLS start...');

  await svg_to_jsx();
  await svg_to_optimized();
  svg_to_symbols();
  svg_to_scss();

  printResult('SVG-ICONS-TOOLS end', 'success');


}
