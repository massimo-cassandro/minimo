/*
  build-tokens-src/legacy-tokens-parser.mjs
  Registra un parser di Style Dictionary che fa da ponte tra i file di token "legacy"
  (sintassi in stile Style Dictionary v3/v4: nessun prefisso `$` su `value`/`type`,
  riferimenti scritti come `{group.token.value}`) e la sintassi W3C DTCG
  (`$value`/`$type`, riferimenti come `{group.token}`) richiesta da Style
  Dictionary v5.

  Perché serve: Style Dictionary v5 decide se una build "usesDtcg"
  UNA SOLA VOLTA per build, a partire dal primo file sorgente elaborato (vedi
  detectDtcgSyntax() chiamata in combineJSON.js di style-dictionary) — è
  un unico flag globale, non un controllo per file. Mescolare un file in sintassi
  legacy (ad es. un file esportato da Open Props, o da un vecchio progetto
  Style Dictionary v3/v4) con sorgenti DTCG fa quindi sì che i token del
  file legacy vengano scartati in silenzio, qualunque sia l'ordine dei file: non hanno mai
  la chiave `$value` che il tagging di combineJSON (e il resto della
  pipeline) si aspetta.

  Questo parser intercetta ogni file sorgente `.json` (non `.jsonc` — quell'
  estensione è riservata in questo progetto alle sorgenti DTCG scritte a mano,
  già gestite correttamente dal loader integrato di Style Dictionary) e
  converte, nodo per nodo:
    value -> $value, type -> $type, comment/description -> $description
    "{group.token.value}" -> "{group.token}" dentro le stringhe di riferimento
  I nodi che usano già `$value` (sintassi DTCG v5) restano intatti, quindi
  il parser è un no-op sicuro per i file che non richiedono conversione — non serve
  alcun flag di config né elenco di file, il rilevamento è completamente automatico.

  I nodi "ibridi" (un token con un valore proprio che è anche un gruppo con
  figli annidati, ad es. other.ease.out di Open Props) non possono essere rappresentati in
  DTCG v5, dove un nodo con $value è una foglia. Il valore proprio viene spostato in un
  token figlio chiamato `default` (oppure `base` se `default` è già il nome di un
  figlio; la build fallisce se entrambi sono occupati) — vedi collectHybridNodes().

  Limitazione: i file `.json` gestiti da questo parser vengono letti con un semplice
  JSON.parse (niente commenti, niente trailing comma), a differenza del loader
  integrato di Style Dictionary (che usa JSON5 per .json/.jsonc/.json5). Così il builder
  resta privo di dipendenze — le esportazioni di token legacy (Open Props, vecchi progetti
  Style Dictionary v3/v4) sono comunque quasi sempre JSON rigoroso. Usare
  `.jsonc` o `.mjs` per le sorgenti DTCG scritte a mano che richiedono commenti.
*/

import StyleDictionary from 'style-dictionary';

export const LEGACY_TOKENS_PARSER_NAME = 'minimo/legacy-tokens';

// Corrisponde a "{some.token.path.value}" -> cattura "some.token.path"
const LEGACY_REF = /\{([^}]+)\.value\}/g;

/*
  Nome del token figlio che riceve il valore proprio di un nodo "ibrido"
  (vedi collectHybridNodes()); FALLBACK_LEAF viene usato quando esiste già un figlio
  con il nome preferito.
*/
const PREFERRED_LEAF = 'default';
const FALLBACK_LEAF = 'base';

/** @param {unknown} node @returns {node is Record<string, unknown>} */
const isPlainObject = (node) => node !== null && typeof node === 'object' && !Array.isArray(node);

// True se il nodo è (o contiene, a qualsiasi profondità) un token, legacy o DTCG.
/** @param {unknown} node @returns {boolean} */
const hasTokenDescendant = (node) => isPlainObject(node)
  && (Object.hasOwn(node, 'value') || Object.hasOwn(node, '$value')
    || Object.values(node).some(hasTokenDescendant));

/*
 * Un nodo legacy "ibrido" è un token (con `value` proprio) che è anche un gruppo, cioè
 * ha figli che sono token o gruppi di token (ad es. other.ease.out di Open Props,
 * con un valore proprio più out.1 ... out.5). Il valore proprio viene
 * spostato in un token figlio: `default`, oppure `base` se `default` è già il nome
 * di un figlio. Se entrambi sono occupati la build fallisce. Restituisce una mappa
 * dot.path -> nome del figlio scelto, usata per convertire il nodo stesso e per
 * riscrivere i riferimenti che puntano a esso (i riferimenti vengono riscritti solo
 * all'interno dello stesso file: un riferimento da un altro file a un nodo ibrido deve
 * usare esplicitamente il nome del figlio).
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

  // Già sintassi DTCG v5: lascia intatto.
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

    // Nodo ibrido: diventa un gruppo, il suo valore proprio si sposta in un token figlio.
    return {
      ...Object.fromEntries(
        Object.entries(rest).map(([key, child]) => [key, convertLegacyNode(child, [...path, key], hybrids)])
      ),
      [hybridLeaf]: token,
    };
  }

  // Nodo gruppo: ricorre nei figli.
  return Object.fromEntries(
    Object.entries(node).map(([key, child]) => [key, convertLegacyNode(child, [...path, key], hybrids)])
  );
};

/*
  Esportata per il riutilizzo da token-rename-parser.mjs, che richiede lo stesso
  caricamento .json legacy-o-DTCG (gestione dei nodi ibridi inclusa) per il
  sottoinsieme di file che hanno anche una mappa di rinomina `transform` registrata.
*/
/** @param {string} contents @param {string} filePath @returns {unknown} */
export const parseLegacyFile = (contents, filePath) => {
  const tree = JSON.parse(contents);
  return convertLegacyNode(tree, [], collectHybridNodes(tree, [], filePath));
};

/*
  Registra il parser globalmente sulla classe StyleDictionary. Per eseguirlo
  effettivamente, anche un'istanza di Style Dictionary deve aderire tramite
  `parsers: [LEGACY_TOKENS_PARSER_NAME]` nella propria config (la sola registrazione
  non lo attiva per ogni istanza — vedi la documentazione degli hook parser di Style Dictionary).
*/
export const registerLegacyTokensParser = () => {
  StyleDictionary.registerParser({
    name: LEGACY_TOKENS_PARSER_NAME,
    pattern: /\.json$/,
    parser: ({ contents, filePath }) => parseLegacyFile(contents, filePath ?? ''),
  });
};
