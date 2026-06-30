import './demo.css';

import './js/demo-ajax-table.js';

// import './js/demo-static-table.js';

import { createId } from '@massimo-cassandro/js-utilities/index.js';

import link_icon from './assets/link-simple.svg?inline';


// toc
const toc = [];
document.querySelectorAll('h2').forEach(h2 => {
  const id = createId(h2.innerText);
  h2.id = id;
  toc.push([id, h2.innerText]);
  h2.insertAdjacentHTML('beforeend', ` <a href="#${id}" class="toc-anchor">${link_icon}</a>`);
});

document.getElementById('toc').innerHTML =
  `<ul>${toc.map(item =>
    `<li><a href="#${item[0]}">${item[1]}</a></li>`).join('')
  }</ul>`;
