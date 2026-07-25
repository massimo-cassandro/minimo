//@ts-nocheck

/* globals process */
import './demo.css';
import './demo-files/charts/charts.css';

import { routes } from 'routes.js';

const root = document.getElementById('root')
  ,route = window.location.hash.replace('#/', '') || 'home'

  ,titleCase = str => str.substring(0,1).toUpperCase() + str.substring(1)
;
routes.push(
  {
    key: 'home',
    title: 'Minimo Demo',
    callback: () => {
      const routeList = routes.filter(r => r.key !== 'home');
      // routeList.sort((a,b) => {
      //   return (a.title?? a.key).toLowerCase().localeCompare((b.title?? b.key).toLowerCase());
      // });

      root.innerHTML = '<ul>' +
        routeList.map(r => `<li><a href="${process.env.NODE_ENV === 'development'? '' : '/minimo'}/#/${r.key}">${r.title?? titleCase(r.key)}</a></li>`).join('') +
        '</ul>';
    }
  }
);

let routeObj = routes.filter(r => r.key === route)[0];

if(!routeObj) {
  throw new Error( 'Rotta non presente' );
}

routeObj = {
  fullPage: false,
  ...routeObj
};

if(routeObj.incl) {
  root.innerHTML = routeObj.incl;
}

if(routeObj.callback) {
  routeObj.callback();
}

if(!routeObj.fullPage) {

  const title =  (routeObj.title?? titleCase(routeObj.key) )+ (route !== 'home'? ' | Minimo Demo' : '');
  root.insertAdjacentHTML('afterbegin', `<h1 class="title">${title}</h1>`);


  if( route !== 'home') {
    root.insertAdjacentHTML('beforeend', '<p class="mbs-lg"><a href="/">Home</a></p>');
  }
}

root.classList.toggle('container', !routeObj.fullPage);




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
