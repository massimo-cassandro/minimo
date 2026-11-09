/*
  Test dei builder di form-tags.js (wrapper opzionale `wrapper` / `wrapperClass`).
  Esecuzione: node --test test/
*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.DocumentFragment = dom.window.DocumentFragment;
globalThis.Node = dom.window.Node;

const { domBuilder } = await import('../src/utilities/dom-builder/dom-builder.js');
const {
  buildInput, buildSelect, buildCheckbox, buildTextarea, buildFakeField, buildButton
} = await import('../src/utilities/dom-builder-helpers/form-tags.js');

function render(items) {
  const parent = document.createElement('div');
  domBuilder(items, parent);
  return parent;
}

test('default: wrapper div.form-group', () => {
  const p = render([buildInput({ label: 'A', id: 'a' })]);
  assert.equal(p.innerHTML, '<div class="form-group"><label for="a" class="form-label">A</label><input type="text" class="form-control" id="a"></div>');
});

test('wrapperClass personalizzata sostituisce form-group', () => {
  const p = render([buildSelect({ label: 'A', id: 'a', wrapperClass: 'form-group span-2' })]);
  assert.equal(p.firstElementChild.className, 'form-group span-2');
});

test('wrapperClass null: div senza classi', () => {
  const p = render([buildTextarea({ label: 'A', id: 'a', wrapperClass: null })]);
  assert.equal(p.firstElementChild.tagName, 'DIV');
  assert.equal(p.firstElementChild.hasAttribute('class'), false);
  assert.equal(p.firstElementChild.firstElementChild.tagName, 'LABEL');
});

test('wrapper false: solo label + controllo, anche annidati in children', () => {
  const p = render([{ className: 'x', children: [buildInput({ label: 'A', id: 'a', wrapper: false, help: 'h' })] }]);
  assert.equal(p.innerHTML, '<div class="x"><label for="a" class="form-label">A</label><input type="text" class="form-control" id="a"></div>');

  const f = render([buildFakeField({ label: 'F', value: 'v', wrapper: false })]);
  assert.equal(f.children.length, 2);
  assert.equal(f.children[1].className, 'form-control-static no-border');
});

test('checkbox: wrapper false restituisce il .form-check', () => {
  const p = render([buildCheckbox({ label: 'C', id: 'c', wrapper: false })]);
  assert.equal(p.firstElementChild.className, 'form-check');
});

test('button: default senza wrapper, wrapper true con form-group', () => {
  assert.equal(render([buildButton({ content: 'B' })]).firstElementChild.tagName, 'BUTTON');
  const p = render([buildButton({ content: 'B', wrapper: true })]);
  assert.equal(p.firstElementChild.className, 'form-group');
  assert.equal(p.firstElementChild.firstElementChild.tagName, 'BUTTON');
});

test('condition false: nulla viene costruito', () => {
  const p = render([buildInput({ label: 'A', condition: false }), buildButton({ content: 'B', condition: false })]);
  assert.equal(p.innerHTML, '');
});
