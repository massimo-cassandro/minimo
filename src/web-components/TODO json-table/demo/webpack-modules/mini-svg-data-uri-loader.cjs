// ./loaders/mini-svg-data-uri-loader.cjs
// Questo file USA la libreria 'mini-svg-data-uri', ma è un wrapper specifico per Webpack.

/* eslint-env node */
// Nota: qui usiamo require perché i Webpack Loaders sono tradizionalmente CommonJS,
// e Node.js li gestisce correttamente con l'estensione .cjs.
const svgToMiniDataURI = require('mini-svg-data-uri');

/**
 * Webpack Loader che prende una stringa SVG e la converte in un
 * Data URI compatto usando la libreria mini-svg-data-uri.
 * @param {string} source - Contenuto SVG (già ottimizzato da svgo-loader)
 * @returns {string} Il Data URI SVG compatto (formato stringa)
 */
module.exports = function (source) {
  // Richiama la funzione per ottenere l'URI compatto
  const dataUri = svgToMiniDataURI(source);

  // Ritorna la stringa Data URI
  return dataUri;
};
