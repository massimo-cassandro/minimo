/*
  build-tokens-src/platforms.mjs
  Costruisce e restituisce l'oggetto `platforms` per la config di Style Dictionary.

  La platform `json` è inclusa solo se jsonBuildPath è impostato.
  Il formato di output (json/jsonc) e la suddivisione in file sono delegati a buildJsonFiles().
*/

import { buildJsonFiles } from './formats/json.mjs';

/** @typedef {import('style-dictionary/types').PlatformConfig} PlatformConfig */

/*
  Transform applicate alla platform CSS.
  Esportate così che altri script (ad es. check-unresolved-custom-props.mjs) possano
  costruire un'istanza di Style Dictionary con nomi dei token trasformati in modo coerente.
  name/kebab-prefixed = name/kebab + prefisso per sorgente (vedi source-prefixes.mjs).
*/
export const CSS_TRANSFORMS = [
  'attribute/cti',
  'name/kebab-prefixed',
  'time/seconds',
  'asset/url',
  'size/pxToRem-smart',
  'color/css-modern',
  'shadow/css',
  'gradient/css',
  'composite/css',
  'typography/css',
];

/*
  Transform applicate alla platform JSON.
  Volutamente minimali: gli strumenti che le usano si aspettano i valori originali (es. "16px"
  e non "1rem") e i riferimenti alias ({...}) devono essere conservati per mantenere
  i collegamenti tra token. I prefissi delle sorgenti non vengono applicati qui (name/kebab semplice): l'output
  JSON mantiene l'albero dei token originale.
  Esportate così che build-source-modes.mjs possa costruire una platform json corrispondente per ogni
  modalità di sourceModes.
*/
export const JSON_TRANSFORMS = [
  'attribute/cti',
  'name/kebab',
  'color/css-modern',
];

/**
 * @param {object}          opts
 * @param {string}          opts.buildPath           Percorso assoluto della directory di output CSS
 * @param {string}          opts.destFile            Nome del file CSS di output (es. "tokens.css")
 * @param {string|null}     opts.jsonBuildPath       Percorso assoluto dell'output JSON (null = disattivato)
 * @param {string|null}     opts.jsonDestFile        Nome base del file aggregato; null = un file per sorgente
 * @param {'json'|'jsonc'}  opts.jsonFormat          Formato di output dei file JSON
 * @param {string[]}        opts.concreteFilePaths   Percorsi concreti (espansi) dei file sorgente per la modalità multi-file.
 *                                                   Raccolti da sd.allTokens dopo l'inizializzazione di SD.
 *                                                   Ignorato quando jsonDestFile è impostato.
 * @param {'keep'|'calc'|'resolve'} opts.jsonExpression  Come gestire le espressioni matematiche nei token dimension.
 * @param {{name: string, prefixes: string[]}[]} opts.customPropsGroups  Gruppi nominati di prefissi di nome, spostati in cima all'output CSS nell'ordine dell'elenco.
 * @param {boolean}         opts.pxToRem             Se false, salta la transform px→rem sulla platform CSS (default: true).
 * @param {string|null}     opts.addLayer            Racchiude le custom properties generate in `@layer <addLayer> { ... }`. null = nessun layer.
 * @param {string}          opts.selector            Selettore CSS che racchiude il blocco generato (default: ':root').
 * @returns {Record<string, PlatformConfig>} oggetto platforms pronto per la config di Style Dictionary
 */
export const buildPlatforms = ({
  buildPath,
  destFile,
  jsonBuildPath,
  jsonDestFile,
  jsonFormat,
  jsonExpression = 'keep',
  concreteFilePaths = [],
  customPropsGroups = [],
  pxToRem = true,
  addLayer = null,
  selector = ':root',
}) => {
  const cssTransforms = pxToRem
    ? CSS_TRANSFORMS
    : CSS_TRANSFORMS.filter((name) => name !== 'size/pxToRem-smart');

  /** @type {Record<string, PlatformConfig>} */
  const platforms = {
    css: {
      buildPath: buildPath + '/',
      transforms: cssTransforms,
      files: [
        {
          destination: destFile,
          format: 'css/variables-sorted',
          options: {
            outputReferences: true,
            showFileHeader: true,
            selector,
            customPropsGroups,
            addLayer,
          },
        },
      ],
    },
  };

  if (jsonBuildPath) {
    platforms.json = {
      buildPath: jsonBuildPath + '/',
      transforms: JSON_TRANSFORMS,
      files: buildJsonFiles(concreteFilePaths, jsonDestFile, jsonFormat, jsonExpression),
    };
  }

  return platforms;
};
