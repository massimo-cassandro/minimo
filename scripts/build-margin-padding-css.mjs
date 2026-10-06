#!/usr/bin/env node
/* eslint-disable no-console */

/*
  build-margin-padding-css.mjs
  Genera 2 file a partire da un'unica mappa `classes`:
    - margin-padding.css        senza breakpoint
    - margin-padding-media.css  un blocco @media per ogni breakpoint
  Per default le classi usano la nomenclatura di minimo. Con il flag `--bs` gli stessi
  file (stessi nomi) vengono generati con la nomenclatura di Bootstrap.
  es: `.mbs { margin-block-start: var(--size-base) !important; }`
  es (nomenclatura bootstrap): `.mt { margin-block-start: var(--size-base) !important; }`

  utilizzo: `node scripts/build-margin-padding-css.mjs [--bs]`

  Ogni file è il prodotto cartesiano di `classes` x `sizes` (eventualmente x `media`).
  Tra le varianti minimo/Bootstrap cambiano solo i prefissi delle classi: la
  scala delle dimensioni e i breakpoint sono gli stessi (la scala di minimo viene usata anche con
  la nomenclatura Bootstrap, dato che la scala numerica 0-5/auto di Bootstrap non ha
  equivalenti qui).
*/

// TODO potrebbe essere sostituito da future funzionalità native del CSS?

// TODO il naming delle classi bootstrap (--bs) è sbagliato: Bootstrap non usa
// i suffissi sm, xl ecc. per queste classi ma i numeri 1, 2, 3... (es. `.mt-3`).
// Va creata una mappa di conversione dalla scala `sizes` a quella numerica di
// Bootstrap. Da fare in futuro.

import * as path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import { writeFile } from 'node:fs/promises';
import stylelint from 'stylelint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const addLayer = false; // true per aggiungere la regola `@layer`

const buildBootstrap = process.argv.includes('--bs'); // usa la nomenclatura delle classi di Bootstrap (stessi file di destinazione)

const target_file            = '../src/css/margin-padding.css',
  target_file_media           = '../src/css/margin-padding-media.css';

const stylelintConfigPath = path.resolve(__dirname, '../stylelint.config.mjs');

/*

sizes custom properties

--size-2xl
--size-3xl
--size-base
--size-lg
--size-md
--size-sm
--size-xl
--size-xs
--size-xxs
*/

const sizes = {
  '0'     : '0',
  'auto'  : 'auto',
  '3xl'   : '--size-3xl',
  '2xl'   : '--size-2xl',
  'base'  : '--size-base', // NB: nessun suffisso nel nome della classe
  'lg'    : '--size-lg',
  'md'    : '--size-md',
  'sm'    : '--size-sm',
  'xl'    : '--size-xl',
  'xs'    : '--size-xs',
  'xxs'   : '--size-xxs',
};

// classi e proprietà. La chiave è il prefisso della classe di minimo, `bs` è il
// prefisso equivalente della classe Bootstrap (usato per i file *-bootstrap.css)
const classes = {
  m   : {
    property: 'margin',
    bs: 'm',
  },
  mb  : {
    property: 'margin-block',
    bs: 'my',
  },
  mbs : {
    property: 'margin-block-start',
    bs: 'mt',
  },
  mbe : {
    property: 'margin-block-end',
    bs: 'mb',
  },
  mi  : {
    property: 'margin-inline',
    bs: 'mx',
  },
  mis : {
    property: 'margin-inline-start',
    bs: 'ms',
  },
  mie : {
    property: 'margin-inline-end',
    bs: 'me',
  },
  p   : {
    property: 'padding',
    bs: 'p',
  },
  pb  : {
    property: 'padding-block',
    bs: 'py',
  },
  pbs : {
    property: 'padding-block-start',
    bs: 'pt',
  },
  pbe : {
    property: 'padding-block-end',
    bs: 'pb',
  },
  pi  : {
    property: 'padding-inline',
    bs: 'px',
  },
  pis : {
    property: 'padding-inline-start',
    bs: 'ps',
  },
  pie : {
    property: 'padding-inline-end',
    bs: 'pe',
  },
};

/*
  le chiavi vengono usate così come sono come suffisso del nome della classe (vedi `responsiveClassName`)
  — brevi e semantiche (invece di xl/lg/md/sm) per non collidere
  con i suffissi della scala `sizes` (ad es. `.mbs-lg-dsk`, non `.mbs-lg-vw-lg`)
*/
//
// TODO queste chiavi sono un workaround locale, non legate ai nomi --media-*
// in src/custom-media.css (che usano ancora il vocabolario xxlarge/xlarge/
// large/medium/small in collisione con `sizes`). Vedi il TODO in quel file:
// una rinomina site-wide è stata scartata per ora (breaking change su molti
// file consumer + template personalizzabile dall'utente), quindi questa
// mappa va tenuta sincronizzata a mano se i breakpoint in custom-media.css
// dovessero cambiare.
const media = {
  dsk: '--media-xlarge-viewport-up', // desktop
  lap: '--media-large-viewport-up',  // laptop / small desktop
  tab: '--media-medium-viewport-up', // tablet
  mob: '--media-small-viewport-up',  // mobile / phone
};

// ── helpers ───────────────────────────────────────────────────────────────

// coppie [prefisso, proprietà], che usano il prefisso di minimo o quello di Bootstrap
const minimoEntries = Object.entries(classes).map(([key, def]) => [key, def.property]);
const bsEntries = Object.values(classes).map((def) => [def.bs, def.property]);

// i valori di sizes sono un letterale ('0', 'auto') oppure il nome di una custom property
// ('--size-lg'), da racchiudere in var()
const sizeValue = (raw) => (raw.startsWith('--') ? `var(${raw})` : raw);

// NB: la dimensione 'base' non ha suffisso nel nome della classe
const className = (prefix, sizeKey) => (sizeKey === 'base' ? prefix : `${prefix}-${sizeKey}`);

const responsiveClassName = (prefix, sizeKey, mediaKey) =>
  sizeKey === 'base' ? `${prefix}-${mediaKey}` : `${prefix}-${sizeKey}-${mediaKey}`;

const rule = (selector, property, value, indent = '') =>
  `${indent}.${selector} {\n${indent}  ${property}: ${sizeValue(value)};\n${indent}}\n`;

// 'auto' è un valore valido per le proprietà `margin*` ma non per `padding*`
// (CSS non valido — non deve essere generato)
const sizeKeysFor = (property) =>
  property.startsWith('padding')
    ? Object.entries(sizes).filter(([sizeKey]) => sizeKey !== 'auto')
    : Object.entries(sizes);

// i commenti restano volutamente fuori da `@layer utilities`: documentano il
// file, non fanno parte della cascata
const fileHeader = (notes) =>
  '/* stylelint-disable selector-class-pattern */\n\n' +
  '/* FILE GENERATO AUTOMATICAMENTE — non modificare a mano.\n' +
  '   Generato da `node scripts/build-margin-padding-css.mjs`.\n' +
  '   Modificare invece le mappe `sizes` / `classes` / `media` dello script.\n\n' +
  notes.map((n) => `   ${n}`).join('\n') +
  ' */\n\n';

function buildPlainCss(entries, header) {
  let out = '';

  for (const [prefix, property] of entries) {
    for (const [sizeKey, sizeRaw] of sizeKeysFor(property)) {
      out += rule(className(prefix, sizeKey), property, sizeRaw);
    }
    out += '\n';
  }

  return addLayer
    ? header + `@layer utilities {\n\n${out.trimEnd()}\n\n}\n`
    : header + '\n' + out.trimEnd() + '\n'
  ;
}

function buildMediaCss(entries, header) {
  let out = '';

  for (const [mediaKey, mediaVar] of Object.entries(media)) {
    out += `@media (${mediaVar}) {\n\n`;
    for (const [prefix, property] of entries) {
      for (const [sizeKey, sizeRaw] of sizeKeysFor(property)) {
        out += rule(responsiveClassName(prefix, sizeKey, mediaKey), property, sizeRaw, '  ');
      }
      out += '\n';
    }
    out += '}\n\n';
  }

  return addLayer
    ? header + `@layer utilities {\n\n${out.trimEnd()}\n\n}\n`
    : header + '\n' + out.trimEnd() + '\n'
  ;
}

// ── build ─────────────────────────────────────────────────────────────────

const entries = buildBootstrap ? bsEntries : minimoEntries;
const namingNotes = buildBootstrap
  ? [
    'Bootstrap-style class names (m/mt/mb/mx/ms/me/p/pt/pb/px/ps/pe...) generated with `--bs`.',
  ]
  : [];

const files = [
  {
    dest: path.resolve(__dirname, target_file),
    content: buildPlainCss(entries, fileHeader([
      ...namingNotes,
      `Le varianti responsive sono in \`${path.basename(target_file_media)}\`.`,
    ])),
  },
  {
    dest: path.resolve(__dirname, target_file_media),
    content: buildMediaCss(entries, fileHeader([
      ...namingNotes,
      `Controparte responsive di \`${path.basename(target_file)}\`, un blocco @media per breakpoint.`,
    ])),
  },
];

for (const { dest, content } of files) {
  await writeFile(dest, content);
}

const stylelintConfig = await import(stylelintConfigPath).then((m) => m.default);

await stylelint.lint({
  config: stylelintConfig,
  files: files.map((f) => f.dest),
  fix: true,
});

// ── log ───────────────────────────────────────────────────────────────────

const short = (p) => p.replace(path.resolve(__dirname, '..') + path.sep, '');
const plainRulesCount = minimoEntries
  .map(([, property]) => sizeKeysFor(property).length)
  .reduce((sum, n) => sum + n, 0);
const mediaRulesCount = plainRulesCount * Object.keys(media).length;

for (const { dest } of files) {
  console.log(styleText(['yellow'], `[build-margin-padding-css] dest file : ${short(dest)}`));
}
console.log(styleText(['green'],
  `[build-margin-padding-css] ${plainRulesCount} plain rules + ${mediaRulesCount} responsive rules (${buildBootstrap ? 'Bootstrap' : 'minimo'} naming)`
));
console.log(styleText(['green'], '**** DONE ****'));
