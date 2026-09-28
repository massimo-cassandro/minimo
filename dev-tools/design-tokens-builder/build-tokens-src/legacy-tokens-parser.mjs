// build-tokens-src/legacy-tokens-parser.mjs
// Registers a Style Dictionary parser that bridges "legacy" token files
// (Style Dictionary v3/v4-style syntax: no `$` prefix on `value`/`type`,
// references written as `{group.token.value}`) into the W3C DTCG syntax
// (`$value`/`$type`, references as `{group.token}`) required by Style
// Dictionary v5.
//
// Why this is needed: Style Dictionary v5 decides whether a build "usesDtcg"
// ONCE per build, from whichever source file is processed first (see
// detectDtcgSyntax() called inside combineJSON.js in style-dictionary) — it
// is a single global flag, not a per-file check. Mixing a legacy-syntax file
// (e.g. a file exported from Open Props, or from an old Style Dictionary
// v3/v4 project) together with DTCG sources therefore causes the legacy
// file's tokens to be silently dropped regardless of file order: they never
// carry the `$value` key combineJSON's own tagging (and the rest of the
// pipeline) expects.
//
// This parser intercepts every `.json` source file (not `.jsonc` — that
// extension is reserved in this project for hand-authored DTCG sources,
// already handled correctly by Style Dictionary's own built-in loader) and
// converts, node by node:
//   value -> $value, type -> $type, comment/description -> $description
//   "{group.token.value}" -> "{group.token}" inside reference strings
// Nodes that already use `$value` (DTCG v5 syntax) are left untouched, so
// the parser is a safe no-op for files that don't need conversion — no
// config flag or file list is required, detection is fully automatic.
//
// "Hybrid" nodes (a token with its own value that is also a group with
// nested children, e.g. Open Props' other.ease.out) can't be represented in
// DTCG v5, where a node with $value is a leaf. The own value is moved to a
// child token named `default` (or `base` if `default` is already a child
// name; the build fails if both are taken) — see collectHybridNodes().
//
// Limitation: `.json` files handled by this parser are parsed with plain
// JSON.parse (no comments, no trailing commas), unlike Style Dictionary's
// own built-in loader (which uses JSON5 for .json/.jsonc/.json5). This keeps
// the builder dependency-free — legacy token exports (Open Props, old Style
// Dictionary v3/v4 projects) are virtually always strict JSON anyway. Use
// `.jsonc` or `.mjs` for hand-authored DTCG sources that need comments.

import StyleDictionary from 'style-dictionary';

export const LEGACY_TOKENS_PARSER_NAME = 'minimo/legacy-tokens';

// Matches "{some.token.path.value}" -> captures "some.token.path"
const LEGACY_REF = /\{([^}]+)\.value\}/g;

// Name of the child token that receives the own value of a "hybrid" node
// (see collectHybridNodes()); FALLBACK_LEAF is used when a child with the
// preferred name already exists.
const PREFERRED_LEAF = 'default';
const FALLBACK_LEAF = 'base';

/** @param {unknown} node @returns {node is Record<string, unknown>} */
const isPlainObject = (node) => node !== null && typeof node === 'object' && !Array.isArray(node);

// True if the node is (or contains, at any depth) a token, legacy or DTCG.
/** @param {unknown} node @returns {boolean} */
const hasTokenDescendant = (node) => isPlainObject(node)
  && (Object.hasOwn(node, 'value') || Object.hasOwn(node, '$value')
    || Object.values(node).some(hasTokenDescendant));

/*
 * A "hybrid" legacy node is a token (own `value`) that is also a group, i.e.
 * has children that are tokens or groups of tokens (e.g. Open Props'
 * other.ease.out, with its own value plus out.1 ... out.5). The own value is
 * moved to a child token: `default`, or `base` if `default` is already a
 * child name. If both are taken the build fails. Returns a map
 * dot.path -> chosen child name, used to convert the node itself and to
 * rewrite references pointing to it (references are only rewritten within
 * the same file: a reference from another file to a hybrid node must use the
 * child name explicitly).
 */
/**
 * @param {unknown} node
 * @param {string[]} path
 * @param {string} filePath
 * @param {Map<string,string>} [hybrids]
 * @returns {Map<string,string>}
 */
const collectHybridNodes = (node, path, filePath, hybrids = new Map()) => {
  if (!isPlainObject(node) || Object.hasOwn(node, '$value')) return hybrids;

  if (Object.hasOwn(node, 'value')
    && Object.entries(node).some(([key, child]) => key !== 'value' && hasTokenDescendant(child))) {
    const leaf = [PREFERRED_LEAF, FALLBACK_LEAF].find((name) => !Object.hasOwn(node, name));
    if (!leaf) {
      throw new Error(
        `[build-tokens] legacy tokens: node "${path.join('.')}" in ${filePath} has its own value and children, `
        + `but both "${PREFERRED_LEAF}" and "${FALLBACK_LEAF}" child names are already taken`
      );
    }
    hybrids.set(path.join('.'), leaf);
  }

  for (const [key, child] of Object.entries(node)) {
    collectHybridNodes(child, [...path, key], filePath, hybrids);
  }
  return hybrids;
};

/**
 * @param {unknown} value
 * @param {Map<string,string>} hybrids
 * @returns {unknown}
 */
const convertLegacyRefs = (value, hybrids) => {
  if (typeof value === 'string') {
    return value.replace(LEGACY_REF, (_, ref) => (
      hybrids.has(ref) ? `{${ref}.${hybrids.get(ref)}}` : `{${ref}}`
    ));
  }
  if (Array.isArray(value)) {
    return value.map((v) => convertLegacyRefs(v, hybrids));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, convertLegacyRefs(v, hybrids)])
    );
  }
  return value;
};

/**
 * @param {unknown} node
 * @param {string[]} path
 * @param {Map<string,string>} hybrids
 * @returns {unknown}
 */
const convertLegacyNode = (node, path, hybrids) => {
  if (!isPlainObject(node)) return node;

  // Already DTCG v5 syntax: leave untouched.
  if (Object.hasOwn(node, '$value')) return node;

  if (Object.hasOwn(node, 'value')) {
    const { value, type, comment, description, ...rest } = node;
    const desc = comment ?? description;
    const token = {
      $value: convertLegacyRefs(value, hybrids),
      ...(type !== undefined ? { $type: type } : {}),
      ...(desc !== undefined ? { $description: desc } : {}),
    };

    const hybridLeaf = hybrids.get(path.join('.'));
    if (hybridLeaf === undefined) return token;

    // Hybrid node: becomes a group, its own value moves to a child token.
    return {
      ...Object.fromEntries(
        Object.entries(rest).map(([key, child]) => [key, convertLegacyNode(child, [...path, key], hybrids)])
      ),
      [hybridLeaf]: token,
    };
  }

  // Group node: recurse into children.
  return Object.fromEntries(
    Object.entries(node).map(([key, child]) => [key, convertLegacyNode(child, [...path, key], hybrids)])
  );
};

/** @param {string} contents @param {string} filePath @returns {unknown} */
const parseLegacyFile = (contents, filePath) => {
  const tree = JSON.parse(contents);
  return convertLegacyNode(tree, [], collectHybridNodes(tree, [], filePath));
};

// Registers the parser globally on the StyleDictionary class. To actually
// run it, a Style Dictionary instance must also opt in via
// `parsers: [LEGACY_TOKENS_PARSER_NAME]` in its config (registering alone
// does not activate it for every instance — see Style Dictionary's parser
// hooks docs).
export const registerLegacyTokensParser = () => {
  StyleDictionary.registerParser({
    name: LEGACY_TOKENS_PARSER_NAME,
    pattern: /\.json$/,
    parser: ({ contents, filePath }) => parseLegacyFile(contents, filePath ?? ''),
  });
};
