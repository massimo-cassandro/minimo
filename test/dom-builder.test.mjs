// Smoke tests for the dom-builder module (dom-builder.js, parseDomString.js,
// domBuilderBasicSetup.js). Run with: node --test test/
//
// Uses jsdom (devDependency) to provide document/Element/DocumentFragment,
// since domBuilder relies on those as browser globals rather than importing them.

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
const { parseDomString } = await import('../src/utilities/dom-builder/parseDomString.js');

test('parseDomString: shorthand with tag, id, classes, attrs, content', () => {
  const parsed = parseDomString('p#main-info.info.active{data-id:123,role=button} Lorem ipsum');
  assert.equal(parsed.tag, 'p');
  assert.equal(parsed.id, 'main-info');
  assert.equal(parsed.className, 'info active');
  assert.deepEqual(parsed.attrs, { 'data-id': '123', role: 'button' });
  assert.equal(parsed.content, 'Lorem ipsum');
});

test('parseDomString: bare attribute defaults to true, tag defaults to div', () => {
  const parsed = parseDomString('input#search-field[type=text,disabled]');
  assert.equal(parsed.tag, 'input');
  assert.deepEqual(parsed.attrs, { type: 'text', disabled: true });

  const bare = parseDomString('.just-a-class');
  assert.equal(bare.tag, 'div');
  assert.equal(bare.className, 'just-a-class');
});

test('domBuilder: shorthand strings build siblings in order', () => {
  const container = document.createElement('div');
  const main = domBuilder(['#a.foo', '.b', 'p#c'], container);

  assert.equal(container.children.length, 3);
  assert.equal(container.children[0].id, 'a');
  assert.equal(container.children[1].className, 'b');
  assert.equal(container.children[2].tagName, 'P');
  assert.equal(main, container.children[0], 'returned mainElement is the first created element');
});

test('domBuilder: insertMode append batches root siblings into a single appendChild call (fix #4)', () => {
  const container = document.createElement('div');
  const originalAppendChild = container.appendChild.bind(container);
  let callCount = 0;
  container.appendChild = node => {
    callCount++;
    return originalAppendChild(node);
  };

  domBuilder(['#a.foo', '.b', 'p#c'], container);

  assert.equal(callCount, 1, 'container.appendChild should be called exactly once for 3 root siblings');
  assert.equal(container.children.length, 3);
});

test('domBuilder: object syntax with tag array nests elements, last one gets object-level props', () => {
  const container = document.createElement('div');
  const main = domBuilder([{
    tag: ['div.wrapper', 'span#inner.active'],
    attrs: { 'data-x': '1' }
  }], container);

  assert.equal(container.children.length, 1);
  const wrapper = container.firstElementChild;
  assert.equal(wrapper.tagName, 'DIV');
  assert.ok(wrapper.classList.contains('wrapper'));

  const inner = wrapper.firstElementChild;
  assert.equal(inner.tagName, 'SPAN');
  assert.equal(inner.id, 'inner');
  assert.ok(inner.classList.contains('active'));
  assert.equal(inner.getAttribute('data-x'), '1');
  assert.equal(main, inner, 'mainElement is the last (innermost) element of the tag array');
});

test('domBuilder: nested children build correctly', () => {
  const container = document.createElement('div');
  domBuilder([{
    tag: 'ul',
    children: [
      { tag: 'li', content: 'One' },
      { tag: 'li', content: 'Two' }
    ]
  }], container);

  const ul = container.firstElementChild;
  assert.equal(ul.tagName, 'UL');
  assert.equal(ul.children.length, 2);
  assert.equal(ul.children[0].textContent, 'One');
  assert.equal(ul.children[1].textContent, 'Two');
});

test('domBuilder: content as array inserts every root item, not just the first (fix #5)', () => {
  const container = document.createElement('div');
  domBuilder([{
    tag: 'div',
    content: ['span.one Uno', 'span.two Due', 'span.three Tre']
  }], container);

  const wrapper = container.firstElementChild;
  assert.equal(wrapper.children.length, 3, 'all 3 content items must be inserted, not discarded');
  assert.equal(wrapper.children[0].className, 'one');
  assert.equal(wrapper.children[1].className, 'two');
  assert.equal(wrapper.children[2].textContent, 'Tre');
});

test('domBuilder: content without "<" uses textContent (fast path), no HTML parsing', () => {
  const container = document.createElement('div');
  domBuilder([{ tag: 'span', content: 'Prezzo: 10 & lode' }], container);

  const span = container.firstElementChild;
  assert.equal(span.textContent, 'Prezzo: 10 & lode');
  assert.equal(span.children.length, 0, 'no elements parsed out of plain text');
});

test('domBuilder: content as a number is set as text', () => {
  const container = document.createElement('div');
  domBuilder([{ tag: 'span', content: 42 }], container);
  assert.equal(container.firstElementChild.textContent, '42');
});

test('domBuilder: content with "<" falls back to innerHTML when Element.setHTML is unsupported', () => {
  assert.equal(typeof document.createElement('div').setHTML, 'undefined', 'sanity check: jsdom has no setHTML');

  const container = document.createElement('div');
  domBuilder([{ tag: 'p', content: 'Testo <strong>importante</strong>' }], container);

  const strong = container.querySelector('strong');
  assert.ok(strong, 'markup fallback should still parse via innerHTML');
  assert.equal(strong.textContent, 'importante');
});

test('domBuilder: content with "<" uses Element.setHTML() (sanitizer path) when available', () => {
  let calledWith = null;
  Element.prototype.setHTML = function (html) {
    calledWith = html;
    this.textContent = '[sanitized]';
  };
  try {
    const container = document.createElement('div');
    domBuilder([{ tag: 'p', content: 'Testo <strong>importante</strong>' }], container);

    assert.equal(calledWith, 'Testo <strong>importante</strong>');
    assert.equal(container.firstElementChild.textContent, '[sanitized]');
  } finally {
    delete Element.prototype.setHTML;
  }
});

test('domBuilder: attrs accepts pair, array-of-pairs, and object forms', () => {
  const container = document.createElement('div');
  domBuilder([
    { tag: 'input', attrs: ['type', 'text'] },
    { tag: 'input', attrs: [['type', 'checkbox'], ['checked', true]] },
    { tag: 'input', attrs: { type: 'radio', disabled: false } }
  ], container);

  const [a, b, c] = container.children;
  assert.equal(a.getAttribute('type'), 'text');
  assert.equal(b.getAttribute('type'), 'checkbox');
  assert.equal(b.hasAttribute('checked'), true, 'boolean attr with truthy value is set');
  assert.equal(c.getAttribute('type'), 'radio');
  assert.equal(c.hasAttribute('disabled'), false, 'boolean attr explicitly false is omitted');
});

test('domBuilder: insertMode before/after preserve structureArray order relative to the anchor', () => {
  const parentEl = document.createElement('div');
  const anchor = document.createElement('div');
  anchor.className = 'anchor';
  parentEl.appendChild(anchor);

  domBuilder(['span.x1', 'span.x2'], anchor, { insertMode: 'before' });
  assert.deepEqual(
    [...parentEl.children].map(el => el.className),
    ['x1', 'x2', 'anchor']
  );

  domBuilder(['span.y1', 'span.y2'], anchor, { insertMode: 'after' });
  assert.deepEqual(
    [...parentEl.children].map(el => el.className),
    ['x1', 'x2', 'anchor', 'y1', 'y2']
  );
});

test('domBuilder: options.emptyParent clears the parent before building', () => {
  const container = document.createElement('div');
  container.innerHTML = '<span>old</span>';
  domBuilder(['p.new'], container, { emptyParent: true });

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].className, 'new');
});

test('domBuilder: condition:false skips the item', () => {
  const container = document.createElement('div');
  domBuilder([
    { tag: 'span', condition: false, content: 'skipped' },
    { tag: 'span', content: 'kept' }
  ], container);

  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].textContent, 'kept');
});

test('domBuilder: callback receives the created element', () => {
  const container = document.createElement('div');
  let received = null;
  domBuilder([{ tag: 'span', className: 'cb', callback: el => { received = el; } }], container);

  assert.equal(received, container.firstElementChild);
  assert.ok(received.classList.contains('cb'));
});

test('domBuilder: with no parent, elements are built but not attached to the document', () => {
  const main = domBuilder(['div.detached']);
  assert.equal(main.tagName, 'DIV');
  assert.equal(main.parentNode, null);
});
