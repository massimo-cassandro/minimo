/**
 * Restituisce una copia dell'array con gli elementi in ordine casuale (Fisher–Yates)
 * @param {Array<any>} arr - array di partenza (non viene modificato)
 * @returns {Array<any>} nuova copia mescolata
 * @example
 * shuffle([1, 2, 3]); // → es. [3, 1, 2]
 */
export function arrayShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
