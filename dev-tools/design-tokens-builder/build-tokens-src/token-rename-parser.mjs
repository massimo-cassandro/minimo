/*
  build-tokens-src/token-rename-parser.mjs
  Implementa la funzionalità `transform` end-to-end (vedi source-transforms.mjs):

  1. Un PARSER di Style Dictionary che sposta/rinomina i nodi dei token nell'albero
     di un file sorgente, in base alla mappa `transform` registrata per
     quel file, PRIMA che Style Dictionary unisca i file e risolva i
     {riferimenti}.
  2. Un PREPROCESSOR di Style Dictionary che, una volta che ogni file è stato letto
     e unito in un unico albero (ma sempre prima che i {riferimenti} vengano
     risolti), riscrive ogni {riferimento} nell'INTERO albero che punta al
     VECCHIO percorso di uno dei token rinominati, col suo NUOVO percorso — così che un riferimento
     non debba essere cercato e aggiornato a mano solo perché il
     token a cui punta è stato spostato (nello stesso file o in uno completamente
     diverso; vedi getAllRenames() in source-transforms.mjs per capire perché
     farlo su tutto l'albero è sicuro).

  Il parser considera solo i file concreti esatti che dichiarano un `transform` (il
  `pattern` costruito da transformedFilesPattern() in
  source-transforms.mjs); ogni altro file non viene toccato e passa
  al loader integrato di Style Dictionary, oppure al parser bridge legacy
  (legacy-tokens-parser.mjs) per i semplici sorgenti .json. Il
  preprocessor, invece, una volta registrato viene sempre eseguito sull'intero albero unito
  — semplicemente non ha nulla da riscrivere dove nessun riferimento corrisponde a un
  percorso rinominato.

  combineJSON di Style Dictionary legge sempre il `contents` di un file sorgente come
  testo grezzo e lo passa ai parser che corrispondono, indipendentemente dall'
  estensione (vedi node_modules/style-dictionary/lib/utils/combineJSON.js) — un
  parser personalizzato non riceve mai un modulo .mjs già eseguito né un oggetto
  già letto come JSON5. Il parser deve quindi caricare il file da sé, nello stesso modo
  del loader di Style Dictionary (loadFile.js):
  `import()` dinamico per .mjs/.js, JSON5 per .jsonc/.json5, e il bridge
  legacy-o-DTCG esistente (parseLegacyFile, riutilizzato così com'è perché la gestione dei
  nodi ibridi resti coerente) per .json.
*/

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

/*
  Rimuove il nodo in pathSegments (modifica tree), potando i gruppi padre rimasti
  vuoti dopo la rimozione (dal più interno), così che un gruppo svuotato del tutto non
  resti come `{}` nell'albero di output.
*/
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

// Inserisce `value` in pathSegments (modifica tree), creando i gruppi
// intermedi necessari.
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

/*
  Una build può creare più istanze di StyleDictionary sullo stesso file
  sorgente (ad es. un passaggio usa e getta per enumerare i percorsi concreti dei file, uno per la
  build vera — vedi build-tokens.mjs), ognuna delle quali riesegue questo parser. Viene tracciato
  così che una chiave sorgente mancante venga segnalata una sola volta per processo, invece che
  una volta per passaggio.
*/
/** @type {Set<string>} */
const warnedMissingKeys = new Set();

/**
 * Applica una mappa di rinomina a un albero DTCG già letto: sposta il nodo di ogni percorso
 * sorgente mappato verso il suo percorso di destinazione. Due fasi (raccolta+eliminazione, poi
 * inserimento) così che un percorso di destinazione usato da una voce e un percorso
 * sorgente usato da un'altra non interferiscano mai tra loro in base all'ordine della mappa. Una chiave
 * sorgente non trovata nell'albero produce solo un warning in console — non
 * fa fallire la build, dato che la config di un progetto può puntare a una chiave presente
 * solo a volte.
 * @param {unknown} tree
 * @param {Record<string,string>} renameMap  dot-path -> dot-path
 * @param {string} filePath  usato solo per il messaggio di warning
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
      /*
        La clonazione può fallire per contenuti con valori non clonabili (ad es.
        funzioni) — ripiega sull'oggetto modulo attivo, come il loadFile.js
        di Style Dictionary.
      */
      return mod.default;
    }
  }

  const contents = await readFile(filePath, 'utf-8');

  if (ext === '.json') {
    // Riutilizza il bridge legacy-o-DTCG così che la conversione dei nodi ibridi resti
    // coerente con ogni altra sorgente .json del progetto.
    return parseLegacyFile(contents, filePath);
  }

  // .jsonc, .json5 o qualsiasi altro: lo stesso parsing JSON5 che il loader integrato di
  // Style Dictionary usa per queste estensioni.
  return JSON5.parse(contents);
};

/*
  Registra il parser globalmente sulla classe StyleDictionary. Per eseguirlo
  effettivamente, un'istanza di Style Dictionary deve anche aderire tramite
  `parsers: [..., TOKEN_RENAME_PARSER_NAME]` (vedi build-tokens.mjs,
  build-source-modes.mjs, check-unresolved-custom-props.mjs) — stesso
  modello di attivazione del parser bridge legacy.
*/
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

// ── Riscrittura dei riferimenti (preprocessor) ──────────────────────────────────────
/*
  Corrisponde a un semplice {riferimento} (non a una funzione CSS che ne contiene uno, ad es.
  "color-mix(in srgb, {primary} 60%, #000)" corrisponde comunque solo alla parte {primary}) —
  stesso stile di pattern di LEGACY_REF in legacy-tokens-parser.mjs.
*/
const REF = /\{([^}]+)\}/g;

/**
 * Sostituisce ogni {riferimento} in `value` (il $value di un token, eventualmente annidato —
 * oggetti/array composite/shadow/gradient) il cui dot-path corrisponde esattamente a una
 * chiave "from" di `renames`, con `{<to>}`. I riferimenti che non corrispondono a nessuna
 * chiave rinominata (inclusi i percorsi parziali/più lunghi, ad es. {primary.200} quando è stata
 * rinominata solo "primary") restano intatti.
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
 * Percorre l'albero di token unito (ogni file sorgente, già combinato da Style
 * Dictionary — vedi il punto di chiamata di `preprocess()` in StyleDictionary.js) e, per
 * ogni token foglia (un nodo con `$value`), riscrive i {riferimenti} nel suo
 * solo `$value` — senza mai toccare `$type`, `filePath`, `isSource` o qualsiasi altro
 * metadato che Style Dictionary attacca al nodo.
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

/*
  Registra il preprocessor globalmente. Per eseguirlo effettivamente, un'istanza di
  Style Dictionary deve anche aderire tramite
  `preprocessors: [TOKEN_RENAME_PREPROCESSOR_NAME]` (vedi build-tokens.mjs,
  build-source-modes.mjs, check-unresolved-custom-props.mjs). È un no-op
  (restituisce l'albero invariato) quando getAllRenames() è vuoto — ad es. quando ogni
  transform registrata si è rivelata ambigua tra file (vedi
  registerSourceTransforms() in source-transforms.mjs).
*/
export const registerTokenRenamePreprocessor = () => {
  StyleDictionary.registerPreprocessor({
    name: TOKEN_RENAME_PREPROCESSOR_NAME,
    preprocessor: (dictionary) => {
      const renames = getAllRenames();
      return renames.size ? rewriteTreeRefs(dictionary, renames) : dictionary;
    },
  });
};
