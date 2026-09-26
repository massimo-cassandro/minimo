// webpack-modules/postcss.config.mjs
// v.3
import path from 'path';
import { fileURLToPath } from 'url';
import globalData from '@csstools/postcss-global-data';
import customMedia from 'postcss-custom-media';
import autoprefixer from 'autoprefixer';
// import jitProps from 'postcss-jit-props';
// import OpenProps from 'open-props';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NB: le custom properties NON sono gestite qui (postcss-jit-props rimosso):
// i css del progetto contengono solo usi `var(--nome)` e le definizioni
// (solo quelle usate) sono iniettate a fine build dal plugin
// custom-props-purgecss-plugin.mjs, che parte dal file master
// custom-properties.css (vedi `useCustomPropsPlugin` in webpack.config.mjs)

// NB: la minificazione è gestita da CssMinimizerPlugin (webpack.config.mjs):
// cssnano NON va aggiunto qui, oltre a duplicare la minificazione
// rimuoverebbe i commenti speciali `/* purgecss start/end ignore */`
// prima dell'esecuzione di PurgeCSS

export default (loaderContext) => {
  const isDevelopment = loaderContext.mode === 'development';

  const plugins = [
    // rende disponibili le @custom-media a tutti i file css
    // (il contenuto iniettato viene rimosso a fine elaborazione;
    // NON aggiungere qui custom-properties.css: le definizioni sono
    // gestite dal plugin delle custom properties, vedi sopra)
    globalData({
      files: [
        path.resolve(__dirname, '../app/css/custom-media.css'),
      ]
    }),

    // jitProps({
    //   ...OpenProps,
    //   files: [
    //     path.resolve(__dirname, '../app/css/custom-properties.css'),
    //   ]
    // }),

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
