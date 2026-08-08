// webpack.config.mjs __project_name__
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import fs from 'fs';
import * as process from 'process'; // Rende 'process' disponibile nel contesto ESM
// import { styleText } from 'node:util';
// import { createRequire } from 'node:module';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackInjectPreload from '@principalstudio/html-webpack-inject-preload';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';
// import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
// import HtmlWebpackInjectAttributesPlugin from 'html-webpack-inject-attributes-plugin';

import { cssRules } from './webpack-modules/css-rules.mjs';
import { createPurgeCSSPlugins } from './webpack-modules/purgecss-setup.mjs';
import { getJsConfigAliases } from './webpack-modules/get-jsConfig-aliases.mjs';
import { svgRules } from './webpack-modules/svg-rules.mjs';

// --- config ---
const isDevelopment = process.env.NODE_ENV === 'development'
  ,__filename = fileURLToPath(import.meta.url)
  ,__dirname = path.dirname(__filename)
  ,useSass = false
  ,inlineCssInDevMode = true
  ,useSvgo = true
  ,useSvgr = false // svg per react
  ,svgoConfig = useSvgo? (await import('./webpack-modules/svgo.config.mjs')).default : null
  ,postcssConfig_path = path.resolve(__dirname, './webpack-modules/postcss.config.mjs')
  ,output_dir = path.resolve(__dirname, '../build')
  // ,output_dir = isDevelopment? '_dev' : 'build' // symfony
  ,favicons_path = 'frontend/favicons/output'
  ,favicons_path_regexp = new RegExp(favicons_path) // source pattern per le favicons (regexp o null)
  ,jsConfigAliases = getJsConfigAliases(path.resolve(__dirname, './jsconfig.json'))
  ,packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf-8')),usePurgeCss = true // false per disattivare PurgeCSS (debug rapido di problemi legati al purge)
  ,usePurgeCss = true // false per disattivare PurgeCSS (debug rapido di problemi legati al purge)
  ,purgeCSSOptions = {
    variables: false, // rimuove le custom properties non usate (sostituisce jit-props)
    keyframes: true, // rimuove i @keyframes non referenziati
    debug: false // true per loggare i selettori rimossi da PurgeCSS a fine build
  }
  // ,manifest_shared_seed = {}
;

// test del cacheGroup `shared` (splitChunks): i css restano SEMPRE FUORI dal
// chunk condiviso e nel chunk della entry che li importa, così ogni asset css
// resta autosufficiente (`variables: true` funziona per singolo asset, e i
// critical css inlinati nei template devono restare autosufficienti). I
// template (twig/altro) linkano solo il css della propria entry (e gli
// eventuali `.critical.css`), MAI uno shared.css: se i css finissero nel
// chunk condiviso, quella parte di stili sparirebbe silenziosamente dalla
// pagina.
//
// NB: non è la soluzione migliore, perché rinuncia alla deduplicazione dei
// css tra entry — ma è la più pratica al momento vista la duplicazione ancora
// limitata tra le pagine. Da rivedere in futuro se la duplicazione dovesse
// crescere.
//
// TODO: se in futuro la duplicazione di css tra le pagine dovesse crescere
// (componenti importati dal js di più entry), valutare un cacheGroup `styles`
// dedicato ai css condivisi: andranno escluse le entry `.critical` (devono
// restare autosufficienti), gestite in safelist.variables le custom properties
// definite/consumate tra asset diversi (vedi purgecss-variables-safelist.mjs),
// e i template dovranno linkare esplicitamente lo shared.css generato
const shared_chunk_paths = (module) => {
  if (module.type === 'css/mini-extract') return false;

  // path delle directory da utilizzare nel chunk `shared`
  const sep = '[\\\\/]'; // stringa che produce [\\/] nel pattern
  const pathsRegexp = new RegExp([
    'node_modules',
    'frontend/src/js',
    'frontend/src/web-components',
    'frontend/src/components',
  ].map(p => `${sep}${p.replace(/\//g, sep)}${sep}`).join('|'));

  return pathsRegexp.test(module.nameForCondition?.() ?? '');
};


// hash: https://medium.com/@web_developer/hash-vs-chunkhash-vs-contenthash-e94d38a32208

// =>> CopyWebpackPlugin patterns
// (null o array vuoto per disattivare)
// https://github.com/webpack/copy-webpack-plugin/tree/main?tab=readme-ov-file#copy-webpack-plugin
const CopyWebpackPluginPatterns = [
  {
    from: 'src/favicons/output/icon-*.png',
    to: '[name][ext]'
  },
  // {
  //   from: '*.webp',
  //   to: 'imgs/[name].[contenthash].[ext]',
  //   context: './source/path/', // viene rimosso nella copia
  //   globOptions: {
  //     dot: true,
  //     gitignore: true,
  //     ignore: [ '**/.DS_Store' ]
  //   }
  // },
  // {
  //   from: 'src/php',
  //   to: 'php',
  //   globOptions: {
  //     dot: true,
  //     gitignore: true,
  //     ignore: [ '**/.DS_Store', ...(isDevelopment ? [] : [ '**/init-dev.php' ]) ]
  //   }
  // }
];

// =>> PurgeCSS: opzioni e istanze (usate nei plugins e dal log di debug)
//
// Vengono create DUE istanze, attive in ENTRAMBE le modalità (dev e prod),
// così i problemi di purge emergono subito durante lo sviluppo:
// - `purgeCSSPluginCritical`: solo le entry `*.critical` (purge stretto, gli asset
//   devono essere autosufficienti e minimi perché inlinati nei template html)
// - `purgeCSSPlugin`: tutti gli asset (il doppio passaggio sui critical è idempotente)
//
// NB (watch mode): i template twig NON sono osservati da webpack: dopo aver
// aggiunto una classe solo in un twig occorre rilanciare la build (o toccare
// un file js/css) perché il purge venga ricalcolato.
// NB (dev): il plugin agisce solo sugli asset css emessi; con
// `inlineCssInDevMode: true` i css non-critical in dev sono iniettati da
// style-loader e non vengono purgati (i critical passano comunque da
// MiniCssExtract e sono sempre purgati)

// `paths`: SOLO file che generano markup o classi (html/ejs, twig, php, js);
// NIENTE file css tra i paths: verrebbero letti come "contenuto" e ogni selettore
// risulterebbe usato, vanificando il purge
const purgeCSSCommonOptions = {
  paths: () => globSync(
    [
      path.resolve(__dirname, './src/**/*.{js,mjs,jsx}'),
      path.resolve(__dirname, './*.ejs'), // template html di webpack
      path.resolve(__dirname, './src/**/*.ejs'),
      // progetti symfony: template twig e classi generate lato php
      // path.resolve(__dirname, '../templates/**/*.twig'),
      // path.resolve(__dirname, '../src/**/*.php'),
      // il js di minimo genera markup con classi proprie (snackbar, unsplash-page, ecc.)
      // NB: adattare il percorso di node_modules se questo config è in una
      // sottodirectory del progetto (es. frontend/ → '../node_modules/...')
      path.resolve(__dirname, './node_modules/@massimo-cassandro/minimo/src/**/*.{js,mjs}'),
    ],
    { nodir: true }
  ),

  // extractor di default (/[A-Za-z0-9_-]+/g): adeguato a classi/tag/id,
  // NON definire extractors custom (il vecchio /[A-z0-9-:/]+/ era buggato:
  // il range [A-z] include caratteri non voluti come `[`, `\`, `^`, ...)

  variables: true, // rimuove le custom properties non usate (sostituisce postcss-jit-props)
  keyframes: true, // rimuove i @keyframes non referenziati
  // fontFace resta false (default): i font sono referenziati solo tramite
  // var(--font-family) e purgecss non risolve le custom properties nei valori,
  // quindi con `true` i @font-face verrebbero rimossi anche se usati

  rejected: purgeCSSDebug // popola purgedStats per il log di debug
};

// safelist base minima, comune alle due istanze
const purgeCSSSafelistBase = {
  standard: [
    // classi costruite dinamicamente nei template o lato server, invisibili
    // all'analisi statica dei paths. Esempio (da adattare al progetto):
    // flash messages twig con class="alert alert-{{ label }}"
    /^alert-(success|notice|error|warning)$/
  ],
  deep: [
    // css modules: prefisso `m_` presente in dev e prod (vedi css-rules.mjs),
    // le classi hashate non possono comparire nei file scansionati
    /^m_/
  ],
  greedy: [
    // INDISPENSABILE: purgecss non riconosce il nesting selector nativo e senza
    // questo pattern i selettori annidati composti solo da `&` + pseudo classi
    // (&:hover, &:focus-visible, `&` semplice, ecc.) verrebbero SEMPRE rimossi
    /^&$/
  ]
};

// css della pagina critici (inlinati nei template): purge stretto,
// devono essere autosufficienti e minimi
const purgeCSSPluginCritical = new PurgeCSSPlugin({
  ...purgeCSSCommonOptions,
  only: ['.critical'],
  safelist: purgeCSSSafelistBase
});

// tutti gli altri asset (il purge è idempotente: il secondo passaggio
// sui critical non rimuove altro)
const purgeCSSPlugin = new PurgeCSSPlugin({
  ...purgeCSSCommonOptions,
  safelist: {
    ...purgeCSSSafelistBase,
    // elenco generato: usi di var() nei blocchi `purgecss ignore` e nei css
    // shadow-DOM/`?raw`, override cross-asset (seeds), con chiusura transitiva
    // delle dipendenze (vedi webpack-modules/purgecss-variables-safelist.mjs)
    variables: purgecssVariablesSafelist({
      declarationGlobs: [
        path.resolve(__dirname, './src/**/*.css'),
        path.resolve(__dirname, './node_modules/@massimo-cassandro/minimo/src/**/*.css'),
      ],
      shadowGlobs: [
        path.resolve(__dirname, './src/web-components/**/*.css'),
        path.resolve(__dirname, './node_modules/@massimo-cassandro/minimo/src/web-components/**/*.css'),
      ],
      seeds: [
        // props dichiarate in un asset ma consumate in un altro (es. override
        // di tema definiti nel css di una pagina e consumati dal css globale):
        // indicarle qui per nome ('--btn-primary-bg') o pattern (/^--btn-/)
      ]
    })
  }
});

// recupero metadata immagini
// const require = createRequire(import.meta.url);
// responsive-loader adapter (CJS) — use createRequire
// const responsiveLoaderSharp = require('responsive-loader/sharp');

/******************************/
/** CONFIG **/

// =>> entries
// NB: percorsi dalla root del progetto
const entries = {
  'xxxxxx': './src/index.js'

  // css critici inlinati nei template html: il suffisso `.critical` nel nome
  // della entry attiva l'istanza PurgeCSS dedicata con purge stretto
  // (vedi purgeCSSPluginCritical) e la regola dedicata in css-rules.mjs
  // ,'xxxxxx.critical': './src/xxxxxx.critical.css'
};


const config = {
  mode: isDevelopment ? 'development' : 'production',

  // watch: isDevelopment, // necessario se non si usa devServer
  watchOptions: {
    ignored: [
      '**/build/**',
      '**/_dev/**',
      '**/.git/**',
      '**/_private/**',
      '**/node_modules/**',
      '!**/node_modules/@massimo-cassandro/**'
    ],
    // poll: 1000, // se necessario, risolve il problema `Error: EMFILE: too many open files, watch`
  },

  // https://webpack.js.org/configuration/dotenv/
  dotenv: {
    prefix: 'APP_',
    dir: '/',
    template: ['.env', '.env.development'] //, '.env.local', '.env.[mode]', '.env.[mode].local'],
  },

  devtool: isDevelopment ? 'inline-source-map' : false,

  entry: entries,

  output: {
    path: output_dir,
    filename: '[name].[contenthash].js',
    publicPath: '/',
    // publicPath: isDevelopment? '/' : './', // per devServer, nel caso in cui l'output di produzione non sia sulla root
    clean: !isDevelopment
  },

  /* SYMFONY:
  output: {
    path: path.resolve(__dirname, `../public/${output_dir}` ),
    // filename: '[name].js',
    filename: '[name].[contenthash].js',
    publicPath: `/${output_dir}/`,
    clean: false //!isDevelopment,
  },
  */

  // =>> optimization
  optimization: {
    minimize: !isDevelopment,
    // di default true solo se minimize:true (quindi false in dev): esplicito qui perché
    // PurgeCSSPlugin modifica gli asset css dopo il calcolo dell'hash "veloce" — senza
    // questo, in dev il contenthash non riflette le modifiche di PurgeCSS e il browser
    // può servire dalla cache una versione stale pur avendo rigenerato la build
    // realContentHash: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: /^!/
          }
        },
        extractComments: false
      })
    ],
    runtimeChunk: 'single', // true
    splitChunks: {
      cacheGroups: {

        shared: {
          // vedi shared_chunk_paths sopra per la logica completa del test
          // (path match + esclusione sempre dei css)
          test: shared_chunk_paths,
          name: 'shared',
          chunks: 'all'
        }
      }
    },
  },

  // =>> performance
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },

  // =>> devServer
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, '/'),
      serveIndex: true
    },
    open: { app: { name: 'Google Chrome' } },
    compress: true,
    hot: true,
    port: 5700
  },

  // =>> plugins
  plugins: [
    // =>> plugins: Dotenv
    new Dotenv({
      path: isDevelopment ? './.env.development' : './.env',
      expand: true,
      ignoreStub: true,
      allowEmptyValues: true
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js'
    }),


    // =>> plugins: RemoveEmptyScriptsPlugin
    new RemoveEmptyScriptsPlugin({
      enabled: !isDevelopment,
      verbose: true
    }),

    // =>> plugins: CopyWebpackPlugin
    ...(
      CopyWebpackPluginPatterns != null && CopyWebpackPluginPatterns.length > 0
        ? [
          new CopyWebpackPlugin({
            patterns: CopyWebpackPluginPatterns
          })
        ]
        : []
    ),

    // =>> plugins: WebpackManifestPlugin
    // new WebpackManifestPlugin({
    //   fileName: path.join(output_dir, 'manifest.json'), // sf: fileName: 'manifest.json', // scrive in output.path
    //   // basePath: item.source_dirname
    //   // removeKeyHash: /(^(_assets\/(?!(fonts\/))))|((\?as_asset)$)/,
    //   removeKeyHash: true, // /([a-f0-9]{32}\.?)/gi, // /(\?as_asset)$/,
    //   // rimuove i font dal manifest. Non necessari, rendono il file inutilmente grande
    //   filter: isDevelopment? undefined : (FileDescriptor) => {
    //     return /fonts/.test(FileDescriptor.path)? false : true;
    //   },
    //   sort: isDevelopment? undefined : (a, b) => a.name.localeCompare(b.name)
    // }),

    // =>> plugins: MiniCssExtractPlugin
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
      ignoreOrder: true
    }),

    // =>> plugins: HtmlWebpackPlugin (manifest)
    new HtmlWebpackPlugin({
      filename: 'manifest.webmanifest',
      template: path.resolve(__dirname, './src/favicons/output/manifest.webmanifest.ejs'),
      inject: false,
      minify: false //!isDevelopment
    }),

    // =>> plugins: HtmlWebpackPlugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, './src/tpl/index.ejs'),
      inject: 'body',
      title: 'XXXXX',
      minify: !isDevelopment
      // base: isDevelopment ? '/' : '/xxxxx/',
    }),

    // =>> plugins: HtmlWebpackInjectAttributesPlugin
    // new HtmlWebpackInjectAttributesPlugin({
    //   // La funzione riceve un oggetto con gli attributi del tag corrente
    //   media: (tag) => {
    //     // console.log(tag.attributes);
    //     // 'tag.attributes.href' contiene il percorso del file CSS generato
    //     if (tag.attributes.href && tag.attributes.rel ===  'stylesheet' && /^(\.\/memo\.).*(\.css)$/.test(tag.attributes.href)) {
    //       return 'print';
    //     }
    //     return null;
    //   }
    // }),

    // =>> plugins: HtmlWebpackInjectPreload
    // https://github.com/principalstudio/html-webpack-inject-preload
    ...(isDevelopment
      ? []
      : [
        new HtmlWebpackInjectPreload({
          files: [
            {
              match: /.*-latin-(?!(ext-)).*\.woff2$/,
              attributes: { as: 'font', type: 'font/woff2', crossorigin: true }
            },
            {
              match: /.*\.css$/,
              attributes: { as: 'style' }
            },
            {
              match: /.*\.js$/,
              attributes: { as: 'script' }
            }
          ]
        })
      ]
    ),


    // =>> plugins: BannerPlugin
    new webpack.BannerPlugin({
      banner: () => {

        const start_year = 2026
          ,current_year = new Date().toLocaleString('en-UK', { year: 'numeric' })
          ,year = [
            start_year,
            ...(current_year > start_year? [current_year] : [])
          ].join('-')
          ,vers = packageJson.version.split('.').slice(0,-1).join('.')
        ;

        return (
          '/*!\n' +
          ` * ${packageJson.name} v.${vers} - Massimo Cassandro ${year}\n` +
          ' */\n'
        );
      },
      raw: true,
      // niente banner nei critical css: vengono inlinati nei template html
      exclude: /\.critical/ // chunk name
    }),

    // =>> plugins: PurgeCSSPlugin (per ultimo, attivo anche in dev)
    // https://github.com/FullHuman/purgecss/tree/main/packages/purgecss-webpack-plugin
    // https://purgecss.com/configuration.html
    // istanze e opzioni in webpack-modules/purgecss-setup.mjs (qui solo flag/dati progetto)
    // `usePurgeCss: false` disattiva il purge per intero (utile per isolare rapidamente
    // eventuali problemi legati ad esso); `purgeCSSOptions` (variables/keyframes/debug,
    // vedi sopra) si applica solo quando è attivo
    // NB: il purge è attivo anche in dev, per far emergere subito eventuali
    // rimozioni errate. In watch mode i template twig NON sono osservati da
    // webpack: dopo aver aggiunto una classe solo in un twig occorre rilanciare
    // la build (o toccare un file js/css) per aggiornare il purge
    ...(usePurgeCss
      ? createPurgeCSSPlugins({

        // SOLO file che generano markup o classi (twig, php, js);
        // i file di stile vengono comunque scartati dal plugin
        contentGlobs: [
          path.resolve(__dirname, '../templates/**/*.twig'),
          path.resolve(__dirname, '../src/**/*.php'),
          path.resolve(__dirname, './src/**/*.{js,mjs,jsx}'),
          path.resolve(__dirname, './error-pages/**/*.js'),
          // il js di minimo genera markup con classi proprie (snackbar, unsplash-page, ecc.)
          path.resolve(__dirname, '../node_modules/@massimo-cassandro/minimo/src/**/*.{js,mjs}'),
        ],

        safelist: {
          standard: [
            // flash messages: class="alert alert-{{ label }}" (templates/incl/flash-messages.html.twig)
            /^alert-(success|notice|error|warning)$/
          ],
          deep: [
            // css modules: prefisso `m_` della build di produzione (vedi css-rules.mjs),
            // le classi con hash non possono comparire nei file scansionati
            /^m_/
          ],
          keyframes: [
            // stesso motivo dei selettori sopra, più un bug di purgecss: dentro un
            // blocco `purgecss start/end ignore` la regola è preservata ma le sue
            // dichiarazioni non vengono scansionate per l'uso di animation-name
            // (vedi @keyframes slide-in/slide-out di minimo snackbar.module.css),
            // quindi l'@keyframes verrebbe rimosso come "non referenziato" anche
            // se in realtà è usato dalla regola stessa
            /^m_/
          ],
          greedy: [
            // purgecss non riconosce il nesting selector nativo: senza questo pattern
            // i selettori annidati composti solo da `&` + pseudo classi (&:hover,
            // &:focus-visible, `&` semplice, ecc.) verrebbero SEMPRE rimossi
            /^&$/
          ]
        },

        // elenco generato: usi di var() nei blocchi `purgecss ignore` e nei css
        // shadow-DOM/`?raw`, override cross-asset (seeds), con chiusura transitiva
        // delle dipendenze (vedi webpack-modules/purgecss-variables-safelist.mjs)
        variablesSafelist: {
          declarationGlobs: [
            path.resolve(__dirname, './src/**/*.css'),
            path.resolve(__dirname, './error-pages/**/*.css'),
            path.resolve(__dirname, '../node_modules/@massimo-cassandro/minimo/src/**/*.css'),
          ],
          shadowGlobs: [
            path.resolve(__dirname, './src/web-components/**/*.css'),
            path.resolve(__dirname, '../node_modules/@massimo-cassandro/minimo/src/web-components/**/*.css'),
          ],
          seeds: [
            // override di .login-group (login.css) consumati dai buttons minimo (css globale)
            /^--btn-secondary-/
          ]
        },

        // fontFace resta false (default): i font sono referenziati solo tramite
        // var(--font-family) e purgecss non risolve le custom properties nei valori
        ...purgeCSSOptions
      })
      : [])
  ], // end plugins

  module: {
    rules: [

      // =>> rules: js / jsx
      {
        test: /\.jsx?$/,
        oneOf: [
          {
            resourceQuery: /as_lib/, // utilizzo come libreria
            type: 'asset/resource',
            generator: {
              filename: 'libs/[name].[contenthash][ext]'
            }
          },
          {
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', { targets: 'defaults' }]]
              }
            }
          }
        ]
      },

      // =>> template ejs
      {
        test: /\.ejs$/i,
        use: [
          {
            loader: 'ejs-loader',
            options: {
              esModule: false // Necessario per far sì che il require restituisca la stringa correttamente
            }
          }
        ]
      },

      // =>> rules: html files
      {
        test: /(\.html?)$/i,
        oneOf: [
          {
            type: 'asset/resource',
            resourceQuery: /as_asset/,
            generator: {
              filename: '[name].[contenthash][ext]'
            }
          },
          {
            loader: 'html-loader'
          }
        ]
      },

      // =>> rules: favicons
      {
        test: /\.(?:ico|png|svg|webmanifest)$/i,
        type: 'asset/resource',
        include: favicons_path_regexp?? undefined,
        generator: {
          filename: '[name][ext]?_=[contenthash]'
        }
      },



      // =>> raw txt / md files
      {
        test: /(\.(txt|md))$/i,
        type: 'asset/source'
      },

      // =>> rules: svg
      ...svgRules({useSvgo: useSvgo, svgoConfig: svgoConfig, useSvgr: useSvgr, favicons_path_regexp: favicons_path_regexp?? null }),

      // =>> rules: Images / pdf
      {
        test: /\.(?:gif|png|jpg|jpeg|webp|avif|pdf)$/i,
        oneOf: [

          // './img.jpg?metadata'
          // {
          //   resourceQuery: /metadata/,
          //   // 'javascript/auto' è OBBLIGATORIO qui per impedire a Webpack 5 di trattarlo come un asset nativo duplicato
          //   type: 'javascript/auto',
          //   use: [
          //     {
          //       loader: 'responsive-loader',
          //       options: {
          //         // Sharp è necessario per leggere i metadati velocemente
          //         adapter: responsiveLoaderSharp,

          //         // solo i dati del file originale
          //         // disable: true,
          //         sizes: [99999999], // forza responsive-loader a ricalcolare le dimensioni reali

          //         esModule: true,

          //         // Manteniamo i nomi file consistenti
          //         name: '[name].[contenthash][ext]',
          //         outputPath: 'imgs',
          //         publicPath: path.join((isDevelopment? '/_dev/' : '/build/'), 'imgs')
          //       },
          //     },
          //   ],
          // },

          {
            type: 'asset/resource',
            exclude: favicons_path_regexp?? undefined,
            generator: {
              filename: 'imgs/[name].[contenthash][ext]',
            }
          },
        ],
      },

      // =>> Video
      {
        test: /\.(?:mp4|webm)$/i,
        // type: 'asset/resource',
        type: 'javascript/auto',
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash][ext]',
              outputPath: 'video/',
              esModule: false,
            }
          }
        ]
      },

      // =>> rules: Fonts
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]'
        }
      },

      // =>> rules: css / scss
      ...cssRules({isDevelopment: isDevelopment, useSass: useSass, inlineCssInDevMode: inlineCssInDevMode, postcssConfig_path: postcssConfig_path})
    ] // end rules
  }, // end module

  // =>> resolve
  resolve: {
    fallback: {
      fs: false,
      util: false,
      process: 'process/browser.js'
    },
    modules: [ './', './node_modules' ],
    extensions: [ '.tsx', '.ts', '.js', '.mjs', '.cjs', '.jsx', '.json', '.scss', '.css' ],
    alias: {
      ...jsConfigAliases
    }
  },

  // =>> stats
  // stats: {
  //   assets: false,
  //   modules: false,
  //   chunks: false,
  //   errors: true,        // Mostra solo gli errori
  //   errorDetails: false, // Disabilita i dettagli troppo prolissi
  //   moduleTrace: false,
  // },
};

export default config;

