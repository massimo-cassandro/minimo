
/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').ColDefinition} ColDefinition */
/** @typedef {import('./defaults.js').DataTypeDefinition} DataTypeDefinition */

/**
 * Definizione della colonna dopo l'analisi: ogni proprietà ha un valore, `condition` è risolto in un
 * booleano, `headerClass`/`cellClass` sono le stringhe di classi finali e `_type` è l'oggetto del data type.
 * `_subRows` è true per le colonne senza `rowspan` di una tabella in cui almeno un'altra colonna lo definisce:
 * le loro celle vengono ripetute su ogni `<tr>` del record.
 * @typedef {Required<Omit<ColDefinition, 'type'|'condition'|'sortValue'|'searchValue'>> & {
 *   condition: boolean,
 *   sortValue: *,
 *   searchValue: *,
 *   _type: DataTypeDefinition,
 *   _subRows: boolean
 * }} ParsedCol
 */

/** Messaggio dell'errore per il parametro `cols` mancante o vuoto. */
export const MISSING_COLS_MESSAGE = '[json-table] parametro `cols` mancante o vuoto: la definizione delle colonne è obbligatoria';


/**
 * Default delle colonne.
 * @type {Omit<Required<ColDefinition>, 'type'|'sortValue'|'searchValue'> & { sortValue: *, searchValue: * }}
 */
export const colDefaults = {
  key: '',
  title: null,
  dataType: 'string',
  parse: null,
  render: null,
  tfootRender: null,
  rowHeading: false,
  rowspan: null,
  searchable: true,
  sortable: true,
  sortValue: undefined,
  searchValue: undefined,
  sortKeys: null,
  searchKeys: null,
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
 * @throws {Error} In caso di `cols` mancante/vuoto, `key` mancante, data type sconosciuto, `sortKeys`/`searchKeys`
 *   o `parse` non validi, `rowspan` definito su tutte le colonne visibili o `render` stringa su una colonna ripetuta su più `<tr>`
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
    throw new Error(MISSING_COLS_MESSAGE);
  }

  const parsedCols = cols
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

      ['sortKeys', 'searchKeys'].forEach(param => {
        const keys = merged[param];
        if (keys != null && !(Array.isArray(keys) && keys.length && keys.every(k => k && typeof k === 'string'))) {
          throw new Error(`[json-table] colonna \`${merged.key}\`: \`${param}\` deve essere un array di stringhe non vuoto`);
        }
      });

      if (merged.parse != null && typeof merged.parse !== 'function') {
        throw new Error(`[json-table] colonna \`${merged.key}\`: \`parse\` deve essere una funzione`);
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

  const hasRowspan = parsedCols.some(col => col.rowspan != null);

  if (hasRowspan && parsedCols.every(col => col.rowspan != null)) {
    throw new Error('[json-table] parametro `rowspan`: almeno una colonna deve esserne priva');
  }

  return parsedCols.map(col => {
    const subRows = hasRowspan && col.rowspan == null;

    // una stringa mustache non può selezionare l'elemento dell'array corrispondente al `<tr>`
    if (subRows && typeof col.render === 'string') {
      throw new Error(`[json-table] colonna \`${col.key}\`: con \`rowspan\` su altre colonne, \`render\` deve essere una funzione`);
    }

    return { ...col, _subRows: subRows };
  });
}


/**
 * Segnala in console i parametri di colonna che non hanno effetto nella modalità corrente: `sortValue`/`searchValue`
 * con `serverSide` attivo (il server riceve solo le chiavi), `sortKeys`/`searchKeys` in modalità client-side e con
 * `jqDatatableMode`. Le funzioni dei data type non vengono considerate.
 * Solo con `debug` attivo segnala anche le colonne ordinabili con `parse` in modalità server-side: il server riceve la
 * `key`, non il valore calcolato, ma il componente non può sapere se la gestisce comunque (avviso assente con `sortKeys`,
 * che indica il campo da usare; con `jqDatatableMode` non è disponibile).
 *
 * @param {ParsedCol[]} cols - Colonne analizzate
 * @param {JsonTableParams} params - Parametri risolti, dopo la validazione (`serverSide` è la modalità effettiva)
 * @returns {void}
 */
export function warnIneffectiveColParams(cols, params) {
  const { serverSide, jqDatatableMode } = params;
  const keysAvailable = serverSide && !jqDatatableMode;
  const mode = jqDatatableMode && serverSide ? '`jqDatatableMode`' : `modalità ${serverSide ? 'server-side' : 'client-side'}`;

  cols.forEach(col => {
    const names = [
      serverSide && col.sortable && col.sortValue !== undefined && 'sortValue',
      serverSide && col.searchable && col.searchValue !== undefined && 'searchValue',
      !keysAvailable && col.sortKeys != null && 'sortKeys',
      !keysAvailable && col.searchKeys != null && 'searchKeys'
    ].filter(Boolean).map(name => `\`${name}\``);

    if (names.length) {
      const hint = keysAvailable ? ': usare `sortKeys` / `searchFields`' : '';
      // eslint-disable-next-line no-console
      console.warn(`[json-table] colonna \`${col.key}\`: ${names.join(', ')} ${names.length > 1 ? 'non hanno' : 'non ha'} effetto con ${mode}${hint}`);
    }

    if (params.debug && serverSide && col.sortable && col.parse && (jqDatatableMode || col.sortKeys == null)) {
      const fix = jqDatatableMode ? 'gestire la colonna sul server' : 'indicare il campo con `sortKeys`';
      // eslint-disable-next-line no-console
      console.warn(`[json-table] colonna \`${col.key}\`: il server ordina in base alla \`key\`, non al valore calcolato da \`parse\`: se non la gestisce, ${fix} oppure impostare \`sortable: false\``);
    }
  });
}
