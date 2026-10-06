// https://stackblitz.com/edit/vitejs-vite-acphht?file=main.js

/*
// Esempio di utilizzo:
const fontUrl = './Rubik Moonrocks.ttf';
const text = 'Hello, World!';
const fontSize = 16; // in punti
textToSvgPath(fontUrl, text, fontSize)
  .then(({ svgPathData, svg }) => {
    //console.log(svgPathData); // stringa con i dati del path SVG
    console.log(svg); // elemento SVG come stringa
  })
  .catch((err) => console.error(err));
 */

// Funzione che carica il font e converte il testo in path SVG
// vedi ada-frontend/ada-charts/test/textToPath-test.mjs

export async function textToSvgPath(fontUrl, text, fontSize) {
  try {
    const opentype = (await import(/* webpackIgnore: true */ 'opentype.js')).default;
    const font = await opentype.load(fontUrl);

    // Coordinate x e y da cui inizia il testo
    const x = 0;
    const y = 50;

    // Ottiene il path che rappresenta il testo
    const path = font.getPath(String(text), x, y, fontSize);

    // Converte il path in una stringa di dati path SVG
    const pathData = path.toPathData();

    // In alternativa, converte il path in un elemento SVG
    const pathElementString = path.toSVG();

    return { pathData, pathElementString };

  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('textToSvgPath - font loading error:', err);
    throw err;
  }
}
