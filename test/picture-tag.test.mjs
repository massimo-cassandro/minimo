/*
  Test di buildPictureTag (dom-builder-helpers/picture-tag.js).
  Esecuzione: node --test test/

  `location` serve a risolvere gli URL relativi e relativi alla root.
*/

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

globalThis.location = /** @type {any} */ ({ href: 'https://example.com/pagina/' });

const { buildPictureTag } = await import('../src/utilities/dom-builder-helpers/picture-tag.js');

const media = '(min-width: 47.5rem) and (max-width: 63.99rem) and (orientation: portrait)';

const stdSizes = [
  [430, 352],
  { from: 600, size: [760, 624] },
  { from: 760, size: [480, 720] },
  { from: 1024, size: [600, 720] },
  { from: 1280, size: [720, 672] },
];

const common = {
  baseSrc: '/viewer/base.jpg',
  dpr: 2,
  imgParams: [['q', '70'], ['fd', '1']],
  formats: ['avif', 'webp', 'pjpg'],
  legacyMediaSyntax: true,
  alt: 'foto',
};

const altEntry = { media, size: [480, 720], src: '/viewer/alt.jpg' };

// esegue fn e restituisce il risultato con gli avvisi emessi
const withWarnings = fn => {
  const warn = mock.method(console, 'warn', () => {});
  try {
    return { result: fn(), warnings: warn.mock.calls.map(c => c.arguments[0]) };
  } finally {
    warn.mock.restore();
  }
};

test('sizes senza src: source normali e img con srcset e sizes attesi', () => {
  const { children } = buildPictureTag({ ...common, sizes: stdSizes });

  assert.deepEqual(children.map(c => c.tag), ['source', 'source', 'img']);
  assert.equal(children[0].attrs.media, undefined);
  assert.equal(children[0].attrs.sizes, '(min-width: 1280px) 720px, (min-width: 1024px) 600px, (min-width: 760px) 480px, (min-width: 600px) 760px, 430px');
  assert.equal(children[2].attrs.src, '/viewer/base.jpg?q=70&fd=1&f=pjpg&bb=600x720');
  assert.equal(children[2].attrs.width, 760);
  assert.equal(children[2].attrs.height, 624);
});

test('entry con src e media: source proprie, per primi e per ogni formato tranne l\'ultimo', () => {
  const { result, warnings } = withWarnings(() => buildPictureTag({ ...common, sizes: [...stdSizes, altEntry] }));
  const { children } = result;

  assert.deepEqual(warnings, []);
  assert.deepEqual(children.map(c => [c.tag, c.attrs.type, c.attrs.media]), [
    ['source', 'image/avif', media],
    ['source', 'image/webp', media],
    ['source', 'image/avif', undefined],
    ['source', 'image/webp', undefined],
    ['img', undefined, undefined],
  ]);
  assert.equal(children[0].attrs.sizes, '480px');
  assert.equal(
    children[0].attrs.srcset,
    '/viewer/alt.jpg?q=70&fd=1&f=avif&bb=480x720 480w,/viewer/alt.jpg?q=70&fd=1&f=avif&bb=960x1440 960w'
  );

  // nessuna traccia della foto alternativa fuori dalle sue source
  children.slice(2).forEach(c => assert.ok(!JSON.stringify(c.attrs).includes('alt.jpg')));

  // source normali e img sono le stesse che si ottengono senza l'entry
  assert.deepEqual(children.slice(2), buildPictureTag({ ...common, sizes: stdSizes }).children);
});

test('più entry con src: resta l\'ordine di scrittura, anche se mescolate alle altre', () => {
  const { children } = buildPictureTag({
    ...common,
    sizes: [
      { media: '(width: 2px)', size: 200, src: '/viewer/due.jpg' },
      ...stdSizes,
      { media: '(width: 1px)', size: 100, src: '/viewer/uno.jpg' },
    ],
  });

  assert.deepEqual(
    children.slice(0, 4).map(c => [c.attrs.media, c.attrs.type]),
    [
      ['(width: 2px)', 'image/avif'],
      ['(width: 2px)', 'image/webp'],
      ['(width: 1px)', 'image/avif'],
      ['(width: 1px)', 'image/webp'],
    ]
  );
});

test('entry con src: valgono dpr, imgParams, formats, devMode e ratio', () => {
  const { children } = buildPictureTag({
    baseSrc: '/viewer/base.jpg',
    sizes: [100, { media: '(width: 1px)', size: 300, src: '/viewer/alt.jpg' }],
    ratio: 3/2,
    dpr: 3,
    imgParams: [['q', '10']],
    devMode: true,
  });

  assert.deepEqual(children.map(c => c.attrs.type), ['image/webp', 'image/webp', undefined]);
  assert.equal(
    children[0].attrs.srcset,
    ['300x200 300w', '600x400 600w', '900x600 900w'].map(s => `/viewer/alt.jpg?q=10&f=webp&bb=${s}`).join(',')
  );
});

test('entry con src: URL relativi e assoluti risolti come baseSrc, con i parametri di query', () => {
  const srcsetOf = src => buildPictureTag({
    baseSrc: '/viewer/base.jpg',
    sizes: [100, { media: '(width: 1px)', size: 300, src }],
    dpr: 1,
    imgParams: [['q', '10']],
  }).children[0].attrs.srcset;

  assert.equal(srcsetOf('/viewer/alt.jpg?v=1'), '/viewer/alt.jpg?v=1&q=10&f=avif&bb=300x 300w');
  assert.equal(srcsetOf('alt.jpg?v=1'), 'https://example.com/pagina/alt.jpg?v=1&q=10&f=avif&bb=300x 300w');
  assert.equal(srcsetOf('https://cdn.example.com/alt.jpg?v=1'), 'https://cdn.example.com/alt.jpg?v=1&q=10&f=avif&bb=300x 300w');
});

test('src nullo: entry ignorata senza avvisi, anche se ha media o è l\'unica senza from', () => {
  const expected = buildPictureTag({ ...common, sizes: stdSizes });

  [null, undefined].forEach(src => {
    [{ media, size: [480, 720], src }, { from: 800, size: 900, src }, { size: 900, src }].forEach(entry => {
      const { result, warnings } = withWarnings(() => buildPictureTag({ ...common, sizes: [...stdSizes, entry] }));
      assert.deepEqual(warnings, []);
      assert.deepEqual(result, expected);
    });
  });
});

test('src senza media e media senza src: un avviso ed entry ignorata', () => {
  const expected = buildPictureTag({ ...common, sizes: stdSizes });

  [
    { size: [480, 720], src: '/viewer/alt.jpg' },
    { from: 800, size: [480, 720], src: '/viewer/alt.jpg' },
    { media, size: [480, 720] },
    { media: '', size: [480, 720], src: '/viewer/alt.jpg' },
  ].forEach(entry => {
    const { result, warnings } = withWarnings(() => buildPictureTag({ ...common, sizes: [...stdSizes, entry] }));
    assert.equal(warnings.length, 1);
    assert.deepEqual(result, expected);
  });
});

test('formats con un solo elemento: nessuna source e nessun errore', () => {
  const { children } = buildPictureTag({ ...common, formats: ['pjpg'], sizes: [...stdSizes, altEntry] });

  assert.deepEqual(children.map(c => c.tag), ['img']);
  assert.ok(!JSON.stringify(children[0].attrs).includes('alt.jpg'));
});

test('nessuna entry utilizzabile: avviso e null, senza errori', () => {
  const { result, warnings } = withWarnings(() => buildPictureTag({ ...common, sizes: [altEntry] }));

  assert.equal(result, null);
  assert.equal(warnings.length, 1);
});

const imgixParams = [['q', '70'], ['fit', 'crop'], ['w', '{w}'], ['h', '{h}'], ['fm', '{f}']];

test('imgParams dell\'entry con src: sostituisce quello generale, solo per le sue source', () => {
  const { children } = buildPictureTag({
    ...common,
    sizes: [...stdSizes, { ...altEntry, imgParams: imgixParams }],
  });

  assert.equal(
    children[0].attrs.srcset,
    '/viewer/alt.jpg?q=70&fit=crop&w=480&h=720&fm=avif 480w,/viewer/alt.jpg?q=70&fit=crop&w=960&h=1440&fm=avif 960w'
  );
  assert.ok(children[1].attrs.srcset.includes('fm=webp'));
  assert.deepEqual(children.slice(2), buildPictureTag({ ...common, sizes: stdSizes }).children);
});

test('imgParams dell\'entry senza segnaposto: f e bb automatici, senza i parametri generali', () => {
  const { children } = buildPictureTag({
    ...common,
    dpr: 1,
    sizes: [...stdSizes, { ...altEntry, imgParams: [['q', '10']] }],
  });

  assert.equal(children[0].attrs.srcset, '/viewer/alt.jpg?q=10&f=avif&bb=480x720 480w');
});

test('imgParams dell\'entry null: vale quello generale', () => {
  const { children } = buildPictureTag({
    ...common,
    dpr: 1,
    sizes: [...stdSizes, { ...altEntry, imgParams: null }],
  });

  assert.equal(children[0].attrs.srcset, '/viewer/alt.jpg?q=70&fd=1&f=avif&bb=480x720 480w');
});

test('segnaposto in imgParams generale: valgono per baseSrc, source e img', () => {
  const { children } = buildPictureTag({
    baseSrc: 'https://cdn.example.com/a.jpg?v=1',
    sizes: [100],
    dpr: 1,
    formats: ['webp', 'jpg'],
    imgParams: [['w', '{w}'], ['fm', '{f}']],
  });

  assert.equal(children[0].attrs.srcset, 'https://cdn.example.com/a.jpg?v=1&w=100&fm=webp 100w');
  assert.equal(children[1].attrs.src, 'https://cdn.example.com/a.jpg?v=1&w=100&fm=jpg');
});

test('segnaposto {h} senza altezza: omesso se è tutto il valore, vuoto dentro un valore più lungo', () => {
  const srcsetOf = imgParams => buildPictureTag({ baseSrc: '/a.jpg?h=1', sizes: [100], dpr: 1, imgParams }).children[0].attrs.srcset;

  assert.equal(srcsetOf([['w', '{w}'], ['h', '{h}']]), '/a.jpg?w=100 100w');
  assert.equal(srcsetOf([['size', '{w}x{h}']]), '/a.jpg?h=1&size=100x 100w');
});

test('imgParams su un\'entry senza src: un avviso, parametro ignorato ed entry valida', () => {
  const expected = buildPictureTag({ ...common, sizes: stdSizes });
  const { result, warnings } = withWarnings(() => buildPictureTag({
    ...common,
    sizes: stdSizes.map((entry, i) => i === 1? { ...entry, imgParams: imgixParams } : entry),
  }));

  assert.equal(warnings.length, 1);
  assert.deepEqual(result, expected);
});

test('imgParams su un\'entry ignorata: nessun avviso aggiuntivo', () => {
  const run = entry => withWarnings(() => buildPictureTag({ ...common, sizes: [...stdSizes, entry] })).warnings.length;

  assert.equal(run({ ...altEntry, src: null, imgParams: imgixParams }), 0);
  assert.equal(run({ size: 100, src: '/viewer/alt.jpg', imgParams: imgixParams }), 1);
  assert.equal(run({ media, size: 100, imgParams: imgixParams }), 1);
});
