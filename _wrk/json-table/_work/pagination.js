export default function () {

  if(jsonData?.recordsFiltered) {

    const page_array = build_page_array(currentPage, props.pageRows, jsonData.recordsFiltered);

    return (
      <nav id={navBarId} aria-label="Navigazione pagine" className={styles.paginationNav}>
        <ul>
          {page_array.map((pag, i) => {
            let content;

            if(pag === currentPage) {
              content = <span className={styles.selected}>{pag}</span>;

            } else if (pag !== null) {
              content = <button
                type="button"
                title={`Vai a pagina ${pag}`}
                onClick={ e => {
                  setLoadingOffsetTop(e.target.offsetTop);
                  updateUrl(pag);
                }}
              >{pag}</button>;

            } else {
              content = <span>&hellip;</span>;
            }

            return <li key={i}>{content}</li>;
          })}
        </ul>
      </nav>
    );
  }

}
