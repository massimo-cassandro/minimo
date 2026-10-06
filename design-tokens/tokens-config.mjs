// Tutti i percorsi sono relativi a questo file di configurazione (non alla CWD).

const config = {

  // Percorso della config stylelint usata per il lint del file CSS generato
  stylelintConfigPath: '../stylelint.config.mjs',

  // Directory di output del file CSS generato da Style Dictionary
  buildPath: '../src',

  // Nome del file CSS generato
  destFile: 'custom-properties.css',

  /*
    File token sorgente — accetta percorsi, glob o una combinazione dei due.
    Formati supportati: .json, .jsonc, .mjs (deve esportare come default un oggetto conforme a DTCG)

    ATTENZIONE: non usare path.join() per costruire i pattern glob — può corrompere
    la sintassi del pattern. Usare i template literal:
      OK:  `${minimo_path}/**\/*.{json,mjs}`
      NO:  path.join(minimo_path, '/**\/*.{json,mjs}')
  */
  source: [
    './_src/**/*.tokens.mjs',
    '../src/**/*.tokens.mjs',

  ],

  /*
    Se true (default), i valori dei token di tipo dimension espressi in px vengono convertiti
    in rem nel CSS generato. I valori in altre unità (em, %, vh, dvw, ...)
    non vengono mai toccati, indipendentemente da questa opzione.
  */
  pxToRem: false,

  /*
    Se true, le custom properties già presenti in `destFile` (se esiste)
    hanno la priorità su quelle generate dalla build corrente.
    Vengono mantenute anche le proprietà presenti solo nel file preesistente
    (non più generate). Utile per conservare, tra una build e l'altra, override/aggiunte
    manuali fatte direttamente nel CSS compilato. Ignorata alla prima
    build, quando destFile non esiste ancora. Default: false.
    I commenti a fine riga delle custom properties vengono conservati, quelli su riga intera vanno persi.
  */
  mergeCustomProps: false,


  // racchiude le custom properties generate in una regola at-rule css `@layer`
  // Impostare la proprietà a null, undefined o false per non usare alcun layer
  addLayer: false,


  /*
    Gruppi nominati di custom properties. Le proprietà il cui primo segmento del nome
    (separato da trattini) corrisponde a uno dei `prefixes` di un gruppo vengono estratte,
    etichettate con il `name` del gruppo e collocate all'inizio del file CSS
    di output, nell'ordine in cui i gruppi sono elencati qui.
  */
  customPropsGroups: [
    {
      name: 'COLORS',
      prefixes: ['accent', 'primary', 'secondary', 'neutral'],
    },
    {
      name: 'LAYOUT',
      prefixes: ['body', 'layout'],
    },
    {
      name: 'UI',
      prefixes: ['ui'],
    },
  ],


  // ---------------------------------------------------------------------------
  // OUTPUT JSON DEI TOKEN
  // ---------------------------------------------------------------------------
  /*
    Output opzionale dei design token, indipendente da qualsiasi strumento specifico
    Genera uno o più file json(c) in aggiunta al file CSS di output —
    utilizzabili in Penpot, Figma (tramite plugin), Token Studio, oppure in alternativa
    ai file sorgente .mjs
  */
  // ---------------------------------------------------------------------------

  /*
    Come gestire le espressioni matematiche nei $value dei token dimension (es. "{size.base} * .25"):
      'keep'    scrive l'espressione invariata
      'calc'    — la racchiude in calc() CSS: "calc({size.base} * .25)"
      'resolve' — (default) la valuta numericamente, ereditando l'unità dal primo token referenziato
                  es. {size.base} = 16px, "{size.base} * .25" -> "4px"
  */
  jsonExpression: 'resolve',

  /*
    Nome base (senza estensione) del file JSON aggregato di output.
    L'estensione viene aggiunta automaticamente in base a jsonFormat.
    Impostare a null (o omettere) per generare invece un file per ogni file sorgente .mjs
    (tutti nella stessa cartella jsonBuildPath, senza sottocartelle — vedi jsonBuildPath più sotto).
  */
  jsonDestFile: null,

  /*
    Formato di output dei file JSON dei token: 'jsonc' o 'json'
      'jsonc' -> aggiunge un'intestazione che segnala il file generato, usa l'estensione .jsonc
      'json'  -> JSON semplice, senza intestazione
  */
  jsonFormat: 'jsonc',

  /*
    Directory di output dei file JSON dei design token.
    Impostare a null (o omettere) per disattivare del tutto l'output json.
    In modalità multi-file (jsonDestFile: null), tutti i file vengono scritti nella stessa
    directory (senza sottocartelle che replicano l'albero dei sorgenti); la build
    fallisce con un errore se due file sorgente producono lo stesso nome file.
  */
  jsonBuildPath: './jsonc-build',



  // ---------------------------------------------------------------------------
  // IMPOSTAZIONI DI CONTROLLO CUSTOM PROPS NON RISOLTE E NON USATE
  // ---------------------------------------------------------------------------

  /*
    Se true, segnala anche le custom properties definite (in destFile o
    in una voce di extraCustomPropsFiles) ma mai referenziate tramite var() in nessun
    file CSS analizzato. Opt-in perché riesegue la pipeline di trasformazione
    di Style Dictionary sui sorgenti dei token per risalire, quando possibile, al
    file sorgente .mjs di ogni proprietà non usata. Default: false.
  */
  checkUnused: true,

  /*
    Quando checkUnused è true: se true (default), le custom properties provenienti
    da un file token sotto node_modules (es. un pacchetto di token di terze parti)
    non vengono mai segnalate come non usate — il progetto che le usa non è tenuto
    a ripulirle.
  */
  ignoreUnusedInNodeModules: true,

  // Directory che contiene i file CSS da analizzare per le custom properties non risolte
  dirToCheck: '../src',

  /*
    Espressioni regolari dei nomi di custom property da escludere dal controllo.
    Utile per le proprietà volutamente private/interne (es. con prefisso --_).
  */
  excludePattern: [
    /^--_/,
  ]
};

export default config;
