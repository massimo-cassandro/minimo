export default function () {
  updateTableInfo(<>
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
}
