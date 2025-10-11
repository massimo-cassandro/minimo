// lista dei cookie per visualizzazione nella pagina della privacy policy
// questo file è importato direttamente nella pagina privacy policy

import { cookie_list } from './src/cookie-list';


export function render_cookie_list(target) {

  const list = document.createDocumentFragment()
    .appendChild(document.createElement('ul'));

  cookie_list
    .filter(i => i.cookieTable !== undefined)
    .forEach(tab => {
      const section = list.appendChild(document.createElement('li'));
      section.appendChild(document.createElement('span'));
      section.querySelector(':scope > span').classList.add('cookie-list-section');
      section.querySelector(':scope > span').appendChild(document.createTextNode(tab.title));
      const sublist = section.appendChild(document.createElement('ul'));

      tab.cookieTable.body.forEach(cookie => {
        const li = sublist.appendChild(document.createElement('li'));
        li.appendChild(document.createElement('strong'))
          .appendChild(document.createTextNode(cookie.name + ': '));
        li.appendChild(document.createTextNode(`${cookie.description} (dur. ${cookie.expiration})`));

      });
    });

  // console.log(list);
  target.appendChild(list);
}
