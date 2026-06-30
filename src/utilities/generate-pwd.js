/**
 * Generates a random password using uppercase letters and digits,
 * excluding visually ambiguous characters (O, I, 0).
 *
 * @param {number} [min_length=8] - Minimum password length (matches `minlength` attribute).
 * @returns {string} The generated password.
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
