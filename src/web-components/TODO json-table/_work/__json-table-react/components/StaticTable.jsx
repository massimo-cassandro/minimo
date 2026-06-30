/**
 * StaticTable per react
 * @param {object} columns - elenco delle colonne.
 * @author Massimo Cassandro
 */

import PropTypes from 'prop-types';
// import classnames from 'classnames';
import React from 'react';
import tableToCsv from '../x/table-to-csv';
import fileDownload from 'js-file-download';

function StaticTable(props) {
  const tableRef= React.useRef();

  // formattazioni std per i vari tipi di dati
  // la classe std viene sovrascitta se presente come parametro nella colonna
  const data_types = {
      // string: {}
      // element: {},
      date: {
        className   : props.centerAlignClassName,
        render: d => new Date(d).toLocaleString('it-IT', {
          year    : 'numeric', // '2-digit'
          month   : '2-digit', // 'short'
          day     : '2-digit' // 'numeric
        })
      },
      num: {
        className                 : props.rightAlignClassName,
        render: d => (d? +d : 0).toLocaleString('it-IT', {
          maximumFractionDigits   : 2
        })
      },
      perc: {
        className                 : props.rightAlignClassName,
        formatClassName           : props.percClassName,
        render: d => (d? +d : 0).toLocaleString('it-IT', {
          maximumFractionDigits   : 2,
          minimumFractionDigits   : 2,
        })
      },
      percDecimal: {
        className                 : props.rightAlignClassName,
        formatClassName           : props.percClassName,
        render: d => ((d? +d : 0) * 100).toLocaleString('it-IT', {
          maximumFractionDigits   : 2,
          minimumFractionDigits   : 2,

        })
      },
      euro: {
        className                 : props.rightAlignClassName,
        formatClassName           : props.euroClassName,
        render: d => (d? +d : 0).toLocaleString('it-IT', {
          minimumFractionDigits   : 2,
          maximumFractionDigits   : 2
        })
      },
    },

    setClassName = (col, addFormatClass = true) => {
      if(col.className) {
        return col.className;
      }

      if(col.dataType) {

        return [
          ...(data_types[col.dataType]?.className? [data_types[col.dataType]?.className] : []),
          ...(addFormatClass? [data_types[col.dataType]?.formatClassName] : [])
        ].join(' ');

      } else {
        return null;
      }
    };

  const TableHeadings = () => {
    return props.columns.map((col, idx) => {
      return <th
        className={setClassName(col, false)}
        key={idx}
        scope='col'
      >
        {col.title}
      </th>;
    });
  };

  const tableRows = (data) => {
    return data.map((row, idx) => {
      return (
        <tr key={idx}>
          {props.columns.map((col, i) => {
            let content,
              addFormatClass = true;

            if(col.parse && typeof col.parse === 'function') {
              content = col.parse(row);
            } else {
              content = row[col.key];
            }

            if(content === null) {
              content = '';
              addFormatClass = false;

            } else if(content === 0 && !props.showZero) {
              content = props.zeroValuesChar;
              addFormatClass = false;

            } else if(col.render && typeof col.render === 'function') {
              content = col.render(content);

            } else if(col.dataType && data_types[col.dataType]?.render) {
              content = data_types[col.dataType].render(content);
            }

            const isTh = col.rowHeading && i === 0,
              CellTag = isTh? 'th' : 'td';
            return (
              <CellTag
                scope={isTh? 'row' : null}
                key={i}
                className={setClassName(col, addFormatClass)}>
                {content}
              </CellTag>
            );

          })}
        </tr>
      );
    });
  };

  const setDownloadFilename = str => {
    str = str
      .replace(/(\.csv)$/, '')
      .replace(/[/:]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '');

    return str + ' [' + new Date().toISOString().split('T')[0] + '].csv';
  };

  return (<>
    <div className={props.wrapperClassName}>
      <table className={props.tableClassName} ref={tableRef}>
        {props.caption && <caption>{props.caption}</caption>}
        <thead>
          <tr>
            <TableHeadings />
          </tr>
        </thead>
        <tbody>
          {tableRows(props.data)}
        </tbody>
        {props.footerData &&
          <tfoot>
            {tableRows(props.footerData)}
          </tfoot>
        }
      </table>
    </div>
    {props.showDownloadBtn &&
      <div className='d-flex'>
        {props.footerInfo  && <div>{props.footerInfo}</div>}

        <div className={`flex-grow-1 ${props.rightAlignClassName}`}>
          {/* eslint-disable jsx-a11y/anchor-is-valid */}
          <button
            type="button"
            className={props.downloadBtnClassName}
            onClick={() => {
              fileDownload(
                tableToCsv(tableRef.current, props.zeroValuesChar),
                setDownloadFilename(props.downloadFilename)
              );
            }}
          >{props.downloadBtnLabel}</button>
          {/* eslint-enable jsx-a11y/anchor-is-valid */}
        </div>
      </div>
    }
  </>);
}

// https://it.reactjs.org/docs/typechecking-with-proptypes.html

StaticTable.propTypes = {
  caption                 : PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  tableClassName          : PropTypes.string,
  wrapperClassName        : PropTypes.string,
  centerAlignClassName    : PropTypes.string,
  rightAlignClassName     : PropTypes.string,
  percClassName           : PropTypes.string,
  euroClassName           : PropTypes.string,
  showZero                : PropTypes.bool,
  zeroValuesChar          : PropTypes.string,
  columns                 : PropTypes.arrayOf(PropTypes.shape({
    title                 : PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
      PropTypes.node,
    ]).isRequired,
    key                   : PropTypes.string,
    dataType              : PropTypes.string,
    className             : PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func
    ]),
    render                : PropTypes.func,
    parse                 : PropTypes.func,
    rowHeading            : PropTypes.bool
  })).isRequired,
  data                    : PropTypes.array.isRequired,
  footerData              : PropTypes.array,
  showDownloadBtn         : PropTypes.bool,
  downloadBtnLabel        : PropTypes.string,
  downloadBtnClassName    : PropTypes.string,
  downloadFilename        : PropTypes.string,
  footerInfo              : PropTypes.oneOfType([PropTypes.string, PropTypes.element]),

};

StaticTable.defaultProps = {
  tableClassName          : 'table',
  wrapperClassName        : 'table-responsive',
  centerAlignClassName    : 'text-center',
  rightAlignClassName     : 'text-right',
  percClassName           : 'perc',
  euroClassName           : 'euro',
  showZero                : false,
  zeroValuesChar          : '\u2014',
  showDownloadBtn         : false,
  downloadBtnLabel        : 'Download',
  downloadBtnClassName    : 'btn btn-outline-secondary btn-sm',
  downloadFilename        : 'download.csv'
};

export default StaticTable;
