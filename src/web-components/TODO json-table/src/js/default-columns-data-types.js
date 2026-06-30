/**
 * data types default settings
 *
 * standard render function and classnames for each data type
 * each of the them can be overridden in the columns definition
 * the formatClassName is used to add a class to the tbody cells for formatting purposes
 *
 * default data types can be expanded with custom values when instatiating the JsonTable class
 *
 * @param {Object} params - the global params object. For clarity, render functions
 *        use a `global_params` argument, instead of `params`, but it's the same thing
 * @param {Object} datatypes - the default datatypes object
 * @param {String} datatypes.className - default className for the data type
 * @param {Function} datatypes.parse - parse function, to normalize/process data before rendering,
 *        its argument is the complete data row, and must be applied to the column definition
 *        (not with this function)
 * @param {Function} datatypes.render - render function
 * @param {Function} datatypes.sortValueParser - the value used for sorting (static table only). If not defined, the raw value is used
 * @param {Function} datatypes.searchValueParser - the value used for searching (static table only). If not defined, the raw value is used
 * @param {Object} datatypes.colDefaultsOverrides - Object with default values for the columns.
 *        They override the default values in the `columns_default` object for the columns with the given dataType
 * @returns {Object} - the default datatypes object
 */

import * as styles from '../css/utility.module.css';
import * as iconsStyles from '../css/icons.module.css';

export function defaultDataTypes(params) {

  const inlineEndAlignClassName  = params.inlineEndAlignClassName?? styles.endAlign
    // ,centerAlignClassName        = params.centerAlignClassName?? styles.centerAlign
    ,nowrapClassName             = params.nowrapClassName?? styles.nowrap

    ,date_datetime_datatype = isDatetime => {

      const parseDateString = d => {
        let date;
        if(!d) {
          date = null;

        // allow using date objects (like the ones returned by symfony)
        // like `{'date': '2022-12-02 06:18:55', 'timezone_type': 3, 'timezone': 'Europe/Berlin' }`
        // added for compatibility reasons
        // ENHANCEMENT parse timezones
        } else if(typeof d === 'object' && Object.hasOwn(d, 'date')) {

          date = new Date(d.date);

        } else {
          date = new Date(d);
        }
        return date;
      };

      return {
        className: inlineEndAlignClassName + (params.datesNowrap? ` ${nowrapClassName}` : ''),

        sortValueParser: (d/* , global_params */) => parseDateString(d)?.toISOString()?? '',
        searchValueParser: (d, global_params) => {
          // normalize the date string
          const date = parseDateString(d);
          if (date) {
            return date.toLocaleString(global_params.locale, {
              ...global_params.datesLocaleOpts,
              ...(isDatetime? global_params.timesLocaleOpts : {})
            });
          } else {
            return '';
          }
        },

        render: (d, global_params) => {

          // normalize the date string
          const date = parseDateString(d);

          if(date) {
            const dateISO = date.toISOString();
            return `<time datetime="${isDatetime? dateISO : dateISO.substring(0,10)}">` +
              date.toLocaleString(global_params.locale, global_params.datesLocaleOpts) +
              (isDatetime?
                '\u00A0' +
                '<small>' +
                  date.toLocaleString(global_params.locale, global_params.timesLocaleOpts) +
                '</small>'
                : '') +
            '</time>';

          } else {
            return '';
          }
        },
        // force some columns default values (`columns_default` variable)  for this dataType.
        // All of these values can in turn be overridden in the column definition.
        colDefaultsOverrides: {
          tfoot: false, // avoid rendering this value inside the tfoot element
        }
      }; // end of returned object
    } // end date_datetime_datatype

    ,parseNum = (val) => {
      const num = +(val?? 0);
      if(isNaN(num) && params.isNaNChar !== false) {
        return params.isNaNChar;
      } else {
        return num;
      }
    }
  ;

  const datatypes =  {

    string: {}, // default type

    date: date_datetime_datatype(false),
    datetime: date_datetime_datatype(true),

    num: {
      className        : inlineEndAlignClassName,
      sortValueParser        : val => parseNum(val),
      searchValueParser      : val => parseNum(val),
      render           : (val, global_params) => {
        const num = parseNum(val);
        return isNaN(num)? num : num.toLocaleString(global_params.locale, global_params.numbersLocaleOpts);
      }
    },
    perc: {
      className        : inlineEndAlignClassName,
      sortValueParser        : val => parseNum(val),
      searchValueParser      : val => parseNum(val),
      render           : (val, global_params) => {
        const num = parseNum(val);
        return isNaN(num)? num : num.toLocaleString(global_params.locale, global_params.currPercLocaleOpts) + '\u202F<small>%</small>';
      }
    },
    percDecimal: {
      className        : inlineEndAlignClassName,
      sortValueParser        : val => parseNum(val),
      searchValueParser      : val => parseNum(val),
      render           : (val, global_params) => {
        const num = parseNum(val);
        return isNaN(num)? num : (num * 100).toLocaleString(global_params.locale, global_params.currPercLocaleOpts) + '\u202F<small>%</small>';
      }
    },
    euro: {
      className        : inlineEndAlignClassName,
      sortValueParser        : val => parseNum(val),
      searchValueParser      : val => parseNum(val),
      render           : (val, global_params) => {
        const num = parseNum(val);
        return isNaN(num)? num : '<small>\u20AC</small>\u202F' + num.toLocaleString(global_params.locale, global_params.currPercLocaleOpts);
      }
    },

    bool: {
      // NB: `true` and `false` classes are added by the `table-row.js` script
      className        : params.boolValuesClassName?? iconsStyles.icon,
      render           : (val, global_params) => val === true? global_params.boolTrueIcon : (val === false? global_params.boolFalseIcon : ''),

      // force some columns default values (`columns_default` variable)  for this dataType.
      // All of these values can in turn be overridden in the column definition.
      colDefaultsOverrides: {
        tfoot            : false, // avoid rendering this value inside the tfoot element
        searchable       : false, // disable searching
        sortable         : false // disable sorting
      }
    }

  };

  return datatypes;
}
