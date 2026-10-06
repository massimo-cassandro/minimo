/*
  build-tokens-src/resolve-source-paths.mjs
  Helper puro: risolve i pattern glob `source` di Style Dictionary rispetto a una
  directory base, senza toccare la sintassi glob.
  Condiviso da config.mjs (build-tokens.mjs) e da check-unresolved-custom-props.mjs.

  I pattern glob (che contengono *, ?, {, [) NON vengono passati a path.join,
  perché path.join può normalizzare/comprimere sequenze che in un glob hanno un
  significato sintattico (ad es. "**"). Vengono solo preceduti da baseDir e
  convertiti con forward slash.
  I percorsi concreti (senza caratteri glob) vengono risolti in modo canonico con path.resolve.
*/

import * as path from 'node:path';

const GLOB_CHARS = /[*?{[]/;

/**
 * @param {string[]} source
 * @param {string} baseDir
 * @returns {string[]}
 */
export const resolveSourcePaths = (source, baseDir) => source.map((s) => {
  if (path.isAbsolute(s)) {
    // Già assoluto: normalizza solo i separatori (necessario su Windows)
    return s.split(path.sep).join('/');
  }
  if (GLOB_CHARS.test(s)) {
    // Pattern glob: antepone baseDir senza toccare il pattern
    const prefix = baseDir.split(path.sep).join('/');
    return `${prefix}/${s}`;
  }
  // Percorso relativo concreto: risoluzione canonica
  return path.resolve(baseDir, s).split(path.sep).join('/');
});
