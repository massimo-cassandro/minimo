/*! minimo - json-table: data types */

import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';
import { iconContent } from './icons.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').DataTypeDefinition} DataTypeDefinition */

/**
 * Converts a value to a number; empty strings and nullish values give `NaN`.
 * @param {*} value
 * @returns {number}
 *
 * @example
 * toNumber('12.5'); // → 12.5
 * toNumber('');     // → NaN
 * toNumber(null);   // → NaN
 */
export function toNumber(value) {
  if (value == null || value === '' || typeof value === 'boolean') {
    return NaN;
  }
  return typeof value === 'number' ? value : Number(value);
}


/**
 * Converts a boolean-like value (`true`/`false`, `1`/`0`, `'1'`/`'0'`, `'true'`/`'false'`)
 * to a boolean; every other value gives `null`, so that `null` can be told apart from `false`.
 * @param {*} value
 * @returns {boolean|null}
 *
 * @example
 * toBool(1);       // → true
 * toBool('false'); // → false
 * toBool(null);    // → null
 * toBool('abc');   // → null
 */
export function toBool(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === false || value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return null;
}


/**
 * Parses a date-like value: ISO string, timestamp, `Date` object or a Symfony-like object
 * (`{ date: '2022-12-02 06:18:55', timezone_type: 3, timezone: 'Europe/Berlin' }`).
 * TODO fuso orario degli oggetti Symfony non gestito (la stringa `date` è interpretata come ora locale)
 * @param {*} value
 * @returns {Date|null} `null` for empty or invalid values
 *
 * @example
 * parseDate('2024-01-31');                       // → Date
 * parseDate({ date: '2024-01-31 01:33:10' });    // → Date
 * parseDate('');                                 // → null
 */
export function parseDate(value) {
  if (value == null || value === '') {
    return null;
  }
  let date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'object' && Object.hasOwn(value, 'date')) {
    date = new Date(String(value.date).replace(' ', 'T'));
  } else {
    date = new Date(value);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}


/**
 * Formats a numeric value, applying `renderNaNAs` and `renderZeroAs`.
 * @param {*} value - Raw value
 * @param {JsonTableParams} params - Resolved params
 * @param {Intl.NumberFormatOptions} formatOpts - `toLocaleString` options
 * @param {(formatted: string, num: number) => string} [wrap] - Optional decorator of the formatted string
 * @returns {string}
 *
 * @example
 * formatNumber(1529.42, params, { maximumFractionDigits: 2 });            // → '1.529,42' (it-IT)
 * formatNumber('abc', params, {});                                        // → params.renderNaNAs ('—')
 * formatNumber(0, { ...params, renderZeroAs: '-' }, {});                  // → '-'
 * formatNumber(4.63, params, {}, s => `${s}\u202F<small>%</small>`);      // → '4,63 <small>%</small>'
 */
export function formatNumber(value, params, formatOpts, wrap) {
  const num = toNumber(value);
  if (Number.isNaN(num)) {
    return params.renderNaNAs ?? '';
  }
  if (num === 0 && params.renderZeroAs != null) {
    return params.renderZeroAs;
  }
  const formatted = num.toLocaleString(params.locale, formatOpts);
  return wrap ? wrap(formatted, num) : formatted;
}


/**
 * Built-in data types, built on the resolved params (class names, locale options, icons).
 *
 * | key           | description                                                     | cell classes            |
 * |---------------|-----------------------------------------------------------------|-------------------------|
 * | `string`      | default type, value as-is                                       | –                       |
 * | `num`         | number formatted with `numbersLocaleOpts`                       | textEnd numeric nowrap  |
 * | `id`          | numeric id: raw value, right aligned, not searchable            | textEnd numeric         |
 * | `perc`        | percentage already in 0–100 scale, `currPercLocaleOpts` + " %"  | textEnd numeric nowrap  |
 * | `percDecimal` | percentage in 0–1 scale (multiplied by 100)                     | textEnd numeric nowrap  |
 * | `currency`    | `Intl` currency format, `params.currency`                       | textEnd numeric nowrap  |
 * | `euro`        | as `currency`, EUR forced                                       | textEnd numeric nowrap  |
 * | `date`        | `<time>` element, `datesLocaleOpts`                             | textEnd nowrap          |
 * | `datetime`    | as `date`, plus time part (`timesLocaleOpts`)                   | textEnd nowrap          |
 * | `bool`        | `boolTrueIcon`/`boolFalseIcon`; not sortable/searchable         | (internal icon styles)  |
 * | `email`       | soft line breaks around `@`                                     | –                       |
 *
 * @param {JsonTableParams} params - Resolved params
 * @returns {Object<string, DataTypeDefinition>}
 *
 * @example
 * const types = builtInDataTypes(params);
 * types.num.render(1529.42, row, params); // → '1.529,42'
 */
export function builtInDataTypes(params) {

  const c = params.classes;
  const numericClass = classnames(c.textEnd, c.numeric, c.nowrap);
  const dateClass = classnames(c.textEnd, c.nowrap);

  /** @type {(formatOpts: Intl.NumberFormatOptions, wrap?: (formatted: string, num: number) => string) => DataTypeDefinition} */
  const numericType = (formatOpts, wrap) => ({
    headerClass: numericClass,
    cellClass: numericClass,
    render: (value, row, p) => formatNumber(value, p, formatOpts, wrap),
    sortValue: value => toNumber(value),
    searchValue: (value, row, p) => {
      const num = toNumber(value);
      return Number.isNaN(num) ? '' : num.toLocaleString(p.locale, formatOpts);
    }
  });

  /** @type {(withTime: boolean) => DataTypeDefinition} */
  const dateType = withTime => ({
    headerClass: dateClass,
    cellClass: dateClass,
    render: (value, row, p) => {
      const date = parseDate(value);
      if (!date) {
        return p.renderNaNAs ?? '';
      }
      const iso = date.toISOString();
      return `<time datetime="${withTime ? iso : iso.substring(0, 10)}">` +
        date.toLocaleString(p.locale, p.datesLocaleOpts) +
        (withTime ? ' <small>' + date.toLocaleString(p.locale, p.timesLocaleOpts) + '</small>' : '') +
        '</time>';
    },
    sortValue: value => parseDate(value)?.getTime() ?? null,
    searchValue: (value, row, p) => {
      const date = parseDate(value);
      return date
        ? date.toLocaleString(p.locale, { ...p.datesLocaleOpts, ...(withTime ? p.timesLocaleOpts : {}) })
        : '';
    }
  });

  const percWrap = /** @type {(formatted: string) => string} */ (formatted => `${formatted}\u202F<small>%</small>`);

  return {

    string: {},

    num: numericType(params.numbersLocaleOpts),

    id: {
      headerClass: classnames(c.textEnd, c.numeric),
      cellClass: classnames(c.textEnd, c.numeric),
      sortValue: value => toNumber(value),
      colDefaults: { searchable: false }
    },

    perc: numericType(params.currPercLocaleOpts, percWrap),

    percDecimal: {
      ...numericType(params.currPercLocaleOpts, percWrap),
      render: (value, row, p) => formatNumber(toNumber(value) * 100, p, p.currPercLocaleOpts, percWrap)
    },

    currency: numericType({ style: 'currency', currency: params.currency, ...params.currPercLocaleOpts }),

    euro: numericType({ style: 'currency', currency: 'EUR', ...params.currPercLocaleOpts }),

    date: dateType(false),

    datetime: dateType(true),

    bool: {
      headerClass: c.textCenter,
      cellClass: null,
      internalCellClass: value => {
        const bool = toBool(value);
        return classnames(
          styles.boolCell, c.boolCell,
          bool === true && [styles.boolTrue, c.boolTrue],
          bool === false && [styles.boolFalse, c.boolFalse]
        );
      },
      render: (value, row, p) => {
        const bool = toBool(value);
        if (bool === true) {
          return iconContent(p.boolTrueIcon);
        }
        if (bool === false) {
          return iconContent(p.boolFalseIcon);
        }
        return p.renderNullAs ?? '';
      },
      sortValue: value => {
        const bool = toBool(value);
        return bool === null ? -1 : (bool ? 1 : 0);
      },
      searchValue: () => '',
      colDefaults: { sortable: false, searchable: false }
    },

    email: {
      render: value => String(value).replace('@', '<wbr>@<wbr>')
    }
  };
}


/**
 * Merges the custom data types (`params.dataTypes`) with the built-in ones.
 *
 * A custom key matching a built-in type overrides only the given properties; a new key can
 * extend a built-in type via `inheritsFrom`.
 *
 * @param {JsonTableParams} params - Resolved params
 * @returns {Object<string, DataTypeDefinition>} The complete data types map
 * @throws {Error} When `inheritsFrom` refers to an unknown type
 *
 * @example
 * const types = buildDataTypes({
 *   ...params,
 *   dataTypes: {
 *     num: { cellClass: 'text-end fw-bold' },                 // overrides only `cellClass` of the built-in `num`
 *     km: { inheritsFrom: 'num', render: v => `${v} km` }     // new type based on `num`
 *   }
 * });
 */
export function buildDataTypes(params) {

  const builtIn = builtInDataTypes(params);
  const result = { ...builtIn };

  for (const [key, def] of Object.entries(params.dataTypes ?? {})) {

    if (def == null || typeof def !== 'object') {
      continue;
    }

    const baseKey = builtIn[key] ? key : def.inheritsFrom;
    const base = baseKey ? result[baseKey] : null;

    if (def.inheritsFrom && !base) {
      throw new Error(`[json-table] dataType \`${key}\`: \`inheritsFrom\` fa riferimento a un tipo inesistente (${def.inheritsFrom})`);
    }

    result[key] = { ...(base ?? {}), ...def };
  }

  return result;
}
