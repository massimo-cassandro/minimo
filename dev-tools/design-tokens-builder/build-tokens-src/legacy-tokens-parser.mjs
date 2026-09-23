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

/** @param {unknown} value @returns {unknown} */
const convertLegacyRefs = (value) => {
  if (typeof value === 'string') {
    return value.replace(LEGACY_REF, '{$1}');
  }
  if (Array.isArray(value)) {
    return value.map(convertLegacyRefs);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, convertLegacyRefs(v)])
    );
  }
  return value;
};

/** @param {unknown} node @returns {node is Record<string, unknown>} */
const isPlainObject = (node) => node !== null && typeof node === 'object' && !Array.isArray(node);

/** @param {unknown} node @returns {unknown} */
const convertLegacyNode = (node) => {
  if (!isPlainObject(node)) return node;

  // Already DTCG v5 syntax: leave untouched.
  if (Object.hasOwn(node, '$value')) return node;

  if (Object.hasOwn(node, 'value')) {
    // Legacy token leaf. Some legacy files (e.g. Open Props) also attach
    // sibling numbered/named children to a node that carries its own
    // `value`/`type` (a group that is also a default token) — those
    // children are converted too, even though Style Dictionary itself
    // cannot represent "group + own $value" ambiguity natively.
    const { value, type, comment, description, ...rest } = node;
    const convertedRest = Object.fromEntries(
      Object.entries(rest).map(([key, child]) => [key, convertLegacyNode(child)])
    );
    const desc = comment ?? description;

    return {
      ...convertedRest,
      $value: convertLegacyRefs(value),
      ...(type !== undefined ? { $type: type } : {}),
      ...(desc !== undefined ? { $description: desc } : {}),
    };
  }

  // Group node: recurse into children.
  return Object.fromEntries(
    Object.entries(node).map(([key, child]) => [key, convertLegacyNode(child)])
  );
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
    parser: ({ contents }) => convertLegacyNode(JSON.parse(contents)),
  });
};
