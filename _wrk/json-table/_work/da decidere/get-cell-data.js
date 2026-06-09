// conviene questa strada o è più efficiente continuare a usare gli attributi data-*?


/**
 * Gets the original value and parameters of a static (non-ajax) table cell.
 */

export function getCellData(jtId, cell_key){
  const rowData = this.params.data.filter(row => row.jtId === +jtId)?.[0]?? null,
    colParams = this.params.columns.filter(col => col.key === cell_key)?.[0]?? null,
    dataType = this.params.dataTypes[colParams?.dataType]?? null;

  return {
    data: rowData,
    colParams: colParams,
    dataType: dataType
  };
}
