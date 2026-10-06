/*
  tokens-config-sample.mjs
  Configurazione di esempio per build-tokens.mjs e check-unresolved-custom-props.mjs.
  Copiare e adattare questo file per ogni progetto; passarlo con il flag --config.

  Tutti i percorsi sono relativi a questo file di configurazione (non alla CWD).
*/

// import { homedir } from 'os';
// import path from 'path';

// Percorso dei file sorgente dei design token.
// Si può usare un percorso assoluto, un percorso relativo, oppure costruirlo programmaticamente.



// percorso del pacchetto minimo in node_modules
const node_modules_path = '../../node_modules',
  minimo_path = `${node_modules_path}/@massimo-cassandro/minimo`;

const config = {

  // ---------------------------------------------------------------------------
  // IMPOSTAZIONI DI BUILD-TOKENS E STYLE-DICTIONARY
  // ---------------------------------------------------------------------------

  // Percorso della config stylelint usata per il lint del file CSS generato
  stylelintConfigPath: '../../stylelint.config.mjs',

  // Directory di output del file CSS generato da Style Dictionary
  buildPath: './',

  // Nome del file CSS generato
  destFile: 'custom-properties.css',

  /*
    File token sorgente — accetta percorsi, glob o una combinazione dei due.
    Formati supportati: .json, .jsonc, .mjs (deve esportare come default un oggetto conforme a DTCG)

    I file .json legacy (non DTCG) — ad es. esportati da Open Props — vengono
    rilevati automaticamente e convertiti alla sintassi DTCG v5 in fase di parsing, quindi
    possono essere mescolati liberamente con le normali sorgenti DTCG (vedi README.md). Non coperti:
    i .jsonc, riservati alle sorgenti DTCG scritte a mano. Questi file .json vengono
    letti con un semplice JSON.parse (niente commenti, niente trailing comma).

    Un nodo legacy che è al tempo stesso un token (value/type propri) E un
    gruppo con figli annidati (ad es. other.ease.out di Open Props, che ha
    un valore proprio più out.1 ... out.5) non può essere rappresentato in DTCG v5 —
    un nodo con $value è sempre una foglia. Il suo valore viene spostato in un token
    figlio chiamato `default` (other.ease.out.default, cioè --other-ease-out-default),
    oppure `base` se esiste già un figlio `default`; se esistono entrambi la build
    fallisce. I riferimenti a un nodo di questo tipo dallo stesso file vengono riscritti
    di conseguenza; da altri file devono usare esplicitamente il nome del figlio.

    ATTENZIONE: non usare path.join() per costruire i pattern glob — può corrompere
    la sintassi del pattern. Usare i template literal:
      OK:  `${minimo_path}/**\/*.{json,mjs}`
      NO:  path.join(minimo_path, '/**\/*.{json,mjs}')

    Una voce può essere anche un oggetto `{ src, prefix, transform }` (src: stringa
    o array di stringhe/glob).

    `prefix`: rende le custom properties di quei file con un prefisso,
    ad es. { src: '...open-props...json', prefix: 'op' } trasforma gray.0 di
    Open Props in --op-gray-0. Cambia solo il nome della proprietà: i {riferimenti} a
    quei token vengono resi come var(--op-gray-0) e l'output JSON resta
    senza prefisso. 'op', 'op-' e '--op-' sono equivalenti. Due prefissi diversi
    per lo stesso file fanno fallire la build.

    `transform`: sposta/rinomina i nodi dei token all'interno dell'albero di quei file —
    ad es. { primary: 'primary.100' } prende ciò che è definito al dot-path
    `primary` e lo sposta in `primary.100`, PRIMA che Style Dictionary risolva
    i {riferimenti} o costruisca l'output CSS/JSON (a differenza di `prefix`, che è una
    modifica puramente estetica del nome CSS applicata a posteriori — vedi
    build-tokens-src/source-transforms.mjs). Caso d'uso tipico: un progetto
    preesistente (ad es. guidato da Figma/Penpot) chiama `primary` il proprio colore base,
    mentre i token di minimo referenziano `{primary.100}` — invece di
    rinominare la proprietà a mano dopo ogni build, o di cercare ogni
    riferimento di minimo per modificarlo, `transform` corregge una volta sola
    il percorso del token, qui.
      - Entrambi i lati della mappa usano la notazione DOT-PATH di Style Dictionary
        ('primary.100'), NON la notazione delle custom properties con trattini
        ('primary-100'): i segmenti dei nomi dei token in questo progetto possono
        contenere trattini (ad es. btn-close), quindi un trattino non permette di
        distinguere in modo affidabile un separatore di percorso da una parte letterale
        del nome di un segmento — un punto invece sì, perché è già riservato da
        Style Dictionary come separatore di percorso dei {riferimenti}.
      - I {riferimenti} al VECCHIO percorso — nello stesso file o in uno completamente
        diverso — vengono riscritti automaticamente, in tutto l'albero, col NUOVO
        percorso una volta uniti tutti i sorgenti: ad es. ogni {primary} dell'intera
        build diventa {primary.100}, sia che i token di minimo scrivessero già
        direttamente {primary.100} (nessun effetto) sia che altro nel
        progetto dica ancora {primary}.
      - ATTENZIONE: questa riscrittura è per design indipendente dal file (un semplice
        {riferimento} non sa a quale file "appartiene") — quindi se la
        STESSA chiave sorgente (ad es. "primary") ha una destinazione DIVERSA nelle
        mappe `transform` di due file diversi, ogni rinomina funziona comunque da sola,
        ma {primary} diventa ambiguo: a quale destinazione va riscritto?
        In quel caso la riscrittura automatica viene saltata per quella chiave
        (viene registrato un warning) e ogni riferimento {primary} va corretto
        a mano per puntare al giusto fra i due nuovi percorsi.
      - Una chiave sorgente non trovata nel file registra solo un warning, non fa
        fallire la build.
      - Si applica sia all'output CSS sia a quello JSON (vedi OUTPUT JSON DEI TOKEN
        più sotto), perché entrambi vengono ricostruiti dal percorso del token, ormai
        già rinominato.

    Entrambe le opzioni funzionano allo stesso modo dentro sourceModes.
  */
  source: [
    `${minimo_path}/design-tokens/_src/**/*.tokens.{mjs,jsonc}`, // token principali
    `${minimo_path}/src/**/*.tokens.{mjs,jsonc}`, // token dei componenti

    // sorgente di token extra opzionale (in questo esempio, openProps, https://open-props.style/)
    // { src: `${node_modules_path}/open-props/open-props.style-dictionary-tokens.json`, prefix: 'op' },

    /*
      i token del tuo progetto — ad es. rimappa il colore `primary`
      esportato da Figma/Penpot sulla nomenclatura `primary.100` di minimo
    */
    {
      src: './design-tokens/*.{js,mjs,jsonc,json}',
      prefix: 'my-project',
      transform: { primary: 'primary.100' },
    }
  ],

  /*
    Suddivisione opzionale light/dark (o altra) delle custom properties — alternativa a
    `source`. Se questa chiave è impostata (un oggetto non null), `source` qui sopra viene
    ignorato: ogni chiave è il nome di una modalità, con il proprio array di pattern sorgente
    (stesse regole di `source`: percorsi, glob o una combinazione).

    Il CSS generato compone tutte le modalità in un unico destFile:
      - le proprietà della modalità base (vedi sourceModesBase più sotto) vanno in un blocco
        `:root { ... }` di primo livello, con `color-scheme: <tutte le modalità>;` anteposto
        (ad es. "light dark")
      - le proprietà di ogni altra modalità vanno in
        `@media (prefers-color-scheme: <modalità>) { :root { ... } }`, con
        `color-scheme: <modalità>;` anteposto
    customPropsGroups, mergeCustomProps, addLayer, pxToRem ecc. si applicano
    allo stesso modo che con un singolo `source`.

    Riferimenti tra modalità: i token di una modalità non base possono referenziare i token
    definiti nella modalità base (ad es. un token dark che usa {color.1} definito in
    light); viene risolto in var(--color-1). Il contrario (o tra due
    modalità non base) non è supportato e fallisce con un errore "reference not
    defined", perché il target risulterebbe non definito fuori dal proprio
    blocco @media.

    L'output JSON (vedi OUTPUT JSON DEI TOKEN più sotto) viene prodotto una volta per
    modalità, con il nome della modalità aggiunto a ogni nome di file, ad es. con
    jsonDestFile: 'tokens' -> "tokens-light.jsonc", "tokens-dark.jsonc".

    esempio:
    sourceModes: {
      light: [
        `${minimo_path}/design-tokens/_src/**\/*.tokens.{mjs,jsonc}`,
        `${minimo_path}/src/**\/*.tokens.{mjs,jsonc}`,
        './project-tokens/light/*.{js,mjs,jsonc,json}',
      ],
      dark: [
        './project-tokens/dark/*.{js,mjs,jsonc,json}',
      ],
    },
  */
  sourceModes: null,

  /*
    Con sourceModes impostato, e solo se definisce sia una chiave `light` sia una `dark`:
    le custom properties presenti in ENTRAMBE — individuate per nome — vengono scritte
    una sola volta come `--name: light-dark(<valore-light>, <valore-dark>);`, invece di
    essere divise tra il blocco di primo livello della modalità base e una regola
    `@media (prefers-color-scheme: dark) { ... }`.

    Non vengono toccati:
      - gli altri eventuali valori di sourceModes oltre a light/dark (ad es. una terza
        modalità personalizzata) — restano sempre sulla propria regola
        `@media (prefers-color-scheme: <modalità>) { ... }`
      - una proprietà presente in una sola tra `light`/`dark` — resta nel blocco della
        propria modalità (sempre dietro `@media`, a meno che quella modalità non sia
        sourceModesBase)

    Ogni volta che questa opzione è attiva (sourceModes ha sia una chiave light sia una
    dark), la dichiarazione `color-scheme` della modalità base viene sempre normalizzata
    in "light dark [...ogni altra modalità]", con light prima di dark — coerentemente con
    l'ordine degli argomenti (valore-light, valore-dark) di light-dark() — indipendentemente
    dall'ordine in cui sono dichiarate le chiavi di sourceModes o da quale delle due
    sia configurata come sourceModesBase qui sotto.

    Interazione con mergeCustomProps: non serve alcuna gestione speciale — il merge
    per modalità con le custom properties preesistenti viene sempre eseguito per primo;
    questa opzione poi riconcilia il valore che risulta in ogni modalità
    (appena generato o conservato da un file preesistente) in light-dark(),
    individuando le proprietà per nome. Ciò significa anche che rieseguire una build
    con questa opzione appena attivata, su un destFile generato in precedenza
    con l'opzione disattivata (divisione classica `@media (prefers-color-scheme: dark)`) e
    mergeCustomProps: true, converte anche i valori conservati in chiamate light-dark() —
    come in ogni caso di mergeCustomProps, un eventuale disallineamento resta da
    correggere a mano.

    Default: true. Ignorata quando sourceModes non è impostato (null/undefined).
  */
  useLightDarkFunc: true,

  /*
    Con sourceModes impostato: la modalità le cui dichiarazioni vanno nel blocco
    `:root { ... }` di primo livello, invece che annidate nella propria regola
    `@media (prefers-color-scheme: <modalità>) { ... }` (default: la prima
    chiave di sourceModes, ad es. 'light'). Ignorata quando sourceModes non è impostato.
  */
  sourceModesBase: 'light',

  /*
    Selettore CSS che racchiude i blocchi di custom properties generati, al posto
    del default `:root`. Si applica in modo uniforme sia con un singolo
    `source` sia con `sourceModes` (il blocco di primo livello della modalità base e il
    blocco di ogni altra modalità, annidato nella propria regola
    `@media (prefers-color-scheme: <modalità>)`, usano lo stesso
    selettore). Valori falsy o vuoti ripiegano su ':root'.
  */
  customPropsSelector: ':where(html)',

  /*
    Se true (default), i valori dei token di tipo dimension espressi in px vengono convertiti
    in rem nel CSS generato. I valori in altre unità (em, %, vh, dvw, ...)
    non vengono mai toccati, indipendentemente da questa opzione.
  */
  pxToRem: false,

  /*
    Conserva, tra una build e l'altra, le custom properties già presenti nel file CSS di
    destinazione (destFile, da una build precedente): i loro valori hanno priorità
    su quelli generati da questa build. Utile per mantenere override/aggiunte
    manuali fatte direttamente nel CSS compilato. Ignorata se destFile non esiste
    ancora. Valori accettati:
      false           - nessun merge: il file di destinazione viene rigenerato completamente
      true (default)  - merge di tutte le sorgenti
      array           - stringhe e/o RegExp confrontate con il percorso dei
                        file token sorgente (quelli in `source` o `sourceModes`):
                        vengono unite solo le proprietà generate da un file corrispondente,
                        le altre vengono sovrascritte dal valore generato.
                        Una stringa corrisponde se è contenuta nel percorso del file.
                        Un array vuoto è trattato come false.
                        ad es. ['/theme.minimo.tokens', /colors\.tokens\.(mjs|jsonc?)$/]
    Con true o con un array, le proprietà presenti solo nel file preesistente (non più
    generate, ad es. aggiunte a mano) vengono sempre conservate.
    I commenti a fine riga di una custom property vengono conservati; i commenti su riga
    intera vanno persi e un commento su più righe viene troncato alla fine della sua prima
    riga (e chiuso, per mantenere valido il CSS).
  */
  mergeCustomProps: true,

  /*
    Racchiude le custom properties generate in una regola at-rule CSS `@layer`,
    ad es. addLayer: 'project' -> `@layer project { :root { ... } }`.
    Impostare a null, undefined o false (default) per non emettere alcun layer.
  */
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
      prefixes: ['accent', 'primary', 'secondary', 'neutral', 'color'],
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
  jsonBuildPath: null, // oppure './path/to/generated/design-tokens-dir',

  /*
    Nome base (senza estensione) del file JSON aggregato di output.
    L'estensione viene aggiunta automaticamente in base a jsonFormat.
    Impostare a null (o omettere) per generare invece un file per ogni file sorgente .mjs
    (tutti nella stessa cartella jsonBuildPath — vedi jsonBuildPath qui sopra).
  */
  jsonDestFile: null, // oppure 'tokens' (o altro),


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

  // File CSS aggiuntivi che definiscono custom properties usate nel progetto
  // ma non generate da build-tokens (ad es. librerie di terze parti)
  extraCustomPropsFiles: [
    // `${node_modules_path}/open-props/open-props.min.css`
  ],

  // Directory che contiene i file CSS da analizzare per le custom properties non risolte
  dirToCheck: '../../app',

  /*
    Espressioni regolari dei nomi di custom property da escludere dal controllo.
    Utile per le proprietà volutamente private/interne (es. con prefisso --_).
  */
  excludePattern: [
    /^--_/,
  ],
};

export default config;
