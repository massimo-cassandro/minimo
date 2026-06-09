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

import { cssRules } from './webpack-modules/css-rules.mjs';
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
  // ,output_dir = path.resolve(__dirname, './dist')
  // ,output_dir = isDevelopment? '_dev' : 'build' // symfony
  ,favicons_path_regexp = null // source pattern per le favicons (regexp o null)
  ,jsConfigAliases = getJsConfigAliases(path.resolve(__dirname, '../jsconfig.json'))
  ,packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
  // ,manifest_shared_seed = {}
;


// CopyWebpackPlugin (null o array vuoto per disattivare)
const CopyWebpackPluginPatterns = [];

// recupero metadata immagini
// const require = createRequire(import.meta.url);
// responsive-loader adapter (CJS) — use createRequire
// const responsiveLoaderSharp = require('responsive-loader/sharp');

/******************************/
/** CONFIG **/

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

  ...(isDevelopment
    ? {
      entry: { jsonTableDemo: './demo/demo.js' },
      output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        clean: true,
      }
    }

    // NB: actually unused
    : {
      entry: { jsonTable: './src/index.js' },
      output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].esm.js',
        // publicPath: '/',
        clean: true,
        library: {
          // name: 'jsonTable',
          type: 'module',
        }
      },
      experiments: {
        outputModule: true,
      },


    }
  ),

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
    runtimeChunk: false,
    usedExports: true,
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


    // =>> plugins: MiniCssExtractPlugin
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css'
    }),

    ...(isDevelopment
      ? [new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, './index.ejs'),
        inject: 'body',
        // title: 'JSON table demo',
        minify: false
      })]
      : []
    ),


    // =>> plugins: BannerPlugin
    new webpack.BannerPlugin({
      banner: () => {

        const start_year = 2025,
          current_year = new Date().toLocaleString('en-UK', { year: 'numeric' }),
          year = [
            start_year,
            ...(current_year > start_year? [current_year] : [])
          ].join('-'),

          vers = packageJson.version; //.split('.').slice(0,-1).join('.');

        return (
          '/*!\n' +
          ` * ${packageJson.name} v.${vers} - Massimo Cassandro ${year}\n` +
          ' */\n'
        );
      },
      raw: true
    }),

    // =>> plugins: PurgeCSSPlugin (per ultimo)
    // https://github.com/FullHuman/purgecss/tree/main/packages/purgecss-webpack-plugin
    // https://purgecss.com/configuration.html
    // https://github.com/isaacs/node-glob#readme
    //   new PurgeCSSPlugin({
    //     paths: globSync(
    //       // array ([]) per path multipli
    //       path.join(__dirname, 'app/{src,tpl}/**/*'),
    //       { nodir: true }
    //     ),

    //     variables: true, // Analizza le variabili custom

    //     // verbose: true,
    //     // rejected: true,
    //     // stdout: true
    //   })

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
      // {
      //   test: /\.ejs$/i,
      //   use: [
      //     {
      //       loader: 'ejs-loader',
      //       options: {
      //         esModule: false // Necessario per far sì che il require restituisca la stringa correttamente
      //       }
      //     }
      //   ]
      // },

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

          {
            type: 'asset/resource',
            exclude: favicons_path_regexp?? undefined,
            generator: {
              filename: 'imgs/[name].[contenthash][ext]',
            }
          },
        ],
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

