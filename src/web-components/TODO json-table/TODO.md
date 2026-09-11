# json-table

Piano di sviluppo per trasformare json-table nel web component light DOM che sostituirà
`s-datatable-component` (vedi CLAUDE.md, sezione "json-table ★").

`s-datatable-component.js` resta il riferimento architetturale per il pattern "custom element
light DOM" adottato, pur non condividendone la dipendenza esterna (simple-datatables).

## Stato / prossimi step

* **step 1 — struttura esterna (fatto)**: in `src/web-components/json-table/` esiste il custom
  element `<json-table>` (`json-table-component.js` + moduli in `src/`: `defaults`,
  `resolve-params`, `get-data`, `main-builder`, `info-section`, `update-info`), con API
  `init()`/`reload()`/`destroy()`, `JsonTable.setDefaults()`, acquisizione dati (`data`/`jsonUrl`),
  sezione info + input di ricerca (senza listener), wrapper con `<table>` vuota e caption, CSS
  module minimo con sole `--jt-*`, token, readme iniziale, demo in `demo/demo-files/json-table/`
* **step 2**: `cols` + rendering di thead/tbody (riprendere la sezione "parametri per `cols`" e
  i data-types)
* **step 3**: ordinamento, ricerca (listener sull'input già previsto), tfoot/`footerRender`
* **step 4**: paginazione (statica e `jsonMaxLength`/`jsonPaginationParams`), `refs`
* **step 5**: icone, locale/formattazione, finalizzazione (vedi fasi 4-7 in fondo)

## Modalità di sviluppo

* non modificare `TODO json-table` ma lavorare nella nuova dir `json-table`. A lavoro finito, la prima sarà eliminata (questo file compreso: eventuali punti ancora in sospeso andranno in un nuovo file)
* suddividere il più possibile il codice in più file da mettere nella subdir `src`. Il file principale è `json-table-component.js`
* compilare il file readme con esempi d'uso e reference dei vari parametri e opzioni
* il css andrà in `json-table-component.module.css`, i tokens in `json-table.minimo.tokens.mjs`; nella prima fase dello sviluppo limitarsi al minimo indispensabile, riutilizzando i css già esistenti di json-table, ma solo per quanto riguarda la struttura di base. Il css di json-table è precedente a minimo, quindi molte parti ora sono ridondanti e vanno sostituite con le nuove classi minimo
* la costruzione della struttura avviene tramite domBuilder
* Ogni funzione va documentata con jsdoc (con sezione `@example` che riepiloghi i parametri e i default) e validata tscheck (`npm run checkJS`)

---

## parametri e confronto con s-datatable

Prima revisione, parziale, delle impostazioni del nuovo componente. Sezioni `cols` e
`data-types` volutamente non ancora riviste/mescolate col resto del piano (vedi in fondo
a questa sezione).

### impostazioni generali
* dove possibile vengono utilizzati i parametri già definiti per s-datatable, eliminando l'underscore iniziale
* tutti parametri devono essere inseribili come attributo o come proprietà istanziate tramite JS (o, sempre da js, tramite domBuilder). In caso di conflitto, l'impostazione tramite JS prevale. Ovviamente, dove prevista, la possibilità che il contenuto sia generato da una funzione è valido solo le proprietà instanziate via JS
* prevedere delle modalità js-free per coprire almeno le esigenze base, analogamente ai render con sintassi mustache-like di s-datatable, in linea di massime utilizzabili sia in html che js, ma di poca utilità in quest'ultimo caso
* uno dei problemi più noiosi di s-datatable, derivati da simple-datatables, è l'impossibilità del `render` nativo di accedere ai dati di riga, in json table deve invece diventare lo standard. le funzioni di render devono passare come parametri il valore corrente, l'oggetto della riga ... (da valutare se necessario altro). prevedere cmq la possibilità di passare semplicemente il valor di riga (render: row => {} ) insieme ad un sintassi più completa ma più prolissa (render: ({row, cell, ...}) => {}) — **vedi "punti aperti"**
* la modalità render in tutte le sue varianti deve essere utilizzabile anche le celle di `tfoot` e `thead` (proprietà di colonna: da integrare quando si riprenderà la sezione `cols`)
* sarebbe utile se possibile fare in modo che in vscode, spostando il cursore sopra il tag <json-table> venisse visualizzato un popup con i parametri, analogamente a quanto si fa con jsDoc nelle funzioni js — **da verificare la fattibilità**: VSCode non ha un supporto nativo equivalente per gli attributi dei custom element (servirebbe eventualmente un file di HTML custom data / web-types)
* se possibile prevedere script o qualcosa simile per passare da s-datatable a json-table
* il layout da generare per l'insieme di elementi info, tabella ecc è quello di json-table. La parte sticky (header tabella e sezione info, vecchi parametri `stickyThead`/`stickyInfo`) è **eliminata**. I pulsanti di sort sono quelli usati per s-datatable: un `<button>` reale dentro il `th`, con `aria-sort` sul `th`
* ~~Utile se possibile, una funzione per impostare dei default validi per tutti il progetto~~ **fatto**: `JsonTable.setDefaults({...})` (statico, module-level; anche `getDefaults()`/`resetDefaults()`). Precedenza: `init()` > attributo HTML > `setDefaults()` > default interno
* I parametri di json-table o s-datatable non riportati vanno ignorati

### parametri di <json-table> (attributi html o proprietà js):

Mix tra i parametri della prima versione di `json-table` (`src/web-components/TODO json-table/src/js/defaults.js`) e `SimpleDatatableAdapter` (`src/web-components/s-datatable-component/s-datatable-component.js`).

I parametri marcati **(step 1)** sono già implementati in `src/defaults.js` del nuovo componente.

* `debug` **(step 1)**: boolean, default false, mostra in console params, dati ed elementi generati (da estendere man mano)
* `jsonUrl` **(step 1)**: url del json da caricare via ajax (stesso comportamento di s-datatable), corrisponde a `json` in `s-datatable`
* `jsonDataField` **(step 1)**: campo del json contenente i dati da utilizzare, ad esempio se `data`, i dati saranno recuperati da `{ data: [...]}` (come in s-datatable), se `null` o stringa vuota, i dati corrispondono alla root del json. Default: `data`
* `jsonMaxLength`: lunghezza massima di record del json. In base alla paginazione e al numero di record per pagina, quando la pagina richiesta supera il numero indicato deve partire una nuova richiesta per un nuovo set di dati. Ovviamente questo richiede che lato backend sia definito un controller in grado di ricevere i parametri necessari. **Da capire come gestire casi in cui il 'cambio' di set dati cade a metà di una pagina** Inoltre: l'eventuale nuovo set si aggiunge all'esistente o lo sostituisce (quindi navigando all'indietro si richiede nuovamente il set già chiesto in precedenza)? Se null (default) nessuna paginazione
* `jsonPaginationParams`: entra in gioco solo se `jsonMaxLength` è diverso da null. È un oggetto (o una stringa json da elaborare con JSON.parse) che contiene i parametri da accodare all'url json per richiedere un nuovo set di dati. Default `{start:<start>, pag:<pag>, perPage: 1500, ...}`. I primi due sono alternativi (in caso siano presenti entrambi prevale `pag`) e uno dei due deve essere presente, gli altri sono definibili liberamente. `pag` indica la pagina (il set di dati) da richiedere, il secondo il record da cui far partire l'eventuale query lato server (ad esempio con mysql avremmo `LIMIT {start},{perPage}`). Usando i valori di default, avremmo, ad esempio, per una seconda pagina di dati, una richiesta ajax di questo tipo: `${jsonUrl}?pag=${pag}&perPage=${perPage}`. **Da definire meglio e capire si si può semplificare**
* `data` **(step 1)**: alternativo a `jsonUrl`, un array di oggetti da utilizzare per il rendering della tabella. Se presente anche `jsonUrl`, `data` prevale. Allo stesso modo viene ignorato un eventuale `jsonDataField`: l'oggetto passato si intende già come root dei dati. Se passato tramite attributo richiede un JSON.parse per essere utilizzato; in caso di json malformato viene mostrato un messaggio di errore in console e il valore viene ignorato
* `caption` **(step 1)**: eventuale caption della tabella, stringa o funzione
* `search` **(step 1)**: boolean, default true, se generare o meno l'input di ricerca in alto a destra (il listener verrà aggiunto con la ricerca)
* `cols`: come s-datatable o il `columns` della prima versione di json-table, vedere dopo per gli argomenti
* parametri ARIA labels (da recuperare interamente da json-table):
  * `sortButtonAriaLabelAsc` : per pulsante ordinamento asc
  * `sortButtonAriaLabelDesc` : idem desc
  * `sortButtonAriaLabelNone` : idem nessun ordinamento
* `locale` : parametro locale per rendering date, numeri ecc (default: 'it-IT')
* `datesLocaleOpts` : da recuperare da json-table, opzioni di default per il rendering della porzione `date` delle  date
* `timesLocaleOpts` : idem per la porzione time
* `numbersLocaleOpts` : idem per i numeri
* `currPercLocaleOpts` : idem per la valuta
* `tableId` **(step 1)**: id della tabella, opzionale, default null
* `tableWrapperClass` **(step 1)**: classe per il div wrapper della tabella (default 'table-responsive'). Questa e le classi seguenti, se presenti sostituiscono interamente i valori di default, salvo eventuali classi legate al layout (generalmente `styles.xxx`)
* `tableClass` **(step 1)**: idem per la tabella (default: `table table-bordered`, coerente col parametro `tableClass` appena aggiunto a s-datatable)
* `mainWrapperExtraClass` **(step 1)**: Classe aggiuntiva per il contenitore principale (che racchiude blocco info e tabella). default null
* `outerInfoExtraClass` **(step 1)**: Classe aggiuntiva per la sezione informativa esterna. default null
* `infoExtraClass` **(step 1)**: Classe aggiuntiva per la sezione info. default null
* `infoText` **(step 1, nuovo)**: funzione `(shown, total) => string|Node` per il testo dell'area info (risolve il vecchio "TODO parametrizzare il testo" di `update-info.js`). Default: testo italiano "Visualizzate N righe su M" / "Nessun record". Da estendere con la paginazione (righe da–a, pagina X di Y)
* nomi delle classi per l'allineamento del testo, i valori di default, tra parentesi sono le classi di minimo:
  * `inlineEndAlignClass`: allineamento a destra (text-end)
  * `inlineCenterAlignClass`: allineamento al centro (text-center)
  * `inlineLeftAlignClass`: allineamento a sx (text-start)
  * `nowrapClass` : nowrap (text-nowrap),
* `renderNullAs`: se diverso da null, è il carattere per rappresentare eventuali valori `null` (default: '—'). Come quella in s-datatable non va applicata dove creerebbe falsi positivi, ad esempio nel tipo boolean (vedi su s-datatable)
* `renderZeroAs`: se diverso da null, è il carattere per rappresentare eventuali valori numerici pari a zero (default: null). Sostituisce la coppia `useZeroAltChar`/`zeroAltChar` della prima versione di json-table
* `renderNaNAs`: se diverso da null, è il carattere per rappresentare eventuali valori NaN. Sostituisce `isNaNChar` (default: '—').
* `boolValuesClass` : Classe aggiunta alle celle con icone per valori booleani (true/false). default null,
* `boolTrueClass` : Classe aggiunta alle celle per il valore true. default null,
* `boolFalseClass` : Classe aggiunta alle celle per il valore false. default null,

* Icone utilizzate dalla tabella per i valori booleani e l'ordinamento. Le icone importate possono essere un HTMLElement, un SVGElement, una funzione che restituisca un elemento o un oggetto domBuilder. **da aggiungere svg di default**
  * `boolTrueIcon`: icona/markup per il valore booleano "true" (vero)
  * `boolFalseIcon`: icona/markup per il valore booleano "false" (falso)
  * `sortAscArrowIcon`: icona/markup per la freccia di ordinamento asc
  * `sortDescArrowIcon`: icona/markup per la freccia di ordinamento desc
  * `sortNoneArrowIcon`: icona/markup per ordinamento non applicato. Tre icone distinte al posto dell'unica `sortArrowIcon` ruotata via CSS della prima versione: nessuna custom property di rotazione

* `searchInputClass` **(step 1)**: Classe alternativa per l'input di ricerca (sovrascrive quella predefinita, tranne eventuali stili legati al layout, styles.xxxx). Default: `form-control`
* `searchInputTitle` **(step 1)**: attributo title per l'input di ricerca, default: 'Filtra record: inserisci un termine per eseguire la ricerca'
* `searchInputPlaceholder` **(step 1)**: placeholder per l'input di ricerca, default: 'Inserisci il termine da cercare'
* `searchInputAriaLabel` **(step 1)**: Aria-label per l'input di ricerca. default 'Filtra risultati',
* `trCallback` : Callback invocata dopo il rendering di ogni riga (<tr>). default null,
* `updateFooterOnPageChange`: Se true, `_footerRender` riceve solo i record della pagina corrente (subtotale). Se false, l'intero set filtrato (il footer si aggiorna solo al cambio filtro, non pagina). Default: false
* `refs`, string[] di percorsi URL da cui, se si proviene, la pagina corrente viene ripristinata dal cookie di sessione 'sd-pag'. Confronto su pathname (query string/hash ignorati): es. ['/utenti'] intercetta anche '/utenti/1234'.

### punti aperti

* **doppia firma di `render`** (`row => {}` vs `({row, cell, ...}) => {}`) distinta "analizzando il tipo dell'argomento, se stringa od oggetto": in entrambi i casi l'argomento è un oggetto (la riga, oppure l'oggetto opzioni), non una stringa — il criterio descritto non sembra poter funzionare così com'è. Da chiarire il criterio reale (es. arità della funzione `fn.length`, oppure evitare il problema chiamando sempre con l'oggetto completo e lasciando che chi scrive `render` destrutturi solo `row` se gli basta: `render: ({row}) => {}`) **da valutare quando si affronterà la sezione `cols`**
* nome dell'evento `jt:ready`: mantenuto così com'è nello step 1; valutare se rinominarlo per coerenza con la convenzione `<tagname>:evento` usata altrove (`datatable:search` ecc. in s-datatable) — **da decidere**
* valutare se portare anche `_collapseKey`/`_collapsePlaceholder`/`_collapseClass` di s-datatable (raggruppamento visivo di valori ripetuti su righe consecutive) — feature aggiuntiva rispetto ai requisiti originali, ma segnalata come pattern utile — **da decidere**

### parametri per `cols`

Corrisponde al merge modificato tra i parametri `columns` di json-table e `cols` di s-datatable.

> `condition` (rendering condizionale colonna, dai "requisiti funzionali" più sotto) e `footerRender`
> (calcoli aggregati nel tfoot, idem) sono proprietà di colonna: da integrare qui quando questa
> sezione verrà ripresa, non separatamente.
/**
* Opzioni predefinite per le colonne.
* @typedef {Object} ColumnDefault
* @property {string|null} key - OBBLIGATORIO: chiave dell'oggetto JSON (= nome colonna nel DB).
* @property {string|null} title - Titolo della colonna (testo del `th`, può essere una stringa HTML).
* @property {string} [dataType='string'] - Tipo di dato della cella; deve corrispondere a una delle chiavi di `data_types`.
* @property {string|null} className - Classe assegnata alla cella; sovrascrive quella predefinita.
* @property {Function|null} render - Funzione di rendering per la cella.
* @property {Function|null} parse - Funzione di parsing per la cella.
* @property {boolean} [rowHeading=false] - Se true, la cella è un'intestazione di riga (`th[scope=row]`).
* @property {boolean} [tfoot=true]
* @property {boolean} [searchable=true]
* @property {boolean} [sortable=true]
* @property {Function|null} sortValueCustomParser - Funzione di ordinamento personalizzata per tabelle statiche.
* @property {Function|null} searchValueCustomParser - Funzione di ricerca personalizzata per tabelle statiche.
*/

* `headerClass` e `cellClass`: quando solo una delle due è presente, quella mancante va impostata automaticamente come quella presente. Questo prevale su eventuali impostazioni dei `dataTypes`


### data-types (bozza originale, non ancora rivista)

Da vedere:
* `_renderMode` -> aggiunta stringa data (in dataTypes?), possibilità di impostare formato data sorgente se non iso standard (es. gg/mm/aaaa)
* locale
* rivedere parte euro e simili di `_renderMode`, semplificare, associare a locale, prevedere altre currency

---

## materiale in `_work/` da valutare in seguito

Fuori dallo scope del piano, resta come riferimento da cui recuperare eventuali parti riciclabili:

* `_work/__json-table-react/` — primissimo esperimento con versione React, non più mantenuto né
  da proseguire (es. logica di paginazione/formattazione)
* `_work/download-excel.js`, `_work/download-button.js`, `_work/pagination.js`,
  `_work/pagination-array-builder.js`, `_work/set-download-filename.js`, `_work/table-info.js`,
  `_work/arrow.svg`, `_work/archived/table-to-csv.js` — frammenti di feature non ancora
  implementate (download excel, paginazione)
* `_work/da decidere/get-cell-data.js`, `_work/___JsonTable.jsx`, `_work/___StaticTable.jsx`
  — marcati esplicitamente "da decidere"

---

## requisiti funzionali (note originali, mantenute)

* meccanismo acquisizione json per grandi quantità di records basato sulla paginazione
* opzione `condition` per renderizzare o meno una colonna (vedi opzione `hidden` di simple-datatable)
* in generale ogni elemento (cella) deve accettare contenuti in forma di stringa plain text, stringa html, elemento DOM, array domBuilder...
* possibilità di aggiungere un campo solo a fini di ricerca senza mostrarlo nella tabella (show: false)
* possibilità di definire valori per ordinamento e ricerca diversi da quelli effettivamente presenti nel json. Il default dovrebbe corrispondere a quanto mostrato
* prevedere possibilità di accedere a un set di dati molto grandi, da paginare, con un parametro che indichi da quale "punto" richiedere un nuovo json al server — vedi `jsonMaxLength`/`jsonPaginationParams` in "parametri e confronto con s-datatable" per la specifica aggiornata
* nei campi di tipo numerico prevedere classi di default text-end e text-numeric o classe ad hoc sovrascrivibile
* footerRender: possibilità di funzioni predefinite per calcoli base (somma, media ecc) di una determinata colonna

---

## analisi codice esistente (`src/` della vecchia versione)

Punti emersi rileggendo il vecchio abbozzo, da tenere presenti per non ripartire da zero
ma nemmeno per portare avanti parti rotte:

* **funzionante/solido, riusabile**: sistema `dataTypes` (`default-columns-data-types.js`:
  string/date/datetime/num/perc/percDecimal/euro/bool, con `render`/`sortValueParser`/
  `searchValueParser`/`colDefaultsOverrides`), validazione colonne/sorting di `parse-params.js`,
  struttura a CSS module per file (`table`, `icons`, `utility`)
* **incompleto/da riscrivere**:
  * `static-data-sorting.js` è uno stub: `staticDataSorting()` non ordina mai, ritorna
    sempre `this.params.data` invariato
  * `set-search-listener.js` ha un bug (`this.ajax` invece di `this.params.ajax`) e
    dipende da `this.parsedData`, che non viene mai popolato da nessuna parte del codice
  * `table-builder.js` lascia il body ajax a `children: this.params.ajax ? [] : ...`
    (commento `// TODO dati da ajax`): il rendering da ajax non è mai stato implementato
  * `set-sort-listeners.js`: branch ajax vuoto (`// TODO ajax sorting`), aria-sort/aria-label
    non implementati (c'è solo un promemoria testuale in coda al file)
  * `update-info.js`: branch ajax è codice JSX incollato da una versione React precedente,
    commentato e mai adattato — da buttare (la versione nuova usa `infoText`)
  * nessuna paginazione, né lato statico né lato ajax, nonostante sia il primo punto dei
    "requisiti funzionali" sopra
* **import da pacchetti esterni non più esistenti in minimo** (`@massimo-cassandro/js-utilities`,
  `@massimo-cassandro/dom-builder`): il nuovo codice usa direttamente `src/utilities/classnames.js`
  e `src/utilities/dom-builder/dom-builder.js` di minimo; non copiare mai quegli import dai vecchi file
* `table.module.css` referenzia direttamente un token generico di minimo (`var(--green-2…)`),
  in violazione della regola di indipendenza dei design token nei componenti (vedi CLAUDE.md):
  quando si riprenderà il CSS della tabella, usare una custom property `--jt-*` mappata nel file token

---

## fase 1 — da classe a custom element light DOM (fatto nello step 1)

* `JsonTable extends HTMLElement`, tag `<json-table>`, light DOM (no shadow DOM), stesso approccio
  di `SimpleDatatableAdapter` in `s-datatable-component.js`
* risoluzione parametri in `src/resolve-params.js` (`getParam`/`resolveParams`): precedenza
  `init()` > attributo HTML > `setDefaults()` > default interno, auto-parse JSON per array/oggetti
  e boolean per attributi HTML idiomatici
* lifecycle `connectedCallback`/`disconnectedCallback` con gestione delle race condition tra
  attach al DOM e chiamata `init()` da script (flag `_initCalledProgrammatically`/`_loadStarted`/
  `_loadGeneration` come in s-datatable)
* API pubblica: `init(config)`, `destroy()`, `reload(overrides)`; proprietà `params`, `data`, `elements`
* evento custom `jt:ready` (dispatch a microtask, `detail.jsonTable`)
* nessuna dipendenza esterna richiesta (a differenza di s-datatable/simple-datatables):
  ordinamento, ricerca e paginazione vanno implementati internamente in vanilla JS

---

## fase 2 — completamento funzionalità core

* rendering di thead/tbody da `cols` (step 2)
* riscrivere l'ordinamento per tabelle statiche (`staticDataSorting` della vecchia versione è un no-op)
* riscrivere la ricerca: listener sull'input già generato (`elements.searchInput`), fonte dati
  coerente (`this.data`)
* implementare davvero il rendering ajax, inclusi ricerca/ordinamento lato server per quella modalità
* implementare la paginazione, sia per dati statici sia ajax — priorità alta, già in cima
  ai "requisiti funzionali" e presupposto per il meccanismo di acquisizione a blocchi di
  grandi dataset (`jsonMaxLength`/`jsonPaginationParams`, vedi "parametri e confronto con
  s-datatable" per i punti ancora aperti su questi due parametri)
* opzione `condition` per rendering condizionale della colonna (equivalente a `hidden` di
  simple-datatable)
* contenuti di cella come stringa plain, stringa HTML, nodo DOM o array domBuilder — usare
  come riferimento `resolveTemplate()`/`computeCellValue()` di s-datatable-component.js
* campo utilizzabile solo per la ricerca, non mostrato in tabella (`show: false`)
* valori di ordinamento/ricerca disaccoppiati dal valore mostrato (equivalenti a
  `_sortValue`/`_searchValue` di s-datatable, pattern già collaudato lì)
* `footerRender` con funzioni predefinite per calcoli di colonna (somma, media, conteggio) —
  vedi `_footerRender` di s-datatable come riferimento di API
* classi di default `text-end`/`text-numeric` per colonne numeriche, sempre sovrascrivibili
  da configurazione di colonna
* aria-sort sul `th` e aria-label sui pulsanti di ordinamento (`sortButtonAriaLabelAsc/Desc/None`)

---

## fase 3 — bug noti di s-datatable da non ereditare

* **parseCols**: mai sostituire per intero l'oggetto di definizione colonna nei preset
  (`renderMode`/`dataType`) — sempre merge con le proprietà utente, mai override secco
  (bug osservato in s-datatable: `_renderMode: 'numeric'` cancellava silenziosamente
  `_cellRender`/`_sortValue`/`_searchValue` della colonna — nel frattempo già corretto in
  `s-datatable-component/src/parse-cols.js` con `classnames(...)` invece di sovrascrivere
  `cellClass`/`headerClass`: usare lo stesso approccio come riferimento diretto)
* se in futuro si introduce un motore di patch/diffing parziale del `<tbody>` (es. per
  ottimizzare i re-render), mai ricavare lo stato "genuino" precedente di una cella
  leggendo `cell.innerHTML` — ricalcolarlo sempre dai dati grezzi con la stessa funzione
  di rendering usata per il render iniziale (bug corposo riscontrato in s-datatable con
  `_collapseKey`, causato dal diffing "cieco" di simple-datatables sui nodi riciclati). Se
  json-table ricostruisce sempre l'intero `<tbody>` da zero ad ogni update, il problema
  non si pone: da tenere presente solo se si ottimizza il rendering in futuro
* distinguere `null` da `false` nei valori di colonna (TODO puntuale mai risolto in
  `s-datatable-component/src/parse-cols.js:55` — verificare se rilevante anche per json-table)

---

## fase 4 — CSS e design token

* `json-table.minimo.tokens.mjs` è già presente e colocato nella cartella del componente (modello
  `modal-alert`/`inner-nav`, vedi CLAUDE.md "Indipendenza dei design token nei componenti"):
  completarlo man mano che il CSS cresce. Le custom properties del CSS restano tutte namespaced
  `--jt-*`, la risoluzione verso i token generici di minimo avviene solo nel file token, in fase
  di build (`npm run build-tokens`)
* quando si riprenderà il CSS della tabella dalla vecchia `table.module.css`: eliminare il
  riferimento diretto a `var(--green-2…)` sostituendolo con una `--jt-*` mappata nel file token;
  nessuna custom property di rotazione per le icone di ordinamento (3 icone distinte)
* mantenere l'impostazione a CSS module (un solo file `json-table-component.module.css`),
  coerente con gli altri web-component

---

## fase 5 — demo e build

* la vecchia versione porta ancora con sé una toolchain demo interamente separata (proprio
  `webpack.config.mjs`, `postcss.config.cjs`, `.browserslistrc`, `_package.json`,
  `json-server` per l'endpoint ajax) ereditata da quando era pubblicato come pacchetto
  standalone `@massimo-cassandro/json-table` — dismessa in favore della demo centrale di minimo
  (`demo/demo-files/json-table/`, avviata nello step 1). Sparisce con l'eliminazione di `TODO json-table`
* i dati demo del caso `jsonUrl` (`demo/demo-files/json-table/demo-data.json`) sono serviti come
  file statico dal devServer: funzionano solo in sviluppo, non nella build GitHub Pages — da
  valutare un'alternativa (asset webpack o solo `data` inline) quando si farà `demo-build/`
* verificare se riusare così com'è `docs-builder/` (script che genera
  `docs/custom-props-list.md`) o allinearlo agli altri strumenti di documentazione di minimo

---

## fase 6 — finalizzazione

* eliminare la cartella `TODO json-table` (questo file compreso) a lavoro finito
* valutare l'export di `JsonTable` da `index.js` (oggi la sezione "web components" è vuota:
  s-datatable si registra per side effect all'import)
* verificare che il glob `files` di `package.json` (root) copra il nuovo web component
  (dovrebbe già essere incluso da `src/**/*.{js,mjs,css,svg,md}`)
* pianificare la rimozione di `s-datatable-component` (già marcato `@deprecated` nel
  codice) in una versione futura, dopo che json-table sarà stabile in produzione
* completare `readme.md` (già impostato sul modello di `s-datatable-component/docs.md`) con
  `cols`, eventi, ricerca, ordinamento e paginazione
