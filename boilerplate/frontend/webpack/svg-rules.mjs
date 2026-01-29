/**
 * Funzione per definire le regole per SVG
 * @returns {import('webpack').RuleSetRule[]}
 */


import path from 'path';
import { fileURLToPath } from 'url';


export function svgRules({
  useSvgo = true,
  useSvgr = false,
  svgoConfig = null,
  favicons_path_regexp = null,
}) {

  const this_filename = fileURLToPath(import.meta.url)
    ,this_dirname = path.dirname(this_filename);

  if(svgoConfig == null) {
    useSvgo = false;
  }

  return [{
    test: /(\.svg)$/i,
    exclude: favicons_path_regexp?? undefined,
    oneOf: [
      // 1. svg inline dataUri per css (con `?cssInline`)
      {
        resourceQuery: /cssInline/, // ex inline-dataURI
        type: 'asset/source',
        use: [
          // Loader di ottimizzazione SVGO
          ...(useSvgo? [ {
            loader: 'svgo-loader',
            options: svgoConfig,
          } ] : []),

          // Loader wrapper per Data URI compatto (Mini-SVG-Data-URI-Loader)
          {
            loader: path.resolve(this_dirname, './mini-svg-data-uri-loader.cjs'),
          },
        ],
      },

      // as react component -> https://react-svgr.com/docs/webpack/
      ...(useSvgr
        ? [{
          resourceQuery: /react/,
          issuer: /\.[jt]sx?$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                ...(useSvgo
                  ? {
                    svgo: true, // false: Disable SVGO inside SVGR if svgo-loader already ran
                    svgoConfig: svgoConfig,
                  }
                  : {
                    svgo: false
                  }

                )
                // Altre opzioni utili di SVGR
                // titleProp: true,
                // ref: true,
              }
            },
            // {
            //   loader: 'svgo-loader',
            //   options: svgoConfig,
            // },
          ],
        }]
        : []
      ),

      // svg inline (con `?inline`)
      {
        resourceQuery: /inline/,
        type: 'asset/source',
        // Ottimizzazione SVGO
        use: useSvgo ? [ { loader: 'svgo-loader', options: svgoConfig } ] : [],
      },

      // svg file (copy image files to build folder)
      {
        type: 'asset/resource',
        exclude: [ /cssInline/, /inline/ ],
        generator: {
          filename: 'imgs/[name].[contenthash][ext]'
        },

        // TODO presumibilmente errore sui file già ottimizzati
        // Ottimizzazione SVGO
        // use: useSvgo ? [
        //   {
        //     loader: 'svgo-loader',
        //     options: svgoConfig,
        //   },
        // ] : []
      }
    ]
  }];
}
