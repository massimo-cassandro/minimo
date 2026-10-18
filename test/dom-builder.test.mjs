/*
  Smoke test del modulo dom-builder (dom-builder.js, parseDomString.js,
  domBuilderBasicSetup.js). Esecuzione: node --test test/

  Usa jsdom (devDependency) per fornire document/Element/DocumentFragment,
  dato che domBuilder li usa come globali del browser invece di importarli.
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

test('domBuilder: content as an Element is appended as-is, not stringified', () => {
  const container = document.createElement('div');
  const inner = document.createElement('strong');
  inner.textContent = 'ipsum';

  domBuilder([{ tag: 'p', content: inner }], container);

  const p = container.firstElementChild;
  assert.equal(p.children.length, 1);
  assert.equal(p.firstElementChild, inner, 'the very same Element instance must be appended');
  assert.equal(p.textContent, 'ipsum');
});

test('domBuilder: content as a DocumentFragment appends its children, not "[object DocumentFragment]"', () => {
  const container = document.createElement('div');
  const fragment = document.createDocumentFragment();
  fragment.appendChild(document.createElement('input'));
  fragment.appendChild(document.createElement('button'));

  domBuilder([{ tag: 'form', content: fragment }], container);

  const form = container.firstElementChild;
  assert.equal(form.children.length, 2, 'both fragment children must land in the parent');
  assert.equal(form.children[0].tagName, 'INPUT');
  assert.equal(form.children[1].tagName, 'BUTTON');
});

test('domBuilder: content as a function returning a Node is appended as-is', () => {
  const container = document.createElement('div');
  const fragment = document.createDocumentFragment();
  fragment.appendChild(document.createElement('em'));

  domBuilder([{ tag: 'p', content: () => fragment }], container);

  assert.equal(container.firstElementChild.firstElementChild.tagName, 'EM');
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

test('domBuilder: `text` shorthand inserts a literal Text node as a sibling of tags', () => {
  const container = document.createElement('div');
  domBuilder([{
    tag: 'p',
    children: [
      { text: 'Lorem ' },
      { tag: 'strong', content: 'ipsum' },
      { text: ' dolor' }
    ]
  }], container);

  const p = container.firstElementChild;
  assert.equal(p.childNodes.length, 3);
  assert.equal(p.childNodes[0].nodeType, 3, 'first child is a Text node');
  assert.equal(p.childNodes[0].textContent, 'Lorem ');
  assert.equal(p.childNodes[1].tagName, 'STRONG');
  assert.equal(p.childNodes[2].nodeType, 3, 'last child is a Text node');
  assert.equal(p.childNodes[2].textContent, ' dolor');
  assert.equal(p.textContent, 'Lorem ipsum dolor');
});

test('domBuilder: `text` shorthand never parses markup, unlike `content`', () => {
  const container = document.createElement('div');
  domBuilder([{ tag: 'p', children: [{ text: 'Testo <strong>non</strong> analizzato' }] }], container);

  const p = container.firstElementChild;
  assert.equal(p.children.length, 0, 'no elements parsed out of the text node');
  assert.equal(p.childNodes.length, 1);
  assert.equal(p.textContent, 'Testo <strong>non</strong> analizzato');
});

test('domBuilder: `text` shorthand accepts numbers and respects condition/callback', () => {
  const container = document.createElement('div');
  let received = null;
  domBuilder([{
    tag: 'p',
    children: [
      { text: 42 },
      { text: 'skipped', condition: false },
      { text: 'kept', callback: node => { received = node; } }
    ]
  }], container);

  const p = container.firstElementChild;
  assert.equal(p.childNodes.length, 2);
  assert.equal(p.childNodes[0].textContent, '42');
  assert.equal(p.childNodes[1].textContent, 'kept');
  assert.equal(received, p.childNodes[1]);
  assert.equal(received.nodeType, 3);
});

test('domBuilder: `text` shorthand respects insertMode before/after', () => {
  const parentEl = document.createElement('div');
  const anchor = document.createElement('span');
  anchor.className = 'anchor';
  parentEl.appendChild(anchor);

  domBuilder([{ text: 'before-' }], anchor, { insertMode: 'before' });
  domBuilder([{ text: '-after' }], anchor, { insertMode: 'after' });

  assert.equal(parentEl.childNodes.length, 3);
  assert.equal(parentEl.childNodes[0].textContent, 'before-');
  assert.equal(parentEl.childNodes[1], anchor);
  assert.equal(parentEl.childNodes[2].textContent, '-after');
});

// --- namespace SVG / MathML ---

const NS_HTML = 'http://www.w3.org/1999/xhtml';
const NS_SVG = 'http://www.w3.org/2000/svg';
const NS_MATH = 'http://www.w3.org/1998/Math/MathML';

test('domBuilder: svg with title and use children are all in the SVG namespace', () => {
  const container = document.createElement('div');
  const svg = domBuilder([{
    tag: 'svg',
    className: 'icon',
    children: [
      { tag: 'title', content: 'Carica' },
      { tag: 'use', attrs: { href: 'icons.svg#cloud' } }
    ]
  }], container);

  assert.equal(svg.namespaceURI, NS_SVG);
  assert.equal(svg.getAttribute('class'), 'icon');
  assert.equal(svg.children[0].namespaceURI, NS_SVG);
  assert.equal(svg.children[0].localName, 'title');
  assert.equal(svg.children[1].namespaceURI, NS_SVG);
  assert.equal(svg.children[1].getAttribute('href'), 'icons.svg#cloud');

  // anche senza genitore
  const detached = domBuilder([{ tag: 'svg', children: [{ tag: 'use' }] }]);
  assert.equal(detached.namespaceURI, NS_SVG);
  assert.equal(detached.firstElementChild.namespaceURI, NS_SVG);
});

test('domBuilder: title outside svg stays HTML', () => {
  const title = domBuilder([{ tag: 'title', content: 'x' }]);
  assert.equal(title.namespaceURI, NS_HTML);
  assert.ok(title instanceof dom.window.HTMLElement);
});

test('domBuilder: children of foreignObject are HTML', () => {
  const svg = domBuilder([{
    tag: 'svg',
    children: [{ tag: 'foreignObject', children: [{ tag: 'div', className: 'inner' }] }]
  }]);
  const fo = svg.firstElementChild;
  assert.equal(fo.namespaceURI, NS_SVG);
  assert.equal(fo.localName, 'foreignObject');
  assert.equal(fo.firstElementChild.namespaceURI, NS_HTML);
  assert.ok(fo.firstElementChild instanceof dom.window.HTMLDivElement);
});

test('domBuilder: math with mi, HTML element inside mi, mglyph/malignmark exceptions', () => {
  const math = domBuilder([{
    tag: 'math',
    children: [{ tag: 'mi', children: ['span.x', 'mglyph', 'malignmark'] }]
  }]);
  const mi = math.firstElementChild;
  assert.equal(math.namespaceURI, NS_MATH);
  assert.equal(mi.namespaceURI, NS_MATH);
  assert.equal(mi.children[0].namespaceURI, NS_HTML);
  assert.equal(mi.children[1].namespaceURI, NS_MATH);
  assert.equal(mi.children[2].namespaceURI, NS_MATH);
});

test('domBuilder: annotation-xml children are HTML only with an HTML encoding', () => {
  const math = domBuilder([{
    tag: 'math',
    children: [{
      tag: 'semantics',
      children: [
        { tag: 'annotation-xml', attrs: { encoding: 'TEXT/HTML' }, children: ['div.a'] },
        { tag: 'annotation-xml', attrs: { encoding: 'application/xhtml+xml' }, children: ['div.b'] },
        { tag: 'annotation-xml', children: ['mi.c'] },
        { tag: 'annotation-xml', children: [{ tag: 'svg' }] }
      ]
    }]
  }]);
  const [html1, html2, plain, withSvg] = math.firstElementChild.children;
  assert.equal(html1.firstElementChild.namespaceURI, NS_HTML);
  assert.equal(html2.firstElementChild.namespaceURI, NS_HTML);
  assert.equal(plain.firstElementChild.namespaceURI, NS_MATH);
  assert.equal(withSvg.firstElementChild.namespaceURI, NS_SVG);
});

test('domBuilder: tag chain [svg.icon, g, use] is entirely SVG', () => {
  const container = document.createElement('div');
  const use = domBuilder([{ tag: ['svg.icon', 'g', 'use'], attrs: { href: '#a' } }], container);
  const svg = container.firstElementChild;
  assert.equal(svg.namespaceURI, NS_SVG);
  assert.equal(svg.getAttribute('class'), 'icon');
  assert.equal(svg.firstElementChild.namespaceURI, NS_SVG);
  assert.equal(use.namespaceURI, NS_SVG);
  assert.equal(use.parentNode, svg.firstElementChild);
  assert.equal(use.getAttribute('href'), '#a');
});

test('domBuilder: explicit namespace without parent is inherited by children', () => {
  const g = domBuilder([{ tag: 'g', namespace: 'svg', children: ['path.p', { tag: 'use' }] }]);
  assert.equal(g.namespaceURI, NS_SVG);
  assert.equal(g.children[0].namespaceURI, NS_SVG);
  assert.equal(g.children[1].namespaceURI, NS_SVG);

  const byUri = domBuilder([{ tag: 'use', namespace: NS_SVG }]);
  assert.equal(byUri.namespaceURI, NS_SVG);
});

test('domBuilder: explicit namespace on a tag chain applies to the first element', () => {
  const g = domBuilder([{ tag: ['g', 'use'], namespace: 'svg' }]);
  assert.equal(g.namespaceURI, NS_SVG);
  assert.equal(g.parentNode.namespaceURI, NS_SVG);
  assert.equal(g.parentNode.localName, 'g');
});

test('domBuilder: options.namespace is the initial namespace without parent', () => {
  const container = document.createElement('div');

  const path = domBuilder(['path.a'], null, { namespace: 'svg' });
  assert.equal(path.namespaceURI, NS_SVG);
  assert.equal(path.getAttribute('class'), 'a');

  // con un genitore HTML, options.namespace non si applica
  const div = domBuilder(['div'], container, { namespace: 'svg' });
  assert.equal(div.namespaceURI, NS_HTML);
});

test('domBuilder: invalid namespace logs an error and falls back to HTML', t => {
  const errorMock = t.mock.method(console, 'error', () => {});
  const el = domBuilder([{ tag: 'use', namespace: 'foo' }]);
  assert.equal(el.namespaceURI, NS_HTML);
  assert.equal(errorMock.mock.callCount(), 1);

  const el2 = domBuilder(['use'], null, { namespace: 'bar' });
  assert.equal(el2.namespaceURI, NS_HTML);
  assert.equal(errorMock.mock.callCount(), 2);
});

test('domBuilder: className as string and array on SVG elements', () => {
  const svg = domBuilder([{ tag: 'svg', className: 'icon big' }]);
  assert.equal(svg.getAttribute('class'), 'icon big');

  const svg2 = domBuilder([{ tag: 'svg', className: ['icon', null, false, 'small'], id: 'ico' }]);
  assert.equal(svg2.getAttribute('class'), 'icon small');
  assert.equal(svg2.id, 'ico');
});

test('domBuilder: mixed-case SVG tags keep their spelling', () => {
  const svg = domBuilder([{
    tag: 'svg',
    children: [
      { tag: 'linearGradient', id: 'g1' },
      'clipPath#c1'
    ]
  }]);
  assert.equal(svg.children[0].localName, 'linearGradient');
  assert.equal(svg.children[1].localName, 'clipPath');
  assert.equal(svg.children[1].id, 'c1');
  assert.equal(parseDomString('feGaussianBlur').tag, 'feGaussianBlur');
});

test('domBuilder: string content with markup inside svg is parsed as SVG', () => {
  const svg = domBuilder([{ tag: 'svg', content: '<circle r="5"></circle>' }]);
  const circle = svg.firstElementChild;
  assert.equal(circle.localName, 'circle');
  assert.equal(circle.namespaceURI, NS_SVG);
});

test('domBuilder: insertMode before/after resolve the namespace from anchor.parentNode', () => {
  const svg = domBuilder([{ tag: 'svg', children: ['g.anchor'] }]);
  const anchor = svg.firstElementChild;

  domBuilder(['path.before'], anchor, { insertMode: 'before' });
  domBuilder(['path.after'], anchor, { insertMode: 'after' });

  assert.deepEqual([...svg.children].map(el => el.getAttribute('class')), ['before', 'anchor', 'after']);
  [...svg.children].forEach(el => assert.equal(el.namespaceURI, NS_SVG));
});

test('domBuilder: tag chain respects insertMode before/after', () => {
  const parentEl = document.createElement('div');
  const anchor = document.createElement('div');
  anchor.className = 'anchor';
  parentEl.appendChild(anchor);

  domBuilder([{ tag: ['ul.b', 'li'] }], anchor, { insertMode: 'before' });
  domBuilder([{ tag: ['ul.a1', 'li'] }, { tag: ['ul.a2', 'li'] }], anchor, { insertMode: 'after' });

  assert.equal(anchor.children.length, 0, 'the chain must not be appended inside the anchor');
  assert.deepEqual([...parentEl.children].map(el => el.className), ['b', 'anchor', 'a1', 'a2']);
  [...parentEl.children].filter(el => el !== anchor)
    .forEach(ul => assert.equal(ul.firstElementChild.localName, 'li'));
});

test('domBuilder: HTML elements are still HTMLElement in the XHTML namespace', () => {
  const container = document.createElement('div');
  domBuilder(['p.a', { tag: 'span', className: ['b', 'c'] }, { tag: ['section', 'a'] }], container);
  [...container.querySelectorAll('*')].forEach(el => {
    assert.equal(el.namespaceURI, NS_HTML);
    assert.ok(el instanceof dom.window.HTMLElement);
  });
  assert.equal(container.children[1].className, 'b c');
});

// --- sanitizeContent ---

test('domBuilder: sanitizeContent:false skips setHTML and keeps <use> via innerHTML', () => {
  let setHTMLCalls = 0;
  Element.prototype.setHTML = function () {
    setHTMLCalls++;
  };
  try {
    const container = document.createElement('div');
    domBuilder([{
      tag: 'span',
      sanitizeContent: false,
      content: '<svg class="icon"><use href="icons.svg#cloud"></use></svg>'
    }], container);

    assert.equal(setHTMLCalls, 0, 'setHTML must not be called with sanitizeContent:false');
    const use = container.querySelector('use');
    assert.ok(use, '<use> must be kept');
    assert.equal(use.namespaceURI, NS_SVG);
    assert.equal(use.getAttribute('href'), 'icons.svg#cloud');
  } finally {
    delete Element.prototype.setHTML;
  }
});

test('domBuilder: sanitizeContent defaults to true (setHTML is still used)', () => {
  let setHTMLCalls = 0;
  Element.prototype.setHTML = function () {
    setHTMLCalls++;
  };
  try {
    domBuilder([{ tag: 'p', content: 'Testo <strong>x</strong>' }]);
    domBuilder([{ tag: 'p', sanitizeContent: true, content: 'Testo <strong>x</strong>' }]);
    assert.equal(setHTMLCalls, 2);
  } finally {
    delete Element.prototype.setHTML;
  }
});

test('domBuilder: sanitizeContent:false is not inherited by children', () => {
  let setHTMLCalls = 0;
  Element.prototype.setHTML = function () {
    setHTMLCalls++;
  };
  try {
    const parentEl = domBuilder([{
      tag: 'div',
      sanitizeContent: false,
      content: '<b>trusted</b>',
      children: [{ tag: 'p', content: 'Testo <strong>x</strong>' }]
    }]);
    assert.ok(parentEl.querySelector('b'), 'parent content inserted via innerHTML');
    assert.equal(setHTMLCalls, 1, 'child content still goes through setHTML');
  } finally {
    delete Element.prototype.setHTML;
  }
});
