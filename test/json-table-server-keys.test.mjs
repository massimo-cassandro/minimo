/*
  Test dei parametri di colonna `sortKeys` / `searchKeys` di json-table e degli avvisi sui parametri senza effetto.
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

globalThis.document = { baseURI: 'http://example.test/' };

const { parseCols, warnIneffectiveColParams } = await import('../src/web-components/json-table/src/parse-cols.js');
const { parseRows } = await import('../src/web-components/json-table/src/parse-rows.js');
const { buildServerUrl } = await import('../src/web-components/json-table/src/get-data.js');
const { defaults, jqDatatableModeDefaults } = await import('../src/web-components/json-table/src/defaults.js');

const dataTypes = { string: {}, euro: { sortValue: Number, searchValue: String } };
const params = { jsonUrl: '/api', serverParams: defaults.serverParams };
const jqParams = { jsonUrl: '/api', jqDatatableMode: true, serverParams: jqDatatableModeDefaults.serverParams };

const query = (urlParams, request) => new URL(buildServerUrl(urlParams, { page: 1, perPage: 25, sort: null, search: '', ...request })).searchParams;

const cols = parseCols([
  { key: 'cognome', sortKeys: ['cognome', 'nome'], searchKeys: ['nome', 'cognome'] },
  { key: 'citta' },
  { key: 'nome' },
  { key: 'note', searchable: false, searchKeys: ['riservato'] }
], dataTypes, params);

test('parseCols: sortKeys/searchKeys devono essere array di stringhe non vuoti', () => {
  ['nome', [], [''], [1]].forEach(value => {
    assert.throws(() => parseCols([{ key: 'a', sortKeys: value }], dataTypes, params), /`sortKeys`/);
    assert.throws(() => parseCols([{ key: 'a', searchKeys: value }], dataTypes, params), /`searchKeys`/);
  });
  assert.equal(parseCols([{ key: 'a' }], dataTypes, params)[0].sortKeys, null);
});

test('buildServerUrl: sort usa sortKeys, altrimenti la key', () => {
  assert.equal(query(params, { cols, sort: { key: 'cognome', dir: 'desc' } }).get('sort'), 'cognome,nome');
  assert.equal(query(params, { cols, sort: { key: 'citta', dir: 'asc' } }).get('sort'), 'citta');
  assert.equal(query(params, { sort: { key: 'citta', dir: 'asc' } }).get('sort'), 'citta');
  assert.equal(query(params, { cols }).get('sort'), null);
});

test('buildServerUrl: searchFields è l\'unione senza duplicati delle colonne ricercabili', () => {
  assert.equal(query(params, { cols, search: 'mar' }).get('searchFields'), 'nome,cognome,citta');
});

test('buildServerUrl: searchFields omesso senza ricerca, senza searchKeys o se disattivato', () => {
  assert.equal(query(params, { cols }).get('searchFields'), null);

  const plainCols = parseCols([{ key: 'a' }], dataTypes, params);
  assert.equal(query(params, { cols: plainCols, search: 'mar' }).get('searchFields'), null);

  const noFields = { ...params, serverParams: { ...params.serverParams, searchFields: null } };
  assert.equal(query(noFields, { cols, search: 'mar' }).get('searchFields'), null);
});

test('buildServerUrl (jqDatatableMode): indice in order, sortKeys in columns[i][name]', () => {
  const result = query(jqParams, { cols, sort: { key: 'cognome', dir: 'asc' }, search: 'mar' });
  assert.equal(result.get('order[0][column]'), '0');
  assert.equal(result.get('columns[0][name]'), 'cognome,nome');
  assert.equal(result.get('columns[1][name]'), 'citta');
  assert.equal(result.get('searchFields'), 'nome,cognome,citta');
});

test('parseRows: in server-side non calcola sortValue/searchValue', () => {
  let calls = 0;
  const countedCols = parseCols([{ key: 'a', sortValue: () => ++calls, searchValue: () => ++calls }], dataTypes, params);

  const rows = [{ a: 1 }];
  assert.deepEqual(parseRows(rows, countedCols, { serverSide: true }), [{ idx: 0, row: rows[0], sortValues: {}, searchText: '' }]);
  assert.equal(calls, 0);

  parseRows(rows, countedCols, { serverSide: false });
  assert.equal(calls, 2);
});

test('warnIneffectiveColParams: sortValue/searchValue in server-side', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  warnIneffectiveColParams(parseCols([
    { key: 'both', sortValue: () => 1, searchValue: () => 1 },
    { key: 'off', sortable: false, searchable: false, sortValue: 1, searchValue: 1 },
    { key: 'type', dataType: 'euro' },
    { key: 'keys', sortKeys: ['a'] }
  ], dataTypes, params), true);

  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /`both`.*`sortValue` e `searchValue`.*`sortKeys`/);
});

test('warnIneffectiveColParams: sortKeys/searchKeys in client-side', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  warnIneffectiveColParams(parseCols([
    { key: 'keys', sortKeys: ['a'], searchKeys: ['b'] },
    { key: 'values', sortValue: () => 1, searchValue: () => 1 }
  ], dataTypes, params), false);

  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /`keys`.*`sortKeys` e `searchKeys`.*client-side/);
});
