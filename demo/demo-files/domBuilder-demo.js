import { domBuilder } from '@minimoSrc/utilities/dom-builder/dom-builder.js';
import { buildPictureTag } from '@minimoSrc/utilities/dom-builder-helpers/picture-tag.js';

export function domBuilderDemo(){

  const root = document.getElementById('root');

  domBuilder([
    {
      tag: 'p',
      content: 'domBuilder'
    },
    'p#test-id.test-class1.test-class2(data-xxx=ok, data-yyy: ok2) Lorem ipsum',
    '.test-class3 dolor sit amet',
    {
      tag: 'table',
      className: 'table',
      children: [
        {
          tag: ['thead', 'tr'],
          children: ['col1', 'col2', 'col3', 'col4'].map(item => ({
            tag: 'th',
            content: item,
            attrs: {scope: 'col'}
          }))
        },
        {
          tag: ['tbody', 'tr.tr-class'],
          children: [1,2,3,4].map(item => ({tag: 'td', content: item}))
        },
      ]
    },
    '#id.classe1.classe2.classeN(attributo1: valore1, attributo2=valore2, attributo3) Lorem ipsum',
    {
      tag: 'p',
      content: 'buildPictureTag: immagine alternativa con `src` e `media` (le immagini non esistono: la scelta si legge da `currentSrc` della `img`)'
    },
    /*
      su tablet in verticale viene scelta alt.jpg (con `src` null l'entry viene ignorata);
      su smartphone in verticale alt-small.jpg, da un servizio con altre convenzioni per i parametri
    */
    buildPictureTag({
      baseSrc: '/viewer/base.jpg',
      sizes: [
        [430, 352],
        { from: 600, size: [760, 624] },
        { from: 760, size: [480, 720] },
        { from: 1024, size: [600, 720] },
        { from: 1280, size: [720, 672] },
        {
          media: '(min-width: 47.5rem) and (max-width: 63.99rem) and (orientation: portrait)',
          size: [480, 720],
          src: '/viewer/alt.jpg'
        },
        {
          media: '(max-width: 37.5rem) and (orientation: portrait)',
          size: [430, 352],
          src: '/imgix/alt-small.jpg',
          imgParams: [['q', '70'], ['fit', 'crop'], ['w', '{w}'], ['h', '{h}'], ['fm', '{f}']]
        },
      ],
      imgParams: [['q', '70'], ['fd', '1']],
      legacyMediaSyntax: true,
      alt: 'Foto di esempio',
    })
  ], root);
}
