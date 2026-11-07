/*! minimo - Title Case */
/**
 * Converte una stringa in title case (prima lettera di ogni parola maiuscola, il resto minuscolo).
 * @param {string | null | undefined} str
 * @param {object} [options]
 * @param {boolean} [options.capitalizeAfterApostrophe=false] - Rende maiuscola anche la lettera che segue un apostrofo (`'` o `’`),
 * @returns {string | null | undefined}
 * @example
 * titleCase("D'ACQUA"); // "D'acqua"
 * titleCase("D'ACQUA", { capitalizeAfterApostrophe: true }); // "D'Acqua"
 */
export function titleCase(str, { capitalizeAfterApostrophe = false } = {}) {

  if(str) {

    let parole = str.toLowerCase().split(' ');
    for (let i = 0; i < parole.length; i++) {
      parole[i] = parole[i].charAt(0).toUpperCase() + parole[i].slice(1);

      if(capitalizeAfterApostrophe) {
        parole[i] = parole[i].replace(/(['’])(\p{L})/gu, (_, apostrofo, lettera) => apostrofo + lettera.toUpperCase());
      }
    }
    str = parole.join(' ');
  }

  return str;
}
