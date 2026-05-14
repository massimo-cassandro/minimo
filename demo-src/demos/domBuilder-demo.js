import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';

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
    '#id.classe1.classe2.classeN(attributo1: valore1, attributo2=valore2, attributo3) Lorem ipsum'
  ], root);
}
