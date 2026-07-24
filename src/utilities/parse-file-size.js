// @ts-check
/*! minimo - Parse File Size */

/**
 * Converts a file size in bytes to a human readable string,
 * using the most appropriate unit (bytes, KB, MB or GB).
 *
 * @example
 * parseFileSize(1536);      // "1.5 KB"
 * parseFileSize(10485760);  // "10 MB"
 *
 * @param {number} bytes - file size in bytes
 * @param {number} [decimals=1] - max number of decimal digits
 * @returns {string} formatted size (e.g. "1.5 MB")
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

  // \u202f = narrow no-break space
  return `${parseFloat(value.toFixed(decimals))}\u202f${units[exp]}`;
}
