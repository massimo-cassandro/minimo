/*
  Test della sintassi mustache dei `render` stringa di json-table (src/web-components/json-table/src/content-utils.js):
  escape dei valori, `[[& key]]`, sezioni `[[#key]]` / `[[^key]]`, segnaposti `[[@icon:…]]` e verifica della struttura.
  Esecuzione: node --test test/

  Usa jsdom per `setContent` e per la sostituzione dei segnaposti icona; CSS e SVG, gestiti da webpack nei progetti,
  vengono sostituiti con moduli vuoti.
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

const { resolveMustache, checkMustache, escapeHtml, isMustacheTruthy, setContent } =
  await import('../src/web-components/json-table/src/content-utils.js');
const { replaceIconPlaceholders } = await import('../src/web-components/json-table/src/icons.js');
const { parseCols } = await import('../src/web-components/json-table/src/parse-cols.js');
const { cellContent } = await import('../src/web-components/json-table/src/cell-content.js');

const XSS = '<img src=x onerror="alert(1)">';


// =>> escape

test('escapeHtml: & < > " \'', () => {
  assert.equal(escapeHtml('a & b < c > d " e \' f'), 'a &amp; b &lt; c &gt; d &quot; e &#39; f');
  assert.equal(escapeHtml(12), '12');
});

test('resolveMustache: [[key]] con escape, anche negli attributi', () => {
  assert.equal(resolveMustache('<b>[[name]]</b>', { name: XSS }), '<b>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</b>');
  assert.equal(resolveMustache('<a title="[[t]]">x</a>', { t: '" onclick="x' }), '<a title="&quot; onclick=&quot;x">x</a>');
  assert.equal(resolveMustache('[[ owner.name ]]', { owner: { name: 'Rossi & Figli' } }), 'Rossi &amp; Figli');
});

test('resolveMustache: [[& key]] inserisce il valore grezzo', () => {
  assert.equal(resolveMustache('[[& html]]', { html: '<b>ok</b>' }), '<b>ok</b>');
  assert.equal(resolveMustache('[[&html]]', { html: '<b>ok</b>' }), '<b>ok</b>');
});

test('resolveMustache: null/undefined → nullAs, senza escape', () => {
  assert.equal(resolveMustache('[[a]]|[[& b]]', { a: null }, '<i>—</i>'), '<i>—</i>|<i>—</i>');
  assert.equal(resolveMustache('[[a]]', {}), '');
});

test('setContent: con asHtml i valori con escape vengono mostrati come testo', () => {
  const td = document.createElement('td');
  setContent(td, resolveMustache('[[name]]', { name: XSS }), true);
  assert.equal(td.textContent, XSS);
  assert.equal(td.querySelector('img'), null);

  setContent(td, resolveMustache('[[name]]', { name: 'Rossi & Figli' }), true);
  assert.equal(td.textContent, 'Rossi & Figli');
});


// =>> sezioni

test('isMustacheTruthy: falsi null, undefined, false, \'\', 0, array vuoto', () => {
  [null, undefined, false, '', 0, NaN, []].forEach(v => assert.equal(isMustacheTruthy(v), false, String(v)));
  [true, 1, 'x', '0', [0], {}].forEach(v => assert.equal(isMustacheTruthy(v), true, String(v)));
});

test('resolveMustache: [[#k]] e [[^k]]', () => {
  const tpl = '[[#active]]sì[[/active]][[^active]]no[[/active]]';
  assert.equal(resolveMustache(tpl, { active: true }), 'sì');
  assert.equal(resolveMustache(tpl, { active: 0 }), 'no');
  assert.equal(resolveMustache(tpl, { active: [] }), 'no');
  assert.equal(resolveMustache(tpl, {}), 'no');
  assert.equal(resolveMustache(tpl, { active: ['a'] }), 'sì');
});

test('resolveMustache: nessuna iterazione e nessun cambio di contesto', () => {
  const row = { items: [{ name: 'a' }, { name: 'b' }], name: 'riga' };
  assert.equal(resolveMustache('[[#items]][[name]][[/items]]', row), 'riga');
});

test('resolveMustache: sezioni annidate con chiavi diverse', () => {
  const tpl = '[[#a]]A[[#b]]B[[/b]][[^b]]nb[[/b]][[/a]]-fine';
  assert.equal(resolveMustache(tpl, { a: 1, b: 1 }), 'AB-fine');
  assert.equal(resolveMustache(tpl, { a: 1, b: 0 }), 'Anb-fine');
  assert.equal(resolveMustache(tpl, { a: 0, b: 1 }), '-fine');
});

test('resolveMustache: chiave annidata nella sezione e valori dentro le sezioni', () => {
  const tpl = '[[#owner.email]]<a href="mailto:[[owner.email]]">[[owner.name]]</a>[[/owner.email]][[^owner.email]][[owner.name]][[/owner.email]]';
  assert.equal(resolveMustache(tpl, { owner: { name: 'Mario', email: 'm@x.it' } }), '<a href="mailto:m@x.it">Mario</a>');
  assert.equal(resolveMustache(tpl, { owner: { name: 'Mario', email: '' } }), 'Mario');
});

test('checkMustache: strutture corrette e sbagliate', () => {
  assert.deepEqual(checkMustache('[[#a]][[^b]]x[[/b]][[/a]] [[c]] [[& d]] [[@icon:check]]'), []);
  assert.deepEqual(checkMustache('[[#a]]x'), ['sezione `a` non chiusa']);
  assert.deepEqual(checkMustache('x[[/a]]'), ['chiusura `[[/a]]` senza sezione aperta corrispondente']);
  assert.deepEqual(checkMustache('[[#a]][[#b]]x[[/a]]'), ['sezione `b` non chiusa prima di `[[/a]]`']);
  assert.deepEqual(checkMustache('[[#a]]x[[/b]]'), [
    'chiusura `[[/b]]` senza sezione aperta corrispondente',
    'sezione `a` non chiusa'
  ]);
  assert.deepEqual(checkMustache('[[ ]]'), ['segnaposto `[[ ]]` senza chiave']);
});

test('resolveMustache: sezione non chiusa → condizione estesa fino alla fine; chiusura orfana ignorata', () => {
  assert.equal(resolveMustache('a[[#x]]b', { x: 0 }), 'a');
  assert.equal(resolveMustache('a[[/x]]b', {}), 'ab');
});

test('parseCols: avviso in console per i render stringa malformati, una volta per colonna', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  parseCols([{ key: 'a', render: '[[#a]]x' }, { key: 'b', render: '[[#b]]x[[/b]]' }], { string: {} }, {});
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /colonna `a`, `render`: sezione `a` non chiusa/);
});


// =>> icone

test('resolveMustache: [[@icon:…]] genera il segnaposto, anche nelle sezioni', () => {
  assert.equal(resolveMustache('[[@icon:check text-success]] ok', {}), '<span data-jt-icon="check text-success"></span> ok');
  assert.equal(resolveMustache('[[#a]][[@icon:check]][[/a]]', { a: false }), '');
});

test('replaceIconPlaceholders: <svg><use> costruito via DOM, con le classi', () => {
  const td = document.createElement('td');
  setContent(td, resolveMustache('[[@icon:check text-success fw-bold]] [[name]]', { name: 'x' }), true);
  replaceIconPlaceholders(td, '/build/icons.svg');

  const svg = td.querySelector('svg');
  assert.ok(svg);
  assert.equal(svg.namespaceURI, 'http://www.w3.org/2000/svg');
  assert.equal(svg.getAttribute('class'), 'icon text-success fw-bold');
  assert.equal(svg.getAttribute('aria-hidden'), 'true');
  assert.equal(svg.querySelector('use').getAttribute('href'), '/build/icons.svg#check');
  assert.equal(td.querySelector('[data-jt-icon]'), null);
  assert.equal(td.textContent, ' x');
});

test('replaceIconPlaceholders: iconClass personalizzata', () => {
  const td = document.createElement('td');
  setContent(td, resolveMustache('[[@icon:check text-success]]', {}), true);
  replaceIconPlaceholders(td, '/build/icons.svg', 'svg-icon');
  assert.equal(td.querySelector('svg').getAttribute('class'), 'svg-icon text-success');
});

test('replaceIconPlaceholders: senza iconFile i segnaposti vengono rimossi con un avviso (una sola volta)', t => {
  const warn = t.mock.method(console, 'warn', () => {});
  const td = document.createElement('td');
  setContent(td, resolveMustache('[[@icon:nofile]][[@icon:nofile]]', {}), true);
  replaceIconPlaceholders(td, null);
  assert.equal(td.innerHTML, '');
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /`iconFile`/);
});

test('cellContent: render stringa restituisce markup con escape', () => {
  const [col] = parseCols([{ key: 'name', render: '<b>[[name]]</b>' }], { string: {} }, {});
  assert.equal(cellContent(col, { name: '<i>' }, { renderNullAs: '—' }), '<b>&lt;i&gt;</b>');
});
