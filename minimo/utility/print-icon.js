import { domBuilder } from '@massimo-cassandro/js-utilities/index.js';

const icon_file = document.body.dataset.icons;

export function printIcon({iconId, className='icon', title= null, output = 'html'}) {

  if(!['html', 'element', 'builderArray'].includes(output)) {
    // eslint-disable-next-line no-console
    console.error(`'printIcon': parametro output non corretto (${output}). `+
      'Deve essere `html`, `element` o `builderArray`');
  }

  // accetta anche un solo argomento stringa (= iconId)
  if(arguments.length === 1 && typeof arguments[0] === 'string') {
    iconId = arguments[0];
  }


  const iconArray = [
    {
      tag: 'svg',
      className: className,
      children: [
        {
          tag: 'title',
          content: title,
          condition: title !=  null
        },
        {
          tag: 'use',
          attrs: {
            href: `${icon_file}#${iconId}`
          }
        }
      ]
    }
  ];

  if(output === 'builderArray') {
    return iconArray;
  } else {

    const iconElement = domBuilder(iconArray);
    if(output === 'element') {
      return iconElement;
    } else {
      return iconElement.outerHTML;
    }
  }

}
