#!/usr/bin/env node


/*
 * find-orphan-css-classes.mjs
 *
 * Analizza i file sorgente (html, js, php, ecc.) ed elenca le classi CSS
 * utilizzate che non sono definite nei file CSS indicati.
 * Per i file js/jsx controlla anche le classi dei CSS modules
 * (styles.xxx, ${styles.xxx}, styles['xxx']), verificandole rispetto al
 * file .module.css importato.
 *
 * Nessuna dipendenza esterna, richiede Node >= 18.
 *
 * Il report viene scritto nel file `orphan-classes.md`, nella stessa directory
 * del file di configurazione, con link cliccabili alle occorrenze. Se non ci
 * sono classi mancanti il file viene eliminato.
 *
 * Uso:
 *   node find-orphan-css-classes.mjs --config orphan-css-classes.config.mjs
 *   node find-orphan-css-classes.mjs -c orphan-css-classes.config.mjs --json
 *
 * Opzioni:
 *   -c, --config   file di configurazione JavaScript (.mjs consigliato, con export default)
 *       --json     output JSON su stdout (nessun file scritto)
 *   -h, --help     mostra questo messaggio
 *
 * Configurazione (i percorsi relativi sono risolti rispetto alla directory
 * del file di configurazione):
 *   src        (obbligatorio) file o directory da analizzare
 *   css        (obbligatorio) file o directory contenenti i CSS
 *   ext        estensioni dei sorgenti
 *   cssExt     estensioni dei file CSS
 *   excludeDir nomi di directory da saltare (default: node_modules, .git, dist, vendor)
 *   excludeCssFiles  percorsi di file CSS (o CSS modules) da non considerare
 *              nel confronto (default: [])
 *   ignore     espressioni regolari (RegExp o stringhe) di classi da ignorare
 *   cssModules {
 *     enabled   attiva il controllo dei CSS modules (default: true)
 *     ext       estensioni dei sorgenti in cui cercare i CSS modules (default: js, jsx)
 *     pattern   espressione regolare (RegExp o stringa) che identifica i file module
 *     camelCase se true, styles.myClass corrisponde anche a .my-class
 *   }
 *
 * Codice di uscita: 0 = nessuna classe mancante, 1 = trovate classi mancanti,
 * 2 = errore di configurazione.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const DEFAULTS = {
  ext: ['html', 'htm', 'js', 'mjs', 'jsx', 'ts', 'tsx', 'php', 'vue', 'twig'],
  cssExt: ['css'],
  excludeDir: ['node_modules', '.git', 'dist', 'vendor'],
  excludeCssFiles: [],
  ignore: [],
  cssModules: {
    enabled: true,
    ext: ['js', 'jsx'],
    pattern: '\\.module\\.(css|scss|sass|less)$',
    camelCase: false
  }
};

const REPORT_FILE = 'orphan-classes.md';

const DYN = '\u0000'; /* segnaposto per le parti dinamiche (PHP, template literal, ecc.) */

/* classe CSS in un selettore: .nome, con eventuali caratteri di escape */
const CSS_CLASS_RE = /\.(-?(?:[_a-zA-Z]|\\.)(?:[\w-]|\\.)*)/g;

/* class="..." / className='...' / class: `...` */
const CLASS_ATTR_RE = /\b(?:class|className)\s*[=:]\s*(["'`])((?:(?!\1)[\s\S])*?)\1/g;

/* el.classList.add('a', 'b') ecc. */
const CLASSLIST_RE = /\.classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g;
const STRING_RE = /(["'`])((?:(?!\1).)*?)\1/g;

/* querySelector('.a .b'), closest('.a'), matches('.a') */
const SELECTOR_RE = /\b(querySelectorAll|querySelector|closest|matches)\(\s*(["'`])((?:(?!\2).)*?)\2/g;

/* getElementsByClassName('a b') */
const BY_CLASS_RE = /\bgetElementsByClassName\(\s*(["'`])((?:(?!\1).)*?)\1/g;

/*
 * Import di un CSS module:
 *   import styles from './x.module.css'
 *   import * as styles from './x.module.css'
 *   import styles, { foo } from './x.module.css'
 *   const styles = require('./x.module.css')
 */
const IMPORT_RE = /\bimport\s+(?:\*\s+as\s+)?([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\})?\s*from\s*(["'])([^"']+)\2/g;
const REQUIRE_RE = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*(["'])([^"']+)\2\s*\)/g;

/* ---------- utilità ---------- */

function unescapeCss(name) {
  return name.replace(/\\(.)/g, '$1');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function camelize(s) {
  return s.replace(/[-_]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
}

function maskDynamic(value) {
  return value
    .replace(/<\?[\s\S]*?\?>/g, DYN)
    .replace(/\{\{[\s\S]*?\}\}/g, DYN)
    .replace(/\{%[\s\S]*?%\}/g, DYN)
    .replace(/\$\{[^}]*\}/g, DYN);
}

/*
 * Divide un valore di attributo in singole classi.
 * I token che contengono parti dinamiche (es. "btn-<?= $x ?>") vengono
 * scartati, perché il nome reale della classe non è noto.
 */
function splitTokens(value) {
  return maskDynamic(value)
    .split(/\s+/)
    .filter(t => t && !t.includes(DYN) && !/[<>"'`]/.test(t));
}

function normalizeExt(list) {
  return new Set(list.map(e => e.replace(/^\./, '').toLowerCase()));
}

function collectFiles(entries, extensions, exclude) {
  const out = new Set();

  const visit = (p, explicit) => {
    let stat;
    try {
      stat = fs.statSync(p);
    } catch {
      console.error(`Percorso non trovato: ${p}`);
      return;
    }

    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
        if (exclude.has(entry.name)) continue;
        visit(path.join(p, entry.name), false);
      }
    } else if (explicit || extensions.has(path.extname(p).slice(1).toLowerCase())) {
      out.add(path.resolve(p));
    }
  };

  entries.forEach(p => visit(p, true));
  return [...out];
}

function buildLineIndex(text) {
  const idx = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) idx.push(i + 1);
  }
  return idx;
}

function lineAt(idx, pos) {
  let lo = 0;
  let hi = idx.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (idx[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/* ---------- configurazione ---------- */

async function loadConfig(configPath) {
  const abs = path.resolve(configPath);
  const mod = await import(pathToFileURL(abs).href);
  const raw = mod.default ?? mod;

  for (const key of ['src', 'css']) {
    if (!Array.isArray(raw[key]) || !raw[key].length) {
      throw new Error(`Nel file di configurazione manca la lista "${key}"`);
    }
  }

  const baseDir = path.dirname(abs);
  const toAbs = list => list.map(p => path.resolve(baseDir, p));
  const modules = { ...DEFAULTS.cssModules, ...(raw.cssModules ?? {}) };

  return {
    src: toAbs(raw.src),
    css: toAbs(raw.css),
    ext: normalizeExt(raw.ext ?? DEFAULTS.ext),
    cssExt: normalizeExt(raw.cssExt ?? DEFAULTS.cssExt),
    excludeDir: new Set(raw.excludeDir ?? DEFAULTS.excludeDir),
    excludeCssFiles: new Set(toAbs(raw.excludeCssFiles ?? DEFAULTS.excludeCssFiles)),
    baseDir,
    ignore: (raw.ignore ?? DEFAULTS.ignore).map(s => new RegExp(s)),
    cssModules: {
      enabled: Boolean(modules.enabled),
      ext: normalizeExt(modules.ext),
      pattern: new RegExp(modules.pattern),
      camelCase: Boolean(modules.camelCase)
    }
  };
}

/* ---------- estrazione classi dai CSS ---------- */

function extractCssClasses(css) {
  const clean = css
    .replace(/\/\*[\s\S]*?\*\//g, '') /* commenti */
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""') /* stringhe */
    .replace(/url\([^)]*\)/gi, 'url()');

  const classes = new Set();
  const preludeRe = /([^{}]+)\{/g; /* testo che precede ogni "{" */
  let m;

  while ((m = preludeRe.exec(clean))) {
    /* con il CSS nesting il testo può includere dichiarazioni precedenti */
    const prelude = m[1].slice(m[1].lastIndexOf(';') + 1).trim();
    if (!prelude || prelude.startsWith('@')) continue; /* at-rule: @media, @font-face, ecc. */

    for (const c of prelude.matchAll(CSS_CLASS_RE)) {
      classes.add(unescapeCss(c[1]));
    }
  }

  return classes;
}

/* ---------- estrazione classi dai sorgenti ---------- */

function* extractUsages(text) {
  for (const m of text.matchAll(CLASS_ATTR_RE)) {
    for (const cls of splitTokens(m[2])) yield { cls, index: m.index };
  }

  for (const m of text.matchAll(CLASSLIST_RE)) {
    for (const lit of m[1].matchAll(STRING_RE)) {
      for (const cls of splitTokens(lit[2])) yield { cls, index: m.index };
    }
  }

  for (const m of text.matchAll(BY_CLASS_RE)) {
    for (const cls of splitTokens(m[2])) yield { cls, index: m.index };
  }

  for (const m of text.matchAll(SELECTOR_RE)) {
    const selector = maskDynamic(m[3]);
    for (const c of selector.matchAll(CSS_CLASS_RE)) {
      /* se la classe è seguita da una parte dinamica il nome è incompleto */
      if (selector[c.index + c[0].length] === DYN) continue;
      yield { cls: unescapeCss(c[1]), index: m.index };
    }
  }
}

/*
 * Classi dei CSS modules: individua le variabili a cui è assegnato un file
 * module (qualunque nome, non solo "styles") e cerca nome.xxx / nome['xxx'].
 * Il caso ${styles.xxx} è coperto da nome.xxx.
 * "module" è il percorso assoluto del file importato, o null se non risolvibile
 * (es. alias di webpack).
 */
function* extractModuleUsages(text, file, pattern) {
  const bindings = new Map();

  for (const re of [IMPORT_RE, REQUIRE_RE]) {
    for (const m of text.matchAll(re)) {
      const name = m[1];
      const spec = m[3];
      if (!pattern.test(spec)) continue;

      let resolved = null;
      if (spec.startsWith('.')) {
        const candidate = path.resolve(path.dirname(file), spec);
        if (fs.existsSync(candidate)) resolved = candidate;
      }
      bindings.set(name, resolved);
    }
  }

  for (const [name, resolved] of bindings) {
    const id = escapeRegExp(name);
    const dotRe = new RegExp(`(?<![\\w$.])${id}\\.([A-Za-z_$][\\w$]*)`, 'g');
    const bracketRe = new RegExp(`(?<![\\w$.])${id}\\[\\s*(["'])([^"']+)\\1\\s*\\]`, 'g');

    for (const m of text.matchAll(dotRe)) {
      yield { cls: m[1], index: m.index, isModule: true, module: resolved };
    }
    for (const m of text.matchAll(bracketRe)) {
      yield { cls: m[2], index: m.index, isModule: true, module: resolved };
    }
  }
}

/* ---------- main ---------- */

const { values } = parseArgs({
  options: {
    config: { type: 'string', short: 'c' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  }
});

if (values.help) {
  const header = fs.readFileSync(new URL(import.meta.url), 'utf8').match(/\/\*[\s\S]*?\*\//)[0];
  console.log(header);
  process.exit(0);
}

if (!values.config) {
  console.error('Specificare il file di configurazione con --config <file> (usare --help per i dettagli).');
  process.exit(2);
}

let cfg;
try {
  cfg = await loadConfig(values.config);
} catch (err) {
  console.error(`Errore nel file di configurazione: ${err.message}`);
  process.exit(2);
}

const camel = cfg.cssModules.camelCase;

/* con camelCase attivo ogni classe è disponibile anche in forma camelCase */
function withCamel(set) {
  if (camel) for (const c of [...set]) set.add(camelize(c));
  return set;
}

const allCssFiles = collectFiles(cfg.css, cfg.cssExt, cfg.excludeDir);
const cssFiles = allCssFiles.filter(f => !cfg.excludeCssFiles.has(f));
const srcFiles = collectFiles(cfg.src, cfg.ext, cfg.excludeDir).filter(f => !allCssFiles.includes(f));

if (!cssFiles.length) {
  console.error('Nessun file CSS trovato.');
  process.exit(2);
}

/*
 * I file module presenti nella lista CSS non contribuiscono alle classi
 * "globali" (sono raggiungibili solo tramite import), ma servono come
 * riferimento di riserva quando l'import non è risolvibile.
 */
const globalClasses = new Set();
const allModuleClasses = new Set();
const moduleCache = new Map();

function getModuleClasses(file) {
  if (!moduleCache.has(file)) {
    moduleCache.set(file, withCamel(extractCssClasses(fs.readFileSync(file, 'utf8'))));
  }
  return moduleCache.get(file);
}

for (const file of cssFiles) {
  if (cfg.cssModules.enabled && cfg.cssModules.pattern.test(file)) {
    for (const cls of getModuleClasses(file)) allModuleClasses.add(cls);
  } else {
    for (const cls of extractCssClasses(fs.readFileSync(file, 'utf8'))) globalClasses.add(cls);
  }
}

const fallbackClasses = new Set([...globalClasses, ...allModuleClasses]);

function isDefined(usage) {
  /* usages of an excluded CSS module are not checked */
  if (usage.module && cfg.excludeCssFiles.has(usage.module)) return true;
  if (!usage.isModule) return globalClasses.has(usage.cls);
  const set = usage.module ? getModuleClasses(usage.module) : fallbackClasses;
  return set.has(usage.cls);
}

const missing = new Map(); /* classe -> [{ file, line, module? }] */

for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const lineIndex = buildLineIndex(text);
  const rel = path.relative(cfg.baseDir, file);
  const ext = path.extname(file).slice(1).toLowerCase();

  const usages = [...extractUsages(text)];
  if (cfg.cssModules.enabled && cfg.cssModules.ext.has(ext)) {
    usages.push(...extractModuleUsages(text, file, cfg.cssModules.pattern));
  }

  for (const usage of usages) {
    if (isDefined(usage) || cfg.ignore.some(re => re.test(usage.cls))) continue;

    const entry = { file: rel, line: lineAt(lineIndex, usage.index) };
    if (usage.isModule) {
      entry.module = usage.module ? path.relative(cfg.baseDir, usage.module) : 'non risolto';
    }

    const list = missing.get(usage.cls) ?? [];
    if (!list.some(e => e.file === entry.file && e.line === entry.line && e.module === entry.module)) {
      list.push(entry);
    }
    missing.set(usage.cls, list);
  }
}

const sorted = [...missing.entries()].sort((a, b) => a[0].localeCompare(b[0]));

if (values.json) {
  console.log(JSON.stringify({
    cssFiles: cssFiles.length,
    sourceFiles: srcFiles.length,
    definedClasses: globalClasses.size,
    missing: Object.fromEntries(sorted)
  }, null, 2));
} else {
  const reportPath = path.resolve(cfg.baseDir, REPORT_FILE);

  if (sorted.length) {
    /* flat list sorted by file and line, with a clickable link to each occurrence */
    const items = sorted
      .flatMap(([cls, locations]) => locations.map(loc => ({ cls, ...loc })))
      .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

    const lines = items.map(({ cls, file, line, module }) => {
      const href = `${file.split(path.sep).map(encodeURIComponent).join('/')}#L${line}`;
      return `* [${path.basename(file)}:${line}](${href}) -> \`.${cls}\``
        + (module ? ` (CSS module: ${module})` : '');
    });

    fs.writeFileSync(reportPath, `## Missing CSS classes\n\n${lines.join('\n')}\n`, 'utf-8');
  } else if (fs.existsSync(reportPath)) {
    fs.unlinkSync(reportPath);
  }

  console.log(
    `File CSS: ${cssFiles.length} (${globalClasses.size} classi globali) | File analizzati: ${srcFiles.length}\n`
    + `Classi mancanti: ${sorted.length}`
    + (sorted.length ? ` -> ${path.relative(process.cwd(), reportPath)}` : '')
  );
}

process.exit(sorted.length ? 1 : 0);
