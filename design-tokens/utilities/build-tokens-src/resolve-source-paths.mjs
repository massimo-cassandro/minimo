// build-tokens-src/resolve-source-paths.mjs
// Pure helper: resolves Style Dictionary `source` glob patterns relative to a
// base directory, without touching glob syntax.
// Shared by config.mjs (build-tokens.mjs) and check-unresolved-custom-props.mjs.
//
// Glob patterns (containing *, ?, {, [) are NOT passed through path.join,
// because path.join can normalise/collapse sequences that carry syntactic
// meaning in a glob (e.g. "**"). They are only prefixed with baseDir and
// converted to forward slashes.
// Concrete paths (no glob characters) are resolved canonically with path.resolve.

import * as path from 'node:path';

const GLOB_CHARS = /[*?{[]/;

/**
 * @param {string[]} source
 * @param {string} baseDir
 * @returns {string[]}
 */
export const resolveSourcePaths = (source, baseDir) => source.map((s) => {
  if (path.isAbsolute(s)) {
    // Already absolute: only normalise separators (needed on Windows)
    return s.split(path.sep).join('/');
  }
  if (GLOB_CHARS.test(s)) {
    // Glob pattern: prefix with baseDir without touching the pattern
    const prefix = baseDir.split(path.sep).join('/');
    return `${prefix}/${s}`;
  }
  // Concrete relative path: canonical resolution
  return path.resolve(baseDir, s).split(path.sep).join('/');
});
