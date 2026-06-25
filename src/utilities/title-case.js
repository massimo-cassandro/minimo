/**
 * Converts a string to title case (first letter of each word uppercase, rest lowercase).
 * @param {string | null | undefined} str
 * @returns {string | null | undefined}
 */
export function titleCase(str) {

  if(str) {

    let parole = str.toLowerCase().split(' ');
    for (let i = 0; i < parole.length; i++) {
      parole[i] = parole[i].charAt(0).toUpperCase() + parole[i].slice(1);
    }
    str = parole.join(' ');
  }

  return str;
}
