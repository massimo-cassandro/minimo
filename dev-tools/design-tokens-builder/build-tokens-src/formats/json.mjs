/*
  build-tokens-src/formats/json.mjs
  Registra il format 'json/tokens' ed esporta buildJsonFiles() e
  collectConcreteFilePaths().

  Il format produce un file JSON(C) annidato W3C DTCG, indipendente da qualsiasi
  strumento specifico (utilizzabile in Penpot, Figma tramite plugin, Token Studio,
  Supernova o qualsiasi altro strumento compatibile con DTCG).

  Il formato di output è controllato dall'opzione jsonFormat nella config del progetto:
    'jsonc' -> estensione .jsonc + intestazione che segnala il file generato
    'json'  -> .json semplice, senza intestazione

  buildJsonFiles() costruisce l'array `files` per la platform json:
    jsonDestFile impostato -> singolo file aggregato
    jsonDestFile null      -> un file per ogni file sorgente concreto, tutti nella stessa
                              cartella jsonBuildPath (senza sottocartelle) — vedi il
                              controllo delle collisioni in buildJsonFiles()

  ── Gestione delle espressioni (opzione jsonExpression) ─────────────────────

  I token dimension possono avere espressioni matematiche nel proprio $value, ad es.:
    { $type: "dimension", $value: "{size.base} * .25" }

  L'opzione di config jsonExpression controlla come vengono gestite:

    'keep'    (default) — scrive l'espressione così com'è; si presume che lo
                          strumento che la usa la valuti.
    'calc'    — la racchiude in un calc() CSS: "calc({size.base} * .25)"
                          gli alias restano come {riferimenti} che lo strumento
                          che li usa dovrà risolvere.
    'resolve' — valuta l'espressione numericamente e scrive un valore concreto.
                          L'unità è ereditata dal primo token dimension
                          referenziato nell'espressione (ad es. {size.base} = 16px
                          -> 16 * .25 = 4 -> "4px"). Se la valutazione fallisce
                          l'espressione originale viene mantenuta con un warning.
*/

import StyleDictionary from 'style-dictionary';
import path from 'node:path';

// Intestazione anteposta a ogni file generato quando jsonFormat è 'jsonc'
const DISCLAIMER = [
  '// -----------------------------------------------------------------------',
  '// File generato — non modificare a mano.',
  '// Questo file è prodotto dalla pipeline di build dei design token.',
  '// Fonte di verità: i file dei token nella directory sorgente del progetto.',
  '// Per rigenerarlo: node build-tokens.mjs --config <path/to/config>',
  '// -----------------------------------------------------------------------',
  '',
].join('\n');

// ── Helper per le espressioni ─────────────────────────────────────────────────

/*
  Restituisce true se la stringa contiene un'espressione matematica — cioè ha almeno
  un operatore (+, -, *, /) fuori da un riferimento a token ({...}).
  I valori negativi come "-0.5rem" o "-8px" NON sono espressioni.
*/
const isExpression = (str) => {
  if (typeof str !== 'string') return false;
  // Rimuove i riferimenti ai token, poi cerca gli operatori
  const stripped = str.replace(/\{[^}]+\}/g, '0');
  /*
    Rimuove il meno iniziale (numero negativo) prima di cercare gli operatori.
    Un operatore ha significato solo quando compare tra due operandi,
    cioè è preceduto da una cifra, una parentesi chiusa o un carattere di parola.
  */
  return /[\d)]\s*[+\-*/]/.test(stripped) || /[+*/]/.test(stripped.replace(/^-/, ''));
};

// Costruisce una mappa di lookup dei token (dot-path -> token) dal dizionario.
const makeTokenMap = (dictionary) => {
  const map = {};
  for (const token of dictionary.allTokens) {
    map[token.path.join('.')] = token;
  }
  return map;
};

/*
  Risolve un'espressione dimension in una stringa di valore concreto (ad es. "4px").

  Strategia:
    1. Trova il primo {riferimento} nell'espressione.
    2. Lo cerca nella mappa dei token per ottenerne il valore numerico risolto e l'unità.
    3. Sostituisce TUTTI i {riferimenti} nell'espressione con i loro valori numerici.
    4. Valuta con Function() l'espressione aritmetica risultante.
    5. Riattacca l'unità del passo 2.

  Restituisce null se la risoluzione fallisce (il chiamante ripiega sulla stringa originale).
*/
const resolveExpression = (orig, tokenMap) => {
  // Raccoglie tutte le chiavi {reference} in ordine di comparsa
  const refPattern = /\{([^}]+)\}/g;
  const refs = [...orig.matchAll(refPattern)];
  if (refs.length === 0) return null;

  // Determina l'unità dal primo token dimension referenziato
  const firstRef  = tokenMap[refs[0][1]];
  if (!firstRef) return null;

  const firstVal  = String(firstRef.$value ?? firstRef.value ?? '');
  const unitMatch = firstVal.match(/[a-z%]+$/i);
  const unit      = unitMatch ? unitMatch[0] : '';
  const baseNum   = parseFloat(firstVal);
  if (isNaN(baseNum)) return null;

  // Sostituisce ogni {ref} con il suo valore numerico
  let expr = orig;
  for (const match of refs) {
    const refKey = match[1];
    const refToken = tokenMap[refKey];
    if (!refToken) return null;
    const refVal = parseFloat(String(refToken.$value ?? refToken.value ?? ''));
    if (isNaN(refVal)) return null;
    expr = expr.replace(match[0], String(refVal));
  }

  // Valuta — consente solo cifre, spazi e operatori aritmetici
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return null;

  try {
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    // Arrotonda a una precisione ragionevole per evitare il rumore della virgola mobile
    const rounded = parseFloat(result.toPrecision(10));
    return unit ? `${rounded}${unit}` : String(rounded);
  } catch {
    return null;
  }
};

// Racchiude un'espressione dimension in calc() CSS, lasciando intatti i {riferimenti}.
const toCalc = (orig) => `calc(${orig})`;

// ── Format ───────────────────────────────────────────────────────────────────

StyleDictionary.registerFormat({
  name: 'json/tokens',
  format: ({ dictionary, options }) => {
    const root = {};
    const expressionMode = options.jsonExpression ?? 'keep'; // 'keep' | 'calc' | 'resolve'
    const tokenMap = (expressionMode === 'resolve') ? makeTokenMap(dictionary) : null;

    for (const token of dictionary.allTokens) {
      // I token caricati tramite `include` (sourceModes: token della modalità base resi
      // disponibili alle altre modalità per la risoluzione dei riferimenti) non vengono emessi.
      if (token.isSource === false) continue;

      // Ricostruisce l'albero annidato dal percorso del token
      let node = root;
      for (let i = 0; i < token.path.length - 1; i++) {
        const segment = token.path[i];
        node[segment] = node[segment] ?? {};
        node = node[segment];
      }

      const leafKey = token.path[token.path.length - 1];
      const type    = token.$type ?? token.type;
      const orig    = token.original?.$value ?? token.original?.value;

      // ── Risoluzione del valore ──────────────────────────────────────────────
      let value;

      if (
        type === 'dimension' &&
        typeof orig === 'string' &&
        isExpression(orig)
      ) {
        // Il $value originale è un'espressione matematica
        if (expressionMode === 'resolve') {
          const resolved = resolveExpression(orig, tokenMap);
          if (resolved !== null) {
            value = resolved;
          } else {
            // Risoluzione fallita — mantiene l'originale ed emette un warning
            // eslint-disable-next-line no-console
            console.warn(`[build-tokens] json: could not resolve expression "${orig}" for token "${token.path.join('.')}". Keeping original.`);
            value = orig;
          }
        } else if (expressionMode === 'calc') {
          // Sostituisce i {riferimenti} con la loro notazione alias e racchiude in calc()
          value = toCalc(orig);
        } else {
          // 'keep' — scrive l'espressione invariata
          value = orig;
        }
      } else {
        /*
          Valore non espressione: conserva i {riferimenti} ovunque compaiano.
            - Alias puro:      "{some.token}"           → mantenuto così com'è per preservare i collegamenti tra token
            - Funzione CSS:    "color-mix(in srgb, {some.token} 60%, #000)" → mantenuta così com'è
            - Valore semplice: "#ff0000", "16px", …     → usa il $value risolto
        */
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
// Estrae i percorsi di file concreti univoci da un'istanza di Style Dictionary.
// Va chiamata DOPO `await sd.hasInitialized`.

export const collectConcreteFilePaths = async (sd) => {
  await sd.hasInitialized;
  const paths = new Set();
  for (const token of sd.allTokens) {
    if (token.filePath && token.isSource !== false) paths.add(token.filePath);
  }
  return [...paths].sort();
};

// ── buildJsonFiles ──────────────────────────────────────────────────────────
/*
  @param {string[]}                       concreteFilePaths  Da collectConcreteFilePaths()
  @param {string|null}                    jsonDestFile       Nome base del file aggregato, oppure null
  @param {'json'|'jsonc'}                 jsonFormat         Formato di output
  @param {'keep'|'calc'|'resolve'}        jsonExpression     Modalità di gestione delle espressioni
  @param {string}                         [suffix]           Aggiunto a ogni nome di file di
    destinazione, prima dell'estensione — usato dalla build sourceModes
    (build-source-modes.mjs) per produrre un set di file per modalità, ad es.
    "-light" -> "tokens-light.jsonc" / "size-light.jsonc" (default: '')
  @returns {object[]}  Descrittori di file per la platform di Style Dictionary
*/

export const buildJsonFiles = (
  concreteFilePaths,
  jsonDestFile,
  jsonFormat = 'json',
  jsonExpression = 'keep',
  suffix = ''
) => {
  const ext  = jsonFormat === 'jsonc' ? '.jsonc' : '.json';
  const jsonc = jsonFormat === 'jsonc';

  if (jsonDestFile) {
    return [{
      destination: jsonDestFile + suffix + ext,
      format: 'json/tokens',
      options: { jsonc, jsonExpression },
    }];
  }

  /*
    Un file per sorgente, tutti nella stessa cartella jsonBuildPath — senza sottocartelle
    che replicano l'albero dei sorgenti. Dato che i file sorgente possono condividere il nome base in
    directory diverse (ad es. due componenti ciascuno con il proprio
    <name>.minimo.tokens.mjs), in caso di collisioni fallisce in modo esplicito invece di lasciare
    che uno sovrascriva l'altro in silenzio.
  */
  const pathsByDestName = new Map();
  for (const filePath of concreteFilePaths) {
    const destName = path.basename(filePath).replace(/\.[^.]+$/, '') + suffix + ext;
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
      destination: path.basename(filePath).replace(/\.[^.]+$/, '') + suffix + ext,
      format: 'json/tokens',
      options: { jsonc, jsonExpression },
      filter: (token) => {
        const fp = token.filePath ? path.resolve(token.filePath) : '';
        return fp === absPath;
      },
    };
  });
};
