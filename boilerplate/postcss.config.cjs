/* eslint-env node */

// const path = require('path');


const isDevelopment = process.env.NODE_ENV === 'development';

const postcssConfig = {
  plugins: [

    // NB: percorsi dalla root
    require('@csstools/postcss-global-data')({
      files: [
        './node_modules/open-props/media.min.css',
        './frontend/src/config/custom-properties.css',
      ]
    }),

    // https://github.com/GoogleChromeLabs/postcss-jit-props
    // https://github.com/argyleink/open-props
    // require('postcss-jit-props')(require('open-props')),
    require('postcss-jit-props')({
      ...require('open-props'),
      custom_selector: ':where(html)'
    }),

    // per IOS < 17 (test)
    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting
    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-light-dark-function#readme
    // require('postcss-nesting')({
    //  edition: '2021',
    //  noIsPseudoSelector: true
    //}),
    // require('@csstools/postcss-light-dark-function')({preserve: false}), /* NB non funziona benissimo... */

    require('autoprefixer'),

    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-media
    require('postcss-custom-media')({
      preserve: isDevelopment
    }),

  ]
};

if (process.env.NODE_ENV === 'production') {
  postcssConfig.plugins.push(

    // per IOS < 17
    // require('postcss-nesting')({
    //  edition: '2021',
    //  noIsPseudoSelector: true
    //}),
    // require('@csstools/postcss-light-dark-function'), /* NB non funziona benissimo... */

    // https://github.com/cssnano/cssnano
    require('cssnano')({
      // use the safe preset so that it doesn't
      // mutate or remove code from our css
      preset: 'default',
    })
  );
}

module.exports = postcssConfig;

