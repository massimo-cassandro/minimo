/*
 * Configurazione per find-prphan-css-classes.mjs
 * I percorsi relativi sono risolti rispetto alla directory di questo file.
 *
 * Config Da Copiare Nella Root Del Progetto
 */

const minimo_path = '../../node_modules/@massimo-cassandro/minimo';

export default {
  /* file o directory da analizzare */
  src: ['../src', '../../templates'],

  /* file o directory contenenti i CSS */
  css: ['./', '../src', `${minimo_path}/src`],

  /* estensioni dei sorgenti */
  ext: ['html', 'js', 'jsx', 'php'],

  /* estensioni dei file CSS */
  cssExt: ['css'],

  /* directory da saltare */
  excludeDir: [/* 'node_modules',  */'.git', 'dist', 'vendor'],

  /* file CSS (o CSS modules) da non considerare nel confronto (default: []) */
  excludeCssFiles: [],

  /* classi da ignorare (RegExp o stringhe) */
  ignore: [/^js-/, /^is-/],

  cssModules: {
    enabled: true,

    /* sorgenti in cui cercare l'uso dei CSS modules */
    ext: ['js', 'jsx'],

    /* file considerati CSS modules */
    pattern: /\.module\.css$/,

    /* se true, styles.myClass corrisponde anche a .my-class */
    camelCase: false
  }
};
