// webpack-modules/purgecss-setup.mjs
import { PurgeCSSPlugin } from 'purgecss-webpack-plugin';
import { globSync } from 'glob';
import { purgecssVariablesSafelist } from './purgecss-variables-safelist.mjs';

/*
  Istanzia i plugin PurgeCSS del progetto: un passaggio stretto sui css
  `.critical` (inlinati nei template, devono restare autosufficienti) e un
  passaggio generale su tutti gli altri asset (il purge è idempotente: il
  secondo passaggio sui critical non rimuove altro).

  NB: il plugin elabora ogni asset css SINGOLARMENTE, quindi con `variables: true`
  una custom property viene mantenuta solo se definita e usata nello stesso asset.
  Per questo, lato progetto:
  - ogni entry css importa direttamente custom-properties.css (che sostituisce
    jit-props: le props non usate vengono rimosse qui)
  - il chunk `shared` deve contenere solo js (il css estratto resta nel chunk
    dell'entry che lo importa)
  - le props dichiarate in un asset ma consumate altrove (override di tema,
    shadow DOM dei web components) vanno indicate tramite `variablesSafelist`
    (vedi purgecss-variables-safelist.mjs)
*/

/**
 * @param {object} params
 * @param {string[]} params.contentGlobs file da scansionare per le classi/id usati
 *   (twig, php, js...); i file di stile vengono comunque scartati dal plugin
 * @param {object} params.safelist { standard, deep, greedy } — selettori sempre
 *   mantenuti, indipendentemente dal contenuto scansionato
 * @param {object} params.variablesSafelist opzioni per purgecssVariablesSafelist
 *   ({ declarationGlobs, shadowGlobs, seeds })
 * @param {boolean} [params.variables=true] rimuove le custom properties non usate
 * @param {boolean} [params.keyframes=true] rimuove i @keyframes non referenziati
 * @param {boolean} [params.debug=false] logga i selettori rimossi a fine build
 * @returns {object[]} plugin webpack da inserire in `plugins`
 *   (critical + generale, più il logger di debug se `debug: true`)
 */
export function createPurgeCSSPlugins({
  contentGlobs,
  safelist,
  variablesSafelist,
  variables = true,
  keyframes = true,
  debug = false
}) {
  const commonOptions = {
    paths: () => globSync(contentGlobs, { nodir: true }),

    // extractor di default (/[A-Za-z0-9_-]+/g): adeguato alle classi/tag/id del progetto,
    // non servono extractors custom

    variables,
    keyframes,
    // fontFace resta false (default): i font sono referenziati solo tramite
    // var(--font-family) e purgecss non risolve le custom properties nei valori

    rejected: debug // popola purgedStats per il log di debug
  };

  const pluginCritical = new PurgeCSSPlugin({
    ...commonOptions,
    only: ['.critical'],
    safelist
  });

  const pluginMain = new PurgeCSSPlugin({
    ...commonOptions,
    safelist: {
      ...safelist,
      // elenco generato: usi di var() nei blocchi `purgecss ignore` e nei css
      // shadow-DOM/`?raw`, override cross-asset (seeds), con chiusura transitiva
      // delle dipendenze (vedi purgecss-variables-safelist.mjs)
      variables: purgecssVariablesSafelist(variablesSafelist)
    }
  });

  return [
    pluginCritical,
    pluginMain,

    // log dei selettori rimossi (richiede `debug: true`, che imposta anche `rejected: true`)
    ...(debug ? [{
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('PurgeCSSLog', () => {
          /* eslint-disable no-console */
          console.log('\n--- [PurgeCSS] Selettori rimossi (critical) ---');
          console.dir(pluginCritical.purgedStats, { depth: null, maxArrayLength: null });
          console.log('\n--- [PurgeCSS] Selettori rimossi ---');
          console.dir(pluginMain.purgedStats, { depth: null, maxArrayLength: null });
          /* eslint-enable no-console */
        });
      }
    }] : [])
  ];
}
