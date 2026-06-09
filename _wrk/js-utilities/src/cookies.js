
export function getCookie(cookie_name, valRegexpString=null) {
  const regexp = new RegExp(`(?:; ?|^)\b${cookie_name}` +
    (valRegexpString? `=${valRegexpString}` : '') +
    '\b;?');
  return document.cookie?.match(regexp)?? null;
}

// expire: secondi o null
export function setCookie(name, value, expire=null) {
  document.cookie =`${name}=${value}${expire? `;max-age=${expire}` : ''};samesite=lax;secure=1`;
}
