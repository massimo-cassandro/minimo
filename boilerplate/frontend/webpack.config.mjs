// webpack.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import fs from 'fs';
import * as process from 'process'; // Rende 'process' disponibile nel contesto ESM
import { styleText } from 'node:util';
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



import { cssRules } from './webpack/css-rules.mjs';
import { getJsConfigAliases } from './webpack/get-jsConfig-aliases.mjs';
import { svgRules } from './webpack/svg-rules.mjs';

// --- Variabili Globali ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import del file package.json
const PACKAGE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf-8')
);

const isDevelopment = process.env.NODE_ENV === 'development';
const useSass = false;
const output_dir = path.resolve(__dirname, './build');
const favicons_path_regexp = /src\/favicons\/output/; // source pattern per le favicons

// SVGO
const USE_SVGO = true; // process.env.USE_SVGO === 'true' || !isDevelopment;

let svgoConfig = {};
try {
  svgoConfig = (USE_SVGO) ? (await import('./webpack/svgo.config.js')).default : {};

} catch {
  if (USE_SVGO) {
    // eslint-disable-next-line no-console
    console.error( styleText(['red'], 'svgo.config.js non trovato o non leggibile.'));
  }
}

// jsConfig
const jsConfigAliases = getJsConfigAliases(path.resolve(__dirname, './jsconfig.json'));

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

  watchOptions: {
    ignored: [ 'build', '**/node_modules', '.git', '_private' ]
  },

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
    path: output_dir,
    filename: '[name].[contenthash].js',
    publicPath: '/',
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
    //   fileName: path.join(output_dir, 'manifest.json'),
    //   // basePath: item.source_dirname
    //   // removeKeyHash: /(^(_assets\/(?!(fonts\/))))|((\?as_asset)$)/,
    //   removeKeyHash: true, // /([a-f0-9]{32}\.?)/gi, // /(\?as_asset)$/,

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
          ` * ${PACKAGE.name} v.${PACKAGE.version} - Massimo Cassandro 2023-${year}\n` +
          ' */\n'
        );
      },
      raw: true
    })
  ], // end plugins

  module: {
    rules: [

      // =>> rules: jsx
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
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
        include: favicons_path_regexp,
        generator: {
          filename: '[name][ext]?_=[contenthash]'
        }
      },

      // =>> rules: JS libraries
      {
        test: /\.js$/,
        type: 'asset/resource',
        resourceQuery: /as_lib/,
        generator: {
          filename: 'libs/[name].[contenthash][ext]'
        }
      },

      // =>> raw txt / md files
      {
        test: /(\.(txt|md))$/i,
        type: 'asset/source'
      },

      // =>> rules: svg
      ...svgRules({useSvgo: USE_SVGO, svgoConfig: svgoConfig, useSvgr: true }),

      // =>> rules: Images / pdf
      {
        test: /\.(?:gif|png|jpg|jpeg|webp|avif|pdf)$/i,
        oneOf: [

          // './img.jpg?metadata'
          // {
          //   resourceQuery: /metadata/,
          //   // 'javascript/auto' è OBBLIGATORIO qui per impedire a Webpack 5
          //   // di trattarlo come un asset nativo duplicato
          //   type: 'javascript/auto',
          //   use: [
          //     {
          //       loader: 'responsive-loader',
          //       options: {
          //         // Sharp è necessario per leggere i metadati velocemente
          //         adapter: responsiveLoaderSharp,

          //         // solo i dati del file originale
          //         // disable: true,
          //         sizes: [9999999], // forse responsive-loader a ricalcolare le dimensioni reali

          //         esModule: true,

          //         // Manteniamo i nomi file consistenti
          //         name: '[name].[contenthash].[ext]',
          //         outputPath: 'imgs',
          //         publicPath: path.join((isDevelopment? '/_dev/' : '/build/'), 'imgs')
          //       },
          //     },
          //   ],
          // },

          {
            type: 'asset/resource',
            exclude: favicons_path_regexp,
            generator: {
              filename: 'imgs/[name].[contenthash].[ext]',
            }
          },
        ],
      },

      // =>> rules: Fonts
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]'
        }
      },

      ...cssRules({isDevelopment: isDevelopment, useSass: useSass})
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

