// webpack-modules/postcss.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import globalData from '@csstools/postcss-global-data';
import customMedia from 'postcss-custom-media';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NB: le custom properties NON sono gestite qui (postcss-jit-props rimosso):
// ogni entry css importa direttamente custom-properties.css e le props
// non utilizzate vengono rimosse in build da PurgeCSS (`variables: true`,
// vedi webpack.config.mjs)

// NB: la minificazione è gestita da CssMinimizerPlugin (webpack.config.mjs):
// cssnano NON va aggiunto qui, oltre a duplicare la minificazione
// rimuoverebbe i commenti speciali `/* purgecss start/end ignore */`
// prima dell'esecuzione di PurgeCSS

export default (loaderContext) => {
  const isDevelopment = loaderContext.mode === 'development';

  const plugins = [
    // rende disponibili le @custom-media a tutti i file css
    // (il contenuto iniettato viene rimosso a fine elaborazione;
    // NON aggiungere qui custom-properties.css: duplicherebbe le props
    // in ogni asset e interferirebbe con il purge, vedi sopra)
    globalData({
      files: [
        path.resolve(__dirname, '../src/css/custom-media.css'),
      ]
    }),

    // per IOS < 17 (test)
    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting
    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-light-dark-function#readme
    // require('postcss-nesting')({
    //  edition: '2021',
    //  noIsPseudoSelector: true
    //}),
    // require('@csstools/postcss-light-dark-function')({preserve: false}), /* NB non funziona benissimo... */

    // https://github.com/csstools/postcss-plugins/

    customMedia({
      preserve: isDevelopment
    }),

    // https://github.com/postcss/autoprefixer?tab=readme-ov-file#options
    autoprefixer(),
  ];

  return {
    plugins: plugins
  };
};
