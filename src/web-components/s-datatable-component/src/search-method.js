// @ts-nocheck

// Generazione della `searchMethod` di colonna usata da `_searchValue`.
//
// simple-datatables NON passa alla searchMethod il nodo DOM della cella, ma
// l'oggetto dati interno `cellType` ({ data, text?, order?, attributes? }):
// vedi `multiSearch` in `src/datatable.ts` (`customSearchMethod(queryColumnWord,
// searchRow[index], row, index, source)`). Gli `attributes` sono conservati
// nell'oggetto dati (`readDataCell` in `src/read_data.ts` ammette le chiavi
// "text", "order", "data", "attributes"), quindi `data-search` va letto da
// `cell.attributes['data-search']`, non con `cell.getAttribute()`.

// Punteggiatura rimossa quando `ignorePunctuation` è attivo
const PUNCTUATION_RX = /[.,/#!$%^&*;:{}=\-_`~()]/g;

/**
 * Normalizza una stringa replicando il trattamento che simple-datatables
 * applica ai termini di ricerca quando è attiva una `searchMethod` personalizzata.
 *
 * La libreria normalizza solo i termini digitati (non il contenuto della cella),
 * con i default `sensitivity: 'base'` e `ignorePunctuation: true`: se l'haystack
 * non riceve lo stesso trattamento, "citta" non troverebbe "Città" e "spa" non
 * troverebbe "S.p.A.".
 *
 * @param {*} str Valore da normalizzare (convertito con String()).
 * @param {object} [opts] (default: {})
 * @param {'base'|'accent'|'case'|'variant'} [opts.sensitivity='base']
 *        'base'    → ignora maiuscole/minuscole e diacritici
 *        'accent'  → ignora maiuscole/minuscole, mantiene i diacritici
 *        'case'    → distingue maiuscole/minuscole, ignora i diacritici
 *        'variant' → distingue tutto (default: 'base')
 * @param {boolean} [opts.ignorePunctuation=true] (default: true)
 * @returns {string}
 */
export function normalizeSearchString(str, opts = {}) {
  const sensitivity       = opts.sensitivity       ?? 'base';
  const ignorePunctuation = opts.ignorePunctuation ?? true;

  // String() anche su numeri/booleani: `_searchValue` come funzione può
  // restituire un id numerico o un flag
  let out = String(str ?? '');

  if (sensitivity === 'base' || sensitivity === 'accent') {
    out = out.toLowerCase();
  }
  if (sensitivity === 'base' || sensitivity === 'case') {
    out = out.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }
  if (ignorePunctuation) {
    out = out.replace(PUNCTUATION_RX, '');
  }

  return out;
}

/**
 * Restituisce la `searchMethod` di colonna per le colonne con `_searchValue`.
 *
 * API simple-datatables: (terms, cell, row, colIdx, source) => boolean
 * - `terms` array di stringhe (una per parola cercata), già normalizzate dalla libreria
 * - `cell`  oggetto dati `cellType` ({ data, text?, order?, attributes? })
 *
 * Comportamento AND: tutti i termini devono essere presenti
 * (come nella demo https://fiduswriter.github.io/simple-datatables/demos/22-and-search/).
 *
 * @param {object} [colSettings] Definizione della colonna (per `sensitivity` / `ignorePunctuation`). (default: {})
 * @returns {(terms: string[], cell: object) => boolean}
 */
export function makeSearchMethod(colSettings = {}) {
  const opts = {
    sensitivity:       colSettings.sensitivity,
    ignorePunctuation: colSettings.ignorePunctuation,
  };

  return (terms, cell) => {
    const raw = cell?.attributes?.['data-search']
      ?? cell?.text
      ?? (typeof cell?.data === 'string' || typeof cell?.data === 'number' ? cell.data : '');

    const haystack = normalizeSearchString(raw, opts);

    return terms.every(term => haystack.includes(normalizeSearchString(term, opts)));
  };
}
