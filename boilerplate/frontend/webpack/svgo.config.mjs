// svgo.config.js
import addViewBox from 'svgo-add-viewbox';

export default {
  multipass: true,
  plugins: [
    {
      ...addViewBox,
      params: { overwrite: false }
    },
    { name: 'cleanupIds', params: { remove: true, minify: true } }
    , 'removeDoctype'
    , 'removeComments'
    , 'removeTitle'
    , 'removeDimensions'
    , 'collapseGroups'
    , { name: 'cleanupNumericValues', params: { floatPrecision: 4 } }
    , { name: 'convertColors', params: { names2hex: true, rgb2hex: true } }
    , 'removeStyleElement'
    , 'removeEmptyContainers'
    , { name: 'removeAttrs', params: { attrs: ['(filter|fill|stroke|class|style|data.*)'/* , 'svg:(width|height)' */] } }
    // , { name: 'removeAttrs', params: { attrs: [ '(filter|fill|stroke|fill-rule|clip-rule|stroke-linecap|stroke-linejoin|stroke-width|transform|style|class|data.*)', 'svg:(width|height)' ] } }
    , 'removeUselessDefs',
    //, { name: 'addAttributesToSVGElement0, params: {attribute: "#{$attr}"}}
    // , { name: 'addClassesToSVGElement', params: { className: 'line-icon'  } }
    'removeUselessStrokeAndFill',
  ]
};
