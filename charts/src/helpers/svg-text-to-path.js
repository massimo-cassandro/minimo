// https://stackblitz.com/edit/vitejs-vite-acphht?file=main.js

import opentype from 'opentype.js';

/*
// Example usage:
const fontUrl = './Rubik Moonrocks.ttf';
const text = 'Hello, World!';
const fontSize = 16; // in points
textToSvgPath(fontUrl, text, fontSize)
  .then(({ svgPathData, svg }) => {
    //console.log(svgPathData); // SVG path data string
    console.log(svg); // SVG element as a string
  })
  .catch((err) => console.error(err));
 */

// Function to load the font and convert text to SVG path
// vedi ada-frontend/ada-charts/test/textToPath-test.mjs

export async function textToSvgPath(fontUrl, text, fontSize) {
  try {
    const font = await opentype.load(fontUrl);

    // Define the x and y coordinates where the text should start
    const x = 0;
    const y = 50;

    // Get a path representing the text
    const path = font.getPath(String(text), x, y, fontSize);

    // Convert the path to an SVG path data string
    const pathData = path.toPathData();

    // Alternatively, convert the path to an SVG
    const pathElementString = path.toSVG();

    return { pathData, pathElementString };

  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('textToSvgPath - font loading error:', err);
    throw err;
  }
}
