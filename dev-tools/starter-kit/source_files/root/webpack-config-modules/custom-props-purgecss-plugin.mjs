// webpack-config-modules/custom-props-purgecss-plugin.mjs
// v.3
import fs from 'fs';
import postcss from 'postcss';
import { globSync } from 'glob';

/*
  Plugin webpack per l'estrazione ottimizzata delle CSS custom properties.

  Contesto: il file "master" (definitionsFile) contiene TUTTE le definizioni di
  custom properties disponibili. I css compilati da webpack contengono invece
  solo *usi* (`var(--nome)`), mai definizioni. Dopo la minificazione degli
  asset, il plugin:
  1. scansiona i css di ogni "set" per trovare le custom properties usate;
  2. risolve le dipendenze transitive (`--a: calc(var(--b) * 2)` => anche
     `--b`, fino al fixed point, fallback `var(--x, var(--y))` inclusi);
  3. estrae dal master le sole definizioni necessarie, PRESERVANDO l'ordine
     originale di dichiarazione;
  4. le inietta all'inizio del file target del set (dopo l'eventuale banner
     webpack, cioè un commento che inizia con `/*!`, o `@charset`), oppure le
     emette come nuovo asset.

  Rispetto a postcss-jit-props (che opera sul singolo file, prima del bundling)
  lavora sugli asset finali e permette di decidere il raggruppamento
  sources -> target.

  Regole di scope del master:
  - una prop è identificata dal nome: se `--x` è usata, TUTTE le sue
    dichiarazioni nel master vengono portate con sé, anche quelle dentro
    blocchi di override (`@media (prefers-color-scheme: dark)`,
    `[data-theme="dark"]`, ecc.), altrimenti il tema alternativo si rompe
    in silenzio; le var() presenti nei valori degli override entrano nella
    risoluzione transitiva;
  - le dichiarazioni non custom (es. `color-scheme`) sono mantenute solo nei
    blocchi che conservano almeno una custom property;
  - le props "locali" con prefisso `--_` non fanno parte del pool globale:
    sono escluse dalla scansione degli usi e dalla risoluzione transitiva
    (e ignorate nel master).

  Stage: PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE, quindi dopo la minificazione
  (CssMinimizerPlugin, OPTIMIZE_SIZE) e dopo PurgeCSSPlugin (ADDITIONAL), ma
  prima del calcolo del contenthash reale (OPTIMIZE_HASH, `realContentHash`).
  Il match degli usi avviene quindi sul css realmente servito e l'hash
  riflette il contenuto finale.

  Watch mode: il master è parsato una sola volta e ricaricato solo se cambia
  (mtime); è comunque registrato come fileDependency. Il set di props usate
  viene ricalcolato a ogni build.
*/

const PLUGIN_NAME = 'CustomPropsPurgeCssPlugin';

const VAR_REFS_REGEX = /var\(\s*(--[A-Za-z0-9_-]+)/g;
// banner webpack (commento `/*!`) e/o `@charset` iniziali, che devono restare in testa
const LEADING_REGEX = /^(?:\s*(?:@charset\s+["'][^"']*["']\s*;|\/\*![\s\S]*?\*\/))*\s*/;

// le props con prefisso `--_` sono locali: fuori dal pool globale
const isGlobalCustomProp = (name) => name.startsWith('--') && !name.startsWith('--_');

const varRefs = (text) => [...text.matchAll(VAR_REFS_REGEX)]
  .map(m => m[1])
  .filter(isGlobalCustomProp);

// pattern asset: stringa con `*` come wildcard (es. 'index.*.css') o RegExp,
// confrontati con il nome completo dell'asset (path relativo a output.path)
const toMatcher = (pattern) => {
  if (pattern instanceof RegExp) {
    return (name) => pattern.test(name);
  }
  const regex = new RegExp(
    '^' + pattern.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$'
  );
  return (name) => regex.test(name);
};

const hasCustomDecl = (node) => {
  let found = false;
  node.walkDecls(decl => {
    if (isGlobalCustomProp(decl.prop)) {
      found = true;
    }
  });
  return found;
};

// rimuove commenti, custom props non incluse e blocchi rimasti senza custom props
const prune = (container, keep) => {
  container.each(node => {
    if (node.type === 'comment') {
      node.remove();
    } else if (node.type === 'decl') {
      if (isGlobalCustomProp(node.prop) ? !keep.has(node.prop) : node.prop.startsWith('--')) {
        node.remove();
      }
    } else if (node.type === 'rule' || (node.type === 'atrule' && node.nodes)) {
      prune(node, keep);
      if (!hasCustomDecl(node)) {
        node.remove();
      }
    } else {
      // at-rule senza blocco (@import, @charset, @layer a, b;): non pertinenti
      node.remove();
    }
  });
};

// serializzazione compatta (senza indentazioni) per gli asset minificati
const compact = (root) => {
  root.walk(node => {
    node.raws.before = '';
    if (node.type === 'decl') {
      node.raws.between = ':';
    } else {
      node.raws.between = '';
      node.raws.after = '';
      node.raws.semicolon = false;
      if (node.type === 'atrule') {
        node.raws.afterName = ' ';
      }
    }
  });
  root.raws.after = '';
};

export class CustomPropsPurgeCssPlugin {

  /**
   * @param {object} options
   * @param {string} options.definitionsFile - Percorso assoluto del file master con tutte
   *   le definizioni di custom properties
   * @param {{ sources: (string|RegExp)[], target?: (string|RegExp) }[]} options.sets - Set
   *   di asset css da elaborare in modo indipendente. `sources`: nomi degli asset css
   *   compilati (con l'hash nel nome), stringhe con `*` come wildcard (es. `'index.*.css'`)
   *   o RegExp. `target`: asset in cui iniettare le definizioni (stesso formato; se il
   *   pattern non corrisponde ad alcun asset e non contiene `*`, viene emesso come nuovo
   *   asset con quel nome). Se omesso, è il primo asset che corrisponde a `sources`
   * @param {string} [options.selector=':root'] - Selettore con cui sostituire i blocchi
   *   `:root` del master (es. `':where(html)'`); gli altri selettori (temi, ecc.) restano invariati (default: ':root')
   * @param {string[]} [options.extraUsageGlobs=[]] - Glob di file css i cui usi di var()
   *   contano come usati in TUTTI i set: css caricati fuori dagli asset (shadow DOM dei
   *   web components, import `?raw`) (default: [])
   * @param {(string|RegExp)[]} [options.seeds=[]] - Props da includere comunque in tutti i
   *   set (nomi esatti o pattern risolti sui nomi dichiarati nel master), es. override
   *   consumati da un altro asset (default: [])
   * @param {boolean} [options.minify=false] - Serializza le definizioni in forma compatta
   *   (default: false)
   *
   * @example
   * new CustomPropsPurgeCssPlugin({
   *   definitionsFile: path.resolve(__dirname, './app/css/custom-properties.css'),
   *   sets: [
   *     // le definizioni vengono iniettate in layout.critical.*.css (inline nel template)
   *     // e valgono anche per index.*.css
   *     { sources: ['index.*.css', 'layout.critical.*.css'], target: 'layout.critical.*.css' },
   *     // target omesso: definizioni iniettate nel primo asset del set
   *     { sources: ['admin.*.css'] }
   *   ],
   *   selector: ':root',      // default
   *   extraUsageGlobs: [],    // default
   *   seeds: [],              // default
   *   minify: !isDevelopment  // default: false
   * })
   */
  constructor({
    definitionsFile,
    sets,
    selector = ':root',
    extraUsageGlobs = [],
    seeds = [],
    minify = false
  }) {
    if (!definitionsFile || !Array.isArray(sets)) {
      throw new Error(`${PLUGIN_NAME}: 'definitionsFile' e 'sets' sono obbligatori`);
    }
    this.definitionsFile = definitionsFile;
    this.sets = sets.map(set => ({
      sources: set.sources.map(toMatcher),
      target: set.target == null ? null : {
        matcher: toMatcher(set.target),
        // nome letterale, usato per emettere un nuovo asset se nessuno corrisponde
        literal: typeof set.target === 'string' && !set.target.includes('*') ? set.target : null
      }
    }));
    this.selector = selector;
    this.extraUsageGlobs = extraUsageGlobs;
    this.seeds = seeds;
    this.minify = minify;

    this.cache = { mtimeMs: null, root: null, declaredRefs: null };
  }

  // parsing (cachato) del master: root PostCSS + grafo nome -> Set(var() nei valori)
  loadDefinitions() {
    const { mtimeMs } = fs.statSync(this.definitionsFile);

    if (this.cache.mtimeMs !== mtimeMs) {
      const root = postcss.parse(fs.readFileSync(this.definitionsFile, 'utf8'), { from: this.definitionsFile });
      const declaredRefs = new Map();

      root.walkDecls(decl => {
        if (!isGlobalCustomProp(decl.prop)) {
          return;
        }
        if (!declaredRefs.has(decl.prop)) {
          declaredRefs.set(decl.prop, new Set());
        }
        varRefs(decl.value).forEach(ref => declaredRefs.get(decl.prop).add(ref));
      });

      this.cache = { mtimeMs, root, declaredRefs };
    }
    return this.cache;
  }

  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    const { RawSource, ReplaceSource } = sources;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {

      compilation.hooks.processAssets.tap(
        { name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE },
        () => {
          compilation.fileDependencies.add(this.definitionsFile);

          const { root: masterRoot, declaredRefs } = this.loadDefinitions();
          const declaredNames = [...declaredRefs.keys()];

          // usi comuni a tutti i set: file css fuori dagli asset + seeds
          const commonUsages = new Set();
          for (const file of globSync(this.extraUsageGlobs, { nodir: true, absolute: true })) {
            compilation.fileDependencies.add(file);
            varRefs(fs.readFileSync(file, 'utf8')).forEach(ref => commonUsages.add(ref));
          }
          for (const seed of this.seeds) {
            (typeof seed === 'string' ? [seed] : declaredNames.filter(name => seed.test(name)))
              .forEach(name => commonUsages.add(name));
          }

          const cssAssetNames = () => compilation.getAssets()
            .map(asset => asset.name)
            .filter(name => /\.css$/i.test(name));

          for (const set of this.sets) {
            const sourceNames = cssAssetNames().filter(name => set.sources.some(match => match(name)));

            if (sourceNames.length === 0) {
              continue;
            }

            // props usate nei css del set
            const used = new Set(commonUsages);
            for (const name of sourceNames) {
              varRefs(compilation.getAsset(name).source.source().toString()).forEach(ref => used.add(ref));
            }

            // chiusura transitiva (solo props dichiarate nel master)
            const keep = new Set();
            const queue = [...used];
            while (queue.length > 0) {
              const name = queue.pop();
              if (!keep.has(name) && declaredRefs.has(name)) {
                keep.add(name);
                queue.push(...declaredRefs.get(name));
              }
            }

            if (keep.size === 0) {
              continue;
            }

            // definizioni: si parte da una copia del master (l'ordine originale è preservato)
            const definitionsRoot = masterRoot.clone();
            prune(definitionsRoot, keep);
            if (this.selector !== ':root') {
              definitionsRoot.walkRules(rule => {
                if (rule.selector.trim() === ':root') {
                  rule.selector = this.selector;
                }
              });
            }
            if (this.minify) {
              compact(definitionsRoot);
            } else {
              // primo nodo senza riga vuota iniziale
              if (definitionsRoot.first) {
                definitionsRoot.first.raws.before = '';
              }
            }
            const definitions = definitionsRoot.toString().trim() + '\n';

            // target
            let targetName;
            if (set.target == null) {
              targetName = sourceNames[0];
            } else {
              const matching = cssAssetNames().filter(name => set.target.matcher(name));
              if (matching.length > 0) {
                targetName = matching[0];
                if (matching.length > 1) {
                  compilation.warnings.push(new compiler.webpack.WebpackError(
                    `${PLUGIN_NAME}: il target del set corrisponde a più asset (${matching.join(', ')}), usato: ${targetName}`
                  ));
                }
              } else if (set.target.literal) {
                compilation.emitAsset(set.target.literal, new RawSource(definitions));
                continue;
              } else {
                compilation.warnings.push(new compiler.webpack.WebpackError(
                  `${PLUGIN_NAME}: nessun asset corrisponde al target del set (sources: ${sourceNames.join(', ')})`
                ));
                continue;
              }
            }

            const original = compilation.getAsset(targetName).source;
            const originalText = original.source().toString();
            const position = originalText.match(LEADING_REGEX)[0].length;
            const replaced = new ReplaceSource(original, PLUGIN_NAME);
            // insert(pos) inserisce PRIMA del carattere in posizione `pos`
            replaced.insert(position, definitions);
            compilation.updateAsset(targetName, replaced);
          }
        }
      );
    });
  }
}
