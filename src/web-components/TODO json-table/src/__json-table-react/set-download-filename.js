import {defaults} from './defaults';
export default function setDownloadFilename(str, format = 'excel') {
  const ext = format.toLowerCase() === 'excel'? 'xlsx' : 'csv';
  if(str) {
    str = str
      .replace(/(\.csv)$/, '')
      .replace(/(\.xslx?)$/, '')
      .replace(/[/:]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '');

    return str + ' [' + new Date().toISOString().split('T')[0] + `].${ext}`;
  }

  return defaults.downloadFilename;
}
