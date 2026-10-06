/*! minimo - Generate Password */
/**
 * Genera una password casuale con lettere maiuscole e cifre,
 * escludendo i caratteri visivamente ambigui (O, I, 0).
 *
 * @param {number} [min_length=8] - Lunghezza minima della password (corrisponde all'attributo `minlength`) (default: 8)
 * @returns {string} La password generata.
 */
export function generatePwd(min_length = 8) {

  let chars='ABCDEFGHJKLMNPQRSTUVWXYZ123456789',
    charsNum = chars.length,
    min_lenght = min_length || 8,
    pwd = '', i, x;

  for( x = 0; x < min_lenght; x++ ) {
    i = Math.floor(Math.random() * charsNum);
    pwd += chars.charAt(i);
  }

  return pwd;

}
