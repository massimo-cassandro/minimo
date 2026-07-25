/* eslint-disable no-console */
import { MinimoCharts }  from '../index.js';
import { createSvgCanvasNode } from '../src/create-svg-canvas-node.mjs';
import * as fs_promises from 'node:fs/promises';
import path from 'node:path';
// https://nodejs.org/api/util.html#utilstyletextformat-text-options
import { styleText } from 'node:util';

import { barsTest } from './src/bars-test.js';
import { goalTest } from './src/goal-test.js';
// import { pieNodeTest } from './src/pie-node-test.mjs';
// import { hBarsNodeTest } from './src/hBars-node-test.mjs';
// import { signalBarsNodeTest } from './src/signalBars-node-test.mjs';
// import { ratingDisplayNodeTest } from './src/ratingDisplay-node-test.mjs';
// import { radialsBarNodeTest } from './src/radialsBar-node-test.mjs';
// import { settimanaleMensileNodeTest } from './src/settimanale-mensile-node-test.mjs';
// import { mcnNodeTest } from './src/mcn-node-test.mjs';
// import { linesNodeTest } from './src/lines-node-test.mjs';

const output_path = new URL(import.meta.resolve('./_output')).pathname;

// const fontFolder = new URL(import.meta.resolve('../../../ada-brochure-business-analysis/2025/assets/fonts/Roboto_Condensed/static')).pathname;
const fontFolder = new URL(import.meta.resolve('./fonts/nunito-sans_5.2.7_fontsource/ttf')).pathname;

const fontFiles = {
    extrabold: fontFolder + '/nunito-sans-latin-900-normal.ttf',
    bold: fontFolder + '/nunito-sans-latin-700-normal.ttf',
    medium: fontFolder + '/nunito-sans-latin-600-normal.ttf',
    regular: fontFolder + '/nunito-sans-latin-400-normal.ttf',
    italic: fontFolder + '/nunito-sans-latin-400-italic.ttf',
    lightItalic: fontFolder + '/nunito-sans-latin-300-italic.ttf',
  },

  writeFile = async (svgString, fileName) => {
    try {
      await fs_promises.writeFile(path.join(output_path, fileName), svgString);
    } catch (err) {
      console.error(err);
    }

  };


// svuota cartella output
try {
  await fs_promises.rm(output_path, { recursive: true, force: true });
  await fs_promises.mkdir(output_path, { recursive: true });
} catch (err) {
  console.error('Error clearing output folder:', err);
}


const chartInstance = new MinimoCharts({
  createSvgCanvas: createSvgCanvasNode,
  textToPath: true, // converte i font in tracciati
});

console.log( styleText(['green'], '...barsTest' ));
barsTest(chartInstance, {
  yAxisTitleFontFilePath: fontFiles.medium,
  xAxisTitleFontFilePath: fontFiles.medium,
  labelXFontFilePath: fontFiles.regular,
  labelYFontFilePath: fontFiles.regular,
  width: 800,
  height: 500,
  container: null
}).then(svgString => writeFile(svgString, 'bars.svg'));


console.log( styleText(['green'], '...goalTest' ));
goalTest(chartInstance, {
  container: null,
  width: 300,

  currentValueFontFilePath: fontFiles.regular,
  rightLabelFontAttrs: fontFiles.bold,
}).then(svgString => writeFile(svgString, 'goal.svg'));



// await pieNodeTest(cfg);
// await hBarsNodeTest(cfg);
// await signalBarsNodeTest(cfg);
// await ratingDisplayNodeTest(cfg);
// await radialsBarNodeTest(cfg);
// await settimanaleMensileNodeTest(cfg);
// await mcnNodeTest(cfg);
// await linesNodeTest(cfg);



console.log(' DONE ');
