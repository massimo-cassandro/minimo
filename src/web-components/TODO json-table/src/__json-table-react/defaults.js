/**
 * Parametri di configurazione
 * @property {array} columns - colonne della tabella
 * @property {array} data - array dei dati
 * @property {array} footerData - array dei dati da renderizzare nell'elemento <tfoot>
 * @author Massimo Cassandro
 */


export const defaults = {
  columns                 : [], // definizione delle colonne
  ajax                    : true, // se true usa `ajaxUrl` e ignora `data`
  ajaxUrl                 : null, // url ajax
  data                    : [], // dati (per versione statica)
  footerData              : [],
  caption                 : null,
  addRowIndex             : false, // se true aggiunge un attributo data al tr con l'indice del record json

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
  separateDownloadBtn     : false, // se true viene restituito un array con tabella e pulsante download separati
  downloadFilename        : 'download',
  downloadFormat          : 'excel', // 'excel' o 'csv'
  trCallback              : null,

  // array di eventuali fogli da aggiungere all'excel nel download
  // ogni elemento dell'array è un oggetto con
  // name - nome dela foglio
  // data - array già formattato da trasformare in excel
  extraDownloadSheets     : null
};

export const columns_default = {
  title                     : null, // titolo colonna (testo th)
  key                       : null, // chiave oggetto del json
  dataType                  : null, // tipo dati
  className                 : null, // classe
  render                    : null, // funzione ad hoc per il rendering
  parse                     : null, // funzione ad hoc per elaborare il valore
  rowHeading                : false // se true, viene creato un elemento th[scope=row] invece di un td
};
