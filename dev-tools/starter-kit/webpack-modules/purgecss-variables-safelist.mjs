// webpack-modules/purgecss-variables-safelist.mjs
import fs from 'fs';
import { globSync } from 'glob';

/*
  Genera l'elenco di custom properties da passare a `safelist.variables` di PurgeCSS.
  L'elenco viene ricalcolato in memoria a ogni avvio di webpack: nessun file su disco.

  Perché serve: PurgeCSS (`variables: true`) registra l'uso delle variabili solo
  nelle regole che effettivamente elabora, all'interno del singolo asset css.
  Restano quindi "invisibili" gli usi di var() che avvengono:

  1. nei blocchi racchiusi tra i commenti `purgecss start/end ignore`
     (presenti ad es. nei sorgenti di minimo): le regole vengono mantenute,
     ma le custom properties che consumano verrebbero rimosse dal :root;
  2. nei css caricati fuori dagli asset purgati (shadow DOM dei web components,
     import con `?raw`): consumano le props del :root della pagina;
  3. nelle dichiarazioni di un asset consumate in un altro asset
     (es. override di tema definiti nel css di una pagina e consumati
     dal css globale): vanno indicate tramite `seeds`.

  Inoltre `safelist.variables` NON segue le catene di dipendenze (una prop
  safelisted resta nel css, ma i suoi riferimenti var() non vengono marcati
  come usati: `--a: var(--b)` in safelist non salva `--b`): l'elenco viene
  quindi espanso con la chiusura transitiva calcolata sul grafo di tutte le
  dichiarazioni `--x: ...` presenti nei sorgenti.
*/

const VAR_REFS_REGEX = /var\(\s*(--[A-Za-z0-9_-]+)/g;
const DECLARATION_REGEX = /(--[A-Za-z0-9_-]+)\s*:\s*([^;}]+)/g;
const IGNORE_START_REGEX = /\/\*\s*purgecss start ignore\s*\*\//;
const IGNORE_END_REGEX = /\/\*\s*purgecss end ignore\s*\*\//;

const varRefs = (cssText) => [...cssText.matchAll(VAR_REFS_REGEX)].map(m => m[1]);

/**
 * @param {object} params
 * @param {string[]} params.declarationGlobs glob dei css che contribuiscono al grafo
 *   delle dipendenze; i loro blocchi `purgecss ignore` contano come usi
 * @param {string[]} [params.shadowGlobs] glob dei css usati fuori dagli asset purgati
 *   (shadow DOM / `?raw`): TUTTI i loro usi di var() contano
 * @param {(string|RegExp)[]} [params.seeds] props da mantenere comunque (nomi o pattern
 *   risolti sui nomi dichiarati), es. override consumati in un altro asset
 * @returns {string[]} elenco ordinato di nomi di custom properties
 */
export function purgecssVariablesSafelist({ declarationGlobs, shadowGlobs = [], seeds = [] }) {

  const declaredRefs = new Map(); // nome → Set(var() referenziate nelle sue dichiarazioni)
  const usages = new Set();       // usi da mantenere (blocchi ignore + shadow css)

  for (const file of globSync(declarationGlobs, { nodir: true })) {
    const src = fs.readFileSync(file, 'utf8');

    // grafo delle dipendenze: ogni dichiarazione `--x: ...` con le var() nel valore
    for (const declaration of src.matchAll(DECLARATION_REGEX)) {
      const [, name, value] = declaration;
      if (!declaredRefs.has(name)) {
        declaredRefs.set(name, new Set());
      }
      varRefs(value).forEach(ref => declaredRefs.get(name).add(ref));
    }

    // usi di var() nei blocchi `purgecss start/end ignore`
    src.split(IGNORE_START_REGEX).slice(1).forEach(chunk => {
      varRefs(chunk.split(IGNORE_END_REGEX)[0]).forEach(ref => usages.add(ref));
    });
  }

  // shadow css: ogni uso di var() conta
  for (const file of globSync(shadowGlobs, { nodir: true })) {
    varRefs(fs.readFileSync(file, 'utf8')).forEach(ref => usages.add(ref));
  }

  // risoluzione dei seeds sui nomi dichiarati
  const declaredNames = [...declaredRefs.keys()];
  const seedNames = seeds.flatMap(seed =>
    typeof seed === 'string' ? [seed] : declaredNames.filter(name => seed.test(name))
  );

  // chiusura transitiva delle dipendenze
  const result = new Set();
  const queue = [...seedNames, ...usages];
  while (queue.length > 0) {
    const name = queue.pop();
    if (!result.has(name)) {
      result.add(name);
      queue.push(...(declaredRefs.get(name) ?? []));
    }
  }

  return [...result].sort();
}
