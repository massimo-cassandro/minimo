/** @typedef {string | null | undefined | false | 0} ClassValue */

/**
 * Joins CSS class names, filtering out falsy and non-string values.
 * Accepts strings, falsy values, and (nested) arrays of the same.
 * @param {...(ClassValue | ClassValue[])} args
 * @returns {string}
 */
export function classnames(...args) {
  return args.flat().filter(x => {
    if (x && typeof x !== 'string') {
      // eslint-disable-next-line no-console
      console.error('[classnames] non-string value ignored: ', ...args);
      return false;
    }
    return Boolean(x);
  }).join(' ');
}

/**
 * Like {@link classnames}, but returns `null` when the result is an empty string.
 * @param {...(ClassValue | ClassValue[])} args
 * @returns {string | null}
 */
export function classnamesNull(...args) {
  return classnames(...args) || null;
}
