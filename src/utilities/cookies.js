// @ts-check
/*! minimo - Cookies */

/**
 * Returns the value of a cookie by name.
 * @param {string} name
 * @param {object} [options]
 * @param {boolean} [options.parseJson=false] - If true, JSON-parses the value and returns an object instead of a string. (default: false)
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
 * Sets a cookie.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.value
 * @param {string|null} [params.path=null] (default: null)
 * @param {number|null} [params.expire=null] - Max-Age in seconds (default: null)
 * @example
 * // Cookie scoped to the current page only, lasting 15 days
 * setCookie({
 *   name: 'cookieName',
 *   value: 'cookieValue',
 *   path: window.location.pathname,
 *   expire: 15 * 24 * 60 * 60 // 15 days
 * });
 */
export function setCookie({name, value, path = null, expire = null}) {
  document.cookie = `${name}=${value}` +
    (path ? `; path=${path}` : '') +
    '; SameSite=Lax' +
    (expire ? `; Max-Age=${expire}` : '');
}
