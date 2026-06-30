export function initStaticTable() {

  this.params.data = this.params.data.map((row, idx) => this.parseDataRow({
    dataRow: row,
    idx: idx,
  }));

  if (this.params.footerData.length) {
    this.params.footerData = this.params.footerData.map((row, idx) => this.parseDataRow({
      dataRow: row,
      idx: idx,
      isTbody: false
    }));
  }

  // first sorting
  this.params.data = this.staticDataSorting(true);
}
