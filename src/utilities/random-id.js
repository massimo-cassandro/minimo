// @ts-check
/*! minimo - Random Id */

/**
 * Genera una stringa ID casuale.
 * @returns {string} Stringa casuale codificata in Base64
 */
export function randomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return chars[bytes[0] % 52] // il primo carattere proviene dai primi 52 (A-Za-z)
    + Array.from(bytes.slice(1), b => chars[b % 63]).join('');
}

