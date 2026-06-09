export function updateInfo(){
  let info;
  if(this.params.ajax) {
    /* updateTableInfo(<>
            {(+jsonData.recordsFiltered).toLocaleString('it-IT', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })} record trovati
            {jsonData.recordsFiltered < jsonData.recordsTotal?
              ` (su un totale di ${(+jsonData.recordsTotal).toLocaleString('it-IT', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })})`
              : ''}
            <br />
            <a href={`#${navBarId}`} title="Vai alla navigazione delle pagine"
              onClick={e => {
                e.preventDefault();
                container?.current?.scrollIntoView({behavior: 'smooth', block: 'end', inline: 'end'});
              }}
            >
              Pagina <strong>{currentPage}</strong> di <strong>{calcTotPages(jsonData.recordsFiltered, props.pageRows)}</strong>
            </a>

          </>);
    */

  } else {
    // when first loaded the table is not defined and the number of rows displayed corresponds to data length
    const search_result = this.params.elements.table?.querySelectorAll('tbody tr:not([hidden])').length ?? this.params.data.length;

    // TODO parametrizzare il testo
    info = search_result === 1
      ? `Visualizzata <strong>${search_result}</strong> riga su <strong>${this.params.data.length}</strong>`
      : `Visualizzate <strong>${search_result}</strong> righe su <strong>${this.params.data.length}</strong>`;

    // TODO paginazione record statici???
  }

  this.params.elements.info.innerHTML = info;
}

