
import * as styles from '../json-table-component.module.css';
import { classnames } from '../../../utilities/classnames.js';
import { iconContent } from './icons.js';

/** @typedef {import('./defaults.js').JsonTableParams} JsonTableParams */
/** @typedef {import('./defaults.js').DataTypeDefinition} DataTypeDefinition */

/**
 * Converte un valore in numero; le stringhe vuote e i valori nullish danno `NaN`.
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
 * Converte un valore simile a un booleano (`true`/`false`, `1`/`0`, `'1'`/`'0'`, `'true'`/`'false'`)
 * in booleano; ogni altro valore dà `null`, così che `null` si distingua da `false`.
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
 * Analizza un valore simile a una data: stringa ISO, timestamp, oggetto `Date` o un oggetto in stile Symfony
 * (`{ date: '2022-12-02 06:18:55', timezone_type: 3, timezone: 'Europe/Berlin' }`).
 * TODO fuso orario degli oggetti Symfony non gestito (la stringa `date` è interpretata come ora locale)
 * @param {*} value
 * @returns {Date|null} `null` per i valori vuoti o non validi
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
 * Formatta un valore numerico, applicando `renderNaNAs` e `renderZeroAs`.
 * @param {*} value - Valore grezzo
 * @param {JsonTableParams} params - Parametri risolti
 * @param {Intl.NumberFormatOptions} formatOpts - Opzioni di `toLocaleString`
 * @param {(formatted: string, num: number) => string} [wrap] - Decoratore opzionale della stringa formattata
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
 * Data type predefiniti, costruiti sui parametri risolti (nomi delle classi, opzioni locale, icone).
 *
 * | chiave        | descrizione                                                     | classi della cella      |
 * |---------------|-----------------------------------------------------------------|-------------------------|
 * | `string`      | tipo predefinito, valore così com'è                             | –                       |
 * | `num`         | numero formattato con `numbersLocaleOpts`                       | textEnd numeric nowrap  |
 * | `id`          | id numerico: valore grezzo, allineato a destra, non ricercabile | textEnd numeric         |
 * | `perc`        | percentuale già in scala 0–100, `currPercLocaleOpts` + " %"     | textEnd numeric nowrap  |
 * | `percDecimal` | percentuale in scala 0–1 (moltiplicata per 100)                 | textEnd numeric nowrap  |
 * | `currency`    | formato valuta `Intl`, `params.currency`                        | textEnd numeric nowrap  |
 * | `euro`        | come `currency`, EUR forzato                                    | textEnd numeric nowrap  |
 * | `date`        | elemento `<time>`, `datesLocaleOpts`                            | textEnd nowrap          |
 * | `datetime`    | come `date`, più la parte oraria (`timesLocaleOpts`)            | textEnd nowrap          |
 * | `bool`        | `boolTrueIcon`/`boolFalseIcon`; non ordinabile/ricercabile      | (stili interni delle icone) |
 * | `email`       | a capo morbidi attorno a `@`                                    | –                       |
 *
 * @param {JsonTableParams} params - Parametri risolti
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

  // TODO implementare sfTime / sfDatetime (??)
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
        `<span class="${c.nowrap}">` + date.toLocaleString(p.locale, p.datesLocaleOpts) + '</span>' +
        (withTime ? ' <small>' + date.toLocaleString(p.locale, p.timesLocaleOpts) + '</small>' : '') +
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
 * Unisce i data type personalizzati (`params.dataTypes`) a quelli predefiniti.
 *
 * Una chiave personalizzata che corrisponde a un tipo predefinito ne sovrascrive solo le proprietà indicate; una nuova chiave può
 * estendere un tipo predefinito tramite `inheritsFrom`.
 *
 * @param {JsonTableParams} params - Parametri risolti
 * @returns {Object<string, DataTypeDefinition>} La mappa completa dei data type
 * @throws {Error} Quando `inheritsFrom` si riferisce a un tipo sconosciuto
 *
 * @example
 * const types = buildDataTypes({
 *   ...params,
 *   dataTypes: {
 *     num: { cellClass: 'text-end fw-bold' },                 // sovrascrive solo `cellClass` del `num` predefinito
 *     km: { inheritsFrom: 'num', render: v => `${v} km` }     // nuovo tipo basato su `num`
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
