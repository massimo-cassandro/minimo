// webpack.config.mjs
import path from 'path';
// import fs from 'fs';
import { fileURLToPath } from 'url';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackInjectPreload from '@principalstudio/html-webpack-inject-preload';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import svgToMiniDataURI from 'mini-svg-data-uri';
// import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';

// import Dotenv from 'dotenv-webpack';
import webpack from 'webpack';
// const { BannerPlugin, ProvidePlugin } = webpack;

// Equivalente a __dirname in CJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import del package.json
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PACKAGE = require('./package.json');
const processBrowserPath = require.resolve('process/browser');

// Variabili di ambiente e percorsi
const isDevelopment = process.env.NODE_ENV === 'development'
  , output_dir = path.resolve(__dirname, './build')
  , favicons_path = /src\/favicons\/output/
;

/**
 * Funzione per generare le regole per il CSS/SASS
 * @param {boolean} css_modules - Abilita i CSS modules.
 * @param {boolean} inline - Usa style-loader per l'iniezione inline.
 * @returns {Array<object>} Array di oggetti loader.
 */
function css_loaders({ css_modules = false, inline = false } = {}) {
  return [
    (
      inline
        ? {
          loader: 'style-loader',
          options: {
            injectType: 'singletonStyleTag'
          }
        }
        : isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader
    ),
    {
      loader: 'css-loader',
      options: {
        modules: css_modules ? {
          auto: true,
          localIdentName: isDevelopment ? '[local]_[hash:base64:6]' : '[hash:base64]',
        } : false,
        sourceMap: isDevelopment,
        importLoaders: isDevelopment ? 3 : 3, // Incrementato a 3 (postcss, sass)
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
    // => Aggiunta di sass-loader
    {
      loader: 'sass-loader',
      options: {
        sourceMap: isDevelopment,
        sassOptions: {
          quietDeps: true,
          // Le opzioni legacy sono state rimosse o semplificate per la sintassi moderna
        }
    
    },
    },
  ];
}

/**
 * Funzione per ottenere gli alias da jsconfig.json
 * @returns {object} Oggetto alias per Webpack
 */
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
  return aliases;
}

/**
 * Funzione per generare le regole del modulo CSS
 * @returns {Array<object>} Array di regole per `module.rules`
 */
function cssRules() {
  return [
    // =>> rules: css/scss modules
    {
      test: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/, 
          use: css_loaders({ inline: true, css_modules: true }),
        },
        {
          use: css_loaders({ css_modules: true }),
        },
      ]
    },

    // =>> rules: css / scss normali
    {
      test: /\.(sass|scss|css)$/,
      exclude: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/, 
          use: css_loaders({ inline: true }),
        },
        {
          use: css_loaders(),
        },
      ]
    }
  ];
}

// Oggetto di configurazione principale
const config = {
  mode: isDevelopment ? 'development' : 'production',

  watchOptions: {
    ignored: ['build', '**/node_modules', '.git', '_private'],
  },

  devtool: isDevelopment ? 'inline-source-map' : false,

  entry: {
    'xxx': './src/index.js',
  },

  output: {
    path: output_dir,
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: !isDevelopment,
  },

  // =>> optimization
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
    runtimeChunk: true,
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    },
  },

  // =>> performance
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },

  // =>> devServer
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, '/'),
      serveIndex: true,
    },
    open: {
      app: {
        name: 'Google Chrome',
      },
    },
    compress: true,
    hot: true,
    port: 5700,
  },

  // =>> plugins
  plugins: [
    // CopyWebpackPlugin
    new CopyWebpackPlugin({
      patterns: [
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

    // WebpackManifestPlugin
    new WebpackManifestPlugin({
      removeKeyHash: /(\?(as_asset|as_lib))$/,
      filter: isDevelopment ? undefined : (FileDescriptor) => {
        return /fonts/.test(FileDescriptor.path) ? false : true;
      },
      sort: isDevelopment ? undefined : (a, b) => a.name.localeCompare(b.name)
    }),

    // MiniCssExtractPlugin
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css'
    }),

    // HtmlWebpackPlugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, './src/tpl/index.ejs'),
      inject: 'body',
      title: 'Calibre-Reader',
      minify: !isDevelopment
    }),

    // HtmlWebpackInjectPreload
    new HtmlWebpackInjectPreload({
      files: [
        {
          match: /.*-latin-(?!(ext-)).*\.woff2$/,
          attributes: { as: 'font', type: 'font/woff2', crossorigin: true },
        },
        {
          match: /.*\.css$/,
          attributes: { as: 'style' },
        },
        {
          match: /.*\.js$/,
          attributes: { as: 'script' },
        },
      ]
    }),

    // BannerPlugin
    new webpack.BannerPlugin({
      banner: () => {
        const year = new Date().toLocaleString('en-UK', { year: 'numeric' });
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
      {
        test: /(\.html?)$/i,
        oneOf: [
          {
            resourceQuery: /as_asset/,
            type: 'asset/resource',
            generator: {
              filename: '[name].[contenthash][ext]',
            }
          },
          {
            type: 'asset/source'
          },
        ]
      },

      {
        test: /\.(?:ico|png|svg|webmanifest)$/i,
        include: favicons_path,
        type: 'asset/resource',
        generator: {
          filename: ({ filename }) => {
            const basename = path.basename(filename);
            return basename.replace(/\.([^.]+)$/, '').replace(/\?.*/, '') + '[ext]';
          },
        }
      },

      {
        test: /\.js$/,
        resourceQuery: /as_lib/,
        type: 'asset/resource',
        generator: {
          filename: 'libs/[name].[contenthash][ext]',
        }
      },

      {
        test: /(\.svg)$/i,
        oneOf: [
          {
            resourceQuery: /inline-dataURI/,
            type: 'asset/inline',
            generator: {
              dataUrl: content => svgToMiniDataURI(content.toString()),
            }
          },
          {
            resourceQuery: /inline/,
            type: 'asset/source',
          },
          {
            type: 'asset/resource',
            generator: {
              filename: 'imgs/[name].[contenthash][ext]',
            }
          },
        ]
      },

      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp|avif|pdf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'imgs/[name].[contenthash][ext]',
        }
      },

      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]',
        }
      },

      ...cssRules()
    ]
  },

  // =>> resolve
  resolve: {
    fallback: {
      'fs': false,
      'util': false,
      // Uso processBrowserPath per risolvere il percorso in un contesto ESM
      'process': processBrowserPath,
    },
    modules: ['./', 'node_modules'],
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.cjs', '.jsx', '.json', '.scss', '.css'],
    alias: getJsConfigAliases()
  }

};

// Esporta la configurazione in sintassi ESM
export default config;