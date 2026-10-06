/*
  build-tokens-src/merge-css.mjs
  Supporta l'opzione di config `mergeCustomProps`: le custom properties preesistenti
  nel file CSS di destinazione hanno priorità su quelle generate dalla build
  corrente (override/aggiunte manuali sopravvivono alle build successive).

  Utilizzo (build a `source` singolo):
    1. Chiamare loadExistingCustomProps(absDestPath) PRIMA che Style Dictionary venga eseguito,
       perché legge il file che sta per essere sovrascritto.
    2. Il format css/variables-sorted (vedi formats/css.mjs) chiama
       mergeCustomProps(generatedMap) mentre costruisce l'output, subito prima di
       serializzare il testo CSS finale.

  `mergeCustomProps` può essere anche un array di stringhe/RegExp: in tal caso
  vengono unite solo le proprietà generate il cui file sorgente di token corrisponde a una
  delle voci (vince il valore preesistente); le altre vengono sovrascritte dal
  valore generato. Le proprietà preesistenti non più generate
  (nessun token, quindi nessun file sorgente) vengono sempre mantenute. Vedi matchesSource().

  Utilizzo (build sourceModes, vedi build-source-modes.mjs):
    1. Chiamare loadExistingCustomPropsScoped(absDestPath, baseMode) PRIMA che venga eseguita
       una qualsiasi delle istanze di Style Dictionary per modalità.
    2. Il format css/variables-sorted chiama mergeCustomProps(generatedMap, mode)
       una volta per modalità. Le dichiarazioni vengono confrontate solo nell'ambito della stessa
       modalità (il blocco base `:root { ... }`, oppure il `:root { ... }` annidato
       dentro il `@media (prefers-color-scheme: <modalità>) { ... }` di quella modalità),
       così che lo stesso nome di custom property definito con valori diversi tra le
       modalità non venga mai confuso.
*/

import { existsSync, readFileSync } from 'node:fs';

const CUSTOM_PROP_RE = /^\s*--([\w-]+):\s*(.+)$/gm;

/**
 * Estrae le dichiarazioni `--name: <tail>` da un blocco di testo CSS. <tail> viene
 * catturato così com'è (valore, `;` finale e qualsiasi altra cosa sulla stessa
 * riga, ad es. un commento finale) così da attraversare un merge senza modifiche.
 * Sono supportate solo le dichiarazioni su una riga.
 * @param {string} cssText
 * @returns {Record<string,string>} mappa nome → coda della dichiarazione, in ordine di prima comparsa
 */
export const parseCustomProps = (cssText) => {
  /** @type {Record<string,string>} */
  const map = {};
  for (const match of cssText.matchAll(CUSTOM_PROP_RE)) {
    let tail = match[2].trim();
    // Un commento su più righe viene troncato a fine riga (vengono lette solo le dichiarazioni
    // su una riga): va chiuso, altrimenti il CSS risultante non sarebbe valido
    if (tail.lastIndexOf('/*') > tail.lastIndexOf('*/')) tail += ' */';
    map[match[1]] = tail;
  }
  return map;
};

/*
  Restituisce l'indice della parentesi graffa di chiusura corrispondente alla `{` in openIndex, con un
  semplice conteggio della profondità. Le graffe dentro commenti/stringhe non sono gestite in modo
  speciale — non ci si aspetta che compaiano nel CSS delle custom properties generato.
*/
/** @param {string} text @param {number} openIndex */
const matchBraces = (text, openIndex) => {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/*
  Esegue l'escape di una stringa per l'uso letterale dentro una RegExp — necessario perché
  customPropsSelector (vedi config.mjs) può contenere caratteri speciali delle regex,
  ad es. ':where(html)'.
*/
/** @param {string} str */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/*
  Trova ogni blocco @media (prefers-color-scheme: <modalità>) { ... } in un file di
  destinazione CSS sourceModes generato in precedenza, con offset assoluti dei caratteri in
  cssText. Usato per dividere il file in ambiti per modalità (vedi
  splitModeScopes() più sotto) e, da check-unresolved-custom-props.mjs, per
  capire a quale modalità appartiene una data dichiarazione di custom property.
  Un eventuale `@layer { ... }` che racchiude tutto (opzione addLayer) è trasparente per
  questa ricerca, dato che cerca solo il pattern `@media (prefers-color-scheme: ...)` stesso.
  @param {string} cssText
  @returns {{mode:string,start:number,end:number}[]} start/end sono gli
    indici della `{` esterna del blocco e della `}` corrispondente (inclusi)
*/
export const findMediaModeBlocks = (cssText) => {
  const MEDIA_RE = /@media\s*\(\s*prefers-color-scheme\s*:\s*([\w-]+)\s*\)\s*\{/g;
  /** @type {{mode:string,start:number,end:number}[]} */
  const mediaBlocks = [];
  for (const match of cssText.matchAll(MEDIA_RE)) {
    const openIdx = match.index + match[0].length - 1;
    const closeIdx = matchBraces(cssText, openIdx);
    if (closeIdx === -1) continue;
    mediaBlocks.push({ mode: match[1], start: openIdx, end: closeIdx });
  }
  return mediaBlocks;
};

/*
  Divide un file di destinazione CSS sourceModes generato in precedenza in ambiti
  per modalità (vedi build-source-modes.mjs per la forma del file generato):
    - l'ambito base è il blocco `<selector> { ... }` di primo livello, cioè
      quello NON annidato dentro una regola `@media (prefers-color-scheme: ...)`
    - ogni altro ambito è il blocco `<selector> { ... }` annidato dentro la propria
      regola `@media (prefers-color-scheme: <modalità>) { ... }`
  @param {string} cssText
  @param {string} [selector] il customPropsSelector con cui è stato generato il file
    (default: ':root' — vedi config.mjs)
  @returns {Record<string,string>} modalità → testo del corpo CSS (la modalità base ha chiave '__base__')
*/
const splitModeScopes = (cssText, selector = ':root') => {
  /** @type {Record<string,string>} */
  const scopes = {};
  const selectorRe = new RegExp(`${escapeRegExp(selector)}\\s*\\{`);

  // 1. Ogni blocco @media (prefers-color-scheme: <modalità>) { ... } e il corpo
  // <selector> { ... } annidato dentro ciascuno.
  const mediaBlocks = findMediaModeBlocks(cssText);
  for (const { mode, start, end } of mediaBlocks) {
    const body = cssText.slice(start + 1, end);
    const rootMatch = selectorRe.exec(body);
    if (rootMatch) {
      const rootOpen = rootMatch.index + rootMatch[0].length - 1;
      const rootClose = matchBraces(body, rootOpen);
      if (rootClose !== -1) {
        scopes[mode] = body.slice(rootOpen + 1, rootClose);
      }
    }
  }

  // 2. Il blocco base <selector> { ... }: il primo non annidato dentro
  // nessuno dei blocchi media trovati qui sopra.
  const ROOT_RE = new RegExp(`${escapeRegExp(selector)}\\s*\\{`, 'g');
  for (const match of cssText.matchAll(ROOT_RE)) {
    const openIdx = match.index + match[0].length - 1;
    const insideMedia = mediaBlocks.some((b) => openIdx > b.start && openIdx < b.end);
    if (insideMedia) continue;
    const closeIdx = matchBraces(cssText, openIdx);
    if (closeIdx === -1) continue;
    scopes.__base__ = cssText.slice(openIdx + 1, closeIdx);
    break;
  }

  return scopes;
};

/*
  `true` = unisce ogni sorgente; un array = unisce solo le proprietà generate
  dai file sorgente di token che corrispondono a una delle sue voci. Impostato
  dalle funzioni loadExistingCustomProps*().
*/
/** @type {true|(string|RegExp)[]} */
let mergeSources = true;

/**
 * Indica se un file sorgente di token corrisponde a una delle voci dell'array
 * `mergeCustomProps`: una stringa corrisponde se è contenuta nel percorso del file
 * (separatori di percorso normalizzati in `/`), una RegExp se il test è positivo.
 * @param {(string|RegExp)[]} sources
 * @param {string|undefined} filePath percorso del file sorgente del token
 * @returns {boolean}
 */
const matchesSource = (sources, filePath) => {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  return sources.some((entry) => {
    if (entry instanceof RegExp) {
      entry.lastIndex = 0;
      return entry.test(normalized);
    }
    return normalized.includes(entry.replace(/\\/g, '/'));
  });
};

// null = merge disattivato, oppure file di destinazione non ancora trovato (prima build)
/** @type {Record<string,string>|null} */
let existingCustomProps = null;

// Equivalente per modalità di existingCustomProps, popolato da
// loadExistingCustomPropsScoped() per una build sourceModes.
/** @type {Record<string, Record<string,string>>|null} */
let scopedExistingCustomProps = null;

/**
 * Legge il file CSS di destinazione (se esiste) e memorizza una mappa nome → valore
 * delle sue custom properties attuali per il merge successivo.
 * @param {string} absDestPath percorso assoluto del file CSS da leggere
 * @param {true|(string|RegExp)[]} [sources] `true` unisce ogni sorgente, un
 *   array solo i file sorgente dei token corrispondenti a una delle sue voci (default: true)
 * @returns {Record<string,string>|null}
 */
export const loadExistingCustomProps = (absDestPath, sources = true) => {
  mergeSources = sources;
  existingCustomProps = existsSync(absDestPath)
    ? parseCustomProps(readFileSync(absDestPath, 'utf8'))
    : null;
  return existingCustomProps;
};

/**
 * Equivalente sourceModes di loadExistingCustomProps(): legge il file CSS di
 * destinazione (se esiste) e memorizza una mappa nome → valore per modalità,
 * limitata al blocco `<selector> { ... }` di ciascuna modalità (vedi splitModeScopes()).
 * @param {string} absDestPath percorso assoluto del file CSS da leggere
 * @param {string} baseMode modalità le cui dichiarazioni stanno nel blocco
 *   `<selector> { ... }` di primo livello, non annidato (nessun default — sempre passata esplicitamente
 *   da build-source-modes.mjs, a partire dal sourceModesBase risolto)
 * @param {true|(string|RegExp)[]} [sources] `true` unisce ogni sorgente, un
 *   array solo i file sorgente dei token corrispondenti a una delle sue voci (default: true)
 * @param {string} [selector] il customPropsSelector con cui è stato generato il file
 *   preesistente (default: ':root' — vedi config.mjs)
 * @returns {Record<string, Record<string,string>>|null}
 */
export const loadExistingCustomPropsScoped = (absDestPath, baseMode, sources = true, selector = ':root') => {
  mergeSources = sources;
  if (!existsSync(absDestPath)) {
    scopedExistingCustomProps = null;
    return scopedExistingCustomProps;
  }
  const scopes = splitModeScopes(readFileSync(absDestPath, 'utf8'), selector);
  scopedExistingCustomProps = {};
  if (scopes.__base__ !== undefined) {
    scopedExistingCustomProps[baseMode] = parseCustomProps(scopes.__base__);
  }
  for (const [mode, body] of Object.entries(scopes)) {
    if (mode === '__base__') continue;
    scopedExistingCustomProps[mode] = parseCustomProps(body);
  }
  return scopedExistingCustomProps;
};

/**
 * Unisce le custom properties appena generate a quelle caricate in precedenza
 * tramite loadExistingCustomProps() / loadExistingCustomPropsScoped(). I valori
 * preesistenti hanno priorità; vengono mantenute anche le custom properties presenti
 * solo nel file preesistente (non più generate). Quando il merge è limitato ad alcuni
 * file sorgente dei token (opzione array), una proprietà generata il cui file sorgente
 * non corrisponde non viene sovrascritta dal suo valore preesistente.
 * @param {Record<string,string>} generated mappa nome → valore prodotta da questa build
 * @param {string|null} [mode] se impostato (build sourceModes), cerca le props
 *   preesistenti limitate a questa modalità invece della mappa piatta/globale (default: null)
 * @param {Record<string,string>} [sourceFileMap] nome della proprietà → percorso del file
 *   sorgente del token, usata solo quando il merge è limitato ad alcuni sorgenti (default: {})
 * @returns {Record<string,string>}
 */
export const mergeCustomProps = (generated, mode = null, sourceFileMap = {}) => {
  const existing = mode !== null ? scopedExistingCustomProps?.[mode] : existingCustomProps;
  if (!existing) return generated;
  if (mergeSources === true) return { ...generated, ...existing };

  const merged = { ...generated };
  for (const [name, tail] of Object.entries(existing)) {
    if (!(name in generated) || matchesSource(mergeSources, sourceFileMap[name])) {
      merged[name] = tail;
    }
  }
  return merged;
};
