/* eslint-env node */
const path = require('path');
// const fs = require('fs');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInjectPreload = require('@principalstudio/html-webpack-inject-preload');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const svgToMiniDataURI = require('mini-svg-data-uri');
// const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
// const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

// const Dotenv = require('dotenv-webpack');
const webpack = require('webpack'); // // const { BannerPlugin, ProvidePlugin } = require('webpack');
const PACKAGE = require('./package.json');

const isDevelopment = process.env.NODE_ENV === 'development'
  ,output_dir = path.resolve(__dirname, './build')
  ,favicons_path = /src\/favicons\/output/

  // https://medium.com/@technoblogueur/webpack-one-manifest-json-from-multiple-configurations-output-fee48578eb92
  // ,manifest_shared_seed = {};
;

// =>> entries obj
// lettura dei file in admin
// const entries = {
//   assicorporate: path.resolve(__dirname, './src/index.js'),
//   autoDatatable: path.resolve(__dirname, './src/components/auto-datatable/auto-datatable.js')
// };
// const app_dir = path.resolve(__dirname, './src/pagine');
// fs.readdirSync(app_dir)
//   .forEach(subdir => {
//     const thisDir = path.join(app_dir, subdir);
//     const stats = fs.statSync(thisDir); // stats.isFile() / stats.isDirectory()
//     if(stats.isDirectory()) {
//       fs.readdirSync(thisDir)
//         .filter(f => /\.js$/.test(f))
//         .filter(f => /^[^_]/.test(f)) // ignore files starting with `_`
//         .forEach(file => {
//           entries[subdir + '/' + path.basename(file, '.js')] = path.join(thisDir, file);
//         });
//     }
//   });

// dev only entries
// if(isDevelopment) {
//   entries['malert'] = path.resolve(__dirname, './src/components/modal-alert/modal-alert.js');
// }
const config = {
  mode: isDevelopment? 'development' : 'production',

  // watch: isDevelopment,
  watchOptions: {
    ignored: ['build', '**/node_modules', '.git', '_private'],
  },

  // devtool: isDevelopment? 'inline-source-map' : 'source-map', // false, <== false non aggiunge la sourcemap ,
  devtool: isDevelopment? 'inline-source-map' : false,
  // devtool: 'source-map',
  // =>> entry
  // https://webpack.js.org/configuration/entry-context/

  entry: {
    'xxx': './src/index.js',
    // entry: entries,
  },

  output: {
    path: output_dir,
    // filename: '[name].js',
    filename: '[name].[contenthash].js',
    publicPath: '/', // `/${output_dir}/`,
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
          output: {
            comments: /^!/,
          },
        },
        extractComments: false,
      }),
    ],
    runtimeChunk: true, //false, //'single',
    // runtimeChunk: { name: entrypoint => `runtime~${entrypoint.name}`,
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    },
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
    // open: true,
    open: {
      app: {
        name: 'Google Chrome',
      },
    },
    compress: true,
    hot: true,
    // host: '0.0.0.0',
    port: 5700,
    // devMiddleware: { writeToDisk: true } // forza la scrittura su disco anche in modalità dev
  },

   // =>> plugins
  plugins: [

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

    // new webpack.ProvidePlugin({
    //   process: 'process/browser',
    // }),

    // =>> CopyWebpackPlugin
    new CopyWebpackPlugin({
      patterns: [

        // {
        //   from: 'src/assets/**/_{htaccess,htpasswd}',
        //   to: ({ context, absoluteFilename }) => {
        //     return path.join(output_dir,  path.basename(absoluteFilename).replace(/^_/, '.'));
        //   },
        //   toType: 'file',
        // },
        {
          from: 'src/favicons/output/icon-*.png',
          to: "[name][ext]",
        },
        {
          from: 'src/php',
          to: 'php',
          globOptions: {
            dot: true,
            gitignore: true,
            ignore: ['**/.DS_Store'],
          },
        },

      ],
    }),

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


    // =>> MiniCssExtractPlugin
    new MiniCssExtractPlugin({
      // filename: isDevelopment? '[name].css' : '[name].[contenthash].css',
      // chunkFilename: isDevelopment? '[id].css' : '[id].[contenthash].css'
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css'
    }),

    // =>> HtmlWebpackPlugin
    // https://github.com/jantimon/html-webpack-plugin#readme
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, './src/tpl/index.ejs'),
      inject: 'body',
      title: 'Calibre-Reader',
      minify: !isDevelopment
    }),

    // ALTERNATIVE
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

    new HtmlWebpackInjectPreload({
      files: [
        {
          match: /.*-latin-(?!(ext-)).*\.woff2$/,
          attributes: {as: 'font', type: 'font/woff2', crossorigin: true },
        },
        {
          match: /.*\.css$/,
          attributes: {as: 'style' },
        },
        {
          match: /.*\.js$/,
          attributes: {as: 'script' },
        },
      ]
    }),

    // =>> BannerPlugin
    new webpack.BannerPlugin({
      banner: () => {
        const year = new Date().toLocaleString('en-UK', { year: 'numeric' });

        // version = /(-alpha|-beta|-rc)/.test(PACKAGE.version)? PACKAGE.version :
        //   PACKAGE.version.replace(/(\d+\.\d+)\.\d+/, '$1.x');

        return '/*!\n' +
          ` * ${PACKAGE.name} v.${PACKAGE.version} - Massimo Cassandro 2023-${year}\n` +
          ' */\n';
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
      {
        test: /\.(?:ico|png|svg|webmanifest)$/i,
        type: 'javascript/auto',
        // type: 'asset/resource',
        include: favicons_path,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]?_=[contenthash]',
              outputPath: '',
              esModule: false,
            }
          }
        ]
      },

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

      ...cssRules()

    ] // end rules
  }, // end module

  // =>> resolve
  resolve: {
    fallback: {
      'fs': false,
      'util': false,
      'process': require.resolve('process'),
    },
    modules: ['./', 'node_modules'],
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.cjs', '.jsx', '.json', '.scss', '.css'],
    // alias: {
    //   '@': './',
    // },
    alias: getJsConfigAliases()
  }

};


function getJsConfigAliases() {
  const jsConfig = require('./jsconfig.json');
  const aliases = {};
  for(const item in jsConfig.compilerOptions.paths) {

    const key = item.replace(/(\/\*)$/, ''),
      value = path.resolve(
        __dirname,
        path.relative(__dirname, jsConfig.compilerOptions.paths[item][0]
      )
        .replace(/(\/\*)$/, ''));

    aliases[key] = value;
  }
  console.log(aliases);
  return aliases;
}

function cssRules() {

  // =>> css_loaders func
  const css_loaders = (opts) => {

    opts = {
      css_modules: false,
      inline: false,
      ...opts
    };

    return [
      (
        opts.inline
          ? {
            loader: 'style-loader',
            options: {
              injectType: 'singletonStyleTag'
            }
          }
          // : isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader
          : MiniCssExtractPlugin.loader // per uso con scrittura del css anche in dev (commentando riga precedente)
      ),
      {
        loader: 'css-loader',
        options: {
          // esModule: false,
          modules: opts.css_modules ? {
            auto: true, // /\.module\.scss$/i.test(filename),
            localIdentName: isDevelopment? '[local]_[hash:base64:6]' : '[hash:base64]', // '[name]__[local]_[hash:base64:5]'
            // localIdentName: '[local]_[hash:base64:6]'
          } : false,
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
      },
      // {
      //   loader: 'sass-loader',
      //   options: {
      //     sourceMap: isDevelopment,
      //     // api: 'legacy',
      //     sassOptions: {
      //       quietDeps: true,
      //       silenceDeprecations: ['legacy-js-api', 'mixed-decls', 'color-functions', 'global-builtin', 'import'],
      //     }
      //   }
      // },
    ];
  }; // end css_loaders func


  return [
    // =>> rules: css/scss modules
    {
      test: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/, // foo.css?inline
          use: css_loaders({inline: true, css_modules: true}),
        },
        {
          use: css_loaders({css_modules: true}),
        },
      ]
    },

    // =>> rules: css / scss
    {
      test: /\.(sass|scss|css)$/,
      exclude: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/, // foo.css?inline
          use: css_loaders({inline: true}),
        },
        {
          use: css_loaders(),
        },
      ]
    } // end css/scss
  ];
}

module.exports = config;
