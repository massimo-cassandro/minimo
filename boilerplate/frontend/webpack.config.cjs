/* eslint-env node */

const { paths } = require('./webpack-src/paths.cjs');
const { jsConfigAliases } = require('./webpack-src/get-jsconfig-aliases.cjs');
const { cssPlugins, cssRules } = require('./webpack-src/css-setup.cjs');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const HtmlWebpackInjectPreload = require('@principalstudio/html-webpack-inject-preload');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const svgToMiniDataURI = require('mini-svg-data-uri');

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const {BannerPlugin} = require('webpack');
const PACKAGE = require(paths.packageJson);
const path = require('path');
const fs = require('fs');



// const Dotenv = require('dotenv-webpack');
const isDevelopment = process.env.NODE_ENV === 'development'
  ,output_dir = isDevelopment? '_dev' : 'build'
  // ,favicons_path = /src\/favicons\/output/

  // https://medium.com/@technoblogueur/webpack-one-manifest-json-from-multiple-configurations-output-fee48578eb92
  // ,manifest_shared_seed = {};

  // =>> CopyWebpackPlugin Obj
  filesToCopy = [
    {
      from: path.resolve(__dirname, './email/logo-assicorporate-email.png'),
      to: "email/[name].[contenthash][ext]",
    },
  ]
;

// =>> entries obj
// lettura dei file in admin
const entries = {
  assicorporate: path.resolve(__dirname, './src/index.js'),
  autoDatatable: path.resolve(__dirname, './src/components/auto-datatable/auto-datatable.js')
};
const app_dir = path.resolve(__dirname, './src/pagine');
fs.readdirSync(app_dir)
  .forEach(subdir => {
    const thisDir = path.join(app_dir, subdir);
    const stats = fs.statSync(thisDir); // stats.isFile() / stats.isDirectory()
    if(stats.isDirectory()) {
      fs.readdirSync(thisDir)
        .filter(f => /\.js$/.test(f))
        .filter(f => /^[^_]/.test(f)) // ignore files starting with `_`
        .forEach(file => {
          entries[subdir + '/' + path.basename(file, '.js')] = path.join(thisDir, file);
        });
    }
  });

// dev only entries
// if(isDevelopment) {
//   entries['malert'] = path.resolve(__dirname, './src/components/modal-alert/modal-alert.js');
// }

const config = {
  mode: isDevelopment? 'development' : 'production',

  watch: isDevelopment,

  // Control how source maps are generated
  // devtool: isDevelopment? 'inline-source-map' : 'source-map', // false, <== false non aggiunge la sourcemap ,
  devtool: isDevelopment? 'inline-source-map' : false,
  // devtool: 'source-map',

  // =>> entry
  // https://webpack.js.org/configuration/entry-context/
  entry: entries,

  // =>> output
  // https://webpack.js.org/configuration/output/
  output: {
    path: path.resolve(__dirname, `../public/${output_dir}` ),
    // filename: '[name].js',
    filename: '[name].[contenthash].js',
    publicPath: `/${output_dir}/`, // usato per i percorsi degli elementi importati nei js
    clean: !isDevelopment,
  },

  // externals: {
  //   jquery: 'jquery',
  // },

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
    // runtimeChunk: { name: entrypoint => `runtime~${entrypoint.name}`,
    // splitChunks: { chunks: 'all', },
    // splitChunks: {
    //   cacheGroups: {
    //     vendor: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: 'vendors',
    //       chunks: 'all'
    //     }
    //   }
    // },
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
  // devServer: {
  //   historyApiFallback: true,
  //   static: {
  //     directory: path.join(__dirname, '/'),
  //     serveIndex: true,
  //   },

  //   open: true, // oppure nel comando cli: --open | --no-open, cambia browser: --open-app-name 'Google Chrome'
  //   // aletrnative a `open: true`
  //   // open: ['/my-page', '/another-page'],
  //   // open: {
  //   //   app: {
  //   //     name: 'Google Chrome',
  //   //   },
  //   // },
  //   compress: true,
  //   hot: true,
  //   // host: '0.0.0.0',
  //   port: 5500,
  //   // devMiddleware: { writeToDisk: true } // forza la scrittura su disco anche in modalità dev
  // },

  // =>> plugins
  plugins: [

    ...cssPlugins,

    // =>> Dotenv
    // richiede `npm install -D dotenv-webpack`
    // new Dotenv({
    //   path: isDevelopment? './.env.development' : './.env',
    //   expand: true,
    //   ignoreStub: true,
    //   allowEmptyValues: true,
    // }),
    // permette di accedere a process da script eseguiti nel browser
    // richiede dotenv-webpack e `npm install -D process`
    // new webpack.ProvidePlugin({
    //   process: 'process/browser',
    // }),

    //=>> numero di versione
    // new webpack.DefinePlugin({
    //   'APP_VERSION': `'${PACKAGE.version}'`,
    // }),

    // Removes/cleans build folders and unused assets when rebuilding
    // non necessario con opzione `clean` di output
    // new CleanWebpackPlugin(),

    // =>> RemoveEmptyScriptsPlugin
    // https://github.com/webdiscus/webpack-remove-empty-scripts
    new RemoveEmptyScriptsPlugin({
      enabled: !isDevelopment,
      verbose: true
    }),



    // =>> CopyWebpackPlugin
    new CopyWebpackPlugin({
      patterns: filesToCopy,
    }), // end CopyWebpackPlugin

    // =>> HotModuleReplacementPlugin
    // Only update what has changed on hot reload
    // new webpack.HotModuleReplacementPlugin(), (non necessario con devServer.hot === true)

    // =>> WebpackManifestPlugin
    new WebpackManifestPlugin({
      // seed: manifest_shared_seed,
      // fileName: path.join(paths.output_path, 'manifest.json'),
      // basePath: item.source_dirname
      // removeKeyHash: /(^(_assets\/(?!(fonts\/))))|((\?as_asset)$)/,
      removeKeyHash: /(\?(as_asset|as_lib))$/,

      // rimuove i font dal manifest. Non necessari, rendono il file inutilmente grande
      filter: isDevelopment? undefined : (FileDescriptor) => {
        // console.log(FileDescriptor.name);
        // console.log(FileDescriptor.path);
        // return /\.(woff2?|eot|ttf|otf)$/.test(FileDescriptor.name)? false : true;
        return /fonts/.test(FileDescriptor.path)? false : true;
      },

      sort: isDevelopment? undefined : (a, b) => a.name.localeCompare(b.name)
    }),

    // =>> HtmlWebpackPlugin
    // https://github.com/jantimon/html-webpack-plugin#readme

    // new HtmlWebpackPlugin({
    //   filename: 'index.html',
    //   template: path.resolve(__dirname, './src/public/index.ejs'),
    //   inject: 'body',
    //   title: 'Calibre-Reader',
    //   minify: true
    // }),

    // new HtmlWebpackPlugin({
    //   filename: '[name]-head.html.twig',
    //   inject: 'body',
    //   title: 'My App',
    //   inject: false,
    //   templateContent: ({htmlWebpackPlugin}) => {
    //     let tpl = '';
    //     const js_files = typeof htmlWebpackPlugin.files.js === 'object'
    //       ? htmlWebpackPlugin.files.js
    //       : [htmlWebpackPlugin.files.js];
    //     const css_files = typeof htmlWebpackPlugin.files.css === 'object'
    //       ? htmlWebpackPlugin.files.css
    //       : [htmlWebpackPlugin.files.css];
    //     if(css_files.length) {
    //       tpl += css_files.map(item =>
    //         `<link rel="preload" href="${item}" as="style">` + (isDevelopment? '\n' : '') +
    //         `<link rel="stylesheet" href="${item}" type="text/css" media="all">`
    //       ).join(isDevelopment? '\n' : '');
    //     }
    //     tpl += (css_files.length && js_files.length && isDevelopment)? '\n\n' : '';
    //     if(js_files.length) {
    //       tpl += js_files.map(item =>
    //         `<link rel="preload" href="${item}" as="script">` + (isDevelopment? '\n' : '') +
    //         `<script src="${item}" defer></script>`
    //       ).join(isDevelopment? '\n' : '');
    //     }
    //     return tpl;
    //   },
    // }),


    // new HtmlWebpackPlugin({
    //   templateContent: `<!DOCTYPE html>
    //     <html lang="it">
    //       <head>
    //         <meta charset="utf-8">
    //         <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    //         <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    //         <link rel="icon" href="./favicon.ico" sizes="32x32">
    //         <link rel="icon" href="./favicon.svg" type="image/svg+xml">
    //         <link rel="apple-touch-icon" href="./apple-touch-icon.png">
    //         <link rel="manifest" href="./manifest.webmanifest">
    //         <title__TITLE__</title>
    //       </head>
    //       <body>
    //         <div id="root" class="wrapper"></div>
    //       </body>
    //     </html>`,
    //   filename: 'index.html',
    //   inject: 'body',
    // }),

    // HtmlWebpackPlugin({
    //   filename: 'index.html',
    //   template: path.resolve(__dirname, './src/public/index.ejs'),
    //   inject: 'body',
    //   title: 'XXXX',
    //   chunks: ['app'],
    //   templateParameters: {
    //     mdContent: getMarkdownFiles(),
    //   }}),

    // new HtmlWebpackInjectPreload({
    //   files: [
    //     {
    //       match: /.*-latin-(?!(ext-)).*\.woff2$/,
    //       match: /.*\.woff2$/,
    //       attributes: { as: 'font', type: 'font/woff2', crossorigin: true },
    //     },
    //     {
    //        match: /.*\.css$/,
    //        attributes: { as: 'style' },
    //     },
    //   ]
    // }),

    // (isDevelopment && new HtmlWebpackPlugin({ ... }))

    // =>> BannerPlugin
    new BannerPlugin({
      banner: () => {
        const date = new Date().toLocaleString('it-IT', { year: 'numeric', month: 'long' });

        // version = /(-alpha|-beta|-rc)/.test(PACKAGE.version)? PACKAGE.version :
        //   PACKAGE.version.replace(/(\d+\.\d+)\.\d+/, '$1.x');

        return '/*!\n' +
          ` * Assicorporate v.${PACKAGE.version} - Massimo Cassandro / Gianluca Canale ${date}\n` +
          ' */\n';
      },
      raw: true
    }) // end BannerPlugin
  ],

  module: {

    // =>> rules
    // Determine how modules within the project are treated
    rules: [

      // =>> rules: html files
      {
      test: /(\.html?)$/i,
        oneOf: [

          // copy files to output folder
          {
            type: 'javascript/auto',
            resourceQuery: /as_asset/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[contenthash].[ext]',
                  // outputPath: 'imgs/',
                  esModule: false,
                }
              }
            ]
          },
          // get html content
          {
            loader: 'html-loader'
          },
        ]
      }, // end html files

      // =>> rules: plain text
      // {
      //   test: /\.(txt|md)$/i,
      //   type: 'asset/source'
      // },


      // =>> rules: typescript
      // {
      //   test: /\.tsx?$/,
      //   use: 'ts-loader',
      //   exclude: /node_modules/,
      // }

      // =>> rules: favicons
      // {
      //   test: /\.(?:ico|png|svg|webmanifest)$/i,
      //   type: 'javascript/auto',
      //   include: favicons_path,
      //   use: [
      //     {
      //       loader: 'file-loader',
      //       options: {
      //         name: '[name].[ext]?_=[contenthash]',
      //         outputPath: '',
      //         esModule: false,
      //       }
      //     }
      //   ]
      // }, // end favicons

      // =>> JS libraries (not included in scripts) (?as_lib)
      {
        test: /\.js$/,
        type: 'javascript/auto',
        resourceQuery: /as_lib/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash].[ext]',
              outputPath: 'libs/',
              esModule: false,
            }
          }
        ]
      },

      // =>> rules: svg
      {
        test: /(\.svg)$/i,
        // exclude: favicons_path,
        oneOf: [
          // svg inline dataUri per css (con `?inline-dataURI`)
          {
            resourceQuery: /inline-dataURI/,
            // loader: 'raw-loader',
            type: 'asset/inline',
            generator: {
              dataUrl: content => {
                content = content.toString();
                return svgToMiniDataURI(content);
              }
            }
          },

          // svg inline (con `?inline`)
          {
            resourceQuery: /inline/,
            // type: 'asset/inline', // inline as base 64
            type: 'asset/source', // inline as svg
          },

          // copy image files to build folder
          {
            // type: 'asset/resource',
            type: 'javascript/auto',
            // resourceQuery: { not: [/(css-)?inline/] },
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[contenthash].[ext]',
                  outputPath: 'imgs/',
                  esModule: false,
                }
              }
            ]
          },
        ]
      }, // end svg

      // =>> rules: Images / pdf
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp|avif|pdf)$/i,
        // type: 'asset/resource',
        type: 'javascript/auto',
        // exclude: favicons_path,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash].[ext]',
              outputPath: 'imgs/',
              esModule: false,
            }
          }
        ]
      }, // end Images / pdf

      // =>> rules: Fonts
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        //type: 'asset/resource',
        type: 'javascript/auto',
        use: [
          {
            loader: 'file-loader',
            options: {
              hmr: isDevelopment,
              name: '[name].[contenthash].[ext]',
              outputPath: 'fonts', // usato nel manifest
              // publicPath: `/${output_dir}/fonts`, // usato nel css
              esModule: false,
            }
          }
        ]
      }, // end fonts

      ...cssRules,

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
    // alias: {
    //   '@': './',
    // },
    alias: jsConfigAliases
  }

};


module.exports = config;
