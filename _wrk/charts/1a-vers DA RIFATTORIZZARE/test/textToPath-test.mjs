/* eslint-disable no-console */
import { textToSvgPath } from '../src/svg-text-to-path.js';

const labelFontFilePath = './Roboto_Condensed/static/RobotoCondensed-Bold.ttf',
  textString = 'Hello World',
  textSize = 24
;

const { pathData, pathElementString } = await textToSvgPath(labelFontFilePath, textString, textSize);


console.log(pathData);
console.log('------');
console.log(pathElementString);
