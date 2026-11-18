/*
  Test del caricamento su richiesta del modulo opzionale `jqDatatableMode` di json-table
  (src/web-components/json-table/src/jq-mode-registry.js, jq-datatable-mode.js).
  Esecuzione: node --test test/

  Ogni file di test gira in un processo separato: qui il modulo parte non caricato.
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

const { getJqMode, loadJqMode } = await import('../src/web-components/json-table/src/jq-mode-registry.js');
const { resolveParams } = await import('../src/web-components/json-table/src/resolve-params.js');
const { buildServerUrl } = await import('../src/web-components/json-table/src/get-data.js');
const { defaults } = await import('../src/web-components/json-table/src/defaults.js');

/** Elemento fittizio con gli attributi indicati. */
const fakeEl = (attrs = {}) => ({ getAttribute: name => attrs[name] ?? null });

const request = { page: 1, perPage: 25, sort: [{ key: 'name', dir: 'desc' }], search: '', cols: [
  { key: 'id', searchable: true, sortable: true },
  { key: 'name', searchable: true, sortable: true }
] };


test('senza jqDatatableMode il modulo non viene caricato', () => {
  const params = resolveParams(fakeEl(), { jsonUrl: '/api', serverSide: true });
  const url = new URL(buildServerUrl(params, request));

  assert.equal(getJqMode(), null);
  assert.equal(url.searchParams.get('sort'), 'name');
  assert.equal(url.searchParams.get('draw'), null);
});

test('con jqDatatableMode e modulo non caricato: errore esplicito', () => {
  assert.throws(() => resolveParams(fakeEl({ jqDatatableMode: 'true' })), /modulo `jq-datatable-mode.js` non caricato/);
  assert.throws(
    () => buildServerUrl({ ...defaults, jsonUrl: '/api', jqDatatableMode: true }, request),
    /modulo `jq-datatable-mode.js` non caricato/
  );
});

test('loadJqMode: una sola importazione anche con chiamate contemporanee', async () => {
  const [a, b] = await Promise.all([loadJqMode(), loadJqMode()]);
  assert.ok(a);
  assert.equal(a, b);
  assert.equal(getJqMode(), a);
  assert.equal(await loadJqMode(), a);
});

test('dopo il caricamento: default di modalità e parametri di jQuery DataTables', () => {
  const params = resolveParams(fakeEl({ jqDatatableMode: 'true' }), { jsonUrl: '/api', serverParams: { search: 'q' } }, { perPage: 50 });

  assert.equal(params.serverSide, true);
  assert.equal(params.totRecField, 'recordsTotal');
  assert.equal(params.perPage, 50);
  assert.equal(params.serverParams.perPage, 'length');
  assert.equal(params.serverParams.search, 'q');

  const url = new URL(buildServerUrl(params, { ...request, search: 'mar' }));
  assert.equal(url.searchParams.get('draw'), '1');
  assert.equal(url.searchParams.get('columns[1][name]'), 'name');
  assert.equal(url.searchParams.get('columns[1][orderable]'), 'true');
  assert.equal(url.searchParams.get('order[0][column]'), '1');
  assert.equal(url.searchParams.get('order[0][dir]'), 'desc');
  assert.equal(url.searchParams.get('length'), '25');
  assert.equal(url.searchParams.get('q'), 'mar');
});

test('jqDatatableMode con perPage 0: length=-1 e start=0', () => {
  const params = resolveParams(fakeEl({ jqDatatableMode: 'true', perPage: '0' }), { jsonUrl: '/api' });
  assert.equal(params.perPage, 0);

  const url = new URL(buildServerUrl(params, { ...request, page: 1, perPage: 0 }));
  assert.equal(url.searchParams.get('length'), '-1');
  assert.equal(url.searchParams.get('start'), '0');
});

test('jqDatatableMode con perPage > 0: start calcolato dalla pagina', () => {
  const params = resolveParams(fakeEl({ jqDatatableMode: 'true' }), { jsonUrl: '/api' });
  const url = new URL(buildServerUrl(params, { ...request, page: 3, perPage: 25 }));
  assert.equal(url.searchParams.get('length'), '25');
  assert.equal(url.searchParams.get('start'), '50');
});

test('senza jqDatatableMode perPage 0 resta invariato', () => {
  const params = resolveParams(fakeEl(), { jsonUrl: '/api', serverSide: true });
  const url = new URL(buildServerUrl(params, { ...request, page: 1, perPage: 0 }));
  assert.equal(url.searchParams.get('perPage'), '0');
  assert.equal(url.searchParams.get('start'), '0');
});

test('l\'import statico registra il modulo (precaricamento)', async () => {
  const mod = await import('../src/web-components/json-table/src/jq-datatable-mode.js');
  assert.equal(getJqMode().defaults, mod.jqDatatableModeDefaults);
});
