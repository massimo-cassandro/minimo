export const params = {
  // Valori di default

  packageJsonFile: './package.json',
  logFile: './changelog.md',
  markdownLog: true,
  toLog: ['major', 'minor'], // opzionale 'patch'
  locale: 'it-IT',

  debug: false, // solo sviluppo, non aggiorna nulla ma mostra l'output finale

  addLog: true, // modificato in base alla scelta del tipo di aggironamento e del valore di toLog
  noLogV0: true, // se true e la major version è 0 il log non viene registrato (ad esclusione dell'inizializzazione del file)

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
