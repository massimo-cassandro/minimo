export default function (tableEl, zeroValuesChar = null) {

  const normalize = str => {
    let is_number = !isNaN(parseFloat(str));

    str = str.replace(/;/g, '').replace(/"/g, '""');
    if(is_number) {
      str = str.replace(/\./g, ''); // sep migliaia
    }
    return str;
  };

  try {
    if(!tableEl) {
      throw new Error( 'table element not present' );
    }

    // table to array
    let download_array = [];
    tableEl.querySelectorAll('tr').forEach(row => {
      let rowArray = [];

      row.querySelectorAll('th, td').forEach(item => {
        rowArray.push(normalize(item.innerText));
      });

      download_array.push(rowArray.join(';'));
    });

    let csv = download_array.join('\n');

    if(zeroValuesChar) {
      csv = csv.replaceAll(zeroValuesChar, 0);
    }

    return csv;

    // const url = new Blob([download_array.join('\n')], { type: 'text/csv;charset=utf-8;' });

    // return URL.createObjectURL(url);

  } catch(e) {
    console.error( e ); // eslint-disable-line
  }

}


