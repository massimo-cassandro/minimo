/* eslint-env node */

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const {BannerPlugin} = require('webpack');

const PACKAGE = require('./package.json');
const path = require('path');

// const Dotenv = require('dotenv-webpack');
const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  mode: process.env.NODE_ENV,
  watch: isDevelopment,
  devtool: isDevelopment? 'inline-source-map' : false,

  // =>> entry
  // https://webpack.js.org/configuration/entry-context/
  entry: {
    'lt': './src/breakpoints.js',
  },

  // =>> output
  // https://webpack.js.org/configuration/output/
  output: {
    path: path.resolve(__dirname, './dist' ),
    filename: '[name].js',
    publicPath: '/',
    clean: true,
  },


  // =>> optimization
  // https://webpack.js.org/configuration/optimization/
  optimization: {
    minimize: !isDevelopment,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          // https://github.com/terser/terser?tab=readme-ov-file#mangle-options
          // mangle: {
          //   reserved: [],
          //   properties: {
          //     keep_quoted: 'strict'
          //   }
          // },
          output: {
            comments: /^!/,
          },
        },
        extractComments: false,
      }),
    ],
    runtimeChunk: false, //'single',
    usedExports: true,
  }, // end optimization

  // =>> performance
  // https://webpack.js.org/configuration/performance/
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  }, // end perfomance


  // =>> devServer
  // https://webpack.js.org/configuration/dev-server/
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, '/'),
      serveIndex: true,
    },

    open: true, // oppure  --open | --no-open, cambia browser: --open-app-name 'Google Chrome'

    compress: true,
    hot: true,
    // host: '0.0.0.0',
    port: 5500,
    // devMiddleware: { writeToDisk: true }
  },

  // =>> plugins
  plugins: [
    // =>> HtmlWebpackPlugin
    // https://github.com/jantimon/html-webpack-plugin#readme
    (isDevelopment && new HtmlWebpackPlugin({

        filename: 'index.html',
        template: path.resolve(__dirname, './src/test-breakpoints-template.ejs'),
        inject: 'body',
        title: 'Test Breakpoints',
        minify: false,
        chunks: ['breakpoints'],
      })
    ),

    // =>> BannerPlugin
    (!isDevelopment && new BannerPlugin({
      banner: () => {
          const date = new Date().toLocaleString('it-IT', { year: 'numeric', month: 'long' });
          return '/*!\n' +
            ` * Layout Tools v.${PACKAGE.version} - Massimo Cassandro ${date}\n` +
            ' */\n';
        },
        raw: true
      }) // end BannerPlugin
    )
  ],

  module: {

    rules: [

      // =>> rules: html files
      // {
      // test: /(\.html?)$/i,
      //   oneOf: [

      //     // copy files to output folder
      //     {
      //       type: 'javascript/auto',
      //       resourceQuery: /as_asset/,
      //       use: [
      //         {
      //           loader: 'file-loader',
      //           options: {
      //             name: '[name].[contenthash].[ext]',
      //             // outputPath: 'imgs/',
      //             esModule: false,
      //           }
      //         }
      //       ]
      //     },
      //     // get html content
      //     {
      //       loader: 'html-loader'
      //     },
      //   ]
      // }, // end html files

      // =>> rules: css/scss modules
      {
        test: /(\.module\.(sass|scss|css))$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              injectType: 'singletonStyleTag'
            },
          },
          {
            loader: 'css-loader',
            options: {
              // esModule: false,
              modules: {
                auto: true, // /\.module\.scss$/i.test(filename),
                localIdentName: isDevelopment? '[local]_[hash:base64:6]' : '[hash:base64]', // '[name]__[local]_[hash:base64:5]'
                // localIdentName: '[local]_[hash:base64:6]'
              },
              sourceMap: isDevelopment,
              importLoaders: isDevelopment? 1 : 2,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                sourceMap: isDevelopment,
              },
            },
          }
        ]
      },

    ], // end rules
  }, // end module

  // =>> resolve
  resolve: {
    fallback: {
      'fs': false,
      'util': false
    },
    modules: ['./', 'node_modules'],
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.cjs', '.jsx', '.json', '.scss', '.css'],
    alias: {
      '@src': './src',
    }
  }
};




module.exports = config;
