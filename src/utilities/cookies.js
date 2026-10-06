// @ts-check
/*! minimo - Cookies */

/**
 * Restituisce il valore di un cookie dal nome.
 * @param {string} name
 * @param {object} [options]
 * @param {boolean} [options.parseJson=false] - Se true, esegue il parsing JSON del valore e restituisce un oggetto invece di una stringa (default: false)
 * @returns {string | object | null}
 */
export function getCookie(name, {parseJson = false} = {}) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return null;

  const cookieValue = parts.pop()?.split(';').shift();
  if (cookieValue === undefined) return null;

  return parseJson ? JSON.parse(cookieValue) : cookieValue;
}


/**
 * Imposta un cookie.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.value
 * @param {string|null} [params.path=null] (default: null)
 * @param {number|null} [params.expire=null] - Max-Age in secondi (default: null)
 * @example
 * // Cookie limitato alla sola pagina corrente, con durata di 15 giorni
 * setCookie({
 *   name: 'cookieName',
 *   value: 'cookieValue',
 *   path: window.location.pathname,
 *   expire: 15 * 24 * 60 * 60 // 15 giorni
 * });
 */
export function setCookie({name, value, path = null, expire = null}) {
  document.cookie = `${name}=${value}` +
    (path ? `; path=${path}` : '') +
    '; SameSite=Lax' +
    (expire ? `; Max-Age=${expire}` : '');
}
