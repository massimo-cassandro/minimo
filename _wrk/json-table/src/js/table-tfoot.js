
export function tableTfoot() {

  return {
    tag: 'tfoot',
    condition: this.params.footerData.length,
    children:this.params.footerData.map(row_data => this.tableRow(row_data, 'tfoot'))
  };
}
