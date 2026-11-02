/*
  Test dei parametri `sortKeys`, `searchKeys` e `searchFields` di json-table e degli avvisi sui parametri senza effetto.
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
globalThis.HTMLElement = class {};
globalThis.customElements = { define: () => {}, get: () => undefined };

const { parseCols, warnIneffectiveColParams } = await import('../src/web-components/json-table/src/parse-cols.js');
const { parseRows } = await import('../src/web-components/json-table/src/parse-rows.js');
const { buildServerUrl } = await import('../src/web-components/json-table/src/get-data.js');
const { defaults, jqDatatableModeDefaults } = await import('../src/web-components/json-table/src/defaults.js');
const { JsonTable } = await import('../src/web-components/json-table/json-table-component.js');

const dataTypes = { string: {}, euro: { sortValue: Number, searchValue: String } };
const params = { jsonUrl: '/api', serverSide: true, serverParams: defaults.serverParams };
const jqParams = {
  jsonUrl: '/api',
  jqDatatableMode: true,
  serverSide: true,
  searchFields: ['extra'],
  serverParams: { ...defaults.serverParams, ...jqDatatableModeDefaults.serverParams }
};

const query = (urlParams, request) => new URL(buildServerUrl(urlParams, { page: 1, perPage: 25, sort: null, search: '', ...request })).searchParams;
const parse = defs => parseCols(defs, dataTypes, params);
const fields = (colDefs, searchFields = null) => query({ ...params, searchFields }, { cols: parse(colDefs), search: 'mar' }).get('searchFields');

const cols = parse([
  { key: 'cognome', sortKeys: ['cognome', 'nome'], searchKeys: ['nome', 'cognome'] },
  { key: 'citta' },
  { key: 'nome' },
  { key: 'note', searchable: false, searchKeys: ['riservato'] }
]);

test('parseCols: sortKeys/searchKeys devono essere array di stringhe non vuoti', () => {
  ['nome', [], [''], [1]].forEach(value => {
    assert.throws(() => parse([{ key: 'a', sortKeys: value }]), /`sortKeys`/);
    assert.throws(() => parse([{ key: 'a', searchKeys: value }]), /`searchKeys`/);
  });
  assert.equal(parse([{ key: 'a' }])[0].sortKeys, null);
});

test('buildServerUrl: sort usa sortKeys, altrimenti la key', () => {
  assert.equal(query(params, { cols, sort: { key: 'cognome', dir: 'desc' } }).get('sort'), 'cognome,nome');
  assert.equal(query(params, { cols, sort: { key: 'citta', dir: 'asc' } }).get('sort'), 'citta');
  assert.equal(query(params, { sort: { key: 'citta', dir: 'asc' } }).get('sort'), 'citta');
  assert.equal(query(params, { cols }).get('sort'), null);
});

test('searchFields: senza parametro invia le colonne ricercabili, con searchKeys al posto della key', () => {
  assert.equal(fields([{ key: 'a' }, { key: 'b' }, { key: 'c', searchable: false }]), 'a,b');
  assert.equal(query(params, { cols, search: 'mar' }).get('searchFields'), 'nome,cognome,citta');
});

test('searchFields: si aggiunge alle colonne ricercabili', () => {
  assert.equal(fields([{ key: 'codice' }], ['clienti.nome', 'comuni.nome']), 'codice,clienti.nome,comuni.nome');
  assert.equal(fields([{ key: 'a', searchKeys: ['b'] }], ['c']), 'b,c');
});

test('searchFields: campo già presente come key non viene duplicato', () => {
  assert.equal(fields([{ key: 'cognome' }, { key: 'citta' }], ['cognome']), 'cognome,citta');
});

test('searchFields: la forma tabella.campo prevale sul nome semplice', () => {
  assert.equal(fields([{ key: 'cognome' }, { key: 'citta' }], ['clienti.cognome']), 'citta,clienti.cognome');
  assert.equal(fields([{ key: 'nome' }], ['clienti.nome', 'comuni.nome']), 'clienti.nome,comuni.nome');
  assert.equal(fields([{ key: 'a', searchKeys: ['clienti.nome'] }], ['nome']), 'clienti.nome');
  // suffisso senza punto: campi diversi
  assert.equal(fields([{ key: 'nome' }], ['clienti.cognome']), 'nome,clienti.cognome');
});

test('searchFields: vale anche per una colonna con searchable false', () => {
  assert.equal(fields([{ key: 'cognome', searchable: false }, { key: 'citta' }], ['cognome']), 'citta,cognome');
});

test('searchFields: omesso senza ricerca o se disattivato', () => {
  assert.equal(query(params, { cols }).get('searchFields'), null);

  const noFields = { ...params, serverParams: { ...params.serverParams, searchFields: null } };
  assert.equal(query(noFields, { cols, search: 'mar' }).get('searchFields'), null);
});

test('jqDatatableMode: nessun parametro nuovo, invariato il formato', () => {
  const result = query(jqParams, { cols, sort: { key: 'cognome', dir: 'asc' }, search: 'mar' });
  assert.equal(result.get('order[0][column]'), '0');
  assert.equal(result.get('columns[0][name]'), 'cognome');
  assert.equal(result.get('search[value]'), 'mar');
  assert.equal(result.get('searchFields'), null);
});

test('_validateParams: searchFields non valido o senza effetto viene azzerato con un avviso', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  const validate = overrides => {
    const validated = { ...params, perPage: 25, paginationDelta: 2, ...overrides };
    JsonTable.prototype._validateParams(validated);
    return validated.searchFields;
  };

  assert.deepEqual(validate({ searchFields: ['a.b'] }), ['a.b']);
  assert.equal(warn.mock.callCount(), 0);

  assert.equal(validate({ searchFields: 'a,b' }), null);
  assert.equal(validate({ searchFields: [''] }), null);
  assert.equal(validate({ searchFields: ['a'], serverSide: false }), null);
  assert.equal(validate({ searchFields: ['a'], jqDatatableMode: true }), null);
  assert.equal(warn.mock.callCount(), 4);
});

test('parseRows: in server-side non calcola sortValue/searchValue', () => {
  let calls = 0;
  const countedCols = parse([{ key: 'a', sortValue: () => ++calls, searchValue: () => ++calls }]);

  const rows = [{ a: 1 }];
  assert.deepEqual(parseRows(rows, countedCols, { serverSide: true }), [{ idx: 0, row: rows[0], sortValues: {}, searchText: '' }]);
  assert.equal(calls, 0);

  parseRows(rows, countedCols, { serverSide: false });
  assert.equal(calls, 2);
});

test('warnIneffectiveColParams: sortValue/searchValue in server-side', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  warnIneffectiveColParams(parse([
    { key: 'both', sortValue: () => 1, searchValue: () => 1 },
    { key: 'off', sortable: false, searchable: false, sortValue: 1, searchValue: 1 },
    { key: 'type', dataType: 'euro' },
    { key: 'keys', sortKeys: ['a'] }
  ]), { serverSide: true });

  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /`both`.*`sortValue`, `searchValue` non hanno effetto.*`searchFields`/);
});

test('warnIneffectiveColParams: parse su colonna ordinabile in server-side', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  const parseCol = row => row.a;
  const colDefs = [
    { key: 'calc', parse: parseCol },
    { key: 'keys', parse: parseCol, sortKeys: ['a'] },
    { key: 'off', parse: parseCol, sortable: false },
    { key: 'plain' }
  ];

  warnIneffectiveColParams(parse(colDefs), { serverSide: true });
  assert.equal(warn.mock.callCount(), 0);

  warnIneffectiveColParams(parse(colDefs), { serverSide: true, debug: true });
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /`calc`.*`parse`.*`sortKeys`.*`sortable: false`/);

  warn.mock.resetCalls();
  warnIneffectiveColParams(parse(colDefs.filter(col => col.key !== 'keys')), { serverSide: false, debug: true });
  assert.equal(warn.mock.callCount(), 0);

  warnIneffectiveColParams(parse([{ key: 'keys', parse: parseCol, sortKeys: ['a'] }]), { serverSide: true, jqDatatableMode: true, debug: true });
  assert.equal(warn.mock.callCount(), 2);
  assert.match(warn.mock.calls[1].arguments[0], /`keys`.*`parse`.*gestire la colonna sul server/);
});

test('warnIneffectiveColParams: sortKeys/searchKeys in client-side', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  warnIneffectiveColParams(parse([
    { key: 'keys', sortKeys: ['a'], searchKeys: ['b'] },
    { key: 'values', sortValue: () => 1, searchValue: () => 1 }
  ]), { serverSide: false });

  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /`keys`.*`sortKeys`, `searchKeys`.*client-side/);
});

test('warnIneffectiveColParams: con jqDatatableMode segnala anche sortKeys/searchKeys', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  warnIneffectiveColParams(parse([{ key: 'keys', sortKeys: ['a'], searchKeys: ['b'] }]), { serverSide: true, jqDatatableMode: true });

  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /`sortKeys`, `searchKeys` non hanno effetto con `jqDatatableMode`$/);
});
