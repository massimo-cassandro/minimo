// csv_array è un array di array

export function arrayToCsv(csv_array) {
  return csv_array.map(row =>
    row.map(cell => `"${cell/* .replace(/;/g, '') */.replace(/"/g, '""')}"`).join(';')
  ).join('\n');
}

