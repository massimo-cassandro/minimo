/*! minimo - Title Case */
/**
 * Converte una stringa in title case (prima lettera di ogni parola maiuscola, il resto minuscolo).
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
