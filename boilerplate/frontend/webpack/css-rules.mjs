import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/**
 * Funzione per definire le regole per CSS/SCSS
 * @returns {import('webpack').RuleSetRule[]}
 */



export function cssRules({
  isDevelopment = false,
  useSass = false,
  inlineCssInDevMode = true
}) {

  // opzioni impostate mel config
  const configOptions = {
    isDevelopment: isDevelopment,
    useSass: useSass,
    inlineCssInDevMode: inlineCssInDevMode
  };

  return [
    {
      test: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/,
          use: css_loaders({...configOptions, inline: true, css_modules: true }),
        },
        {
          use: css_loaders({...configOptions,  css_modules: true }),
        },
      ]
    },
    {
      test: /\.(sass|scss|css)$/,
      exclude: /(\.module\.(sass|scss|css))$/,
      oneOf: [
        {
          resourceQuery: /inline/,
          use: css_loaders({...configOptions, inline: true }),
        },
        {
          use: css_loaders({...configOptions}),
        }
      ]
    }
  ];
}


function css_loaders ({
  isDevelopment = false,
  useSass = false,
  inlineCssInDevMode = true,
  css_modules = false,
  inline = false
}) {

  return [
    (inline || (isDevelopment && inlineCssInDevMode))
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
        modules: css_modules
          ? {
            auto: true,
            localIdentName: isDevelopment
              ? '[local]_[hash:base64:6]'
              : '[hash:base64]',

            // namedExport: false, // false: permette l'utilizzo di `import style...` invece di `import * as style...` come nella versione 6
            exportLocalsConvention: 'as-is', // 'camel-case-only' // 'camel-case-only': forces camelcase style (rewrites classnames)
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
    ...(useSass
      ? [{
        loader: 'sass-loader',
        options: {
          sourceMap: isDevelopment,

          // per bootstrap 5.3
          // api: 'legacy',
          sassOptions: {
            quietDeps: true,
            silenceDeprecations: ['legacy-js-api', 'mixed-decls', 'color-functions', 'global-builtin', 'import'],
          }

        }
      }]
      : []
    )
  ];
}
