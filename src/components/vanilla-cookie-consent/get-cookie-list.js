// elenco dei cookie per la pagina della privacy policy, come dati: il markup è a cura del consumer
// usa la stessa configurazione di `initCookieConsent()`, così che i cookie elencati coincidano con quelli del modal

import { resolveConfig } from './src/resolve-config.js';

/**
 * Categoria dell'elenco dei cookie
 * @typedef {Object} CookieListSection
 * @property {string} key - Nome della categoria (necessary, functionality, analytics)
 * @property {string} section - Titolo della categoria (lo stesso del modal preferenze)
 * @property {string} description - Descrizione della categoria (la stessa del modal preferenze)
 * @property {Required<import('./cookie-consent.js').CookieRow>[]} cookies - Righe della categoria
 */

/**
 * Restituisce l'elenco dei cookie diviso per categoria, nello stesso ordine del modal preferenze.
 * Compaiono solo le categorie mostrate anche nel modal (le necessarie sempre, le altre se hanno righe
 * o servizi, oppure con `show: true`). Nelle righe `type` vale "cookie" se non indicato ed
 * `expiration` una stringa vuota; `description` può contenere `<br>` (il modal interpreta l'HTML).
 *
 * @param {import('./cookie-consent.js').CookieConsentConfig} [config] - Configurazione usata per `initCookieConsent()` (default: {})
 * @returns {CookieListSection[]}
 *
 * @example
 * getCookieList(config);
 * // [{ key: 'necessary', section: 'Cookie strettamente necessari', description: '…',
 * //    cookies: [{ name: 'cc_cookie', type: 'cookie', domain: 'Questo sito', description: '…', expiration: '6 mesi' }, …] }, …]
 */
export function getCookieList(config = {}) {
  return resolveConfig(config).categories.map(cat => ({
    key: cat.key,
    section: cat.title,
    description: cat.description,
    // copie: il consumer può modificarle senza toccare i default del componente
    cookies: cat.cookies.map(row => ({
      name: row.name,
      type: row.type ?? 'cookie',
      domain: row.domain,
      description: row.description,
      expiration: row.expiration ?? '',
    })),
  }));
}
