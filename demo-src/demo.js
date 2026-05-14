import './demo.css';

import buttons from './pages/buttons.html';
import { snackbarsDemo } from './pages/snackbars/snackbars-demo.js';

const root = document.getElementById('root')
  ,h1 = document.getElementById('title')
  ,route = window.location.hash.replace('#/', '') || 'home'

  ,titleCase = str => str.substring(0,1).toUpperCase() + str.substring(1)
;

const routes = [
  {
    key: 'buttons',
    incl: buttons
  },
  {
    key: 'snackbars',
    callback: snackbarsDemo
  },

  {
    key: 'home',
    title: 'Minimo Demo',
    callback: () => {
      const routeList = routes.filter(r => r.key !== 'home');
      routeList.sort((a,b) => {
        return (a.title?? a.key).toLowerCase().localeCompare((b.title?? b.key).toLowerCase());
      });

      root.innerHTML = '<ul>' +
        routeList.map(r => `<li><a href="/#/${r.key}">${r.title?? titleCase(r.key)}</a></li>`).join('') +
        '</ul>'
    }
  }
];

const routeObj = routes.filter(r => r.key === route)[0];

if(!routeObj) {
  throw new Error( 'Rotta non presente' );
}



h1.innerHTML =  routeObj.title?? titleCase(route);
document.title = h1.innerText + (route !== 'home'? ' | Minimo Demo' : '');

if(routeObj.incl) {
  root.innerHTML = buttons;
}

if(routeObj.callback) {
  routeObj.callback();
}

if( route !== 'home') {
  root.insertAdjacentHTML('afterend', '<p class="mt-lg"><a href="/">Home</a></p>');
}

document.body.addEventListener('click', e => {
  if(e.target.closest('a') &&
    e.target.hasAttribute('href') &&
    e.target.getAttribute('href').includes('/#/')
  ) {

    // console.log(e.target.getAttribute('href'));
    window.location.href = e.target.getAttribute('href');
    window.location.reload();
  }
});
