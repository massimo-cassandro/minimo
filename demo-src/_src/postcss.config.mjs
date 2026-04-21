// webpack-modules/postcss.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import globalData from '@csstools/postcss-global-data';
import customMedia from 'postcss-custom-media';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (loaderContext) => {
  const isDevelopment = loaderContext.mode === 'development';

  const plugins = [
    globalData({
      files: [
        // openProps.
        path.resolve(__dirname, '../../src/custom-properties-default.css'),
        path.resolve(__dirname, '../../src/custom-media-default.css'),
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

  if (!isDevelopment) {
    // per IOS < 17
    // require('postcss-nesting')({
    //  edition: '2021',
    //  noIsPseudoSelector: true
    //}),
    // require('@csstools/postcss-light-dark-function'), /* NB non funziona benissimo... */


    plugins.push(cssnano({ preset: 'default' }));
  }


  return {
    plugins: plugins
  };
};
