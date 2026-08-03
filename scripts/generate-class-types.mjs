#!/usr/bin/env node
/* eslint-disable no-console */
/* globals process */

// generate-class-types.mjs
// Scans minimo's global CSS source files and generates a TypeScript union
// type (`MinimoClass`) listing every CSS class name defined by the
// framework, for JSDoc/TS autocomplete in consuming projects.
//
// Only "global" CSS is scanned (src/**/*.css), excluding:
//   - *.module.css: CSS Modules classes are accessed through a hashed JS
//     import (`styles.className`), never typed directly by the consumer, so
//     they don't belong in this union.
//   - any path with a "TODO ..." segment: components not yet published (see
//     the "files" field in package.json and CLAUDE.md).
//
// Custom properties (--foo, including the --_foo "private" convention) are
// declarations, not part of a selector, so they are never picked up by the
// selector walk below — no extra filtering needed.
//
// Usage: node scripts/generate-class-types.mjs

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob, readFile, writeFile, mkdir } from 'node:fs/promises';
import { styleText } from 'node:util';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir    = path.resolve(__dirname, '../src');
const destFile  = path.resolve(__dirname, '../types/classes.d.ts');

// Extracts class names from a rule's selector (media queries, `:not()`/`:is()`
// nesting, and dark-mode/theme override blocks are all reached automatically
// since postcss walks rules recursively regardless of at-rule nesting).
// Pseudo-classes/elements and other selector parts are ignored: only actual
// class nodes are visited.
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
    '// Auto-generated file, do not edit manually.',
    '// Run `npm run generate:types` to regenerate.',
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
