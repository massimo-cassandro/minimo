
import { defaults_params, columns_default } from './defaults.js';
import { defaultDataTypes } from './default-columns-data-types.js';

export function parseParams({custom_params = {}, custom_data_types = {}}) {

  try {


    const params = {
      ...defaults_params,
      ...(JSON.parse(custom_params?.container?.dataset?.params?? null)?? {}), // params from `data-params` attribute
      ...custom_params
    };

    if(!params.container || !(params.container instanceof HTMLElement)) {
      throw '`container` parameter not present or not a DOM element';
    }

    // ENHANCEMENT jqDatatableCompliant
    // temporarily force `jqDatatableCompliant` to true
    params.jqDatatableCompliant = true;



    // ENHANCEMENT download btn
    // if(params.ajax === true) {
    //   params.showDownloadBtn = false;
    // }


    // =>> DATA TYPES
    // parse default datatypes
    params.dataTypes = defaultDataTypes(params);

    // if custom_data_types are provided, they are merged with the one defined in the `inheritsFrom` key
    if(Object.keys(custom_data_types).length) {

      for(const key in custom_data_types) {
        if(custom_data_types[key].inheritsFrom) {
          custom_data_types[key] = {
            ...params.dataTypes[custom_data_types[key].inheritsFrom],
            ...custom_data_types[key]
          };
        }
      }
      // merge custom data types with the default ones
      params.dataTypes = {...params.dataTypes, ...custom_data_types};
    }


    // check if the dataTypes are valid
    const dataTypesList = Object.keys(params.dataTypes);
    params.columns.forEach(col => {
      if(col.dataType && !dataTypesList.includes(col.dataType)) {
        throw `JsonTable: Invalid data type for column with key '${col.key}' (${col.dataType})`;
      }
    });


    // =>> COLUMNS

    // build columns definition array
    params.columns = params.columns.map(col => {

      const inheritedDatatype = params.dataTypes[col.dataType]?.inheritsFrom?? null;

      return {
        // default values
        ...columns_default,

        // override values for columns with specific dataTypes (from the `colDefaultsOverrides` object in dataTypes)`)
        ...(params.dataTypes[col.dataType]?.colDefaultsOverrides?? {}),

        // same, from the inherited dataType, if exists
        ...(inheritedDatatype? params.dataTypes[inheritedDatatype].colDefaultsOverrides?? {} : {}),

        // user settings
        ...col
      };
    });


    // columns key list and check for missing ones
    params.fieldKeysList = params.columns.reduce((acc, col, idx) => {
      if(!col.key) {
        throw `JsonTable: Missing key for column #${idx}`;
      }
      acc.push(col.key);
      return acc;
    }, []);

    // default sorting check
    params.defaultSorting??= {}; // force null to empty object

    Object.keys(params.defaultSorting).forEach(sort_key => {

      if(!params.fieldKeysList.includes(sort_key)) {
        throw `JsonTable: Invalid sort key '${sort_key}'`;
      }

      // force sorting direction to lowercase
      params.defaultSorting[sort_key] = params.defaultSorting[sort_key].toLowerCase();
      if(['asc', 'desc'].indexOf(params.defaultSorting[sort_key]) === -1) {
        throw `JsonTable: Invalid sorting direction for column with key '${sort_key}' `+
          `(${params.defaultSorting[sort_key]} instead of 'sort' or 'desc')`;
      }
    });

    return params;

  } catch(e) {
    return {err: e};
  }

}


