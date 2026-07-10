// @ts-check

/**
 * Returns the value of a cookie by name.
 * @param {string} name
 * @returns {string | undefined}
 */
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}


/**
 * Sets a cookie.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.value
 * @param {string|null} [params.path=null]
 * @param {number|null} [params.expire=null] - Max-Age in seconds
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
