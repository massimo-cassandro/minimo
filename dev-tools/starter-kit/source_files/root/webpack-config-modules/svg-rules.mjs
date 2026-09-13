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

  /**
   * Restituisce i loader SVGO tenendo conto sia dell'opzione globale `useSvgo`
   * sia delle modalità di opt-out per singolo file/import:
   *
   *  1. resourceQuery `?noSVGO` (combinabile con altre query):
   *       import icon from './icon.svg?noSVGO';
   *       import icon from './icon.svg?cssInline&noSVGO';
   *
   *  2. Suffisso `-noSVGO` nel nome file (si applica a tutti gli import di quel file):
   *       import icon from './icon-noSVGO.svg';
   *
   * Il parametro `resourceQuery` è la stringa raw della query dell'import corrente
   * (es. "?cssInline&noSVGO"). Quando non disponibile a compile-time, la verifica
   * sul suffisso del file viene delegata a `test: /-noSVGO\.svg$/i` sulla regola.
   *
   * @param {boolean} [skipSvgo=false] - true se la regola ha già rilevato noSVGO
   */
  const svgoLoaders = (skipSvgo = false) =>
    (useSvgo && !skipSvgo) ? [ { loader: 'svgo-loader', options: svgoConfig } ] : [];

  /**
   * Dato un set di condizioni (resourceQuery, test, ...) e i loader "core" della regola,
   * restituisce una coppia di regole: una normale e una con `?noSVGO` che bypassa SVGO.
   * Questo permette di combinare liberamente ?noSVGO con qualsiasi altra query.
   *
   * @param {object} baseRule  - la regola senza i loader SVGO
   * @param {function} makeUse - funzione (skipSvgo: bool) => loader array
   */
  const withNoSVGOVariant = (baseRule, makeUse) => [
    // Variante con ?noSVGO: stessa regola ma senza SVGO.
    // La resourceQuery combina il match originale con la presenza di noSVGO.
    {
      ...baseRule,
      resourceQuery: {
        and: [ baseRule.resourceQuery, /noSVGO/ ],
      },
      use: makeUse(true),
    },
    // Variante normale (senza ?noSVGO).
    {
      ...baseRule,
      use: makeUse(false),
    },
  ];

  return [{
    test: /(\.svg)$/i,
    exclude: favicons_path_regexp?? undefined,
    oneOf: [

      // 1. svg inline dataUri per css (con `?cssInline`)
      //    Supporta anche `?cssInline&noSVGO` per saltare SVGO su quel singolo import.
      ...withNoSVGOVariant(
        {
          resourceQuery: /cssInline/, // ex inline-dataURI
          type: 'asset/source',
        },
        (skipSvgo) => [
          // Loader wrapper per Data URI compatto (Mini-SVG-Data-URI-Loader)
          {
            loader: path.resolve(this_dirname, './mini-svg-data-uri-loader.cjs'),
          },
          // Loader di ottimizzazione SVGO
          ...svgoLoaders(skipSvgo),
        ],
      ),

      // 2. as react component -> https://react-svgr.com/docs/webpack/
      //    Supporta anche `?react&noSVGO`.
      ...(useSvgr
        ? withNoSVGOVariant(
          {
            resourceQuery: /react/,
            issuer: /\.[jt]sx?$/,
          },
          (skipSvgo) => [
            {
              loader: '@svgr/webpack',
              options: {
                ...((useSvgo && !skipSvgo)
                  ? {
                    svgo: true,
                    svgoConfig: svgoConfig,
                  }
                  : {
                    svgo: false,
                  }
                ),
                // Altre opzioni utili di SVGR
                // titleProp: true,
                // ref: true,
              },
            },
          ],
        )
        : []
      ),

      // 3. svg inline (con `?inline`)
      //    Supporta anche `?inline&noSVGO`.
      ...withNoSVGOVariant(
        {
          resourceQuery: /inline/,
          type: 'asset/source',
        },
        (skipSvgo) => svgoLoaders(skipSvgo),
      ),

      // 4. svg file con suffisso `-noSVGO` nel nome (es. `icon-noSVGO.svg`).
      //    Si applica a tutti gli import di quel file, senza bisogno di ?noSVGO.
      {
        test: /-noSVGO\.svg$/i,
        type: 'asset/resource',
        generator: {
          filename: 'imgs/[name].[contenthash][ext]'
        },
      },

      // 5. svg file (copy image files to build folder)
      {
        type: 'asset/resource',
        exclude: [ /cssInline/, /inline/ ],
        sideEffects: true,
        generator: {
          filename: 'imgs/[name].[contenthash][ext]'
        },
      }
    ]
  }];
}
