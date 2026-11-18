/*
  Test delle icone bool di colonna di json-table (`boolTrueIcon` / `boolFalseIcon` / `boolNullIcon`) e delle icone
  `'@icon:nome'` del file sprite `iconFile`.
  Esecuzione: node --test test/

  Usa jsdom per i nodi delle icone; CSS e SVG, gestiti da webpack nei progetti, vengono sostituiti con moduli vuoti
  (le icone predefinite risultano quindi stringhe vuote).
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { JSDOM } from 'jsdom';

registerHooks({
  resolve: (specifier, context, next) => (/\.svg(\?|$)/.test(specifier)
    ? { url: 'stub:svg', shortCircuit: true }
    : next(specifier, context)),
  load: (url, context, next) => (url === 'stub:svg' || url.endsWith('.css')
    ? { format: 'module', source: 'export default "";', shortCircuit: true }
    : next(url, context))
});

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.DocumentFragment = dom.window.DocumentFragment;
globalThis.Node = dom.window.Node;

const { defaults } = await import('../src/web-components/json-table/src/defaults.js');
const { buildDataTypes } = await import('../src/web-components/json-table/src/data-types.js');
const { parseCols } = await import('../src/web-components/json-table/src/parse-cols.js');
const { cellContent } = await import('../src/web-components/json-table/src/cell-content.js');
const { iconContent } = await import('../src/web-components/json-table/src/icons.js');

const params = {
  ...defaults,
  boolTrueIcon: '<svg data-icon="true"></svg>',
  boolFalseIcon: '<svg data-icon="false"></svg>',
  iconFile: '/build/icons.svg'
};
const dataTypes = buildDataTypes(params);

/** Contenuto della cella come markup (i nodi vengono serializzati). */
const html = content => {
  if (content instanceof Node) {
    const box = document.createElement('div');
    box.append(content);
    return box.innerHTML;
  }
  return content;
};

const cell = (colDef, value) => {
  const [col] = parseCols([{ key: 'v', ...colDef }], dataTypes, params);
  return html(cellContent(col, { v: value }, params));
};


test('iconContent: testo semplice, markup e @icon:', () => {
  assert.equal(html(iconContent('B')), 'B');
  assert.equal(html(iconContent('<b>B</b>')), '<b>B</b>');
  assert.equal(
    html(iconContent('@icon:check text-success', '/i.svg')),
    '<svg class="icon text-success" aria-hidden="true" focusable="false"><use href="/i.svg#check"></use></svg>'
  );
});

test('iconContent: iconClass sostituisce la classe di base, null/\'\' la eliminano', () => {
  assert.match(html(iconContent('@icon:check text-success', '/i.svg', 'svg-icon')), /^<svg class="svg-icon text-success"/);
  assert.match(html(iconContent('@icon:check', '/i.svg', '')), /^<svg aria-hidden/);
  assert.match(html(iconContent('@icon:check x', '/i.svg', null)), /^<svg class="x"/);
});

test('icone bool @icon: con iconClass della tabella', () => {
  const p = { ...params, iconClass: 'svg-icon' };
  const [col] = parseCols([{ key: 'v', dataType: 'bool', boolTrueIcon: '@icon:check' }], buildDataTypes(p), p);
  assert.match(html(cellContent(col, { v: true }, p)), /^<svg class="svg-icon"/);
});

test('bool senza icone di colonna: icone della tabella e renderNullAs', () => {
  assert.equal(cell({ dataType: 'bool' }, true), '<svg data-icon="true"></svg>');
  assert.equal(cell({ dataType: 'bool' }, '0'), '<svg data-icon="false"></svg>');
  assert.equal(cell({ dataType: 'bool' }, null), '—');
  assert.equal(cell({ dataType: 'bool' }, 'abc'), '—');
});

test('bool con icone di colonna: testo, markup, @icon:', () => {
  const def = { dataType: 'bool', boolTrueIcon: 'B', boolFalseIcon: '<i>C</i>', boolNullIcon: '@icon:question' };
  assert.equal(cell(def, 1), 'B');
  assert.equal(cell(def, false), '<i>C</i>');
  assert.match(cell(def, null), /<use href="\/build\/icons.svg#question">/);
  assert.match(cell(def, 'abc'), /#question/);
});

test('bool: solo alcune icone di colonna, le altre restano quelle della tabella', () => {
  assert.equal(cell({ dataType: 'bool', boolTrueIcon: 'B' }, false), '<svg data-icon="false"></svg>');
  assert.equal(cell({ dataType: 'bool', boolTrueIcon: 'B' }, null), '—');
});

test('boolTrueOnly: usa solo boolTrueIcon della colonna, false e null restano vuoti', () => {
  const def = { dataType: 'boolTrueOnly', boolTrueIcon: 'B', boolFalseIcon: 'C', boolNullIcon: 'N' };
  assert.equal(cell(def, true), 'B');
  assert.equal(cell(def, false), '');
  assert.equal(cell(def, null), '');
});

test('icone di colonna: classi boolTrue/boolFalse invariate', () => {
  const [col] = parseCols([{ key: 'v', dataType: 'bool', boolTrueIcon: 'B' }], dataTypes, params);
  assert.equal(col._type.internalCellClass(true, {}, params), col._type.internalCellClass(1, {}, params));
});

test('icone di colonna: i parametri della colonna ereditano quelli della tabella', () => {
  const [col] = parseCols([{ key: 'v', dataType: 'bool', boolTrueIcon: 'B' }], dataTypes, params);
  assert.equal(col._params.locale, params.locale);
  assert.equal(col._params.boolTrueIcon, 'B');
  assert.equal(params.boolTrueIcon, '<svg data-icon="true"></svg>');

  const [plain] = parseCols([{ key: 'v', dataType: 'bool' }], dataTypes, params);
  assert.equal(plain._params, undefined);
});

test('boolNullIcon della tabella', () => {
  const p = { ...params, boolNullIcon: '?' };
  const [col] = parseCols([{ key: 'v', dataType: 'bool' }], buildDataTypes(p), p);
  assert.equal(html(cellContent(col, { v: null }, p)), '?');
});

test('tipi personalizzati derivati da bool: icone di colonna applicate', () => {
  const p = { ...params, dataTypes: { yesNo: { inheritsFrom: 'bool', cellClass: 'x' } } };
  const [col] = parseCols([{ key: 'v', dataType: 'yesNo', boolTrueIcon: 'S', boolNullIcon: 'N' }], buildDataTypes(p), p);
  assert.equal(html(cellContent(col, { v: true }, p)), 'S');
  assert.equal(html(cellContent(col, { v: null }, p)), 'N');
});
