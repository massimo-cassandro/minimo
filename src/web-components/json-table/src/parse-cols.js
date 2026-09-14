/*! minimo - json-table: columns parsing */

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').ColDefinition} ColDefinition */
/** @typedef {import('./defaults.js').DataTypeDefinition} DataTypeDefinition */

/**
 * Column definition after parsing: every property has a value, `condition` is resolved to a
 * boolean, `headerClass`/`cellClass` are the final class strings and `_type` is the data type object.
 * @typedef {Required<Omit<ColDefinition, 'type'|'condition'|'sortValue'|'searchValue'>> & {
 *   condition: boolean,
 *   sortValue: *,
 *   searchValue: *,
 *   _type: DataTypeDefinition
 * }} ParsedCol
 */

/**
 * Column defaults.
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
 * Normalizes the `cols` param: applies the column defaults and the data type `colDefaults`,
 * resolves the `type`/`dataType` alias, the `condition` and the `headerClass`/`cellClass`
 * fallbacks, and drops the columns whose `condition` is false.
 *
 * When `cols` is empty, one `string` column per key of `firstRow` is generated (title = key).
 *
 * Merge order (lowest first): `colDefaults` ← data type `colDefaults` ← column definition.
 * Class resolution: `headerClass` = column `headerClass` ?? column `cellClass` ?? type `headerClass`;
 * `cellClass` = column `cellClass` ?? column `headerClass` ?? type `cellClass`.
 *
 * @param {ColDefinition[]|null|undefined} cols - Columns definition (`params.cols`)
 * @param {Object<string, DataTypeDefinition>} dataTypes - Data types map (see `buildDataTypes`)
 * @param {JsonTableParams} params - Resolved params (passed to `condition` functions)
 * @param {Object|undefined} [firstRow] - First data row, used to generate the columns when `cols` is empty
 * @returns {ParsedCol[]} Visible columns only
 * @throws {Error} On missing `key` or unknown data type
 *
 * @example
 * parseCols([
 *   { key: 'id', dataType: 'id' },                       // title: 'id' (default: key)
 *   { key: 'name', title: 'Nome', cellClass: 'fw-bold' }, // headerClass: 'fw-bold' (default: cellClass)
 *   { key: 'amount', type: 'euro', tfootRender: '@sum' }, // `type` alias of `dataType`
 *   { key: 'notes', condition: false }                     // dropped
 * ], dataTypes, params);
 */
export function parseCols(cols, dataTypes, params, firstRow) {

  let list = Array.isArray(cols) ? cols : [];

  if (!list.length && firstRow != null && typeof firstRow === 'object') {
    list = Object.keys(firstRow).map(key => ({ key, title: key }));
  }

  return list
    .map((col, idx) => {

      if (col == null || typeof col !== 'object') {
        throw new Error(`[json-table] colonna #${idx}: definizione non valida`);
      }

      const dataType = col.dataType ?? col.type ?? 'string';
      const type = dataTypes[dataType];

      if (!type) {
        throw new Error(`[json-table] colonna #${idx} (${col.key}): dataType \`${dataType}\` non definito`);
      }

      // `type` is only an alias of `dataType`: dropped from the merged definition
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
