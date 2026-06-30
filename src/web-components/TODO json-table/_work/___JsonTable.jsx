/**
 * JsonTable per react
 * Utilizza gli stessi tracciati di jQuery datatable
 * @param {object} columns - elenco delle colonne. Vengono visualizzate solo quelle
 *   con `title` e con `visible` `undefined` o `true`
 * @param {string} urlExtraQueryString - eventuale query string da aggiungere all'url
 * @author Massimo Cassandro
 */


import PropTypes from 'prop-types';
import classnames from 'classnames';
import React, { useState, useEffect, useRef } from 'react';
// import styled from 'styled-components';
import styles from './styles/JsonTable.module.scss';
import uniqid from '@massimo-cassandro/m-utilities/js-utilities/unique-id';

import build_page_array, {calcTotPages} from '../../src/build-page-array';


function JsonTable(props) {
  // const Div = styled.div``;
  const [url, setUrl] = useState(null),
    container = useRef(),
    [jsonData, updateJsonData] = useState(null),
    [table, updateTable] = useState(null),
    [defaultContent, updateDefaultContent] = useState(null),
    [currentPage, setCurrentPage] = useState(1),
    [searchStr, setSearchStr] = useState(null),
    [orderArray, setOrderArray] = useState(props.order?? null),
    [loadingOffsetTop, setLoadingOffsetTop] = useState(null), // offset top elemento loading
    [tableInfo, updateTableInfo] = useState(null),
    navBarId = uniqid(),

    column_url_params = (() => {
      let p = [];

      props.columns.forEach((item, idx) => {
        // per compatibilità con jquery datatable
        if(item.name && !item.data) {
          item.data = item.name;
        }

        p.push(
          // [`columns[${idx}][data]`, item.data],
          [`columns[${idx}][name]`, item.data],
          [`columns[${idx}][searchable]`, item.searchable !== undefined? item.searchable.toString() : 'true'],
          [`columns[${idx}][orderable]`, item.orderable !== undefined? item.searchable.toString() : 'true'],
          // [`columns[${idx}][search][value]`, ''],
          // [`columns[${idx}][search][regex]`, 'false']
        );
      });
      return p.map(item => `${encodeURIComponent(item[0])}=${encodeURIComponent(item[1])}`);

    })();

  // =>> composizione url
  function updateUrl(pag=1, searchString = searchStr, currentOrder = orderArray) {
    const start = (pag - 1) * props.pageRows;

    let url_params = [
      ...column_url_params,
      'draw=1',
      `start=${start}`,
      `length=${props.pageRows}`,
      `search[value]=${encodeURIComponent(searchString?? '')}`,
      // `_=${Date.now()}`
    ];

    if(currentOrder) {
      currentOrder.forEach((item, idx) => {
        url_params.push(
          `order[${idx}][column]=${item[0]}`,
          `order[${idx}][dir]=${item[1].toLowerCase()}`
        );
      });
      setOrderArray(currentOrder);
    }

    setCurrentPage(pag);
    if(searchString !== null) {
      setSearchStr(searchString);
    }
    setUrl(props.ajaxUrl + '?' +
      (props.urlExtraQueryString? `${props.urlExtraQueryString}&` : '') +
      url_params.join('&'));
  }

  // init
  useEffect(() => {
    updateUrl();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // =>> loading json
  useEffect(() => {

    const setDefaultContent = (contentType, offsetTop) => {


      updateDefaultContent(contentType &&
        <div className={styles.msgWrapper} style={{paddingTop: offsetTop? `${offsetTop - 10}px` : null}}>
          {props.defaultContents[contentType]}
        </div>
      );
    };



    const getJsonData = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        /* eslint-disable */
        console.error('Ajax error on: ' + url);
        console.error(response);
        /* eslint-enable */
        return false;
      }

      const data = await response.json(response);
      return data;
    };

    container?.current?.classList.add(styles.loading);
    container?.current?.querySelector('.json-table-search').blur();
    setDefaultContent('loading', loadingOffsetTop);
    updateTableInfo('In caricamento...');


    if(url) {

      getJsonData(url)
        .then(jsondata => {

          updateJsonData(jsondata);
          setLoadingOffsetTop(null);

          if(jsondata.data.length) {
            setDefaultContent(null);
          } else {
            setDefaultContent('nodata');
          }
          container?.current?.classList.remove(styles.loading);

        })
        .catch((err) => {
          console.error(err); // eslint-disable-line
          setDefaultContent('error');
        });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, props.defaultContents]);



  // =>> costruzione tabella e paginazione
  useEffect(() => {

    // restituisce true se la colonna data va visualizzata
    const columnIsVisible = col => {
      return col.title !== undefined &&
        (col.includeIf === undefined || col.includeIf === true) &&
        (col.visible !== undefined || col.visible !== false);
    };

    const TableHeadings = () => {

      const SortArrows = () => {
        return (<div className={styles.sortArrows}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 16 8' className={styles.arrowUp}>
            <path d="M0 0L16 0 7.959 8z"/>
          </svg>

          <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 16 8' className={styles.arrowDn}>
            <path d="M0 0L16 0 7.959 8z"/>
          </svg>
        </div>);
      };

      return props.columns.map((col, idx) => {

        // necessario effettuare il ciclo anche sugli elementi nascosti, perché
        // l'indice deve considerarli
        if(columnIsVisible(col)) {

          // props.order => [[column_idx, direction (asc|desc)],...]
          // es.r => order={[[1,'desc'], [7, 'asc']]}
          let order_classes=orderArray.filter(item => item[0] === idx)
            .map(item =>
              `${styles[`order${item[1].charAt(0).toUpperCase() + item[1].substr(1).toLowerCase()}`]}`
            );

          let isOrderable = false;
          if(col.orderable === undefined || col.orderable) {
            order_classes.push(styles.order);
            isOrderable = true;
          }

          return <th
            className={classnames(col.className, order_classes)}
            key={idx}
            scope='col'
            {...(isOrderable && { onClick: () => {
              let prevOrder = orderArray.filter(item => item[0] === idx)[0]?? [];
              updateUrl(1, searchStr, [[idx, prevOrder[1] === 'asc'? 'desc' : 'asc']]);
            } })}
          >
            <div>
              {col.title}
              {isOrderable && <SortArrows />}
            </div>
          </th>;

        } else {

          return '';
        }
      });
    };

    const TableRows = () => {
      return jsonData.data.map((row, idx) => {
        return (
          <tr key={idx}>
            {props.columns.filter(col => {
              return columnIsVisible(col);
            }).map((col, i) => {
              let cell_content;

              // =>> generazione tabella: tipo dati
              if(col.render !== undefined && typeof col.render === 'function') {
                cell_content = col.render(row);

              } else if(col.type === 'sf_date') {

                cell_content = <span className="text-nowrap">
                  {new Date(row[col.data].date).toLocaleString('it-IT', {
                    year: '2-digit',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>;

              } else if(col.type === 'euro') {
                let val = +row[col.data];
                if(val) {
                  cell_content = <span className="euro">
                    {val.toLocaleString('it-IT', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>;
                } else {
                  cell_content = '–';
                }

              }  else {
                cell_content = row[col.data];
              }

              return (
                <td key={i} className={classnames(col.className)}>
                  {cell_content}
                </td>
              );
            })}
          </tr>
        );
      });
    };

    const Pagination = () => {
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
      } else {
        return null;
      }
    };


    if(jsonData?.recordsFiltered) {

      updateTable(<>
        <table className={props.tableClassName}>
          {props.caption && <caption>{props.caption}</caption>}
          <thead>
            <tr>
              <TableHeadings />
            </tr>
          </thead>
          <tbody>
            <TableRows />
          </tbody>
        </table>
        <Pagination />
      </>);

      // =>> Update table info
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

    } else {
      updateTable(null);
      updateTableInfo(<>Nessun record trovato</>);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonData, orderArray]);

  useEffect(() => {
    container?.current?.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'start'});
  }, [table]);


  return (
    <>
      <div className={styles.mainWrapper} ref={container}>
        <div className={styles.info}>
          <div className={styles.resultInfo}>{tableInfo}</div>
          <div className={styles.search}>
            <input
              title='Filtra records'
              className="form-control form-control-sm json-table-search"
              type="search"
              placeholder="INVIO per eseguire la ricerca"
              aria-label="Filtra risultati"
              defaultValue={searchStr}
              onKeyDown={ e => {
                if(e.code === 'Enter'){
                  updateUrl(1, e.target.value);
                }
              }}
              onInput={ e => { // per il pulsante di reset
                if(e.target.value === '') {
                  updateUrl(1, '');
                }
              }}
            />
          </div>
        </div>
        <div className={styles.content}>
          {table}
          {defaultContent}
        </div>
      </div>
    </>
  );
}

// https://it.reactjs.org/docs/typechecking-with-proptypes.html

JsonTable.propTypes = {
  caption               : PropTypes.string,
  tableClassName        : PropTypes.string,
  ajaxUrl               : PropTypes.string,
  urlExtraQueryString   : PropTypes.string,
  order                 : PropTypes.array,
  columns               : PropTypes.array,
  pageRows              : PropTypes.number,
  iconaErrore           : PropTypes.element,
  iconaInfo             : PropTypes.element,
  defaultContents:  PropTypes.exact({
    loading             : PropTypes.element,
    error               : PropTypes.element,
    nodata              : PropTypes.element
  }),
};

JsonTable.defaultProps = {
  tableClassName        : 'table',
  pageRows              : 25,
  order                 : [],
  iconaErrore           : null,
  iconaInfo             : null,

  get defaultContents() {
    return {
      loading: <div className={classnames('spinner-border', 'text-primary', styles.msg)} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>,

      error: <div className={classnames('text-danger', styles.msg)}>
        {this.iconaErrore}
        <div>
          <p className="fw-bold">Errore nel caricamento dei dati</p>
          <p className="xsmall">Riprova, e se l'errore si ripete contatta l'assistenza tecnica</p>
        </div>
      </div>,

      nodata: <div className={classnames('text-info', styles.msg)}>
        {this.iconaInfo}
        <div className="fw-bold">Nessun dato disponibile</div>
      </div>
    };
  }
};

export default JsonTable;
