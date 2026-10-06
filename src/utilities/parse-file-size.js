// @ts-check
/*! minimo - Parse File Size */

/**
 * Converte una dimensione di file in byte in una stringa leggibile,
 * usando l'unità più appropriata (bytes, KB, MB o GB).
 *
 * @example
 * parseFileSize(1536);      // "1.5 KB"
 * parseFileSize(10485760);  // "10 MB"
 *
 * @param {number} bytes - dimensione del file in byte
 * @param {number} [decimals=1] - numero massimo di cifre decimali (default: 1)
 * @returns {string} dimensione formattata (es. "1.5 MB")
 */
export function parseFileSize(bytes, decimals = 1) {

  if(typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    return '';
  }

  const units = ['bytes', 'KB', 'MB', 'GB'],
    k = 1024;

  const exp = bytes === 0
    ? 0
    : Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);

  const value = bytes / Math.pow(k, exp);

  // \u202f = narrow no-break space (spazio sottile non separabile)
  return `${parseFloat(value.toFixed(decimals))}\u202f${units[exp]}`;
}
