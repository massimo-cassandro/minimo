import { domBuilder } from '@minimoSrc/index.js';

const root = document.getElementById('root');

domBuilder([
  {
    tag: 'h1',
    content: 'Minimo Web Tools'
  },
  {
    tag: 'ul',
    children: [
      {
        tag: 'li',
        children: [
          {
            tag: 'a',
            attrs: {
              href: './color-set-builder/'
            },
            content: 'Color Ser Builder'
          }
        ]
      }
    ]
  }
], root, {emptyParent: true});
