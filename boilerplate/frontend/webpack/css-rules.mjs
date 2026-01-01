import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/**
 * Funzione per definire le regole per CSS/SCSS
 * @returns {import('webpack').RuleSetRule[]}
 */


function css_loaders (isDevelopment = false, opts = {}) {
  opts = {
    css_modules: false,
    inline: false,
    ...opts
  };
  return [
    opts.inline
      ? {
        loader: 'style-loader',
        options: {
          injectType: 'singletonStyleTag'
        }
      }
      : MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        modules: opts.css_modules
          ? {
            auto: true,
            localIdentName: isDevelopment
              ? '[local]_[hash:base64:6]'
              : '[hash:base64]'
          }
          : false,
        sourceMap: isDevelopment,
        importLoaders: isDevelopment ? 1 : 2
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          sourceMap: isDevelopment
        }
      }
    },
    // {
    //   loader: 'sass-loader',
    //   options: {
    //     sourceMap: isDevelopment
    //   }
    // }
  ];
}

export function cssRules(isDevelopment = false) {

  return [
    {
      test: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/,
          use: css_loaders(isDevelopment, { inline: true, css_modules: true }),
        },
        {
          use: css_loaders(isDevelopment, { css_modules: true }),
        },
      ]
    },
    {
      test: /\.(sass|scss|css)$/,
      exclude: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/,
          use: css_loaders(isDevelopment, { inline: true }),
        },
        {
          use: css_loaders(isDevelopment),
        }
      ]
    }
  ];
}
