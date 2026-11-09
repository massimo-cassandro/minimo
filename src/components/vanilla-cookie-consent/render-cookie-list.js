// elenco dei cookie per la pagina della privacy policy
// usa la stessa configurazione di `initCookieConsent()`, così che i cookie mostrati coincidano con quelli del modal

import { resolveConfig } from './src/resolve-config.js';

/**
 * Inserisce in `target` l'elenco dei cookie, raggruppati per categoria
 * @param {Element} target - Elemento in cui inserire l'elenco
 * @param {import('./cookie-consent.js').CookieConsentConfig} [config] - Configurazione usata per `initCookieConsent()` (default: {})
 */
export function renderCookieList(target, config = {}) {

  const list = document.createElement('ul');

  resolveConfig(config).categories.forEach(cat => {
    const section = list.appendChild(document.createElement('li')),
      title = section.appendChild(document.createElement('span'));

    title.classList.add('cookie-list-section');
    title.textContent = cat.title;

    const sublist = section.appendChild(document.createElement('ul'));

    cat.cookies.forEach(cookie => {
      const li = sublist.appendChild(document.createElement('li'));
      li.appendChild(document.createElement('strong')).textContent = `${cookie.name}: `;

      // la descrizione può contenere `<br>` (usato nel modal, che interpreta l'HTML):
      // qui viene sostituito da uno spazio, dato che il testo è inserito come text node
      const description = cookie.description.replace(/<br\s*\/?>/gi, ' ');
      li.appendChild(document.createTextNode(`${description} (dur. ${cookie.expiration})`));
    });
  });

  target.appendChild(list);
}
