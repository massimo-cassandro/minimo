#!/usr/bin/env node
/* eslint-disable no-console */
/* globals process */

/*
  generate-class-types.mjs
  Analizza i file CSS globali di minimo e genera un tipo union TypeScript
  (`MinimoClass`) che elenca ogni nome di classe CSS definito dal
  framework, per l'autocomplete JSDoc/TS nei progetti che lo usano.

  Viene analizzato solo il CSS "globale" (tutti i file .css sotto src/), escludendo:
    - i *.module.css: le classi dei CSS Modules sono accessibili tramite un import JS
      con hash (`styles.className`), mai tipizzate direttamente dal consumer, quindi
      non appartengono a questa union.
    - qualsiasi percorso con un segmento "TODO ...": componenti non ancora pubblicati (vedi
      il campo "files" in package.json e CLAUDE.md).

  Le custom properties (--foo, inclusa la convenzione "privata" --_foo) sono
  dichiarazioni, non parte di un selettore, quindi non vengono mai intercettate
  dalla scansione dei selettori qui sotto — non serve alcun filtro aggiuntivo.

  Utilizzo: node scripts/generate-class-types.mjs
*/

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob, readFile, writeFile, mkdir } from 'node:fs/promises';
import { styleText } from 'node:util';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir    = path.resolve(__dirname, '../src');
const destFile  = path.resolve(__dirname, '../types/classes.d.ts');

/*
  Estrae i nomi di classe dal selettore di una regola (media query, annidamento
  `:not()`/`:is()` e blocchi di override dark-mode/tema vengono raggiunti tutti automaticamente
  perché postcss visita le regole in modo ricorsivo indipendentemente dall'annidamento delle at-rule).
  Pseudo-classi/elementi e altre parti del selettore vengono ignorati: vengono visitati solo
  i veri nodi class.
*/
const extractClasses = (selector) => {
  const classes = [];
  selectorParser((selectors) => {
    selectors.walkClasses((node) => classes.push(node.value));
  }).processSync(selector);
  return classes;
};

async function collectClassNames() {
  const classSet = new Set();

  for await (const entry of glob(path.join(srcDir, '**/*.css'))) {
    if (entry.endsWith('.module.css')) continue;
    if (entry.split(path.sep).some((segment) => segment.startsWith('TODO '))) continue;

    const css  = await readFile(entry, 'utf8');
    const root = postcss.parse(css, { from: entry });

    root.walkRules((rule) => {
      for (const className of extractClasses(rule.selector)) {
        classSet.add(className);
      }
    });
  }

  return classSet;
}

async function run() {
  const classSet = await collectClassNames();

  if (classSet.size === 0) {
    console.error(styleText(['red'],
      '[generate-class-types] Error: no CSS class found in src/**/*.css — aborting, not writing an empty file.'
    ));
    process.exit(1);
  }

  const classNames = [...classSet].sort((a, b) => a.localeCompare(b, 'en'));

  const content = [
    '// File generato automaticamente, non modificare a mano.',
    '// Eseguire `npm run generate:types` per rigenerarlo.',
    '',
    'export type MinimoClass =',
    ...classNames.map((name) => `  | '${name}'`),
  ].join('\n') + ';\n';

  await mkdir(path.dirname(destFile), { recursive: true });
  await writeFile(destFile, content, 'utf8');

  console.log(styleText(['green'],
    `[generate-class-types] ${classNames.length} classes written to ${path.relative(process.cwd(), destFile)}`
  ));
}

run();
