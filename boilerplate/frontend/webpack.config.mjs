// webpack.config.mjs
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

import { PurgeCSSPlugin } from 'purgecss-webpack-plugin';
import { globSync } from 'glob';

import { cssRules } from './webpack/css-rules.mjs';
import { getJsConfigAliases } from './webpack/get-jsConfig-aliases.mjs';
import { svgRules } from './webpack/svg-rules.mjs';

// --- config ---
const isDevelopment = process.env.NODE_ENV === 'development'
  ,__filename = fileURLToPath(import.meta.url)
  ,__dirname = path.dirname(__filename)
  ,useSass = false
  ,inlineCssInDevMode = true
  ,useSvgo = true
  ,useSvgr = false // svg per react
  ,svgoConfig = useSvgo? (await import('./webpack/svgo.config.mjs')).default : null
  ,output_dir = path.resolve(__dirname, './build') // sf:  isDevelopment? '_dev' : 'build'
  ,favicons_path_regexp = /src\/favicons\/output/ // source pattern per le favicons (regexp o null)
  ,jsConfigAliases = getJsConfigAliases(path.resolve(__dirname, './jsconfig.json'))
  ,packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf-8'))
  // ,manifest_shared_seed = {}
  // ,sf_public_dir_path = path.resolve(__dirname, '../public')
;


// CopyWebpackPlugin (null o array vuoto per disattivare)
const CopyWebpackPluginPatterns = [
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
];

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
  dotenv: {
    prefix: 'APP_',
    dir: '/',
    template: ['.env', '.env.development'] //, '.env.local', '.env.[mode]', '.env.[mode].local'],
  },

  devtool: isDevelopment ? 'inline-source-map' : false,

  entry: {
    'xxxxxx': './src/index.js'
  },

  output: {
    path: output_dir, // sf: path.resolve(__dirname, `./public/${output_dir}` ),
    filename: '[name].[contenthash].js',
    publicPath: '/',
    // publicPath: `/${output_dir}/`, // sf
    // publicPath: isDevelopment? '/' : './', // per devServer, nel caso in cui l'output di produzione non sia sulla root
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

          // alternativa: non include nel chunk vendor i path che contengono la stringa `blurhash`
          // test: /[\\/]node_modules[\\/](?!.*blurhash)/i,

          // alternativa: verifica se l'import ha una query specifica (?exclude-vendor-chunk)
          // test(module) {
          //   const resource = module.nameForCondition && module.nameForCondition();
          //   if (!resource) return false;

          //   // Verifica se è in node_modules
          //   const isNodeModule = /[\\/]node_modules[\\/]/.test(resource);

          //   // module.resource è il percorso completo + query string
          //   const hasExcludeQuery = module.resource && module.resource.includes('exclude-vendor-chunk');

          //   // Include nel chunk vendor solo se è un node_module E NON ha la query
          //   return isNodeModule && !hasExcludeQuery;
          // },

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
      CopyWebpackPluginPatterns != null &&
      CopyWebpackPluginPatterns.length > 0
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
      template: path.resolve(__dirname, './src/tpl/index.ejs'),
      inject: 'body',
      title: 'XXXXX',
      minify: !isDevelopment
    }),
    new HtmlWebpackPlugin({
      filename: 'manifest.webmanifest',
      template: path.resolve(__dirname, './src/favicons/output/manifest.webmanifest.ejs'),
      inject: false,
      minify: false //!isDevelopment
    }),

    // =>> plugins: HtmlWebpackInjectPreload
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
        const year = new Date().toLocaleString('en-UK', { year: 'numeric' });
        return (
          '/*!\n' +
          ` * ${packageJson.name} v.${packageJson.version} - Massimo Cassandro 2023-${year}\n` +
          ' */\n'
        );
      },
      raw: true
    }),

    // =>> plugins: PurgeCSSPlugin (per ultimo)
    // https://purgecss.com/configuration.html
    new PurgeCSSPlugin({
      paths: globSync(
        path.join(__dirname, 'app/{src,tpl}/**/*'),
        { nodir: true }
      ),

      variables: true, // Analizza le variabili custom

      // verbose: true,
      // rejected: true,
      // stdout: true
    })

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
  }
};

export default config;

