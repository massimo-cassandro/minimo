/*
  build-tokens-src/source-prefixes.mjs
  Supporta i prefissi delle custom properties per sorgente: una voce di `source` (o di una
  modalità di `sourceModes`) può essere un oggetto `{ src, prefix }` invece di una semplice
  stringa, ad es.

    { src: 'node_modules/open-props/open-props.style-dictionary-tokens.json', prefix: 'op' }

  in modo che ogni token definito da quei file venga reso come `--op-<nome>`.

  Come funziona: il prefisso viene applicato solo al NOME del token (vedi la
  transform name/kebab-prefixed in transforms.mjs), mai al suo percorso.
  I {riferimenti} vengono risolti tramite il percorso del token e resi con il nome
  già prefissato, quindi un token di un'altra sorgente che referenzia ad es.
  {gray.5} diventa `var(--op-gray-5)` senza modificare i file dei token. L'output
  JSON mantiene la struttura ad albero originale (senza prefisso).

  La transform del nome conosce solo il file concreto da cui proviene un token
  (token.filePath), mentre `src` può contenere pattern glob: registerSourcePrefixes()
  li espande (tramite lo stesso Style Dictionary, così che il risultato corrisponda
  esattamente a token.filePath) in una mappa percorso file -> prefisso.

  La stessa voce può anche avere una mappa `transform` (che rinomina/sposta i
  nodi dei token nell'albero del file, ad es. { primary: 'primary.100' }) — vedi
  source-transforms.mjs / token-rename-parser.mjs. splitSourceEntries() più sotto
  estrae sia `prefix` sia `transform` dalla stessa forma `{ src, ... }`,
  dato che condividono la stessa sintassi di individuazione dei sorgenti.
*/

import StyleDictionary from 'style-dictionary';
import { LEGACY_TOKENS_PARSER_NAME } from './legacy-tokens-parser.mjs';
import { resolveSourcePaths } from './resolve-source-paths.mjs';
import { collectConcreteFilePaths } from './formats/json.mjs';
import { normalizeTransformMap } from './source-transforms.mjs';

/**
 * @typedef {object} PrefixedSource
 * @property {string[]} src     Percorsi/glob sorgente, già risolti (vedi resolveSourcePaths)
 * @property {string}   prefix  Prefisso normalizzato, senza `--` iniziale né `-` finale
 */

/** @type {Map<string, string>} */
let prefixByFile = new Map();

/**
 * Normalizza un prefisso fornito dall'utente: 'op', 'op-' e '--op-' diventano tutti 'op'.
 * @param {unknown} prefix
 * @returns {string}
 * @throws {Error} se il risultato non è un segmento valido di nome di custom property
 */
export const normalizePrefix = (prefix) => {
  const value = String(prefix).trim().replace(/^-+/, '').replace(/-+$/, '');
  if (!/^[a-z_][\w-]*$/i.test(value)) {
    throw new Error(`[build-tokens] config: invalid source prefix "${prefix}"`);
  }
  return value;
};

/**
 * @typedef {object} TransformedSource
 * @property {string[]} src               Percorsi/glob sorgente, già risolti
 * @property {Record<string,string>} transform  Mappa di rinomina validata (vedi source-transforms.mjs)
 */

/**
 * Suddivide un array `source` (o `sourceModes[mode]`), le cui voci possono essere
 * stringhe od oggetti `{ src, prefix, transform }`, nell'elenco piatto di
 * pattern da passare a Style Dictionary, nell'elenco delle voci con prefisso e
 * nell'elenco delle voci trasformate (rinominate). I pattern vengono risolti
 * rispetto a baseDir (vedi resolveSourcePaths).
 * @param {(string|{src: string|string[], prefix?: string, transform?: Record<string,string>})[]} entries
 * @param {string} baseDir
 * @returns {{patterns: string[], prefixed: PrefixedSource[], transformed: TransformedSource[]}}
 */
export const splitSourceEntries = (entries, baseDir) => {
  /** @type {string[]} */
  const patterns = [];
  /** @type {PrefixedSource[]} */
  const prefixed = [];
  /** @type {TransformedSource[]} */
  const transformed = [];

  for (const entry of entries ?? []) {
    if (typeof entry === 'string') {
      patterns.push(...resolveSourcePaths([entry], baseDir));
      continue;
    }

    const isObjectEntry = entry !== null && typeof entry === 'object'
      && (typeof entry.src === 'string' || Array.isArray(entry.src));
    if (!isObjectEntry) {
      throw new Error(
        `[build-tokens] config: invalid source entry ${JSON.stringify(entry)} `
        + '(expected a string or an object { src, prefix, transform })'
      );
    }

    const src = resolveSourcePaths([].concat(entry.src), baseDir);
    patterns.push(...src);

    if (entry.prefix !== undefined && entry.prefix !== null && entry.prefix !== '') {
      prefixed.push({ src, prefix: normalizePrefix(entry.prefix) });
    }

    if (entry.transform !== undefined && entry.transform !== null) {
      transformed.push({ src, transform: normalizeTransformMap(entry.transform) });
    }
  }

  return { patterns, prefixed, transformed };
};

/**
 * Espande i pattern `src` di ogni voce con prefisso in percorsi di file concreti
 * e memorizza la mappa percorso file -> prefisso usata da getSourcePrefix().
 * Va chiamata dopo registerLegacyTokensParser() e prima di qualsiasi build.
 * @param {PrefixedSource[]} prefixedSources
 * @returns {Promise<void>}
 * @throws {Error} se allo stesso file vengono assegnati due prefissi diversi
 */
export const registerSourcePrefixes = async (prefixedSources) => {
  /** @type {Map<string, string>} */
  const map = new Map();

  for (const { src, prefix } of prefixedSources) {
    const sd = new StyleDictionary({
      source: src,
      parsers: [LEGACY_TOKENS_PARSER_NAME],
      log: { verbosity: 'silent' },
      platforms: {},
    });

    for (const filePath of await collectConcreteFilePaths(sd)) {
      const existing = map.get(filePath);
      if (existing !== undefined && existing !== prefix) {
        throw new Error(
          `[build-tokens] config: "${filePath}" has two different prefixes ("${existing}" and "${prefix}")`
        );
      }
      map.set(filePath, prefix);
    }
  }

  prefixByFile = map;
};

/**
 * @param {string|undefined} filePath  token.filePath
 * @returns {string|undefined} il prefisso registrato per quel file, se presente
 */
export const getSourcePrefix = (filePath) => (filePath ? prefixByFile.get(filePath) : undefined);
