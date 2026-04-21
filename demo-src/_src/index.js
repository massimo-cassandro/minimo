import './index.css';

import buttons from '../buttons.html';

const root = document.getElementById('root')
  ,h1 = document.getElementById('title')
  ,route = window.location.hash.replace('#/', '') || 'home'

  ,titleCase = str => str.substring(0,1).toUpperCase() + str.substring(1)
;

const routes = [
  {
    key: 'buttons',
    incl: buttons,
    callback: null
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
        routeList.map(r => `<li><a href="/#/${r.key}">${r.title?? titleCase(r.key)}</a></li>`) +
        '</ul>';
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

document.body.addEventListener('click', e => {
  if(e.target.closest('a') &&
    e.target.hasAttribute('href') &&
    e.target.getAttribute('href').includes('/#/')
  ) {
    window.location.assign(e.target.getAttribute('href'));
  }
});
