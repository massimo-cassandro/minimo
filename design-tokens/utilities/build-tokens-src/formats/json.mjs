// build-tokens-src/formats/json.mjs
// Registers the 'json/tokens' format and exports buildJsonFiles() and
// collectConcreteFilePaths().
//
// The format produces a W3C DTCG nested JSON(C) file, independent of any
// specific consuming tool (usable in Penpot, Figma via plugin, Token Studio,
// Supernova, or any other DTCG-compatible tool).
//
// Output format is controlled by the jsonFormat option in the project config:
//   'jsonc' -> .jsonc extension + generated-file disclaimer header
//   'json'  -> plain .json, no disclaimer
//
// buildJsonFiles() builds the `files` array for the json platform:
//   jsonDestFile set  -> single aggregated file
//   jsonDestFile null -> one file per concrete source file, all placed flat
//                        in jsonBuildPath (no subdirectories) — see the
//                        collision check in buildJsonFiles()
//
// ── Expression handling (jsonExpression option) ─────────────────────────────
//
// Dimension tokens may carry math expressions in their $value, e.g.:
//   { $type: "dimension", $value: "{size.base} * .25" }
//
// The jsonExpression config option controls how these are handled:
//
//   'keep'    (default) — write the expression as-is; the consuming tool is
//                         expected to evaluate it.
//   'calc'    — wrap in a CSS calc(): "calc({size.base} * .25)"
//                         aliases are left as {references} for the consuming
//                         tool to resolve.
//   'resolve' — evaluate the expression numerically and write a concrete value.
//                         The unit is inherited from the first dimension token
//                         referenced in the expression (e.g. {size.base} = 16px
//                         -> 16 * .25 = 4 -> "4px"). If evaluation fails the
//                         original expression is kept with a warning.

import StyleDictionary from 'style-dictionary';
import path from 'node:path';

// Disclaimer prepended to every generated file when jsonFormat is 'jsonc'
const DISCLAIMER = [
  '// -----------------------------------------------------------------------',
  '// Generated file — do not edit manually.',
  '// This file is produced by the design-token build pipeline.',
  '// Source of truth: the token files in the project source directory.',
  '// Re-generate with: node build-tokens.mjs --config <path/to/config>',
  '// -----------------------------------------------------------------------',
  '',
].join('\n');

// ── Expression helpers ────────────────────────────────────────────────────────

// Returns true if the string contains a math expression — i.e. it has at least
// one operator (+, -, *, /) outside of a token reference ({...}).
// Negative values like "-0.5rem" or "-8px" are NOT expressions.
const isExpression = (str) => {
  if (typeof str !== 'string') return false;
  // Strip token references, then check for operators
  const stripped = str.replace(/\{[^}]+\}/g, '0');
  // Remove leading minus (negative number) before testing for operators.
  // An operator is only meaningful when it appears between two operands,
  // i.e. it is preceded by a digit, closing paren, or word character.
  return /[\d)]\s*[+\-*/]/.test(stripped) || /[+*/]/.test(stripped.replace(/^-/, ''));
};

// Builds a token lookup map (dot-path -> token) from the dictionary.
const makeTokenMap = (dictionary) => {
  const map = {};
  for (const token of dictionary.allTokens) {
    map[token.path.join('.')] = token;
  }
  return map;
};

// Resolves a dimension expression to a concrete value string (e.g. "4px").
//
// Strategy:
//   1. Find the first {reference} in the expression.
//   2. Look it up in the token map to obtain its resolved numeric value and unit.
//   3. Replace ALL {references} in the expression with their numeric values.
//   4. Evaluate the resulting arithmetic expression with Function().
//   5. Reattach the unit from step 2.
//
// Returns null if resolution fails (caller falls back to the original string).
const resolveExpression = (orig, tokenMap) => {
  // Collect all {reference} keys in order of appearance
  const refPattern = /\{([^}]+)\}/g;
  const refs = [...orig.matchAll(refPattern)];
  if (refs.length === 0) return null;

  // Determine unit from the first referenced dimension token
  const firstRef  = tokenMap[refs[0][1]];
  if (!firstRef) return null;

  const firstVal  = String(firstRef.$value ?? firstRef.value ?? '');
  const unitMatch = firstVal.match(/[a-z%]+$/i);
  const unit      = unitMatch ? unitMatch[0] : '';
  const baseNum   = parseFloat(firstVal);
  if (isNaN(baseNum)) return null;

  // Replace every {ref} with its numeric value
  let expr = orig;
  for (const match of refs) {
    const refKey = match[1];
    const refToken = tokenMap[refKey];
    if (!refToken) return null;
    const refVal = parseFloat(String(refToken.$value ?? refToken.value ?? ''));
    if (isNaN(refVal)) return null;
    expr = expr.replace(match[0], String(refVal));
  }

  // Evaluate — only allow digits, whitespace and arithmetic operators
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return null;

  try {
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    // Round to a reasonable precision to avoid floating-point noise
    const rounded = parseFloat(result.toPrecision(10));
    return unit ? `${rounded}${unit}` : String(rounded);
  } catch {
    return null;
  }
};

// Wraps a dimension expression in CSS calc(), leaving {references} intact.
const toCalc = (orig) => `calc(${orig})`;

// ── Format ───────────────────────────────────────────────────────────────────

StyleDictionary.registerFormat({
  name: 'json/tokens',
  format: ({ dictionary, options }) => {
    const root = {};
    const expressionMode = options.jsonExpression ?? 'keep'; // 'keep' | 'calc' | 'resolve'
    const tokenMap = (expressionMode === 'resolve') ? makeTokenMap(dictionary) : null;

    for (const token of dictionary.allTokens) {
      // Rebuild the nested tree from the token path
      let node = root;
      for (let i = 0; i < token.path.length - 1; i++) {
        const segment = token.path[i];
        node[segment] = node[segment] ?? {};
        node = node[segment];
      }

      const leafKey = token.path[token.path.length - 1];
      const type    = token.$type ?? token.type;
      const orig    = token.original?.$value ?? token.original?.value;

      // ── Value resolution ────────────────────────────────────────────────────
      let value;

      if (
        type === 'dimension' &&
        typeof orig === 'string' &&
        isExpression(orig)
      ) {
        // The original $value is a math expression
        if (expressionMode === 'resolve') {
          const resolved = resolveExpression(orig, tokenMap);
          if (resolved !== null) {
            value = resolved;
          } else {
            // Resolution failed — keep the original and emit a warning
            // eslint-disable-next-line no-console
            console.warn(`[build-tokens] json: could not resolve expression "${orig}" for token "${token.path.join('.')}". Keeping original.`);
            value = orig;
          }
        } else if (expressionMode === 'calc') {
          // Replace {refs} with their alias notation and wrap in calc()
          value = toCalc(orig);
        } else {
          // 'keep' — write the expression unchanged
          value = orig;
        }
      } else {
        // Non-expression value: preserve {references} wherever they appear.
        //   - Pure alias:   "{some.token}"           → kept as-is to preserve token links
        //   - CSS function: "color-mix(in srgb, {some.token} 60%, #000)" → kept as-is
        //   - Plain value:  "#ff0000", "16px", …     → use the resolved $value
        const containsRef = typeof orig === 'string' && orig.includes('{');
        value = containsRef ? orig : (token.$value ?? token.value);
      }

      const entry = { $type: type, $value: value };

      const desc = token.$description ?? token.description ?? token.comment;
      if (desc) entry.$description = desc;

      node[leafKey] = entry;
    }

    const body = JSON.stringify(root, null, 2) + '\n';
    return options.jsonc ? DISCLAIMER + body : body;
  },
});

// ── collectConcreteFilePaths ──────────────────────────────────────────────────
//
// Extracts the unique concrete file paths from a Style Dictionary instance.
// Must be called AFTER `await sd.hasInitialized`.

export const collectConcreteFilePaths = async (sd) => {
  await sd.hasInitialized;
  const paths = new Set();
  for (const token of sd.allTokens) {
    if (token.filePath) paths.add(token.filePath);
  }
  return [...paths].sort();
};

// ── buildJsonFiles ──────────────────────────────────────────────────────────
//
// @param {string[]}                       concreteFilePaths  From collectConcreteFilePaths()
// @param {string|null}                    jsonDestFile       Aggregated file base name, or null
// @param {'json'|'jsonc'}                 jsonFormat         Output format
// @param {'keep'|'calc'|'resolve'}        jsonExpression     Expression handling mode
// @returns {object[]}  File descriptors for the Style Dictionary platform

export const buildJsonFiles = (
  concreteFilePaths,
  jsonDestFile,
  jsonFormat = 'json',
  jsonExpression = 'keep'
) => {
  const ext  = jsonFormat === 'jsonc' ? '.jsonc' : '.json';
  const jsonc = jsonFormat === 'jsonc';

  if (jsonDestFile) {
    return [{
      destination: jsonDestFile + ext,
      format: 'json/tokens',
      options: { jsonc, jsonExpression },
    }];
  }

  // One file per source, all placed flat in jsonBuildPath — no subdirectories
  // mirroring the source tree. Since source files can share a basename across
  // different directories (e.g. two components each with their own
  // <name>.minimo.tokens.mjs), fail loudly on collisions instead of letting
  // one silently overwrite the other.
  const pathsByDestName = new Map();
  for (const filePath of concreteFilePaths) {
    const destName = path.basename(filePath).replace(/\.[^.]+$/, '') + ext;
    if (!pathsByDestName.has(destName)) pathsByDestName.set(destName, []);
    pathsByDestName.get(destName).push(filePath);
  }

  const collisions = [...pathsByDestName.entries()].filter(([, paths]) => paths.length > 1);
  if (collisions.length > 0) {
    const details = collisions
      .map(([destName, paths]) => `  "${destName}" <- ${paths.join(', ')}`)
      .join('\n');
    throw new Error(
      `[build-tokens] json: output filename collision — these source files would overwrite each other (json output files are flattened into a single directory):\n${details}`
    );
  }

  return concreteFilePaths.map((filePath) => {
    const absPath = path.resolve(filePath);
    return {
      destination: path.basename(filePath).replace(/\.[^.]+$/, '') + ext,
      format: 'json/tokens',
      options: { jsonc, jsonExpression },
      filter: (token) => {
        const fp = token.filePath ? path.resolve(token.filePath) : '';
        return fp === absPath;
      },
    };
  });
};
