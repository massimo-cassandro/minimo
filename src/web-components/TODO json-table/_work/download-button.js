const setDownloadFilename = str => {
  str = str
    .replace(/(\.csv)$/, '')
    .replace(/[/:]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');

  return str + ' [' + new Date().toISOString().split('T')[0] + '].csv';
};
let downloadBtn = '';
if(params.showDownloadBtn) {
  const btn_id = table_id + '-dwnld-btn';
  downloadBtn =
    `<div class="${params.rightAlignClassName}">
      <button type="button"
        id="${btn_id}"
        class="${params.downloadBtnClassName}"
      >${params.downloadBtnLabel}</button>
    </div>`;

  document.body.addEventListener('click', e => {
    if(e.target.id === btn_id) {

      downloadExcel(params);

    }
  }, false);
}
