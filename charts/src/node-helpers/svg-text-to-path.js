// https://stackblitz.com/edit/vitejs-vite-acphht?file=main.js
// vedi ada-frontend/ada-charts/test/textToPath-test.mjs

/**
 * Carica un font e converte un testo in un tracciato SVG.
 * Richiede il package `opentype.js` (peer dependency facoltativa), caricato con un import dinamico.
 *
 * @example
 * const { pathData, pathElementString } = await textToSvgPath('./Rubik Moonrocks.ttf', 'Hello, World!', 16);
 * // pathData: stringa con i dati del path SVG (attributo `d`)
 * // pathElementString: elemento `<path>` come stringa
 *
 * @param {string} fontUrl - Percorso o URL del file del font
 * @param {string|number} text - Testo da convertire
 * @param {number} fontSize - Dimensione del testo
 * @returns {Promise<{pathData: string, pathElementString: string}>} I dati del tracciato (attributo `d`) e l'elemento `<path>` come stringa
 * @throws {Error} Se il caricamento del font non riesce (l'errore viene anche registrato in console)
 */
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
