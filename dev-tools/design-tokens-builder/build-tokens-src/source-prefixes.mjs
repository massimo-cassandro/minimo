// build-tokens-src/source-prefixes.mjs
// Supports per-source custom property prefixes: an entry of `source` (or of a
// `sourceModes` mode) can be an object `{ src, prefix }` instead of a plain
// string, e.g.
//
//   { src: 'node_modules/open-props/open-props.style-dictionary-tokens.json', prefix: 'op' }
//
// so that every token defined by those files is rendered as `--op-<name>`.
//
// How it works: the prefix is applied to the token NAME only (see the
// name/kebab-prefixed transform in transforms.mjs), never to its path.
// {references} are resolved through the token path and rendered with the
// already-prefixed name, so a token of another source referencing e.g.
// {gray.5} becomes `var(--op-gray-5)` with no change to the token files. The
// JSON output keeps the original (unprefixed) tree structure.
//
// The name transform only knows the concrete file a token comes from
// (token.filePath), while `src` may contain glob patterns: registerSourcePrefixes()
// expands them (through Style Dictionary itself, so the result matches
// token.filePath exactly) into a file path -> prefix map.

import StyleDictionary from 'style-dictionary';
import { LEGACY_TOKENS_PARSER_NAME } from './legacy-tokens-parser.mjs';
import { resolveSourcePaths } from './resolve-source-paths.mjs';
import { collectConcreteFilePaths } from './formats/json.mjs';

/**
 * @typedef {object} PrefixedSource
 * @property {string[]} src     Source paths/globs, already resolved (see resolveSourcePaths)
 * @property {string}   prefix  Normalised prefix, without leading `--` or trailing `-`
 */

/** @type {Map<string, string>} */
let prefixByFile = new Map();

/**
 * Normalises a user-provided prefix: 'op', 'op-' and '--op-' all become 'op'.
 * @param {unknown} prefix
 * @returns {string}
 * @throws {Error} if the result is not a valid custom property name segment
 */
export const normalizePrefix = (prefix) => {
  const value = String(prefix).trim().replace(/^-+/, '').replace(/-+$/, '');
  if (!/^[a-z_][\w-]*$/i.test(value)) {
    throw new Error(`[build-tokens] config: invalid source prefix "${prefix}"`);
  }
  return value;
};

/**
 * Splits a `source` (or `sourceModes[mode]`) array, whose entries can be
 * strings or `{ src, prefix }` objects, into the flat list of patterns to pass
 * to Style Dictionary and the list of the prefixed entries. Patterns are
 * resolved relative to baseDir (see resolveSourcePaths).
 * @param {(string|{src: string|string[], prefix?: string})[]} entries
 * @param {string} baseDir
 * @returns {{patterns: string[], prefixed: PrefixedSource[]}}
 */
export const splitSourceEntries = (entries, baseDir) => {
  /** @type {string[]} */
  const patterns = [];
  /** @type {PrefixedSource[]} */
  const prefixed = [];

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
        + '(expected a string or an object { src, prefix })'
      );
    }

    const src = resolveSourcePaths([].concat(entry.src), baseDir);
    patterns.push(...src);

    if (entry.prefix !== undefined && entry.prefix !== null && entry.prefix !== '') {
      prefixed.push({ src, prefix: normalizePrefix(entry.prefix) });
    }
  }

  return { patterns, prefixed };
};

/**
 * Expands the `src` patterns of every prefixed entry into concrete file paths
 * and stores the file path -> prefix map used by getSourcePrefix().
 * Must be called after registerLegacyTokensParser() and before any build.
 * @param {PrefixedSource[]} prefixedSources
 * @returns {Promise<void>}
 * @throws {Error} if the same file is given two different prefixes
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
 * @returns {string|undefined} the prefix registered for that file, if any
 */
export const getSourcePrefix = (filePath) => (filePath ? prefixByFile.get(filePath) : undefined);
