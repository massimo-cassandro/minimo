import { getCellValue, getCellValues, resolveMustache } from './content-utils.js';
import { toNumber } from './data-types.js';
import { iconContent } from './icons.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').CellContent} CellContent */
/** @typedef {import('./parse-cols.js').ParsedCol} ParsedCol */

/**
 * Calcola il contenuto di una cella del body.
 *
 * Pipeline:
 * 1. `render` della colonna: funzione `(row, tr, td, subIdx)` o stringa in stile mustache (`[[key]]`, vedi
 *    `resolveMustache`: il risultato è markup, da inserire con `setContent(td, content, true)`); una funzione
 *    che restituisce `undefined` lascia proseguire la pipeline (utile per decorare solo `td`/`tr`), `null`
 *    dà `renderNullAs`
 * 2. valore della cella: il risultato di `parse` della colonna, se definito, altrimenti il valore grezzo
 * 3. valore `null`/`undefined` → `boolNullIcon` (tipo `bool`, se impostata), `nullContent` del data type, se definito,
 *    altrimenti `renderNullAs`
 * 4. `render(value, row, params)` del data type; `params` contiene le eventuali icone bool della colonna
 *    (`boolTrueIcon`, `boolFalseIcon`, `boolNullIcon`)
 * 5. valore così com'è
 *
 * @param {ParsedCol} col - Colonna analizzata
 * @param {Object} row - Oggetto riga
 * @param {JsonTableParams} params - Parametri risolti
 * @param {HTMLTableRowElement} [tr] - Elemento riga, passato al `render` della colonna
 * @param {HTMLTableCellElement} [td] - Elemento cella, passato al `render` della colonna
 * @param {number} [subIdx=0] - Indice del `<tr>` all'interno del record, vedi `rowspan` (default: 0)
 * @returns {CellContent}
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * cellContent(
 *   col, // colonna analizzata, OBBL
 *   row, // oggetto riga, OBBL
 *   params, // parametri risolti, OBBL
 *   tr, // elemento riga, FAC
 *   td, // elemento cella, FAC
 *   0 // indice del tr nel record, FAC
 * );
 *
 * @example
 * cellContent({ ...col, key: 'amount', _type: types.euro }, { amount: 12 }, params);   // → '12,00 €'
 * cellContent({ ...col, key: 'amount', _type: types.euro }, { amount: null }, params); // → '—' (renderNullAs)
 * cellContent({ ...col, render: '<b>[[name]]</b>' }, { name: 'Mario' }, params);      // → '<b>Mario</b>'
 * cellContent({ ...col, render: '<b>[[name]]</b>' }, { name: '<i>' }, params);        // → '<b>&lt;i&gt;</b>'
 * cellContent({ ...col, render: (row, tr, td) => { td.title = row.name; } }, row, params, tr, td);
 * // → data type / valore grezzo (render ha restituito undefined)
 * cellContent({ ...col, key: 'amount', parse: row => row.amount * 2, _type: types.euro }, { amount: 12 }, params); // → '24,00 €'
 */
export function cellContent(col, row, params, tr, td, subIdx = 0) {

  const nullAs = params.renderNullAs ?? '';
  // parametri con le eventuali icone bool della colonna (vedi `parseCols`)
  const typeParams = col._params ?? params;

  if (col.render != null) {
    const content = typeof col.render === 'function'
      ? col.render(row, tr, td, subIdx)
      : resolveMustache(String(col.render), row, nullAs);

    if (content !== undefined) {
      return content ?? nullAs;
    }
  }

  const value = getCellValue(row, col, subIdx);

  if (value == null) {
    if (col._type._boolNullIcon && typeParams.boolNullIcon != null) {
      return iconContent(typeParams.boolNullIcon, typeParams.iconFile, typeParams.iconClass);
    }
    return col._type.nullContent ?? nullAs;
  }

  if (typeof col._type.render === 'function') {
    return col._type.render(value, row, typeParams) ?? nullAs;
  }

  return value;
}


/**
 * Aggregati predefiniti del footer (`tfootRender: '@sum'`, ...), calcolati sui valori numerici
 * della colonna (i valori non numerici vengono saltati).
 * @type {Object<string, (nums: number[]) => number>}
 */
const aggregates = {
  '@sum': nums => nums.reduce((acc, n) => acc + n, 0),
  '@avg': nums => (nums.length ? nums.reduce((acc, n) => acc + n, 0) / nums.length : NaN),
  '@min': nums => (nums.length ? Math.min(...nums) : NaN),
  '@max': nums => (nums.length ? Math.max(...nums) : NaN),
  '@count': nums => nums.length
};


/**
 * Formatta un valore numerico del footer con il data type della colonna, con ripiego su
 * `toLocaleString(params.locale, params.numbersLocaleOpts)` se il data type non ha `render`.
 *
 * @param {ParsedCol} col - Colonna analizzata
 * @param {number} value - Valore da formattare
 * @param {JsonTableParams} params - Parametri risolti
 * @returns {CellContent}
 */
function formatTfootNumber(col, value, params) {
  return typeof col._type.render === 'function'
    ? col._type.render(value, null, params)
    : value.toLocaleString(params.locale, params.numbersLocaleOpts);
}


/**
 * Calcola il contenuto di una cella del footer dal `tfootRender` della colonna:
 * - funzione `(rows, td) => content`: se restituisce un numero, viene formattato dal data type della
 *   colonna come gli aggregati (es. un totale calcolato fuori dalla tabella); stringhe, Node, array
 *   domBuilder e `null`/`undefined` (→ cella vuota) restano invariati. Per un numero non formattato
 *   restituire una stringa
 * - aggregato predefinito `'@sum'`, `'@avg'`, `'@min'`, `'@max'` (formattato dal data
 *   type della colonna, ad es. come valuta per le colonne `euro`) oppure `'@count'` (numero di valori numerici)
 * - qualsiasi altra stringa: contenuto statico (ad es. un'etichetta "Totale")
 * - `null`: cella vuota
 *
 * @param {ParsedCol} col - Colonna analizzata
 * @param {Array<Object>} rows - Righe da aggregare (insieme filtrato o pagina corrente, vedi `updateFooterOnPageChange`)
 * @param {JsonTableParams} params - Parametri risolti
 * @param {HTMLTableCellElement} [td] - Elemento cella del footer, passato alla funzione `tfootRender`
 * @returns {CellContent}
 *
 * @example
 * tfootContent({ ...col, key: 'amount', tfootRender: '@sum', _type: types.euro }, rows, params); // → '1.234,56 €'
 * tfootContent({ ...col, tfootRender: 'Totale' }, rows, params);                                 // → 'Totale'
 * tfootContent({ ...col, tfootRender: rows => `${rows.length} righe` }, rows, params);           // → '10 righe'
 * tfootContent({ ...col, tfootRender: () => 15942.24, _type: types.euro }, rows, params);       // → '15.942,24 €'
 * tfootContent({ ...col, tfootRender: () => String(15942.24), _type: types.euro }, rows, params); // → '15942.24'
 * tfootContent({ ...col, tfootRender: null }, rows, params);                                     // → ''
 */
export function tfootContent(col, rows, params, td) {

  const renderer = col.tfootRender;

  if (renderer == null) {
    return '';
  }

  if (typeof renderer === 'function') {
    const content = renderer(rows, td);

    return typeof content === 'number'
      ? formatTfootNumber(col, content, params)
      : content ?? '';
  }

  const tpl = String(renderer);

  if (tpl.startsWith('@')) {
    const aggregate = aggregates[tpl];

    if (!aggregate) {
      // eslint-disable-next-line no-console
      console.error(`[json-table] colonna \`${col.key}\`: aggregato \`${tpl}\` non riconosciuto (disponibili: ${Object.keys(aggregates).join(', ')})`);
      return '';
    }

    // nelle colonne `_subRows` flatMap aggrega i singoli elementi degli array
    const nums = rows
      .flatMap(row => getCellValues(row, col))
      .map(toNumber)
      .filter(n => !Number.isNaN(n));

    const result = aggregate(nums);

    if (tpl === '@count') {
      return result.toLocaleString(params.locale);
    }

    return formatTfootNumber(col, result, params);
  }

  return tpl;
}
