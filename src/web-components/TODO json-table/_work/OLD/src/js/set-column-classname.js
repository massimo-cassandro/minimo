// returns the string of classes for the given column
// according to the column definition and to the data_types object


export function setColumClassname(col, addClassAttrName = true) {
  let classname ='';

  if(col.className) {
    classname = col.className;

  } else if(col.dataType) {
    classname = this.params.dataTypes[col.dataType]?.className?? '';
  }

  classname = classname.trim();

  if(addClassAttrName) {
    return classname? ` class="${classname}"` : '';
  } else {
    return classname? classname : null;
  }
}
