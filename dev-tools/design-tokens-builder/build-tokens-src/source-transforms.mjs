// build-tokens-src/source-transforms.mjs
// Supports per-source token renaming: an entry of `source` (or of a
// `sourceModes` mode) can carry a `transform` object next to (or instead of)
// `prefix` — see splitSourceEntries() in source-prefixes.mjs — e.g.
//
//   { src: './project-tokens/*.jsonc', transform: { primary: 'primary.100' } }
//
// so that the token found at dot-path `primary` in those files is moved to
// dot-path `primary.100` before Style Dictionary ever sees it, i.e. before
// {references} are resolved and before the CSS/JSON output is built.
//
// Typical use case: a preexisting project defines its tokens (e.g. exported
// from Figma/Penpot) under names that don't match minimo's own naming (e.g.
// the project's base color is `primary`, minimo's equivalent is
// `primary.100`). Without this feature every custom property generated from
// the project's tokens would have to be renamed by hand after each build, or
// every minimo reference to `{primary.100}` would have to be tracked down and
// changed instead. `transform` fixes the token's OWN path once, in config.
//
// Notation: both sides of the map use Style Dictionary's own dot-path
// notation (e.g. 'primary.100'), NOT the hyphen-joined custom-property
// notation (e.g. 'primary-100'). Token name segments in this project can
// themselves contain hyphens (e.g. btn-close, status-buttons), so a hyphen
// can't reliably tell a path separator from a literal part of a segment name;
// a dot can, since Style Dictionary already reserves it as the path
// separator in {references} and never allows it inside a single segment
// name.
//
// Moving a node would otherwise leave every {reference} to its OLD path
// dangling (in the same file or a completely different one) — so this module
// also collects a flat, file-independent from -> to map (getAllRenames()),
// used by the token-rename PREPROCESSOR (see token-rename-parser.mjs) to
// rewrite every such {reference} tree-wide, once all files are merged. This
// is safe to do because Style Dictionary resolves {references} against the
// single merged token tree by absolute path: if `primary` existed exactly
// once before the rename, every {primary} anywhere in the build
// unambiguously pointed at that one node, so every one of them must now
// become {primary.100} — there is no risk of rewriting an unrelated
// reference. The one case this can't disambiguate is the same "from" key
// renamed to a DIFFERENT destination in a different file (each valid on its
// own, per-file); see registerSourceTransforms() below — that key is
// excluded from the tree-wide rewrite (with a console warning), and its
// {references} are left for the user to fix by hand.
//
// How it works: unlike `prefix` (a purely cosmetic CSS name transform, see
// source-prefixes.mjs, which never touches the token tree), `transform`
// restructures the actual parsed token tree of the source file, via a
// dedicated Style Dictionary parser (see token-rename-parser.mjs) that runs
// at parse time, before files are merged and before reference resolution.
// Since both the CSS and JSON output formats rebuild their tree from
// token.path (by then already renamed), no separate handling is needed to
// make the JSON output reflect the renamed structure too.

import StyleDictionary from 'style-dictionary';
import { collectConcreteFilePaths } from './formats/json.mjs';
import { LEGACY_TOKENS_PARSER_NAME } from './legacy-tokens-parser.mjs';

/** @type {Map<string, Record<string,string>>} */
let transformByFile = new Map();

// Flat, file-independent from -> to map, used by the token-rename
// preprocessor (see token-rename-parser.mjs) to rewrite any {reference}
// pointing to a renamed token's OLD path, anywhere in the build (same file or
// another one) — references are resolved by Style Dictionary against the
// single merged token tree, by absolute path, so a bare dot-path is
// unambiguous UNLESS the same "from" key was given a different destination
// in a different file (each valid on its own — see registerSourceTransforms
// below), in which case that key is excluded here (with a warning) and its
// {references} are left for the user to fix by hand, same as before this
// preprocessor existed.
/** @type {Map<string, string>} */
let globalRenames = new Map();

const DOT_PATH = /^[^.\s][\w-]*(\.[^.\s][\w-]*)*$/;

/**
 * Validates a `transform` map: every key/value must be a non-empty
 * Style-Dictionary dot-path string (e.g. 'primary.100'), not a
 * hyphen-joined custom-property name (e.g. 'primary-100') — see the notation
 * rationale above.
 * @param {unknown} map
 * @returns {Record<string,string>}
 * @throws {Error} if the map is not a plain object, or a key/value is invalid
 */
export const normalizeTransformMap = (map) => {
  if (map === null || typeof map !== 'object' || Array.isArray(map)) {
    throw new Error(
      `[build-tokens] config: invalid "transform" value ${JSON.stringify(map)} (expected an object)`
    );
  }

  for (const [from, to] of Object.entries(map)) {
    if (!DOT_PATH.test(from) || !DOT_PATH.test(String(to))) {
      throw new Error(
        `[build-tokens] config: invalid "transform" entry "${from}": "${to}" `
        + '(expected Style Dictionary dot-path strings, e.g. { "primary": "primary.100" })'
      );
    }
  }

  return map;
};

/**
 * Expands the `transform` entries' `src` patterns into concrete file paths
 * and stores the file path -> rename map used by getSourceTransform(). Must
 * be called after registerLegacyTokensParser() and before any real build.
 * Maps from different entries touching the same file are merged; the build
 * fails only if two entries disagree on the destination of the same source
 * key.
 * @param {import('./source-prefixes.mjs').TransformedSource[]} transformedSources
 * @returns {Promise<void>}
 * @throws {Error} if the same file gets two conflicting destinations for the same key
 */
export const registerSourceTransforms = async (transformedSources) => {
  /** @type {Map<string, Record<string,string>>} */
  const map = new Map();
  // Every destination seen for a given "from" key, across all files — used
  // below to build globalRenames, and to detect the cross-file ambiguous
  // case (same "from" key, different destination in a different file).
  /** @type {Map<string, Set<string>>} */
  const destinationsByFrom = new Map();

  for (const { src, transform } of transformedSources) {
    const sd = new StyleDictionary({
      source: src,
      parsers: [LEGACY_TOKENS_PARSER_NAME],
      log: { verbosity: 'silent' },
      platforms: {},
    });

    for (const filePath of await collectConcreteFilePaths(sd)) {
      const existing = map.get(filePath) ?? {};
      for (const [from, to] of Object.entries(transform)) {
        if (existing[from] !== undefined && existing[from] !== to) {
          throw new Error(
            `[build-tokens] config: "${filePath}" has two different transform destinations `
            + `for "${from}" ("${existing[from]}" and "${to}")`
          );
        }
        existing[from] = to;

        if (!destinationsByFrom.has(from)) destinationsByFrom.set(from, new Set());
        destinationsByFrom.get(from).add(to);
      }
      map.set(filePath, existing);
    }
  }

  transformByFile = map;

  const global = new Map();
  for (const [from, destinations] of destinationsByFrom) {
    if (destinations.size > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        `[build-tokens] transform: "${from}" is renamed to different destinations in different `
        + `files (${[...destinations].join(', ')}) — {${from}} references will NOT be `
        + 'auto-rewritten; update them by hand.'
      );
      continue;
    }
    global.set(from, [...destinations][0]);
  }
  globalRenames = global;
};

/**
 * @returns {Map<string, string>} the flat from -> to map used to rewrite
 * {references} across the whole build (see token-rename-parser.mjs)
 */
export const getAllRenames = () => globalRenames;

/**
 * @param {string|undefined} filePath  token.filePath
 * @returns {Record<string,string>|undefined} the rename map registered for that file, if any
 */
export const getSourceTransform = (filePath) => (filePath ? transformByFile.get(filePath) : undefined);

/** @returns {boolean} true if at least one file has a registered transform */
export const hasRegisteredTransforms = () => transformByFile.size > 0;

/**
 * Builds the RegExp matching exactly the concrete files that have a
 * registered transform, for the Style Dictionary parser `pattern` (see
 * token-rename-parser.mjs). Returns null if no file has one.
 * @returns {RegExp|null}
 */
export const transformedFilesPattern = () => {
  const files = [...transformByFile.keys()];
  if (files.length === 0) return null;

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^(${files.map(escapeRegExp).join('|')})$`);
};
