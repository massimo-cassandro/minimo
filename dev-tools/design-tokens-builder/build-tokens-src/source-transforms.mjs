/*
  build-tokens-src/source-transforms.mjs
  Supporta la rinomina dei token per sorgente: una voce di `source` (o di una
  modalità di `sourceModes`) può avere un oggetto `transform` accanto a (o al posto di)
  `prefix` — vedi splitSourceEntries() in source-prefixes.mjs — ad es.

    { src: './project-tokens/*.jsonc', transform: { primary: 'primary.100' } }

  in modo che il token trovato al dot-path `primary` in quei file venga spostato al
  dot-path `primary.100` prima ancora che Style Dictionary lo veda, cioè prima che
  i {riferimenti} vengano risolti e prima che venga costruito l'output CSS/JSON.

  Caso d'uso tipico: un progetto preesistente definisce i propri token (ad es. esportati
  da Figma/Penpot) con nomi che non corrispondono alla nomenclatura di minimo (ad es.
  il colore base del progetto è `primary`, l'equivalente di minimo è
  `primary.100`). Senza questa funzionalità ogni custom property generata dai token
  del progetto andrebbe rinominata a mano dopo ogni build, oppure ogni riferimento di minimo
  a `{primary.100}` andrebbe cercato e modificato. `transform` corregge una volta
  sola il percorso PROPRIO del token, nella config.

  Notazione: entrambi i lati della mappa usano la notazione dot-path di Style Dictionary
  (ad es. 'primary.100'), NON la notazione delle custom properties con trattini
  (ad es. 'primary-100'). I segmenti dei nomi dei token in questo progetto possono
  contenere trattini (ad es. btn-close, status-buttons), quindi un trattino
  non permette di distinguere in modo affidabile un separatore di percorso da una parte letterale
  del nome di un segmento; un punto sì, dato che Style Dictionary lo riserva già come
  separatore di percorso nei {riferimenti} e non lo ammette mai dentro il nome
  di un singolo segmento.

  Spostare un nodo lascerebbe altrimenti ogni {riferimento} al suo VECCHIO percorso
  pendente (nello stesso file o in uno completamente diverso) — quindi questo modulo
  raccoglie anche una mappa piatta from -> to, indipendente dal file (getAllRenames()),
  usata dal PREPROCESSOR di rinomina dei token (vedi token-rename-parser.mjs) per
  riscrivere ogni {riferimento} di questo tipo in tutto l'albero, una volta uniti tutti i file. Si
  può fare in sicurezza perché Style Dictionary risolve i {riferimenti} sull'unico
  albero di token unito, tramite percorso assoluto: se `primary` esisteva una sola
  volta prima della rinomina, ogni {primary} in qualsiasi punto della build
  puntava senza ambiguità a quell'unico nodo, quindi ognuno deve ora
  diventare {primary.100} — non c'è rischio di riscrivere un riferimento non correlato. L'unico
  caso che non si può disambiguare è la stessa chiave "from" rinominata con una
  destinazione DIVERSA in un file diverso (ciascuna valida per conto proprio, per
  file); vedi registerSourceTransforms() più sotto — quella chiave viene
  esclusa dalla riscrittura su tutto l'albero (con un warning in console) e i suoi
  {riferimenti} restano da correggere a mano.

  Come funziona: a differenza di `prefix` (una trasformazione puramente estetica del nome CSS, vedi
  source-prefixes.mjs, che non tocca mai l'albero dei token), `transform`
  ristruttura il vero albero dei token letto dal file sorgente, tramite un
  parser dedicato di Style Dictionary (vedi token-rename-parser.mjs) che viene eseguito
  in fase di parsing, prima dell'unione dei file e della risoluzione dei riferimenti.
  Poiché sia l'output CSS sia quello JSON ricostruiscono il proprio albero da
  token.path (ormai già rinominato), non serve una gestione separata perché
  anche l'output JSON rifletta la struttura rinominata.
*/

import StyleDictionary from 'style-dictionary';
import { collectConcreteFilePaths } from './formats/json.mjs';
import { LEGACY_TOKENS_PARSER_NAME } from './legacy-tokens-parser.mjs';

/** @type {Map<string, Record<string,string>>} */
let transformByFile = new Map();

/*
  Mappa piatta from -> to, indipendente dal file, usata dal preprocessor di
  rinomina dei token (vedi token-rename-parser.mjs) per riscrivere ogni {riferimento}
  che punta al VECCHIO percorso di un token rinominato, in qualsiasi punto della build (stesso file o
  un altro) — i riferimenti vengono risolti da Style Dictionary sull'unico albero di
  token unito, tramite percorso assoluto, quindi un semplice dot-path non è
  ambiguo A MENO CHE la stessa chiave "from" non abbia ricevuto una destinazione diversa
  in un file diverso (ciascuna valida per conto proprio — vedi registerSourceTransforms
  più sotto), nel qual caso quella chiave viene esclusa qui (con un warning) e i suoi
  {riferimenti} restano da correggere a mano, come prima dell'esistenza di questo
  preprocessor.
*/
/** @type {Map<string, string>} */
let globalRenames = new Map();

const DOT_PATH = /^[^.\s][\w-]*(\.[^.\s][\w-]*)*$/;

/**
 * Valida una mappa `transform`: ogni chiave/valore deve essere una stringa dot-path
 * di Style Dictionary non vuota (ad es. 'primary.100'), non un nome di custom property
 * con trattini (ad es. 'primary-100') — vedi la motivazione della notazione qui sopra.
 * rationale above.
 * @param {unknown} map
 * @returns {Record<string,string>}
 * @throws {Error} se la mappa non è un oggetto semplice o una chiave/valore non è valido
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
 * Espande i pattern `src` delle voci `transform` in percorsi di file concreti
 * e memorizza la mappa percorso file -> mappa di rinomina usata da getSourceTransform().
 * Va chiamata dopo registerLegacyTokensParser() e prima di qualsiasi build reale.
 * Le mappe di voci diverse che toccano lo stesso file vengono unite; la build
 * fallisce solo se due voci non concordano sulla destinazione della stessa chiave
 * sorgente.
 * @param {import('./source-prefixes.mjs').TransformedSource[]} transformedSources
 * @returns {Promise<void>}
 * @throws {Error} se lo stesso file riceve due destinazioni in conflitto per la stessa chiave
 */
export const registerSourceTransforms = async (transformedSources) => {
  /** @type {Map<string, Record<string,string>>} */
  const map = new Map();
  /*
    Ogni destinazione vista per una data chiave "from", in tutti i file — usata
    più sotto per costruire globalRenames e per rilevare il caso ambiguo tra file
    (stessa chiave "from", destinazione diversa in un file diverso).
  */
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
 * @returns {Map<string, string>} la mappa piatta from -> to usata per riscrivere
 * i {riferimenti} in tutta la build (vedi token-rename-parser.mjs)
 */
export const getAllRenames = () => globalRenames;

/**
 * @param {string|undefined} filePath  token.filePath
 * @returns {Record<string,string>|undefined} la mappa di rinomina registrata per quel file, se presente
 */
export const getSourceTransform = (filePath) => (filePath ? transformByFile.get(filePath) : undefined);

/** @returns {boolean} true se almeno un file ha una transform registrata */
export const hasRegisteredTransforms = () => transformByFile.size > 0;

/**
 * Costruisce la RegExp che corrisponde esattamente ai file concreti che hanno una
 * transform registrata, per il `pattern` del parser di Style Dictionary (vedi
 * token-rename-parser.mjs). Restituisce null se nessun file ne ha una.
 * @returns {RegExp|null}
 */
export const transformedFilesPattern = () => {
  const files = [...transformByFile.keys()];
  if (files.length === 0) return null;

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^(${files.map(escapeRegExp).join('|')})$`);
};
