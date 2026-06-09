
export function tableFoot() {
  const tfoot = document.createElement('tfoot');
  this.params.footerData.forEach((row_data) => {
    tfoot.insertAdjacentElement('beforeend', this.tableRow(row_data, null, 'tfoot'));
  });
  return tfoot;
}
