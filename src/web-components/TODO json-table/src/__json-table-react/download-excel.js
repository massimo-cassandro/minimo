// genera un json ottimizzato per l'esportazione in xslx partendo
// dai dati assegnati alla tabella

// import {data_types} from './columns-data-types';
import setDownloadFilename from './set-download-filename';
import { utils as utilsXSLX, writeFileXLSX } from 'xlsx/xlsx.mjs';


export default function (params) {


  function excel_sheet(columns, data) {

    let excel_data = [];

    const parser = new DOMParser();
    excel_data.push(columns.map(item => {

      const tit = parser.parseFromString(item.title, 'text/html');
      return tit.documentElement.textContent;
    }));

    // https://www.codegrepper.com/code-examples/javascript/javascript+convert+number+to+letter+of+alphabet
    // https://docs.sheetjs.com/docs/csf/features/formulae
    // function numToSSColumnLetter(num) {
    //   let columnLetter = "",
    //     t;

    //   while (num > 0) {
    //     t = (num - 1) % 26;
    //     columnLetter = String.fromCharCode(65 + t) + columnLetter;
    //     num = (num - t) / 26 | 0;
    //   }
    //   return columnLetter || undefined;
    // }

    let values_lengths = {};

    data.forEach(row => {
      let excel_row = [];

      columns.forEach(col => {
        let cell_value;
        if(col.parse && typeof col.parse === 'function') {
          cell_value = col.parse(row);
        } else {
          cell_value = row[col.key];
        }
        values_lengths[col.key] = Math.max(values_lengths[col.key]?? 0, String(cell_value).length);


        // https://docs.sheetjs.com/docs/csf/cell
        // https://docs.sheetjs.com/docs/csf/features/#number-formats
        // https://support.microsoft.com/it-it/office/codici-del-formato-numerico-5026bbd6-04bc-48cd-bf33-80f18b4eae68
        let cell_obj;
        switch (col.dataType) {
          case 'date':
            cell_obj = {
              v: cell_value? new Date(cell_value).toISOString() : undefined,
              t: 'd',
              z: 'd-mmm-yyyy'
            };
            break;
          case 'datetime':
            cell_obj = {
              v: cell_value? new Date(cell_value).toISOString() : undefined,
              t: 'd',
              z: 'd-mmm-yyyy hh:mm'
            };
            break;
          case 'num':
            cell_obj = {
              v: cell_value? +cell_value : 0,
              t: 'n',
              z: '#,##0.00'
            };
            break;
          case 'perc':
            cell_obj = {
              v: (cell_value? +cell_value : 0)/100,
              t: 'n',
              z: '#,##0.00%'
            };
            break;
          case 'percDecimal':
            cell_obj = {
              v: cell_value? +cell_value : 0,
              t: 'n',
              z: '#,##0.00%'
            };
            break;
          case 'euro':
            cell_obj = {
              v: cell_value? +cell_value : 0,
              t: 'n',
              z: '"€"\ #,##0.00' // eslint-disable-line no-useless-escape
            };
            break;

          default:
            cell_obj = {
              v: cell_value,
              t: 's'
            };
            break;
        }

        excel_row.push(cell_obj);
      });
      excel_data.push(excel_row);
    });

    let ws = utilsXSLX.aoa_to_sheet(excel_data); // worksheet
    // larghezza colonne
    ws['!cols'] = [];
    columns.forEach(col => {
      ws['!cols'].push({ wch: values_lengths[col.key] + 4 });
    });

    return ws;

  }

  function setSheetName(str) {
    if(str.length > 31) {
      return str.substring(0, 27)  + '...';
    }

    return str;
  }

  let wb = utilsXSLX.book_new(); // workbook

  utilsXSLX.book_append_sheet(
    wb,
    excel_sheet(params.columns, params.data),
    setSheetName(params.downloadFilename)
  );

  if(params.extraDownloadSheets) {
    params.extraDownloadSheets.forEach(item => {

      utilsXSLX.book_append_sheet(
        wb,
        utilsXSLX.aoa_to_sheet(item.data),
        setSheetName(item.name)
      );
    });
  }

  const filename = setDownloadFilename(params.downloadFilename, params.downloadFormat);
  writeFileXLSX(wb, filename, {
    bookType: 'xlsx',
    cellDates: true
  });
}
