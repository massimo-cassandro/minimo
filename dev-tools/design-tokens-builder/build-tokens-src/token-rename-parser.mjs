// build-tokens-src/token-rename-parser.mjs
// Implements the `transform` feature end-to-end (see source-transforms.mjs):
//
// 1. A Style Dictionary PARSER that moves/renames token nodes within a
//    source file's own tree, according to the `transform` map registered for
//    that file, BEFORE Style Dictionary merges files together and resolves
//    {references}.
// 2. A Style Dictionary PREPROCESSOR that, once every file has been parsed
//    and merged into a single tree (but still before {references} are
//    resolved), rewrites every {reference} in the WHOLE tree that points to
//    one of the renamed tokens' OLD path, to its NEW path — so a reference
//    doesn't have to be hunted down and updated by hand just because the
//    token it points to was moved (in the same file or a completely
//    different one; see getAllRenames() in source-transforms.mjs for why
//    this is safe to do tree-wide).
//
// Only the exact concrete files that declare a `transform` are matched by
// the parser (the `pattern` built by transformedFilesPattern() in
// source-transforms.mjs); every other file is untouched by it and falls
// through to Style Dictionary's own built-in loader, or to the legacy bridge
// parser (legacy-tokens-parser.mjs) for plain .json sources. The
// preprocessor, instead, always runs over the entire merged tree once
// registered — it just has nothing to rewrite where no reference matches a
// renamed path.
//
// Style Dictionary's combineJSON always reads a source file's `contents` as
// raw text and hands it to whichever parser(s) match, regardless of
// extension (see node_modules/style-dictionary/lib/utils/combineJSON.js) — a
// custom parser never receives an already-executed .mjs module or an
// already-JSON5-parsed object. The parser therefore has to load the file
// itself the same way Style Dictionary's own loader (loadFile.js) would:
// dynamic `import()` for .mjs/.js, JSON5 for .jsonc/.json5, and the existing
// legacy-or-DTCG bridge (parseLegacyFile, reused as-is so hybrid-node
// handling stays consistent) for .json.

import StyleDictionary from 'style-dictionary';
import JSON5 from 'json5';
import * as path from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseLegacyFile } from './legacy-tokens-parser.mjs';
import { getSourceTransform, getAllRenames } from './source-transforms.mjs';

export const TOKEN_RENAME_PARSER_NAME = 'minimo/token-rename';
export const TOKEN_RENAME_PREPROCESSOR_NAME = 'minimo/token-rename-refs';

/** @param {unknown} node @returns {node is Record<string, unknown>} */
const isPlainObject = (node) => node !== null && typeof node === 'object' && !Array.isArray(node);

/** @param {unknown} tree @param {string[]} pathSegments @returns {unknown} */
const getAtPath = (tree, pathSegments) => pathSegments.reduce(
  (node, segment) => (isPlainObject(node) ? node[segment] : undefined),
  tree
);

// Removes the node at pathSegments (mutates tree), pruning parent groups left
// empty by the removal (innermost first), so a fully-emptied group doesn't
// linger as `{}` in the output tree.
/** @param {Record<string, unknown>} tree @param {string[]} pathSegments */
const deleteAtPath = (tree, pathSegments) => {
  if (pathSegments.length === 0) return;

  /** @type {Record<string, unknown>[]} */
  const parents = [];
  let node = /** @type {unknown} */ (tree);
  for (let i = 0; i < pathSegments.length - 1; i++) {
    if (!isPlainObject(node)) return;
    parents.push(node);
    node = node[pathSegments[i]];
  }
  if (!isPlainObject(node)) return;

  delete node[pathSegments[pathSegments.length - 1]];

  for (let i = pathSegments.length - 2; i >= 0; i--) {
    const parent = parents[i];
    const key = pathSegments[i];
    if (isPlainObject(parent[key]) && Object.keys(parent[key]).length === 0) {
      delete parent[key];
    }
  }
};

// Inserts `value` at pathSegments (mutates tree), creating intermediate
// group objects as needed.
/** @param {Record<string, unknown>} tree @param {string[]} pathSegments @param {unknown} value */
const setAtPath = (tree, pathSegments, value) => {
  let node = tree;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    if (!isPlainObject(node[segment])) node[segment] = {};
    node = /** @type {Record<string, unknown>} */ (node[segment]);
  }
  node[pathSegments[pathSegments.length - 1]] = value;
};

// A build can create several StyleDictionary instances over the same source
// file (e.g. one throwaway pass to enumerate concrete file paths, one for the
// real build — see build-tokens.mjs), each re-running this parser. Tracked so
// a missing source key is only ever warned about once per process, instead of
// once per pass.
/** @type {Set<string>} */
const warnedMissingKeys = new Set();

/**
 * Applies a rename map to a parsed DTCG tree: moves each mapped source path's
 * node to its destination path. Two phases (collect+delete, then insert) so
 * that a destination path used by one entry and a source path used by
 * another never interfere with each other depending on map order. A source
 * key not found in the tree only produces a console warning — it does not
 * fail the build, since a project config may target a key that's only
 * sometimes present.
 * @param {unknown} tree
 * @param {Record<string,string>} renameMap  dot-path -> dot-path
 * @param {string} filePath  only used for the warning message
 * @returns {unknown}
 */
export const applyTokenRenameMap = (tree, renameMap, filePath) => {
  if (!isPlainObject(tree)) return tree;

  /** @type {{fromPath: string[], toPath: string[], node: unknown}[]} */
  const moves = [];

  for (const [from, to] of Object.entries(renameMap)) {
    const fromPath = from.split('.');
    const node = getAtPath(tree, fromPath);
    if (node === undefined) {
      const warnKey = `${filePath}::${from}`;
      if (!warnedMissingKeys.has(warnKey)) {
        warnedMissingKeys.add(warnKey);
        // eslint-disable-next-line no-console
        console.warn(
          `[build-tokens] transform: source token "${from}" not found in ${filePath} — skipped`
        );
      }
      continue;
    }
    moves.push({ fromPath, toPath: to.split('.'), node });
  }

  for (const { fromPath } of moves) deleteAtPath(tree, fromPath);
  for (const { toPath, node } of moves) setAtPath(tree, toPath, node);

  return tree;
};

/** @param {string} filePath @returns {Promise<unknown>} */
const loadTree = async (filePath) => {
  const ext = path.extname(filePath);

  if (ext === '.mjs' || ext === '.js') {
    const mod = await import(pathToFileURL(filePath).href);
    try {
      return structuredClone(mod.default);
    } catch {
      // Cloning may fail for content with non-cloneable values (e.g.
      // functions) — fall back to the live module object, same as Style
      // Dictionary's own loadFile.js.
      return mod.default;
    }
  }

  const contents = await readFile(filePath, 'utf-8');

  if (ext === '.json') {
    // Reuses the legacy-or-DTCG bridge so hybrid-node conversion stays
    // consistent with every other .json source in the project.
    return parseLegacyFile(contents, filePath);
  }

  // .jsonc, .json5, or anything else: the same JSON5 parsing Style
  // Dictionary's own built-in loader uses for these extensions.
  return JSON5.parse(contents);
};

// Registers the parser globally on the StyleDictionary class. To actually
// run it, a Style Dictionary instance must also opt in via
// `parsers: [..., TOKEN_RENAME_PARSER_NAME]` (see build-tokens.mjs,
// build-source-modes.mjs, check-unresolved-custom-props.mjs) — same
// activation model as the legacy bridge parser.
/** @param {RegExp} pattern  from transformedFilesPattern() in source-transforms.mjs */
export const registerTokenRenameParser = (pattern) => {
  StyleDictionary.registerParser({
    name: TOKEN_RENAME_PARSER_NAME,
    pattern,
    parser: async ({ filePath }) => {
      const tree = await loadTree(filePath ?? '');
      const renameMap = getSourceTransform(filePath);
      return renameMap ? applyTokenRenameMap(tree, renameMap, filePath ?? '') : tree;
    },
  });
};

// ── Reference rewriting (preprocessor) ──────────────────────────────────────
//
// Matches a bare {reference} (not a CSS function containing one, e.g.
// "color-mix(in srgb, {primary} 60%, #000)" still matches the {primary} part
// only) — same pattern style as LEGACY_REF in legacy-tokens-parser.mjs.
const REF = /\{([^}]+)\}/g;

/**
 * Replaces every {reference} in `value` (a token's $value, possibly nested —
 * composite/shadow/gradient objects, arrays) whose dot-path exactly matches a
 * "from" key of `renames`, with `{<to>}`. References that don't match any
 * renamed key (including partial/longer paths, e.g. {primary.200} when only
 * "primary" was renamed) are left untouched.
 * @param {unknown} value
 * @param {Map<string,string>} renames
 * @returns {unknown}
 */
const rewriteRefs = (value, renames) => {
  if (typeof value === 'string') {
    return value.replace(REF, (match, ref) => (renames.has(ref) ? `{${renames.get(ref)}}` : match));
  }
  if (Array.isArray(value)) return value.map((v) => rewriteRefs(v, renames));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewriteRefs(v, renames)]));
  }
  return value;
};

/**
 * Walks the merged token tree (every source file, already combined by Style
 * Dictionary — see StyleDictionary.js's `preprocess()` call site) and, for
 * every leaf token (a node with `$value`), rewrites {references} in its
 * `$value` only — never touching `$type`, `filePath`, `isSource` or any other
 * metadata Style Dictionary attaches to the node.
 * @param {unknown} node
 * @param {Map<string,string>} renames
 * @returns {unknown}
 */
const rewriteTreeRefs = (node, renames) => {
  if (!isPlainObject(node)) return node;
  if (Object.hasOwn(node, '$value')) {
    return { ...node, $value: rewriteRefs(node.$value, renames) };
  }
  return Object.fromEntries(
    Object.entries(node).map(([key, child]) => [key, rewriteTreeRefs(child, renames)])
  );
};

// Registers the preprocessor globally. To actually run it, a Style
// Dictionary instance must also opt in via
// `preprocessors: [TOKEN_RENAME_PREPROCESSOR_NAME]` (see build-tokens.mjs,
// build-source-modes.mjs, check-unresolved-custom-props.mjs). A no-op
// (returns the tree unchanged) when getAllRenames() is empty — e.g. every
// registered transform turned out to be file-ambiguous (see
// registerSourceTransforms() in source-transforms.mjs).
export const registerTokenRenamePreprocessor = () => {
  StyleDictionary.registerPreprocessor({
    name: TOKEN_RENAME_PREPROCESSOR_NAME,
    preprocessor: (dictionary) => {
      const renames = getAllRenames();
      return renames.size ? rewriteTreeRefs(dictionary, renames) : dictionary;
    },
  });
};
