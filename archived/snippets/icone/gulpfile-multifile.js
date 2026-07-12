/* eslint-env node */
// gulpfile icone

// Versione che prevede l'output di file icone separati
// Con modulo per la registrazione delle mdimensioni lineari delle icone



const gulp = require('gulp')
  //,del = require('del')
  ,beautify = require('gulp-jsbeautifier')
  ,replace = require('gulp-replace')
  ,rename = require('gulp-rename')
  //,markdown = require('gulp-markdown')
  // ,file = require('gulp-file')
  ,svgstore = require('gulp-svgstore')
  ,svgmin = require('gulp-svgmin')
  ,inject = require('gulp-inject-string')
  // ,flatmap = require('gulp-flatmap')
  ,fs = require('fs')
  ,dom  = require('gulp-dom')
  // ,wrap = require('gulp-wrap')
  // ,grst = require('gulp-remove-svg-tag')
;


let icons_list = [], // lista delle icone, utilizzate per il file demo
  current_file,
  icons_sizes = [];  // array delle dimensioni per utilizzo in sass

const svg_files_folder = 'svg-files'
  ,dest_folder = '../path/to/dest/folder/'
  ,output_files = {
    file1: 'icone1.svg',
    file2: 'icone2.svg',
    fiel3: 'icone3.svg'
  }
  ,icons_list_file = 'icons-list.mjs'
  ,tpl_demo_file = './tpl/demo-icone-tpl.html'
  // ,svg_to_scss = ['freccia', 'ui-errore', 'ui-info', 'ui-success', 'ui-avviso'], // icone da convertire in variabili scss
  // ,icons_scss_file = '_icone-svg.scss'
;

const make_icon_file = function (src_array, destfile) {
  return gulp.src(src_array)
    .pipe(rename(function (path) {
      //path.basename = path.basename.replace(/XXXX_/, '');
      //path.basename = 'icon-' + icon_name;

      current_file = path.basename;
      icons_list.push(path.basename);

      return path;
    }))
    .pipe( replace(/<svg(.*?)width="(.*?)" height="(.*?)"/im, function (match, _, w, h) {

      icons_sizes.push([current_file, parseFloat(w), parseFloat(h)]);

      return(match);
    }))
    .pipe(svgmin({
      multipass: true,
      full: true,
      plugins: [
        { name: 'cleanupIDs', params: { remove: true, minify: true } }
        , 'removeDoctype'
        , 'removeComments'
        , 'removeTitle'
        , 'removeDimensions'
        , 'collapseGroups'
        , { name: 'cleanupNumericValues', params: { floatPrecision: 4  } }
        , { name: 'convertColors', params: { names2hex: true, rgb2hex: true } }
        , 'removeStyleElement'
        , 'removeEmptyContainers'
        // , { name: 'removeAttrs', params: { attrs: ['(fill|stroke|class|style|data.*)', 'svg:(width|height)'] } }
        // , { name: 'removeAttrs', params: { attrs: ['(filter|fill|stroke|class|style|data.*)', 'svg:(width|height)'] } }
        , { name: 'removeAttrs', params: { attrs: ['(filter|fill|stroke|fill-rule|stroke-linecap|stroke-linejoin|stroke-width|transform|style|class|data.*)', 'svg:(width|height)'] } }
        , 'removeUselessDefs'
        //, { name: 'addAttributesToSVGElement0, params: {attribute: "#{$attr}"}}
        // , { name: 'addClassesToSVGElement', params: { className: 'line-icon'  } }
      ]
    }))
    .pipe(svgstore())
    .pipe( rename(destfile) )
    .pipe(gulp.dest(dest_folder));
};


gulp.task('icone1', function() {
  return make_icon_file(
    [`${svg_files_folder}/*.svg`, `!${svg_files_folder}/prefix*.svg`],
    output_files.file1
  );
});

gulp.task('icone2', function() {
  return make_icon_file(
    [ `${svg_files_folder}/*.svg`, `!${svg_files_folder}/blu.svg`, `!${svg_files_folder}/prefix*.svg`],
    output_files.file2
  );
});

gulp.task('icone3', function() {
  return make_icon_file(
    [ `${svg_files_folder}/*.svg`, `!${svg_files_folder}/prefix*.svg`],
    output_files.file3
  );
});

gulp.task('icons_list', function(cb) {

  // rimozione doppioni
  icons_list =  [...new Set(icons_list)];

  let str = '// lista id icone per demo e altro\n' +
    '// NB: questo file è generato dinamicamente, eventuali modifiche saranno sovrascritte\n\n' +
    '// NB: questo file non utilizzato nella demo, è generato solo a scopo di controllo.\n\n' +
    'export const icons_list = ' + JSON.stringify(icons_list.sort(), null, '  ').replace(/"/g, '\'') + ';';

  //str +=  '\n\nexport default icons_list;';

  return fs.writeFile(icons_list_file, str, cb);
});

// creazione file html standalone per la consultazione
// la lista e il codice svg viene incorporato nel file html in modo
// che sia consultabile anche col protocollo `file:///`
gulp.task('demo_file', function() {
  let icone = '';

  Object.values(output_files).forEach(output_file => {
    icone += fs.readFileSync(dest_folder + output_file, 'utf8');
  });

  return gulp.src(tpl_demo_file)
    .pipe(inject.prepend(
      '<!--\n' +
      '  NB: questo file è stato generato dinamicamente, eventuali modifiche saranno sovrascritte \n' +
      `  Se necessario, modificare il file template (${tpl_demo_file})\n`+
      '-->\n'
    ))
    .pipe(dom(function(){
      const wrapper = this.querySelector('.icon-wrapper');
      wrapper.insertAdjacentHTML('afterend',
        `<script>const icons_list = ${JSON.stringify(icons_list.sort(), null, '  ').replace(/"/g, '\'')};</script>`
      );
      return this.body.insertAdjacentHTML('beforeend',
        `<div hidden>${icone}</div>`
      );
    }))
    .pipe(beautify({
      indent_size: 2,
      html: {
        'indent_char': ' ',
        'indent_size': 2,
        'inline': [],
        'wrap_line_length': 0
      }
    }))
    .pipe( rename('demo-icone.html') )
    .pipe(gulp.dest('./'));
});

gulp.task('build_sizes_list', function(cb) {

  let str = '// lista dimensioni elementi svg per scss\n' +
    '// NB: questo file è generato da uno script gulp, eventuali modifiche saranno sovrascritte\n' +

    '$icons-sizes: (';

  // eliminazione doppioni
  icons_sizes = icons_sizes.reduce( (result, item) =>
    result.flat().includes(item[0])? result : [...result, item],
  []);

  const last_idx = icons_sizes.length -1;

  icons_sizes.forEach((item, idx) => {
    str += `\n  '${item[0]}': (\n` +
      `    w        : ${item[1]}px,\n` +
      `    h        : ${item[2]}px,\n` +
      `    wh_ratio : ${(item[1] / item[2])}\n` +
      '  )';

    if(idx < last_idx) {
      str += ',';
    }
  });

  str += '\n);';

  return fs.writeFile('./_icons-sizes.scss', str, cb);
});



gulp.task('default',
  gulp.series(
    'icone1',
    'icone2',
    'icone3',
    'icons_list', // in series perché la var icons_list viene elaborata dopo la generazione
    'build_sizes_list', // idem

    gulp.parallel(
      'demo_file'
    )
  )
);
