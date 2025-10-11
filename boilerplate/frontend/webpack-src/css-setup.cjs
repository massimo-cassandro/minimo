const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

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


exports.cssPlugins = [
  // =>> MiniCssExtractPlugin
  // Extracts CSS into separate files
  new MiniCssExtractPlugin({
    // filename: isDevelopment? '[name].css' : '[name].[contenthash].css',
    // chunkFilename: isDevelopment? '[id].css' : '[id].[contenthash].css'
    filename: '[name].[contenthash].css',
    chunkFilename: '[id].[contenthash].css'
  })
];

exports.cssRules = [
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
