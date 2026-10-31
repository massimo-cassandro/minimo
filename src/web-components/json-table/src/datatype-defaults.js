
/**
 * Valori di default di un data type predefinito; `null` indica l'assenza di un default.
 *
 * @typedef {Object} DatatypeDefaults
 * @property {boolean} sortable - Default di `sortable` per le colonne di questo tipo
 * @property {boolean} searchable - Default di `searchable` per le colonne di questo tipo
 * @property {Array<keyof import('./defaults.js').JsonTableClasses>|null} headerClass - Classi del `<th>`, come chiavi di `params.classes`
 * @property {Array<keyof import('./defaults.js').JsonTableClasses>|null} cellClass - Classi delle celle, come chiavi di `params.classes`
 * @property {string|null} nullContent - Contenuto delle celle con valore `null`/`undefined`; con `null` si usa `renderNullAs`
 */

/**
 * Default dei data type predefiniti, per chiave del tipo. Le funzioni di ogni tipo (`render`, `sortValue`, ...)
 * sono in `data-types.js`, che unisce a esse questi valori.
 *
 * `sortable` e `searchable` restano sovrascrivibili nella definizione della colonna.
 *
 * @type {Object<string, DatatypeDefaults>}
 */
export const datatypeDefaults = {
  string: {
    sortable: true,
    searchable: true,
    headerClass: null,
    cellClass: null,
    nullContent: null
  },
  num: {
    sortable: true,
    searchable: true,
    headerClass: ['textEnd', 'numeric', 'nowrap'],
    cellClass: ['textEnd', 'numeric', 'nowrap'],
    nullContent: null
  },
  id: {
    sortable: true,
    searchable: false,
    headerClass: ['textEnd', 'numeric'],
    cellClass: ['textEnd', 'numeric'],
    nullContent: null
  },
  perc: {
    sortable: true,
    searchable: true,
    headerClass: ['textEnd', 'numeric', 'nowrap'],
    cellClass: ['textEnd', 'numeric', 'nowrap'],
    nullContent: null
  },
  percDecimal: {
    sortable: true,
    searchable: true,
    headerClass: ['textEnd', 'numeric', 'nowrap'],
    cellClass: ['textEnd', 'numeric', 'nowrap'],
    nullContent: null
  },
  currency: {
    sortable: true,
    searchable: true,
    headerClass: ['textEnd', 'numeric', 'nowrap'],
    cellClass: ['textEnd', 'numeric', 'nowrap'],
    nullContent: null
  },
  euro: {
    sortable: true,
    searchable: true,
    headerClass: ['textEnd', 'numeric', 'nowrap'],
    cellClass: ['textEnd', 'numeric', 'nowrap'],
    nullContent: null
  },
  date: {
    sortable: true,
    searchable: true,
    headerClass: ['textEnd', 'nowrap'],
    cellClass: ['textEnd', 'nowrap'],
    nullContent: null
  },
  datetime: {
    sortable: true,
    searchable: true,
    headerClass: ['textEnd', 'nowrap'],
    cellClass: ['textEnd', 'nowrap'],
    nullContent: null
  },
  bool: {
    sortable: true,
    searchable: false,
    headerClass: ['textCenter'],
    cellClass: null,
    nullContent: null
  },
  boolTrueOnly: {
    sortable: true,
    searchable: false,
    headerClass: ['textCenter'],
    cellClass: null,
    nullContent: ''
  },
  email: {
    sortable: true,
    searchable: true,
    headerClass: null,
    cellClass: null,
    nullContent: null
  }
};
