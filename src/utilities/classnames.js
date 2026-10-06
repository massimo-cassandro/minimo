/*! minimo - Classnames */

/**
 * `MinimoClass | qualsiasi altra stringa`: mantiene l'autocomplete dell'editor per i nomi
 * di classe di minimo (vedi ../../types/classes.d.ts, generato automaticamente) pur
 * accettando nomi di classe arbitrari definiti dal consumer. Il branding `string & {}`
 * è un trucco TS che impedisce all'union di ridursi a semplice `string`,
 * cosa che disattiverebbe in silenzio l'autocomplete.
 * @typedef {import('../../types/classes.js').MinimoClass | (string & {})} ClassName
 */

/** @typedef {ClassName | null | undefined | false | 0} ClassValue */

/**
 * Unisce i nomi di classe CSS, scartando i valori falsy e non stringa.
 * Accetta stringhe, valori falsy e array (anche annidati) degli stessi.
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
 * Come {@link classnames}, ma restituisce `null` quando il risultato è una stringa vuota.
 * @param {...(ClassValue | ClassValue[])} args
 * @returns {string | null}
 */
export function classnamesNull(...args) {
  return classnames(...args) || null;
}
