/*
  Test del parametro di colonna `rowspan` di json-table (analisi di colonne e righe).
  Esecuzione: node --test test/

  CSS e SVG, gestiti da webpack nei progetti, vengono sostituiti con moduli vuoti.
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  resolve: (specifier, context, next) => (/\.svg(\?|$)/.test(specifier)
    ? { url: 'stub:svg', shortCircuit: true }
    : next(specifier, context)),
  load: (url, context, next) => (url === 'stub:svg' || url.endsWith('.css')
    ? { format: 'module', source: 'export default "";', shortCircuit: true }
    : next(url, context))
});

const { parseCols } = await import('../src/web-components/json-table/src/parse-cols.js');
const { parseRows } = await import('../src/web-components/json-table/src/parse-rows.js');
const { cellContent, tfootContent } = await import('../src/web-components/json-table/src/cell-content.js');

const dataTypes = { string: {}, num: { sortValue: Number } };
const params = { renderNullAs: '—', locale: 'it-IT' };

const cols = parseCols([
  { key: 'key1', rowspan: 3 },
  { key: 'key2', rowspan: row => row.key3.length },
  { key: 'key3' }
], dataTypes, params);

const row = { key1: 'aaa', key2: 'bbb', key3: ['riga1', 'riga2'] };

test('parseCols: errore se tutte le colonne visibili hanno rowspan', () => {
  assert.throws(() => parseCols([
    { key: 'a', rowspan: 2 },
    { key: 'b', condition: false }
  ], dataTypes, params), /rowspan/);
});

test('parseCols: render stringa ammesso solo sulle colonne con rowspan', () => {
  assert.throws(() => parseCols([
    { key: 'a', rowspan: 2 },
    { key: 'b', render: '[[b]]' }
  ], dataTypes, params), /`b`.*funzione/);

  assert.doesNotThrow(() => parseCols([
    { key: 'a', rowspan: 2, render: '<b>[[a]]</b>' },
    { key: 'b' }
  ], dataTypes, params));

  assert.doesNotThrow(() => parseCols([{ key: 'a', render: '[[a]]' }], dataTypes, params));
});

test('parseCols: _subRows solo sulle colonne senza rowspan di tabelle con rowspan', () => {
  assert.deepEqual(cols.map(col => col._subRows), [false, false, true]);
  assert.equal(parseCols([{ key: 'a' }], dataTypes, params)[0]._subRows, false);
});

test('cellContent: elemento dell\'array per ogni tr, null per quelli mancanti', () => {
  assert.equal(cellContent(cols[2], row, params, undefined, undefined, 1), 'riga2');
  assert.equal(cellContent(cols[2], row, params, undefined, undefined, 2), '—');
});

test('cellContent: render riceve subIdx', () => {
  const [, col] = parseCols([
    { key: 'a', rowspan: 2 },
    { key: 'b', render: (_row, _tr, _td, subIdx) => `tr ${subIdx}` }
  ], dataTypes, params);
  assert.equal(cellContent(col, {}, params, undefined, undefined, 1), 'tr 1');
});

test('cellContent: array invariato senza colonne con rowspan', () => {
  const [col] = parseCols([{ key: 'a' }], dataTypes, params);
  assert.deepEqual(cellContent(col, { a: ['x', 'y'] }, params), ['x', 'y']);
});

test('parseRows: ricerca su tutti gli elementi, ordinamento sul primo', () => {
  const [parsed] = parseRows([row], cols, params);
  assert.equal(parsed.searchText, 'aaa bbb riga1 riga2');
  assert.equal(parsed.sortValues.key3, 'riga1');
});

test('tfootContent: gli aggregati considerano tutti gli elementi', () => {
  const [, col] = parseCols([
    { key: 'a', rowspan: 2 },
    { key: 'n', dataType: 'num', tfootRender: '@count' }
  ], dataTypes, params);
  assert.equal(tfootContent(col, [{ n: [1, 2] }, { n: [3] }], params), '3');
});
