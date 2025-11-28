/*

[
  {
    label: 'xxx',
    descr: [],         <- renderizzati come '* ...'
    snippets: [],      <- renderizzati come '* `...`'

    packages: [],      <- renderizzati come `npm i --S ...` o `--D ...`, se presenti dei subarray
    dev_packages: [],  <- vengono renderizati come `npm i` distinti

    addConfigFile: [], <- files in `config_files` da rirpodurre con `echo` e `>>`

    uninstall: [],     <- i pacchetti indicati vengono renderizzati come `npm uninstall ...`
    fav: false,        <- se true, il pacchetto viene considerato tra i preferiti e messo in cima alla lista
  },
  ...
]

il json viene ordinato per label

*/

const snippets = [
  {
    label: '.editorconfig',
    addConfigFile: ['_editorconfig'],
    fav: true
  },
  {
    label: '.gitignore',
    addConfigFile: ['_gitignore'],
    fav: true
  },

  {
    label: '.browserslistrc',
    addConfigFile: ['_browserslistrc'],
    fav: true
  },
  {
    label: 'jsconfig.json',
    addConfigFile: ['jsconfig.json'],
    fav: true
  },
  {
    label: '.prettierrc',
    addConfigFile: ['_prettierrc'],
    fav: true
  },

  {
    label: 'Local servers',
    descr: [
      '`"python server": "python3 -m http.server 8000 # --directory __dirname__ # 8000 = default port",`',
      '`"php server": "php -S localhost:8000 # -t root_dir/",`',
      '`"symfony local server": "symfony serve -d",`',
      'node serve # npm i serve'
    ],
    fav: true
  },


  {
    label: 'eslint 8',
    dev_packages: [['eslint@^8'], ['@massimo-cassandro/eslint-config@^1']],
  },
  {
    label: 'eslint9 (+ uninstall)',
    uninstall: ['eslint', '@eslint/js', 'globals', '@massimo-cassandro/eslint-config'],
    dev_packages: [['eslint@^9', '@eslint/js', 'globals'], ['@massimo-cassandro/eslint-config@^2']],
    addConfigFile: ['eslint.config.mjs'],
    fav: true
  },
  {
    label: 'stylelint',
    snippets: [
      '## upd config file:',
      'mv -f .stylelintrc.cjs stylelint.config.cjs',
    ],
    uninstall: [
      '@stylistic/stylelint-plugin',
      'stylelint-config-css-modules',
      'stylelint-config-twbs-bootstrap',
      'stylelint',
      '@massimo-cassandro/stylelint-config'
    ],
    dev_packages: [
      [
        '@stylistic/stylelint-plugin',
        'stylelint-config-css-modules',
        'stylelint-config-twbs-bootstrap',
        'stylelint'
      ],
      ['@massimo-cassandro/stylelint-config'],
    ],
    addConfigFile: ['stylelint.config.cjs'],
    fav: true,
  },
  {
    label: 'webhint',
    snippets: [],
    dev_packages: [
      ['hint'],
    ],
    addConfigFile: ['_hintrc.cjs'],
    fav: true,
  },

  {
    label: 'rollup base',
    snippets: [
      '"rollup (config)": "npx rollup --config ./config/rollup.config.mjs --watch",',
      '"rollup (CLI)": "npx rollup --input js/source.js --file dist/dest.min.js --format iife --sourcemap --plugin \'terser={compress: {passes: 2}}\' --plugin @rollup/plugin-node-resolve --watch"'
    ],
    addConfigFile: ['rollup.config.mjs'],
    dev_packages: [
      'rollup@latest',
      '@rollup/plugin-terser',
      '@rollup/plugin-node-resolve',
      '@rollup/plugin-json',
      '@rollup/plugin-image',
      '@rollup/plugin-replace',
      '@rollup/plugin-commonjs',
    ],
  },
  {
    label: 'rollup-plugin-string-html',
    dev_packages: ['rollup-plugin-string-html'],
  },

  // 'npm i --save-dev rollup-plugin-minify-html-template-literals',

  {
    label: 'sass cli',
    dev_packages: ['sass'],
    fav: true
  },
  {
    label: 'postcss + plugins (webpack)',
    dev_packages: [
      'postcss',
      // 'postcss-preset-env',
      // '@fullhuman/postcss-purgecss',
      'autoprefixer',
      'postcss-custom-media',
      '@csstools/postcss-global-data',
      // 'postcss-csso',
    ],
    addConfigFile: ['postcss.config.cjs'],
    fav: true
  },
  {
    label: 'postcss cli',
    descr: [
      'Per creare file css di test.',
      '*postcss-import* è necessario per risolvere le importazioni da cli (con webpack non serve, l’operazione è svolta da *css-loader*)',
    ],
    snippets: [
      '"build css test": "npx postcss ./src/source.css -o ./test/test.css --no-map --verbose --env development --config ./ --use postcss-import --watch",'
    ],
    dev_packages: ['postcss-cli', 'postcss-import'],
    fav: true
  },
  {
    label: 'postcss-banner',
    dev_packages: ['postcss-banner'],
  },
  {
    label: 'POSTCSS per supportare nuove funzionalità con browser meno recenti',
    descr: [
      'Per utilizzare css nesting, light-dark() ecc. con IOS <= 16 e per le email (NB light-dark disabilitata di default',
      '`npm i -D @csstools/postcss-light-dark-function`'
    ],
    dev_packages: ['postcss-nesting', /* '@csstools/postcss-light-dark-function' */],
  },

  {
    label: 'bootstrap',
    packages: ['bootstrap'],
  },
  {
    label: 'gulp per icone',
    snippets: ['"build_icons": "cd ./path/to/icone && gulp",'],
    dev_packages: [
      'gulp@latest',
      'gulp-concat',
      'gulp-dom',
      'gulp-flatmap',
      'gulp-inject-string',
      'gulp-rename',
      'gulp-replace',
      'gulp-svgmin',
      'gulp-svgstore',
      'gulp-wrap',
    ],
  },
  {
    label: 'gulp-wrap (aggiunta per icone react)',
    dev_packages: ['gulp-wrap'],
  },
  {
    label: 'gulp-jsbeautifier (aggiunta per icone react)',
    dev_packages: ['gulp-jsbeautifier'],
  },
  {
    label: 'prismjs',
    packages: ['prismjs'],
  },
  {
    label: 'normalize.css',
    packages: ['normalize.css'],
  },
  {
    label: 'css reset',
    descr: [
      '<https://www.joshwcomeau.com/css/custom-css-reset/#the-css-reset-1>',
      '<https://meyerweb.com/eric/tools/css/reset/>',
    ],
    fav: true
  },
  {
    label: 'open-props + postcss-jit-props',
    packages: ['open-props'],
    dev_packages: ['postcss-jit-props'],
    fav: true
  },

  {
    label: 'react (NB: richiede eslint 8)',
    dev_packages: [
      [
        '@babel/preset-react',
        'babel-plugin-transform-react-remove-prop-types',
        'eslint-config-react-app'
      ],
      [
        'classnames',
        'nanoid',
        'prop-types'
      ],
      [
        'react-dom',
        'react'
      ]
    ],
  },

  {
    label: 'React utilities',
    dev_packages: [
      'classnames',
      'nanoid',
      'prop-types'
    ],
  },
  {
    label: 'styled-components',
    dev_packages: [
      'babel-plugin-styled-components',
      'styled-components'
    ],
  },
  {
    label: 'react-html-comment',
    dev_packages: ['react-html-comment'],
  },
  {
    label: 'html-react-parser',
    dev_packages: ['html-react-parser'],
  },
  {
    label: 'solid-js (webpack)',
    dev_packages: ['solid-js', 'babel-loader', '@babel/preset-env', '@babel/plugin-syntax-jsx', 'babel-preset-solid'],
  },
  {
    label: 'webpack',
    fav: true,
    descr: ['Non include Postcss'],
    snippets: [
      '"webpack DEV": "NODE_ENV=development webpack serve --config ./webpack.config.cjs #--open-app-name \'Google Chrome\'",',
      '"webpack DEV": "rm -rf ./public/dev && NODE_ENV=development webpack --config ./webpack.config.cjs",',
      '"webpack PROD": "NODE_ENV=production webpack --config ./webpack.config.cjs",'
    ],
    // addConfigFile: ['webpack.config.cjs'], // TODO così non funziona
    dev_packages: [
      [
        '@babel/core',
        '@babel/preset-env',
        'babel-loader',
        // 'clean-webpack-plugin',
        'copy-webpack-plugin',
        'css-loader',
        'css-minimizer-webpack-plugin',
        // 'csso-webpack-plugin',
        'dotenv-webpack',
        'file-loader',
        'html-loader',
        'html-webpack-plugin',
        'mini-css-extract-plugin',
        'mini-svg-data-uri',
        'postcss-loader',
        'postcss-preset-env',
        'style-loader',
        'terser-webpack-plugin',
      ],
      [
        'webpack-cli',
        'webpack-dev-server',
        'webpack-manifest-plugin',
        'webpack'
      ]
    ],
  },
  {
    label: 'webpack-remove-empty-scripts',
    fav: true,
    descr: ['<https://github.com/webdiscus/webpack-remove-empty-scripts#readme>'],
    dev_packages: [
      'webpack-remove-empty-scripts'
    ],
  },
  {
    label: 'html-webpack-inject-preload',
    fav: true,
    descr: ['<https://github.com/principalstudio/html-webpack-inject-preload#readme>'],
    dev_packages: [
      '@principalstudio/html-webpack-inject-preload'
    ],
  },
  {
    label: 'typescript per react/webpack',
    dev_packages: [
      '@types/react-dom',
      '@types/react',
      'ts-loader',
      'typescript-plugin-css-modules',
      'typescript'
    ],
  },
  {
    label: 'sass per webpack',
    dev_packages: [
      'sass-loader',
      'sass'
    ],
    fav: true,
  },
];

// =>> @m
const m = [...[
  {p: 'auto-datatables-bs5', extra_p: ['datatables.net@^1', 'datatables.net-bs5@^1'], dev: false},
  {p: 'autocomplete', dev: false},
  {p: 'ckeditor-utilities', dev: false},
  // {p: 'cookie-consent', dev: false},
  {p: 'svg-icons-tools', dev: true,
    descr: [
      '<https://github.com/massimo-cassandro/svg-icons-tools?tab=readme-ov-file#svg-icons-tools>'
    ]
  },
  {p: 'create-favicons', dev: true,

    snippets: [
      'npx create-favicons init',
      'npx create-favicons --dir=./'
    ]
  },
  {p: 'dev-updater', dev: true, fav: true,

    snippets: [
      '"UPD-version": "npx update-version  # --config=./dev-utilities.config.mjs",',
      '"upd@m": "npx upd@m",',
    ]
  },
  {p: 'js-file-uploader', dev: false,
    descr: [
      '<https://massimo-cassandro.github.io/js-file-uploader/demo/>'
    ]
  },
  {p: 'js-utilities', dev: false},
  {p: 'json-table', dev: false},
  {p: 'layout-tools', dev: true},
  {p: 'modal-alert', dev: false},
  {p: 'scss-utilities', dev: false},
  {p: 'sharing-links', dev: false},
  {p: 'unsplash-page', dev: false},
  {p: 'twig-utilities', dev: false},
].map(item =>{

  const p = {
    label: `${item.p}`,
    fav: item.fav??false
  };

  p.descr = [...(item.descr??[]), ...[`<https://github.com/massimo-cassandro/${item.p}>`]];

  if(item.snippets) {
    p.snippets = item.snippets;
  }

  if(item.dev) {
    p.dev_packages = [`@massimo-cassandro/${item.p}`];
    if(item.extra_p) {
      p.dev_packages.push(item.extra_p);
    }
  } else {
    p.packages = [`@massimo-cassandro/${item.p}`];
    if(item.extra_p) {
      p.packages.push(item.extra_p);
    }
  }
  return p;
})];


export default [...m, ...snippets];
