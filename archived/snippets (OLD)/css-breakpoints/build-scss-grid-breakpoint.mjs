/**
 * Generazione file scss grid-breakpoints da file js
 * in modo che quest'ultimo possa essere condiviso anche dalle applicazioni JS
 *
 * Alternative:
 *    - `:export` nel file scss → configurazione molto complessa in encore
 *    - parsing di una custom property nel file js: meno efficiente, richiede
 *      elaborazione lato client ogni volta
 */

import fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { gridBreakpoints, brkp } from './css-breakpoints.mjs';

const current_dir = new URL('.', import.meta.url).pathname,
  dest = path.resolve(current_dir, './_css-breakpoints.scss');

let str = '/* stylelint-disable @stylistic/number-no-trailing-zeros */\n\n' +
  '// Questo file è stato generato da `build-scss-grid-breakpoint.mjs`,\n' +
  '// eventuali modifiche apportate manualmente verranno sovrascritte.\n' +
  '// Se fosse necessario editare i breakpoints,\n'+
  '// modificare il file `css-breakpoints.mjs`\n' +
  '// e avviare nuovamente lo script.\n\n';

// $grid_breakpoints
// let items = breakpoints.gridBreakpoints.map(i =>
//   `  ${i.brk}: ${i.w}` + (i.w > 0? 'px' : '')
// );

// $grid_breakpoints
const items = [];
for( const breakpoint in gridBreakpoints) {
  items.push(`  ${breakpoint}: ${gridBreakpoints[breakpoint]}` + (gridBreakpoints[breakpoint] > 0? 'px' : ''));
}

str += '$grid-breakpoints: (\n' + items.join(',\n') + '\n);\n\n';

for( const key in brkp) {
  str += '$' + (key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())) + ': '  + brkp[key] + (isNaN(brkp[key])? '' : 'px') + ';\n';
}

fs.writeFileSync(dest, str);
