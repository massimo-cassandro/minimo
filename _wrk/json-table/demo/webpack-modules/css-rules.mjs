import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export function cssRules({
  isDevelopment = false,
  useSass = false,
  inlineCssInDevMode = true
}) {
  const configOptions = { isDevelopment, useSass, inlineCssInDevMode };

  return [
    // CSS modules
    {
      test: /\.module\.(sass|scss|css)$/i,
      oneOf: [
        // inserimento critical css con tag style al momento della build
        {
          test: /\.critical\.module\./i,
          use: css_loaders({ ...configOptions, critical: true, css_modules: true }),
        },

        // inserimento css con tag style nel runtime
        {
          resourceQuery: /inline/,
          use: css_loaders({ ...configOptions, inline: true, css_modules: true }),
        },
        // comportamento standard
        {
          use: css_loaders({ ...configOptions, css_modules: true }),
        },
      ]
    },
    // CSS standard
    {
      test: /\.(sass|scss|css)$/i,
      exclude: /\.module\.(sass|scss|css)$/i,
      sideEffects: true,
      oneOf: [
        {
          test: /\.critical\.(sass|scss|css)$/i,
          use: css_loaders({ ...configOptions, critical: true }),
        },
        {
          resourceQuery: /inline/,
          use: css_loaders({ ...configOptions, inline: true }),
        },
        {

          use: css_loaders({ ...configOptions }),
        }
      ]
    }
  ];
}

function css_loaders({
  isDevelopment = false,
  useSass = false,
  inlineCssInDevMode = true,
  css_modules = false,
  critical = false,     // Iniezione statica nell'HTML
  inline = false        // Iniezione dinamica via JS
}) {

  let mainLoader;

  if (inline) {
    // usa style-loader per la query string ?inline
    mainLoader = {
      loader: 'style-loader',
      options: { injectType: 'singletonStyleTag' }
    };

  } else if (critical) {
    // usa MiniCssExtractPlugin per permettere al plugin HTML di leggerlo
    mainLoader = MiniCssExtractPlugin.loader;

  } else {
    // compartamento stabdard
    mainLoader = (isDevelopment && inlineCssInDevMode)
      ? { loader: 'style-loader', options: { injectType: 'singletonStyleTag' } }
      : MiniCssExtractPlugin.loader;
  }


  return [
    mainLoader,

    {
      loader: 'css-loader',
      options: {
        modules: css_modules
          ? {
            auto: true,
            localIdentName: isDevelopment ? '[local]_[hash:base64:6]' : '[hash:base64]',
            exportLocalsConvention: 'as-is',
          }
          : false,
        sourceMap: isDevelopment,
        importLoaders: useSass ? 2 : 1,
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: { sourceMap: isDevelopment }
      }
    },
    ...(useSass
      ? [ {
        loader: 'sass-loader',
        options: {
          sourceMap: isDevelopment,
          sassOptions: {
            quietDeps: true,
            silenceDeprecations: [ 'legacy-js-api', 'mixed-decls', 'color-functions', 'global-builtin', 'import' ],
          }
        }
      } ]
      : []
    )
  ];
}
