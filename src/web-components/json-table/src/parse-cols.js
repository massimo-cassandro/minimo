
/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').ColDefinition} ColDefinition */
/** @typedef {import('./defaults.js').DataTypeDefinition} DataTypeDefinition */

/**
 * Definizione della colonna dopo l'analisi: ogni proprietà ha un valore, `condition` è risolto in un
 * booleano, `headerClass`/`cellClass` sono le stringhe di classi finali e `_type` è l'oggetto del data type.
 * @typedef {Required<Omit<ColDefinition, 'type'|'condition'|'sortValue'|'searchValue'>> & {
 *   condition: boolean,
 *   sortValue: *,
 *   searchValue: *,
 *   _type: DataTypeDefinition
 * }} ParsedCol
 */

/**
 * Default delle colonne.
 * @type {Omit<Required<ColDefinition>, 'type'|'sortValue'|'searchValue'> & { sortValue: *, searchValue: * }}
 */
export const colDefaults = {
  key: '',
  title: null,
  dataType: 'string',
  render: null,
  tfootRender: null,
  rowHeading: false,
  searchable: true,
  sortable: true,
  sortValue: undefined,
  searchValue: undefined,
  condition: true,
  headerClass: null,
  cellClass: null
};


/**
 * Normalizza il parametro `cols`: applica i default delle colonne e i `colDefaults` del data type,
 * risolve l'alias `type`/`dataType`, `condition` e i fallback di `headerClass`/`cellClass`,
 * ed elimina le colonne la cui `condition` è false.
 *
 * `cols` è obbligatorio: una definizione vuota o mancante lancia un errore.
 *
 * Ordine di unione (dal più basso): `colDefaults` ← `colDefaults` del data type ← definizione della colonna.
 * Risoluzione delle classi: `headerClass` = `headerClass` della colonna ?? `cellClass` della colonna ?? `headerClass` del tipo;
 * `cellClass` = `cellClass` della colonna ?? `headerClass` della colonna ?? `cellClass` del tipo.
 *
 * @param {ColDefinition[]|null|undefined} cols - Definizione delle colonne (`params.cols`)
 * @param {Object<string, DataTypeDefinition>} dataTypes - Mappa dei data type (vedi `buildDataTypes`)
 * @param {JsonTableParams} params - Parametri risolti (passati alle funzioni `condition`)
 * @returns {ParsedCol[]} Solo le colonne visibili
 * @throws {Error} In caso di `cols` mancante/vuoto, `key` mancante o data type sconosciuto
 *
 * @example
 * parseCols([
 *   { key: 'id', dataType: 'id' },                       // title: 'id' (default: key)
 *   { key: 'name', title: 'Nome', cellClass: 'fw-bold' }, // headerClass: 'fw-bold' (default: cellClass)
 *   { key: 'amount', type: 'euro', tfootRender: '@sum' }, // `type` alias di `dataType`
 *   { key: 'notes', condition: false }                     // scartata
 * ], dataTypes, params);
 */
export function parseCols(cols, dataTypes, params) {

  if (!Array.isArray(cols) || !cols.length) {
    throw new Error('[json-table] parametro `cols` mancante o vuoto: la definizione delle colonne è obbligatoria');
  }

  return cols
    .map((col, idx) => {

      if (col == null || typeof col !== 'object') {
        throw new Error(`[json-table] colonna #${idx}: definizione non valida`);
      }

      const dataType = col.dataType ?? col.type ?? 'string';
      const type = dataTypes[dataType];

      if (!type) {
        throw new Error(`[json-table] colonna #${idx} (${col.key}): dataType \`${dataType}\` non definito`);
      }

      // `type` è solo un alias di `dataType`: eliminato dalla definizione unita
      const colProps = { ...col };
      delete colProps.type;

      const merged = {
        ...colDefaults,
        ...(type.colDefaults ?? {}),
        ...colProps,
        dataType
      };

      if (!merged.key || typeof merged.key !== 'string') {
        throw new Error(`[json-table] colonna #${idx}: parametro \`key\` mancante`);
      }

      const condition = typeof merged.condition === 'function'
        ? merged.condition(params)
        : (merged.condition ?? true);

      return /** @type {ParsedCol} */ ({
        ...merged,
        title: merged.title ?? merged.key,
        condition: Boolean(condition),
        headerClass: merged.headerClass ?? merged.cellClass ?? type.headerClass ?? null,
        cellClass: merged.cellClass ?? merged.headerClass ?? type.cellClass ?? null,
        _type: type
      });
    })
    .filter(col => col.condition);
}
