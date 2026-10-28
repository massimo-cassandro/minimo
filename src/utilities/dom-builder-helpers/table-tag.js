
/**
 * @typedef {string | number | Node | Function | DomBuilderItem | DomBuilderItem[] | null} TableCellContent
 * Contenuto di una cella: testo, stringa html, `Node`, funzione che restituisce una stringa o un `Node`,
 * singolo oggetto domBuilder o array di oggetti domBuilder.
 */

/**
 * @typedef {Object} TableCell
 * @property {string | string[] | null} [class=null] - Classname della cella (default: null)
 * @property {TableCellContent} [content=null] - Contenuto della cella: testo, html, `Node`, funzione, oggetto o array domBuilder (default: null)
 * @property {boolean} [heading=false] - La cella è un th? (NB: parametro ignorato nel thead, dove è sempre true) (default: false)
 * @property {Record<string, any>} [attrs] - Attributi opzionali della cella (default: null)
 */

/**
 * @typedef {string | number | Node | Function | DomBuilderItem[] | TableCell | null} TableCellInput
 * Cella in forma abbreviata o estesa: stringa, numero, `Node`, funzione o array domBuilder sono interpretati come
 * `content`; un oggetto semplice è un `TableCell` esteso. Per usare un singolo oggetto domBuilder come contenuto
 * indicarlo in forma estesa: `{ content: { tag: ... } }`.
 */

/**
 * @typedef {Object} TableRow
 * @property {string | string[] | null} [class=null] - Classname del tr (default: null)
 * @property {Record<string, any>} [attrs] - Attributi opzionali del tr (default: null)
 * @property {TableCellInput[]} cells - Celle della riga.
 */

/**
 * @typedef {TableCellInput[] | TableRow} TableRowInput
 * Riga in forma abbreviata (array di celle) o estesa (oggetto `TableRow`).
 */

/**
 * @typedef {Object} TableSection
 * @property {string | string[] | null} [class=null] - Classname della sezione (thead, tbody o tfoot) (default: null)
 * @property {Record<string, any>} [attrs] - Attributi opzionali della sezione (default: null)
 * @property {TableRowInput[]} [rows] - Righe della sezione.
 * @property {TableCellInput[]} [cells] - Scorciatoia per una sezione con una sola riga (ignorata se è presente `rows`).
 */

/**
 * @typedef {TableCellInput[] | TableRowInput[] | TableSection} TableSectionInput
 * Sezione in forma abbreviata o estesa:
 * - array piatto di celle → una sola riga
 * - array di righe (ogni riga è un array di celle o un oggetto `{ cells }`)
 * - oggetto `TableSection` con `rows` oppure `cells`
 *
 * NB: un array è interpretato come array di righe se il primo elemento è a sua volta un array
 * o un oggetto con la proprietà `cells`. Per una singola riga il cui primo contenuto è un array domBuilder
 * usare la forma estesa `{ content: [...] }`.
 */


/**
 * Normalizza il contenuto di una cella: un singolo oggetto domBuilder viene racchiuso in un array,
 * dato che `domBuilder` accetta come `content` solo stringhe, numeri, `Node`, funzioni e array.
 *
 * @param {TableCellContent} [content]
 * @returns {string | number | Node | Function | DomBuilderItem[] | null}
 */
function normalizeCellContent(content = null) {
  if (content != null && typeof content === 'object' && !Array.isArray(content) && !(content instanceof Node)) {
    return [content];
  }
  return content ?? null;
}


/**
 * @param {unknown} value
 * @returns {boolean} `true` per un oggetto semplice (non `null`, non array, non `Node`).
 */
function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Node);
}


/**
 * Porta una cella in forma estesa.
 *
 * @param {TableCellInput} cell
 * @returns {TableCell}
 */
function normalizeCell(cell) {
  return isPlainObject(cell)
    ? /** @type {TableCell} */ (cell)
    : { content: /** @type {TableCellContent} */ (cell) };
}


/**
 * Porta una riga in forma estesa.
 *
 * @param {TableRowInput} row
 * @returns {TableRow}
 */
function normalizeRow(row) {
  return Array.isArray(row)
    ? { cells: row }
    : row;
}


/**
 * Porta una sezione in forma estesa (`{ class, attrs, rows: [{ cells }] }`).
 *
 * @param {TableSectionInput} section
 * @returns {{ class?: string | string[] | null, attrs?: Record<string, any>, rows: TableRow[] }}
 */
function normalizeSection(section) {

  if (Array.isArray(section)) {
    const first = section[0];
    const isRowsArray = Array.isArray(first) || (isPlainObject(first) && 'cells' in /** @type {object} */ (first));

    return {
      rows: isRowsArray
        ? /** @type {TableRowInput[]} */ (section).map(normalizeRow)
        : [{ cells: /** @type {TableCellInput[]} */ (section) }]
    };
  }

  const { rows, cells, ...rest } = section;

  return {
    ...rest,
    rows: (rows ?? (cells ? [{ cells }] : [])).map(normalizeRow)
  };
}


/**
 * Costruisce l'item domBuilder di una sezione della tabella (thead, tbody o tfoot).
 *
 * @param {'thead' | 'tbody' | 'tfoot'} tag
 * @param {TableSectionInput | null} sectionInput
 * @returns {DomBuilderItem | null} `null` se la sezione non è definita.
 */
function buildSection(tag, sectionInput) {

  if (sectionInput == null) {
    return null;
  }

  const section = normalizeSection(sectionInput);
  const isHead = tag === 'thead';

  return {
    tag,
    class: section.class ?? undefined,
    attrs: section.attrs,
    children: section.rows.map(row => ({
      tag: 'tr',
      class: row.class ?? undefined,
      attrs: row.attrs,
      children: (row.cells ?? []).map(cellInput => {

        const cell = normalizeCell(cellInput);
        const isTh = isHead || cell.heading === true;

        return {
          tag: isTh ? 'th' : 'td',
          class: cell.class ?? undefined,
          attrs: {
            // scope: sempre `col` nel thead, `row` per i th di tbody/tfoot (sovrascrivibile da `attrs`)
            ...(isTh && !isHead ? { scope: 'row' } : {}),
            ...(cell.attrs ?? {}),
            ...(isHead ? { scope: 'col' } : {})
          },
          content: normalizeCellContent(cell.content)
        };
      })
    }))
  };
}


/**
 * Table builder
 * Restituisce un oggetto domBuilder per una tabella.
 *
 * Ogni sezione (`thead`, `tbody`, `tfoot`) accetta sia una forma abbreviata sia una estesa:
 * - cella: stringa, numero, `Node`, funzione o array domBuilder (= `content`), oppure oggetto `{ content, class, attrs, heading }`
 * - riga: array di celle, oppure oggetto `{ cells, class, attrs }`
 * - sezione: array piatto di celle (una sola riga), array di righe, oppure oggetto `{ rows | cells, class, attrs }`
 *
 * @param {Object} args
 * @param {string | string[]} [args.classname='table'] - Classe del tag table (default: 'table')
 * @param {Record<string, any>} [args.attrs] - Oggetto opzionale di attributi del tag table (default: null)
 * @param {TableSectionInput | null} [args.thead=null] - Oggetto opzionale per il tag thead (default: null)
 * @param {TableSectionInput | null} [args.tbody=null] - Oggetto opzionale per il tag tbody (default: null)
 * @param {TableSectionInput | null} [args.tfoot=null] - Oggetto opzionale per il tag tfoot (default: null)
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildTableTag({
 *   classname: 'table', // classe del tag table, FAC
 *   attrs: null, // attributi del tag table, FAC
 *   thead: null, // celle/righe del thead, FAC
 *   tbody: null, // celle/righe del tbody, FAC
 *   tfoot: null, // celle/righe del tfoot, FAC
 * });
 *
 * @example
 * buildTableTag({
 *   classname: 'table', // default: 'table'
 *   attrs: { id: 'my-table' }, // default: null
 *
 *   // array piatto di celle: una sola riga (caso più comune)
 *   thead: ['Nome', 'Email', { content: 'Importo', class: 'text-end' }],
 *
 *   // array di righe; ogni riga è un array di celle o un oggetto { cells }
 *   tbody: [
 *     [
 *       { content: 'Mario', heading: true }, // th scope="row"
 *       'mario@x.it', // testo
 *       { content: '<strong>10</strong>', class: 'text-end' }, // html
 *       { content: { tag: 'a', attrs: { href: '#' }, content: 'dettagli' } } // singolo oggetto domBuilder
 *     ],
 *     {
 *       class: 'is-selected',
 *       attrs: { 'data-id': 2 },
 *       cells: [
 *         'Anna',
 *         'anna@x.it',
 *         '12',
 *         [{ tag: 'em', content: 'a' }, { tag: 'em', content: 'b' }] // array domBuilder
 *       ]
 *     }
 *   ],
 *
 *   // forma estesa della sezione: { class, attrs, rows | cells }
 *   tfoot: { class: 'table-light', cells: ['Totale', '', '', { content: '22', class: 'text-end' }] }
 *   // oppure: tfoot: null (default)
 * });
 *
 * @example
 * // thead con più righe (es. colspan nella prima)
 * buildTableTag({
 *   thead: [
 *     [{ content: 'Contatti', attrs: { colspan: 2 } }, 'Importo'],
 *     ['Nome', 'Email', 'Importo']
 *   ]
 * });
 *
 * @returns {DomBuilderItem} L'item domBuilder del tag `table`.
 */
export function buildTableTag({
  classname = 'table',
  attrs,
  thead = null,
  tbody = null,
  tfoot = null
} = {}) {

  return {
    tag: 'table',
    class: classname,
    attrs: attrs,
    children: [
      buildSection('thead', thead),
      buildSection('tbody', tbody),
      buildSection('tfoot', tfoot)
    ].filter(/** @returns {item is DomBuilderItem} */ item => item != null)
  };

}
