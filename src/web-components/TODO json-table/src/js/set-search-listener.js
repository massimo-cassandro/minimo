
/**
 * Listener for search input
 */

// TODO form ricerca: prevedere salvataggio dati ricerca nel sessionstorage
// TODO form ricerca: datalist

export function setSearchListener(){
  const searchInput = this.params.elements.searchInput;

  if(searchInput && this.params.search) {

    let searchtimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchtimer);
      searchtimer = setTimeout(() => {
        const toBeSearchedValue = searchInput.value.trim();

        const test_regexp = new RegExp(toBeSearchedValue, 'i');
        if(this.ajax) {
          // TODO ajax search

        } else {



          this.params.elements.tbodyRows.forEach(tr => {
            const rowId = +tr.dataset.jtId;

            let result = false;
            tr.querySelectorAll('th, td').forEach(cell => {
              const cellData = this.parsedData.filter(data => // parsedData is generated into `table-row.js` for static data only
                data.rowId === rowId &&
                data.key === cell.dataset.key
              )?.[0]?? null;

              const found = cellData != null
                ? toBeSearchedValue? test_regexp.test(cellData.searchingValue) : true // if toBeSearchedValue is an empty string all rows are returned
                : false;

              cell.innerHTML = (toBeSearchedValue && cellData != null)
                ? cellData.displayValue.replace(
                  RegExp('(?![^<]*>)' + toBeSearchedValue, 'ig'), // ignores matches occurring inside html tags
                  `<mark>${toBeSearchedValue}</mark>`
                )
                : cellData.displayValue;

              result = result || found;
            });

            tr.toggleAttribute('hidden', !result);
          });
        }

        this.updateInfo();

      }, 400);

    }, false);
  }
}
