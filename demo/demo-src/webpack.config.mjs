// webpack.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import fs from 'fs';
import * as process from 'process'; // Rende 'process' disponibile nel contesto ESM
// import { styleText } from 'node:util';
// import { createRequire } from 'node:module';

import HtmlWebpackPlugin from 'html-webpack-plugin';
// import HtmlWebpackInjectPreload from '@principalstudio/html-webpack-inject-preload';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
// import CopyWebpackPlugin from 'copy-webpack-plugin';
// import Dotenv from 'dotenv-webpack';
// import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';
// import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
// import HtmlWebpackInjectAttributesPlugin from 'html-webpack-inject-attributes-plugin';

// import { PurgeCSSPlugin } from 'purgecss-webpack-plugin';
// import { globSync } from 'glob';

import { cssRules } from '../../webpack-setup/webpack-modules/css-rules.mjs';
import { getJsConfigAliases } from '../../webpack-setup/webpack-modules/get-jsConfig-aliases.mjs';
import { svgRules } from '../../webpack-setup/webpack-modules/svg-rules.mjs';

// --- config ---
const isDevelopment = process.env.NODE_ENV === 'development'
  ,__filename = fileURLToPath(import.meta.url)
  ,__dirname = path.dirname(__filename)
  ,useSass = false
  ,inlineCssInDevMode = true
  ,useSvgo = true
  ,useSvgr = false // svg per react
  ,svgoConfig = useSvgo? (await import('../../webpack-setup/webpack-modules/svgo.config.mjs')).default : null
  ,output_dir = path.resolve(__dirname, '../build')
  // ,output_dir = isDevelopment? '_dev' : 'build' // symfony
  ,favicons_path = null //'frontend/favicons/output'
  ,favicons_path_regexp = null //new RegExp(favicons_path) // source pattern per le favicons (regexp o null)
  ,jsConfigAliases = getJsConfigAliases(path.resolve(__dirname, '../../jsconfig.json'))
  ,packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'))
  // ,manifest_shared_seed = {}
;

// hash: https://medium.com/@web_developer/hash-vs-chunkhash-vs-contenthash-e94d38a32208

// =>> CopyWebpackPlugin patterns
// (null o array vuoto per disattivare)
// https://github.com/webpack/copy-webpack-plugin/tree/main?tab=readme-ov-file#copy-webpack-plugin
// const CopyWebpackPluginPatterns = [];

// recupero metadata immagini
// const require = createRequire(import.meta.url);
// responsive-loader adapter (CJS) — use createRequire
// const responsiveLoaderSharp = require('responsive-loader/sharp');

/******************************/
/** CONFIG **/

// =>> entries
const entries = {
  'index': path.resolve(__dirname, './index.js'),
};


const config = {
  mode: isDevelopment ? 'development' : 'production',

  // watch: isDevelopment, // necessario se non si usa devServer
  watchOptions: {
    ignored: [ 'build', '**/node_modules', '.git', '_private' ],
    // poll: 1000, // se necessario, risolve il problema `Error: EMFILE: too many open files, watch`
  },

  // https://webpack.js.org/configuration/dotenv/
  // dotenv: {
  //   prefix: 'APP_',
  //   dir: '/',
  //   template: ['.env', '.env.development'] //, '.env.local', '.env.[mode]', '.env.[mode].local'],
  // },

  devtool: isDevelopment ? 'inline-source-map' : false,

  entry: entries,

  output: {
    path: output_dir,
    filename: '[name].[contenthash].js',
    publicPath: '/',
    // publicPath: isDevelopment? '/' : './', // per devServer, nel caso in cui l'output di produzione non sia sulla root
    clean: !isDevelopment,
    // module: true, 
    // chunkFormat: 'module',
  },

  experiments: {
    outputModule: true,
  },

  // =>> optimization
  optimization: {
    minimize: !isDevelopment,
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
    runtimeChunk: true,
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
    open: {
      app: {
        name: 'Google Chrome'
      }
    },
    compress: true,
    hot: true,
    port: 5700
  },

  // =>> plugins
  plugins: [
    // =>> plugins: Dotenv
    // new Dotenv({
    //   path: isDevelopment ? './.env.development' : './.env',
    //   expand: true,
    //   ignoreStub: true,
    //   allowEmptyValues: true
    // }),
    // new webpack.ProvidePlugin({
    //   process: 'process/browser.js'
    // }),


    // // =>> plugins: RemoveEmptyScriptsPlugin
    // new RemoveEmptyScriptsPlugin({
    //   enabled: !isDevelopment,
    //   verbose: true
    // }),

    // =>> plugins: CopyWebpackPlugin
    // ...(
    //   CopyWebpackPluginPatterns != null && CopyWebpackPluginPatterns.length > 0
    //     ? [
    //       new CopyWebpackPlugin({
    //         patterns: CopyWebpackPluginPatterns
    //       })
    //     ]
    //     : []
    // ),

    // =>> plugins: WebpackManifestPlugin
    // new WebpackManifestPlugin({
    //   fileName: path.join(output_dir, 'manifest.json'), // sf: fileName: 'manifest.json', // scrive in output.path
    //   // basePath: item.source_dirname
    //   // removeKeyHash: /(^(_assets\/(?!(fonts\/))))|((\?as_asset)$)/,
    //   removeKeyHash: true, // /([a-f0-9]{32}\.?)/gi, // /(\?as_asset)$/,
    //   // rimuove i font dal manifest. Non necessari, rendono il file inutilmente grande
    //   filter: isDevelopment? undefined : (FileDescriptor) => {
    //     return /_fonts/.test(FileDescriptor.path)? false : true;
    //   },
    //   sort: isDevelopment? undefined : (a, b) => a.name.localeCompare(b.name)
    // }),

    // =>> plugins: MiniCssExtractPlugin
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css'
    }),

    // =>> plugins: HtmlWebpackPlugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../index.ejs'),
      inject: 'body',
      // title: 'Buttons Demo',
      minify: !isDevelopment
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

 

    // =>> plugins: PurgeCSSPlugin (per ultimo)
    // https://github.com/FullHuman/purgecss/tree/main/packages/purgecss-webpack-plugin
    // https://purgecss.com/configuration.html
    // https://github.com/isaacs/node-glob#readme
    // new PurgeCSSPlugin({

    //   // css da pulire
    //   paths: globSync(
       
    //     // path.resolve(__dirname, '@minimo/**/!(*.module).css'),
    //     path.resolve(__dirname, '@src/**/*.{css,js,ejs}'),
    //     //   path.resolve(__dirname, '@src/**/*.js'),
    //     //   path.resolve(__dirname, '@app/**/*.ejs'),
    //     //   path.join(__dirname, './templates/**/*.twig')
    
    //     { nodir: true }
    //   ), // .filter(filePath => !filePath.endsWith('.module.css'));



    //   variables: false, // Analizza le variabili custom
    //   safelist: {
    //     standard: ['body', 'html', 'button', 'a'], 
    //     deep: [/^btn/],
    //     greedy: []

    //   },

      // verbose: true,
      // rejected: true,
      // stdout: true
    // })

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
      // {
      //   test: /\.(?:ico|png|svg|webmanifest)$/i,
      //   type: 'asset/resource',
      //   include: favicons_path_regexp?? undefined,
      //   generator: {
      //     filename: '[name][ext]?_=[contenthash]'
      //   }
      // },

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
      ...cssRules({isDevelopment: isDevelopment, useSass: useSass, inlineCssInDevMode: inlineCssInDevMode})
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
};

export default config;

