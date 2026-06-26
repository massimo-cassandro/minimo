// @ts-check

/**
 * Generates a random ID string.
 * @returns {string} Base64-encoded random string
 */
export function randomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return chars[bytes[0] % 52] // first item is from first 52 chars (A-Za-z)
    + Array.from(bytes.slice(1), b => chars[b % 63]).join('');
}

