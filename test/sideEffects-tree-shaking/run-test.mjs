// Verifica se aggiungere `sideEffects: true` alla rule dei CSS Modules in
// dev-tools/starter-kit/webpack-modules/css-rules.mjs riesuma il problema
// (già risolto in passato) per cui importare un solo componente da index.js
// portava con sé il JS/CSS di TUTTI i componenti del barrel.
//
// Uso: node test/sideEffects-tree-shaking/run-test.mjs
//
// Costruisce due bundle di produzione a partire da fixture-entry.js (che
// importa SOLO modalPopup da index.js):
//   - baseline: css-rules.mjs così com'è oggi (nessun sideEffects sulla rule)
//   - fixed:    con `sideEffects: true` applicato alla rule .module.css
//
// Per ciascuna variante controlla nel CSS estratto (bundle.css):
//   - il banner di modal-popup (usato)              → deve esserci
//   - il banner di snackbar (mai importato)          → NON deve esserci
//   - il banner di slide-up-down-toggle (mai import.)→ NON deve esserci
//
// I banner /*! ... */ sopravvivono a cssnano (CssMinimizerPlugin) perché
// iniziano con `!`, quindi sono un marker affidabile anche nel bundle minificato.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, symlinkSync, unlinkSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const webpackBin = path.resolve(rootDir, 'demo/node_modules/.bin/webpack');
const configPath = path.resolve(__dirname, './webpack.config.mjs');
const demoNodeModules = path.resolve(rootDir, 'demo/node_modules');

// dev-tools/starter-kit non ha un proprio node_modules (è solo un template,
// vedi starter-install.sh): senza un node_modules raggiungibile risalendo da
// dev-tools/starter-kit/webpack-modules/css-rules.mjs, i suoi `import` bare
// (mini-css-extract-plugin, ecc.) falliscono. Lo stesso vale per il nostro
// webpack.config.mjs in questa cartella. Creiamo qui i symlink verso
// demo/node_modules (già installato) solo per la durata del test.
const TEMP_SYMLINKS = [
  path.resolve(rootDir, 'dev-tools/node_modules'),
  path.resolve(__dirname, 'node_modules'),
];

function createTempSymlinks() {
  for (const link of TEMP_SYMLINKS) {
    if (!existsSync(link)) {
      symlinkSync(demoNodeModules, link, 'dir');
    }
  }
}

function removeTempSymlinks() {
  for (const link of TEMP_SYMLINKS) {
    try {
      unlinkSync(link);
    } catch {
      // già assente: niente da fare
    }
  }
}

const MARKERS = {
  modalPopup: '/*! minimo - Modal Popup */',
  snackbar: '/*! minimo - Snackbar */',
  slideToggle: '/*! minimo - Slide Up/Down Toggle */',
};

function build(variant, sideEffectsFix) {
  console.log(`\n--- build variante "${variant}" (SIDE_EFFECTS_FIX=${sideEffectsFix ? '1' : '0'}) ---`);
  execFileSync(webpackBin, ['--config', configPath], {
    cwd: __dirname,
    env: {
      ...process.env,
      SIDE_EFFECTS_FIX: sideEffectsFix ? '1' : '0',
      VARIANT: variant,
    },
    stdio: 'inherit',
  });

  const cssPath = path.resolve(__dirname, `./dist/${variant}/bundle.css`);
  if (!existsSync(cssPath)) {
    throw new Error(`${cssPath} non generato: la build non ha prodotto CSS`);
  }
  return readFileSync(cssPath, 'utf-8');
}

function check(variant, css) {
  const hasModalPopup = css.includes(MARKERS.modalPopup);
  const hasSnackbar = css.includes(MARKERS.snackbar);
  const hasSlideToggle = css.includes(MARKERS.slideToggle);

  const results = [
    { label: 'modal-popup incluso (atteso: sì, è l\'unico componente importato)', pass: hasModalPopup },
    { label: 'snackbar escluso (atteso: sì, mai importato)', pass: !hasSnackbar },
    { label: 'slide-up-down-toggle escluso (atteso: sì, mai importato)', pass: !hasSlideToggle },
  ];

  console.log(`\nRisultati variante "${variant}":`);
  for (const r of results) {
    console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.label}`);
  }

  return results.every(r => r.pass);
}

let allPass = true;

createTempSymlinks();
try {
  const baselineCss = build('baseline', false);
  allPass = check('baseline', baselineCss) && allPass;

  const fixedCss = build('fixed', true);
  allPass = check('fixed', fixedCss) && allPass;
} finally {
  removeTempSymlinks();
}

console.log('\n=================================');
if (allPass) {
  console.log('OK: in entrambe le varianti il tree-shaking dei componenti non usati funziona.');
  console.log('Aggiungere sideEffects:true alla rule .module.css NON riesuma il vecchio problema.');
} else {
  console.log('ATTENZIONE: almeno una verifica è fallita, vedi dettagli sopra.');
}
console.log('=================================\n');

process.exit(allPass ? 0 : 1);
