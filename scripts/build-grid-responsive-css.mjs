#!/usr/bin/env node
/* eslint-disable no-console */

/*
  build-grid-responsive-css.mjs
  Genera il file `src/css/grid-responsive.css`: per ogni breakpoint definito in `media`
  crea un blocco @media annidato in `.grid` con:
    - le classi `.grid-{media}-{n}`  → imposta il numero di colonne (`--_cols: n`)
    - le classi `> .span-{media}-{n}` → occupa n colonne (`grid-column-end: span n`)

  es: `.grid.grid-md-3 { --_cols: 3; }` e `.grid > .span-md-2 { grid-column-end: span 2; }`

  utilizzo: `node scripts/build-grid-responsive-css.mjs`
*/

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import { writeFile } from 'node:fs/promises';
import stylelint from 'stylelint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── parametri ─────────────────────────────────────────────────────────────

const target_file = '../src/css/grid-responsive.css';

// breakpoint: la chiave è il suffisso usato nel nome della classe (es. `.grid-md-3`),
// il valore è il nome della custom media definita in src/custom-media.css
const media = {
  // sm: '--media-small-viewport-up',
  md: '--media-medium-viewport-up',
  lg: '--media-large-viewport-up',
  xl: '--media-xlarge-viewport-up',
  xxl: '--media-xxlarge-viewport-up',
};

// numero di colonne della griglia: genera `.grid-{media}-{min}` … `.grid-{media}-{max}`
const grid = { min: 2, max: 10 };

// span delle celle: genera `.span-{media}-{min}` … `.span-{media}-{max}`
const span = { min: 2, max: 6 };

const stylelintConfigPath = path.resolve(__dirname, '../stylelint.config.mjs');

// ── helpers ───────────────────────────────────────────────────────────────

const range = ({ min, max }) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

const fileHeader =
  '/* FILE GENERATO AUTOMATICAMENTE — non modificare.\n' +
  '   Generato da `node scripts/build-grid-responsive-css.mjs` */\n\n';

function buildCss() {
  let out = '.grid {\n';

  for (const [mediaKey, mediaVar] of Object.entries(media)) {
    out += `\n  @media (${mediaVar}) {\n`;

    for (const n of range(grid)) {
      out += `    &.grid-${mediaKey}-${n} {\n      --_cols: ${n};\n    }\n`;
    }

    out += '\n';

    for (const n of range(span)) {
      out += `    > .span-${mediaKey}-${n} {\n      grid-column-end: span ${n};\n    }\n`;
    }

    out += '  }\n';
  }

  out += '}\n';

  return fileHeader + out;
}

// ── build ─────────────────────────────────────────────────────────────────

const dest = path.resolve(__dirname, target_file);
await writeFile(dest, buildCss());

const stylelintConfig = await import(stylelintConfigPath).then((m) => m.default);

await stylelint.lint({
  config: stylelintConfig,
  files: [dest],
  fix: true,
});

// ── log ───────────────────────────────────────────────────────────────────

const short = (p) => p.replace(path.resolve(__dirname, '..') + path.sep, '');
const mediaCount = Object.keys(media).length;

console.log(styleText(['yellow'], `[build-grid-responsive-css] dest file : ${short(dest)}`));
console.log(styleText(['green'],
  `[build-grid-responsive-css] ${mediaCount} breakpoint × (${range(grid).length} grid + ${range(span).length} span)`
));
console.log(styleText(['green'], '**** DONE ****'));
