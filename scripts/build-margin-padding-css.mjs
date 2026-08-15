#!/usr/bin/env node
/* eslint-disable no-console */

// build-margin-padding-css.mjs
// Generates 4 files from a single `classes` map:
//   - margin-padding.css                 minimo naming,    no breakpoints
//   - margin-padding-media.css           minimo naming,    one @media block per breakpoint
//   - margin-padding-bootstrap.css       Bootstrap naming, no breakpoints
//   - margin-padding-bootstrap-media.css Bootstrap naming, one @media block per breakpoint
// es: `.mbs { margin-block-start: var(--size-base) !important; }`
// es (bootstrap naming): `.mt { margin-block-start: var(--size-base) !important; }`
//
// Each file is the cross product of `classes` x `sizes` (optionally x `media`).
// Only the class prefixes differ between the minimo/Bootstrap variants: the
// size scale and breakpoints are the same (minimo's own scale is used even in
// the Bootstrap-named files, since Bootstrap's numeric 0-5/auto scale has no
// equivalent here).

// TODO potrebbe essere sostituito da future funzionalità native del CSS?

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import { writeFile } from 'node:fs/promises';
import stylelint from 'stylelint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const addLayer = false; // true to add `@layer` rule

const target_file            = '../src/css/margin-padding.css',
  target_file_media           = '../src/css/margin-padding-media.css',
  target_bs_file              = '../src/css/margin-padding-bootstrap.css',
  target_bs_file_media        = '../src/css/margin-padding-bootstrap-media.css';

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
  'base'  : '--size-base', // NB: no suffix in class name
  'lg'    : '--size-lg',
  'md'    : '--size-md',
  'sm'    : '--size-sm',
  'xl'    : '--size-xl',
  'xs'    : '--size-xs',
  'xxs'   : '--size-xxs',
};

// classes and properties. Key is the minimo class prefix, `bs` is the
// equivalent Bootstrap class prefix (used for the *-bootstrap.css files)
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

// keys are used verbatim as the class name suffix (see `responsiveClassName`)
// — kept short and semantic (rather than xl/lg/md/sm) so they don't collide
// with the `sizes` scale suffixes (e.g. `.mbs-lg-dsk`, not `.mbs-lg-vw-lg`)
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

// [prefix, property] pairs, using either the minimo or the Bootstrap prefix
const minimoEntries = Object.entries(classes).map(([key, def]) => [key, def.property]);
const bsEntries = Object.values(classes).map((def) => [def.bs, def.property]);

// sizes values are either a literal ('0', 'auto') or a custom property name
// ('--size-lg'), to be wrapped in var()
const sizeValue = (raw) => (raw.startsWith('--') ? `var(${raw})` : raw);

// NB: the 'base' size has no suffix in the class name
const className = (prefix, sizeKey) => (sizeKey === 'base' ? prefix : `${prefix}-${sizeKey}`);

const responsiveClassName = (prefix, sizeKey, mediaKey) =>
  sizeKey === 'base' ? `${prefix}-${mediaKey}` : `${prefix}-${sizeKey}-${mediaKey}`;

const rule = (selector, property, value, indent = '') =>
  `${indent}.${selector} {\n${indent}  ${property}: ${sizeValue(value)};\n${indent}}\n`;

// 'auto' is a valid value for `margin*` properties but not for `padding*`
// (invalid CSS — must not be generated)
const sizeKeysFor = (property) =>
  property.startsWith('padding')
    ? Object.entries(sizes).filter(([sizeKey]) => sizeKey !== 'auto')
    : Object.entries(sizes);

// comments are kept outside `@layer utilities` on purpose: they document the
// file, they're not part of the cascade
const fileHeader = (notes) =>
  '/* stylelint-disable selector-class-pattern */\n\n' +
  '/* AUTO-GENERATED FILE — do not edit by hand.\n' +
  '   Generated by `node scripts/build-margin-padding-css.mjs`.\n' +
  '   Edit the `sizes` / `classes` / `media` maps there instead.\n\n' +
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

const files = [
  {
    dest: path.resolve(__dirname, target_file),
    content: buildPlainCss(minimoEntries, fileHeader([
      `Responsive variants live in \`${path.basename(target_file_media)}\`.`,
    ])),
  },
  {
    dest: path.resolve(__dirname, target_file_media),
    content: buildMediaCss(minimoEntries, fileHeader([
      `Responsive companion of \`${path.basename(target_file)}\`, one @media block per breakpoint.`,
    ])),
  },
  {
    dest: path.resolve(__dirname, target_bs_file),
    content: buildPlainCss(bsEntries, fileHeader([
      `Same rules as \`${path.basename(target_file)}\`, but using Bootstrap-style class names`,
      '(m/mt/mb/mx/ms/me/p/pt/pb/px/ps/pe...) to ease the transition to \'minimo\'.',
      `Responsive variants live in \`${path.basename(target_bs_file_media)}\`.`,
    ])),
  },
  {
    dest: path.resolve(__dirname, target_bs_file_media),
    content: buildMediaCss(bsEntries, fileHeader([
      `Same rules as \`${path.basename(target_file_media)}\`, but using Bootstrap-style class names`,
      '(m/mt/mb/mx/ms/me/p/pt/pb/px/ps/pe...) to ease the transition to \'minimo\'.',
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
  `[build-margin-padding-css] ${plainRulesCount} plain rules + ${mediaRulesCount} responsive rules per naming variant`
));
console.log(styleText(['green'], '**** DONE ****'));
