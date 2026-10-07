export const params = {
  // Valori di default

  // percorso package.json
  // corrisponde al parametro cli `--pkg`
  packageJsonFile: './package.json',

  // percorso log file
  // corrisponde al parametro cli `--log-file`
  logFile: './changelog.md',

  markdownLog: true,
  toLog: ['major', 'minor'], // opzionale 'patch'
  locale: 'it-IT',

  debug: false, // solo sviluppo, non aggiorna nulla ma mostra l'output finale

  addLog: true, // modificato in base alla scelta del tipo di aggiornamento e del valore di toLog

  // se true e la major version è 0 il log non viene registrato (ad esclusione dell'inizializzazione del file)
  // corrisponde al parametro cli `--no-log-v0`
  noLogV0: true,

  // testo di default per il log delle patch
  // corrisponde al parametro cli `--default-patch-log`
  defaultPatchLog: 'Fix / Upd',

  // preRealeaseTags: ['alpha', 'beta', 'rc'],
  logRow: {
    vers: null,
    date: new Date(),
    descr: null,
    fullText: ''
  },
  oldSemver: null,
  newSemver: null,
  semverArray: [],
  updateMode: null
};
