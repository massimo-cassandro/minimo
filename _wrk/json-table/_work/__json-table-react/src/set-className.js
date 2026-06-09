// Restituisce la stringa delle classi per la colonna data
import {data_types} from './columns-data-types';

export default function setClassName(col, addFormatClass = true) {
  if(col.className) {
    return col.className;
  }

  if(col.dataType) {

    return [
      ...(data_types[col.dataType]?.className? [data_types[col.dataType]?.className] : []),
      ...(addFormatClass? [data_types[col.dataType]?.formatClassName] : [])
    ].join(' ');

  } else {
    return null;
  }
}
