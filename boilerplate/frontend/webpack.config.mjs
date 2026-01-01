// webpack.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import fs from 'fs';
import * as process from 'process'; // Rende 'process' disponibile nel contesto ESM
import { styleText } from 'node:util';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackInjectPreload from '@principalstudio/html-webpack-inject-preload';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import Dotenv from 'dotenv-webpack';

import { cssRules } from './webpack/css-rules.mjs';
import { getJsConfigAliases } from './webpack/get-jsConfig-aliases.mjs';

// --- Variabili Globali ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import del file package.json
const PACKAGE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf-8')
);

const isDevelopment = process.env.NODE_ENV === 'development';
const output_dir = path.resolve(__dirname, './build');
const favicons_path_regexp = /src\/favicons\/output/; // source pattern per le favicons

// --- Logica Condizionale SVGO ---
const USE_SVGO = true; // process.env.USE_SVGO === 'true' || !isDevelopment;

let svgoConfig = {};
try {
  svgoConfig = (USE_SVGO) ? (await import('./svgo.config.js')).default : {};

} catch {
  if (USE_SVGO) {
    // https://nodejs.org/api/util.html#utilstyletextformat-text-options
    // eslint-disable-next-line no-console
    console.error( styleText(['red'], 'SVGO_CONFIG_WARN: svgo.config.js non trovato o non leggibile. Disabilitare USE_SVGO se non richiesto.'));
  }
}

// jsConfig
const jsConfigAliases = getJsConfigAliases(path.resolve(__dirname, './jsconfig.json'));



const config = {
  mode: isDevelopment ? 'development' : 'production',

  watchOptions: {
    ignored: [ 'build', '**/node_modules', '.git', '_private' ]
  },

  devtool: isDevelopment ? 'inline-source-map' : false,

  entry: {
    'xxxxxx': './src/index.js'
  },

  output: {
    path: output_dir,
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: !isDevelopment
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
    splitChunks: {
      cacheGroups: {

        icons: {
          test(module) {
            return (
              module.resource &&
              module.resource.includes(`${path.sep}src${path.sep}icons${path.sep}`) &&
              !module.resource.includes(`${path.sep}node_modules${path.sep}`)
            );
          },
          name: 'icons',
          chunks: 'all',
          priority: 20,
          enforce: true
        },

        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },

        // separazione @massimo-cassandro da node_modules:
        // mc: {
        //   test: /[\\/]node_modules\/@massimo-cassandro[\\/]/,
        //   name: 'mc',
        //   chunks: 'all'
        // },
        // vendor: {
        //   // test: /[\\/]node_modules[\\/]/,
        //   test(module) {
        //     // `module.resource` contains the absolute path of the file on disk.
        //     // Note the usage of `path.sep` instead of / or \, for cross-platform compatibility.
        //     return (
        //       module.resource &&
        //       module.resource.includes(`${path.sep}node_modules${path.sep}`) &&
        //       !module.resource.includes(`${path.sep}@massimo-cassandro${path.sep}`)
        //     );
        //   },
        //   name: 'vendors',
        //   chunks: 'all'
        // },
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
      // directory: output_dir, nel caso in cui l'output non sia sulla root
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
    new Dotenv({
      path: isDevelopment ? './.env.development' : './.env',
      expand: true,
      ignoreStub: true,
      allowEmptyValues: true
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js'
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/favicons/output/icon-*.png',
          to: '[name][ext]'
        },
        // {
        //   from: 'src/php',
        //   to: 'php',
        //   globOptions: {
        //     dot: true,
        //     gitignore: true,
        //     ignore: [ '**/.DS_Store', ...(isDevelopment ? [] : [ '**/init-dev.php' ]) ]
        //   }
        // }
      ]
    }),

    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css'
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, './src/tpl/index.ejs'),
      inject: 'body',
      title: 'XXXXX',
      minify: !isDevelopment
    }),

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
      ]),

    new webpack.BannerPlugin({
      banner: () => {
        const year = new Date().toLocaleString('en-UK', { year: 'numeric' });
        return (
          '/*!\n' +
          ` * ${PACKAGE.name} v.${PACKAGE.version} - Massimo Cassandro 2023-${year}\n` +
          ' */\n'
        );
      },
      raw: true
    })
  ], // plugins

  module: {
    // =>> rules
    rules: [
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
        include: favicons_path_regexp,
        generator: {
          filename: '[name][ext]?_=[contenthash]'
        }
      },

      // =>> JS libraries
      {
        test: /\.js$/,
        type: 'asset/resource',
        resourceQuery: /as_lib/,
        generator: {
          filename: 'libs/[name].[contenthash][ext]'
        }
      },

      // =>> rules: svg
      {
        test: /(\.svg)$/i,
        exclude: favicons_path_regexp,
        oneOf: [
          // 1. svg inline dataUri per css (con `?cssInline`)
          {
            resourceQuery: /cssInline/, // ex inline-dataURI
            type: 'asset/source',
            use: [
              // Loader di ottimizzazione SVGO (condizionale)
              ...(USE_SVGO ? [ {
                loader: 'svgo-loader',
                options: svgoConfig,
              } ] : []),

              // Loader wrapper per Data URI compatto (Mini-SVG-Data-URI-Loader)
              {
                loader: path.resolve(__dirname, './loaders/mini-svg-data-uri-loader.cjs'),
              },
            ],
          },

          // as react component -> https://react-svgr.com/docs/webpack/
          // {
          //   resourceQuery: /react/,
          //   issuer: /\.[jt]sx?$/,
          //   use: [
          //     ...(USE_SVGO ? [
          //       {
          //         loader: 'svgo-loader',
          //         options: svgoConfig,
          //       },
          //     ] : []),
          //     {
          //       loader: '@svgr/webpack',
          //       options: {
          //         // Disable SVGO inside SVGR if svgo-loader already ran
          //         svgo: !USE_SVGO ? true : false,
          //         ...(USE_SVGO ? {} : { svgoConfig }),
          //       }
          //     }
          //   ],
          // },

          // svg inline (con `?inline`)
          {
            resourceQuery: /inline/,
            type: 'asset/source',
            // Ottimizzazione SVGO (condizionale)
            use: USE_SVGO ? [ { loader: 'svgo-loader', options: svgoConfig } ] : [],
          },

          // svg file (copy image files to build folder)
          {
            type: 'asset/resource',
            exclude: [ /cssInline/, /inline/ ],
            generator: {
              filename: 'imgs/[name].[contenthash][ext]'
            },
            // Ottimizzazione SVGO (condizionale)
            use: USE_SVGO ? [
              {
                loader: 'svgo-loader',
                options: svgoConfig,
              },
            ] : []
          }
        ]
      }, // end svg

      // =>> rules: Images / pdf
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp|avif|pdf)$/i,
        type: 'asset/resource',
        exclude: favicons_path_regexp,
        generator: {
          filename: 'imgs/[name].[contenthash][ext]'
        }
      },

      // =>> rules: Fonts
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]'
        }
      },

      ...cssRules(isDevelopment)
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
  }
};

export default config;

