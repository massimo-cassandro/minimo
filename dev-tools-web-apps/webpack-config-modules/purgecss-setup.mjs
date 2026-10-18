// webpack-modules/purgecss-setup.mjs
// v.3
import { PurgeCSSPlugin } from 'purgecss-webpack-plugin';
import { globSync } from 'glob';

/*
  Istanzia i plugin PurgeCSS del progetto: un passaggio stretto sui css
  `.critical` (inline nei template, devono restare autosufficienti) e un
  passaggio generale su tutti gli altri asset (il purge è idempotente: il
  secondo passaggio sui critical non rimuove altro).

  NB: PurgeCSS gestisce SOLO classi/id/tag e @keyframes. Le custom properties
  NON sono gestite qui (`variables` è sempre false): le definizioni vengono
  iniettate, solo per quelle usate, da custom-props-purgecss-plugin.mjs, che
  opera sugli asset css già finalizzati (dopo questo purge e dopo la
  minificazione), quindi vede anche gli usi di var() nei blocchi
  `purgecss start/end ignore`, che PurgeCSS mantiene.
  Il purge lavora sul singolo asset css: i @keyframes definiti in un asset
  (es. `shared.css`) ma usati solo in un altro vengono rimossi (vedi
  `safelist.keyframes` / `keyframes: false`).
*/

/**
 * @param {object} params
 * @param {string[]} params.contentGlobs file da scansionare per le classi/id usati
 *   (twig, php, js...); i file di stile vengono comunque scartati dal plugin
 * @param {object} params.safelist { standard, deep, greedy, keyframes } — selettori sempre
 *   mantenuti, indipendentemente dal contenuto scansionato
 * @param {boolean} [params.keyframes=true] rimuove i @keyframes non referenziati (default: true)
 * @param {boolean} [params.debug=false] logga i selettori rimossi a fine build (default: false)
 * @returns {object[]} plugin webpack da inserire in `plugins`
 *   (critical + generale, più il logger di debug se `debug: true`)
 *
 * @example
 * createPurgeCSSPlugins({
 *   contentGlobs: [path.resolve(__dirname, './app/src/**\/*.{js,mjs}')],
 *   safelist: { standard: [/^alert-/], deep: [/^m_/], greedy: [/^&$/] },
 *   keyframes: true, // default
 *   debug: false     // default
 * })
 */
export function createPurgeCSSPlugins({
  contentGlobs,
  safelist,
  keyframes = true,
  debug = false
}) {
  const commonOptions = {
    paths: () => globSync(contentGlobs, { nodir: true }),

    // extractor di default (/[A-Za-z0-9_-]+/g): adeguato alle classi/tag/id del progetto,
    // non servono extractors custom

    variables: false, // vedi sopra: custom properties gestite da custom-props-purgecss-plugin.mjs
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
    safelist
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
