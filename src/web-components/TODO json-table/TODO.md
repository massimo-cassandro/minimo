# json-table

Piano di sviluppo per trasformare json-table nel web component light DOM che sostituirà
`s-datatable-component` (vedi CLAUDE.md, sezione "json-table ★"). Bozza da rivedere prima
di iniziare l'implementazione: correggere/integrare liberamente prima di procedere.

Stato attuale: in `src/` esiste solo una primissima versione, una classe plain JS
(`new JsonTable(params)`, non un custom element) con parti abbozzate e altre incomplete
o non funzionanti (vedi "Analisi codice esistente" più sotto). `s-datatable-component.js`
resta il riferimento architetturale per il pattern "custom element light DOM" da adottare,
pur non condividendone la dipendenza esterna (simple-datatables).

Modalità di sviluppo: non modificare `TODO json-table` ma creare una nuova dir `json-table`. A lavoro finito, la prima sarà eliminata

---

## parametri e confronto con s-datatable

Prima revisione, parziale, delle impostazioni del nuovo componente. Sezioni `cols` e
`data-types` volutamente non ancora riviste/mescolate col resto del piano (vedi in fondo
a questa sezione).

### impostazioni generali
* dove possibile vengono utilizzati i parametri già definiti per s-datatable, eliminando l'underscore iniziale
* tutti parametri devono essere inseribili come attributo o come proprietà istanziate tramite JS (o, sempre da js, tramite domBuilder). In caso di conflitto, l'impostazione tramite JS prevale. Ovviamente, dove prevista, la possibilità che il contenuto sia generato da una funzione è valido solo le proprietà instanziate via JS
* prevedere delle modalità js-free per coprire almeno le esigenze base, analogamente ai render con sintassi mustache-like di s-datatable, in linea di massime utilizzabili sia in html che js, ma di poca utilità in quest'ultimo caso
* uno dei problemi più noiosi di s-datatable, derivati da simple-datatables, è l'impossibilita dal render (nativo) di accedere ai dati di riga, in json table deve invece diventare lo standard. le funzioni di render devono passare come parametri il valore corrente, l'oggetto della riga ... (da valutare se necessario altro). prevedere cmq la possibilità di passare semplicemente il valor di riga (render: row => {} ) insieme ad un sintassi più completa ma più prolissa (render: ({row, cell, ...}) => {}). Si potrebbe fare analizzando il tipo dell'argomento, se stringa od oggetto — **vedi "incongruenze" più sotto: il criterio descritto non sembra applicabile così com'è**
* la modalità render in tutte le sue varianti deve essere utilizzabile anche le celle di `tfoot` e `thead` (proprietà di colonna: da integrare quando si riprenderà la sezione `cols`)
* sarebbe utile se possibile fare in modo che in vscode, spostando il cursore sopra il tag <json-table> venisse visualizzato un popup con i parametri, analogamente a quanto si fa con jsDoc nelle funzioni js — **da verificare la fattibilità**: VSCode non ha un supporto nativo equivalente per gli attributi dei custom element (servirebbe eventualmente un file di HTML custom data / web-types)
* se possibile prevedere script o qualcosa simile per passare da s-datatable a json-table
* il layout da generare per l'insieme di elementi info, tabella ecc è quello di json-table. Ignoriamo per ora tutta la parte per rendere l'header della tabella sticky (i vecchi parametri `stickyThead`/`stickyInfo` di json-table restano quindi fuori dall'elenco sotto: rimandati, non eliminati — vedi "incongruenze"). i pulsanti di sort sono quelli usati per s-datatable, ~~ma senza annidare un button dentro il th, metteremo solo un `role="button"` al th stesso — **vedi "incongruenze": possibile rischio di accessibilità**.~~ **Come non detto, usiamo un button**
* Utile se possibile, una funzione per impostare dei default validi per tutti il progetto senza dover ripetere gli stessi parametri ogni volta. Ad esempio, in uno script condiviso lanciati sempre prima degli altri, invocare qualcosa come `jsonTable.setDefaults({...})` che imposti dei valori standard per qualsissi parametro di quel progetto
* I parametri di json-table o s-datatable non riportati vanno ignorati

### parametri di <json-table> (attributi html o proprietà js):

Mix tra i parametri della prima versione di `json-table` (`src/web-components/TODO json-table/src/js/defaults.js`) e `SimpleDatatableAdapter` (`src/web-components/s-datatable-component/s-datatable-component.js`)

* `debug`: boolean, default false, da definire bene ma in linea di massima deve mostrare in console info extra se impostato a true
* `jsonUrl`: url del json da caricare via ajax (stesso comportamento di s-datatable), corrisponde a `json` in `s-datatable`
* `jsonDataField`: campo del json contenente i dati da utilizzare, ad esempio se `data`, i dati saranno recuperati da `{ data: [...]}` (come in s-datatable), se `null` o stringa vuota, i dati corrispondono alla root del json. Default: `data`
* `jsonMaxLength`: (sostituisce il generico `maxDataLength` ipotizzato nei "requisiti funzionali" più sotto e in fase 2 — nome definitivo da qui in avanti): lunghezza massima di record del json. In base alla paginazione e al numero di record per pagina, quando la pagina richiesta supera il numero indicato deve partire una nuova richiesta per un nuovo set di dati. Ovviamente questo richiede che lato backend sia definito un controller in grado di ricevere i parametri necessari. **Da capire come gestire casi in cui il 'cambio' di set dati cade a metà di una pagina** Inoltre: l'eventuale nuovo set si aggiunge all'esistente o lo sostituisce (quindi navigando all'indietro si richiede nuovamente il set già chiesto in precedenza)? Se null (default) nessuna paginazione
* `jsonPaginationParams`: entra in gioco solo se `jsonMaxLength` è diverso da null. È un oggetto (o una stringa json da elaborare con JSON.parse) che contiene i parametri da accodare all'url json per richiedere un nuovo set di dati. Default `{start:<start>, pag:<pag>, perPage: 1500, ...}`. I primi due sono alternativi (in caso siano presenti entrambi prevale `pag`) e uno dei due deve essere presente, gli altri sono definibili liberamente. `pag` indica la pagina (il set di dati) da richiedere, il secondo il record da cui far partire l'eventuale query lato server (ad esempio con mysql avremmo `LIMIT {start},{perPage}`). Usando i valori di default, avremmo, ad esempio, per una seconda pagina di dati, una richiesta ajax di questo tipo: `${jsonUrl}?pag=${pag}&perPage=${perPage}`. **Da definire meglio e capire si si può semplificare**
* `data`: alternativo a `json`, un oggetto di valori da utilizzare per il rendering della tabella. Se presente anche `json`, `data` prevale. Allo stesso modo viene ignorato un eventuale  `jsonDataField`: l'oggetto passato si intende già come root dei dati. Se passato tramite attributo richiede un JSON.parse per essere utilizzato. Prevedere messaggio di errore in caso di json malformato
* `caption`: eventuale caption della tabella, stringa o funzione
* `search`: boolean, default true, se generare o meno l'input di ricerca in alto a destra
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
* `tableId` : id della tabella, opzionale, default null
* `tableWrapperExtraClass` : classe extra per il div wrapper della tabella (default 'table-responsive'), Questa e le classi seguenti, se presenti sostituiscono interamente i valori di dafult, salvo eventuali classi legate al layout (generalmente `styles.xxx`) — **vedi "incongruenze": nome "Extra" ma comportamento di sostituzione integrale**
* `tableClass` : idem per la tabella (default: `table table-bordered`, coerente col parametro `tableClass` appena aggiunto a s-datatable),
* `mainWrapperExtraClass` : Classe aggiuntiva per il contenitore principale (che racchiude blocco info e tabella). default null
* `outerInfoExtraClassName` : Classe aggiuntiva per la sezione informativa esterna. default null — **vedi "incongruenze": naming `ClassName` vs `Class`**
* `infoExtraClassName` : Classe aggiuntiva per la sezione info. default null — idem
* nomi delle classi per l'allineamento del testo, i valori di default, tra parentesi sono le classi di minimo:
  * `inlineEndAlignClass`: allineamento a destra (text-end)
  * `inlineCenterAlignClass`: allineamento al centro (text-center)
  * `inlineLeftAlignClass`: allineamento a sx (text-start)
  * `nowrapClass` : nowrap (text-nowrap),
* `renderNullAs`: se diverso da null, è il carattere per rappresentare eventuali valori `null` (default: '\u2014'). Come quella in s-datatable non va applicata dove creerebbe falsi positivi, ad esempio nel tipo boolean (vedi su s-datatable)
* `renderZeroAs`: se diverso da null, è il carattere per rappresentare eventuali valori numerici pari a zero (default: null). Sostituisce la coppia `useZeroAltChar`/`zeroAltChar` della prima versione di json-table
* `renderNaNAs`: se diverso da null, è il carattere per rappresentare eventuali valori NaN. Sostituisce `isNaNChar` (default: '\u2014').
* `boolValuesClass` : Classe aggiunta alle celle con icone per valori booleani (true/false). default null,
* `boolTrueClass` : Classe aggiunta alle celle per il valore true. default null,
* `boolFalseClass` : Classe aggiunta alle celle per il valore false. default null,

* Icone utilizzate dalla tabella per i valori booleani e l'ordinamento. Le icone importate possono essere un HTMLElement, un SVGElement, una funzione che restituisca un elemento o un oggetto domBuilder. **da aggiungere svg di default**
  * `boolTrueIcon`: icona/markup per il valore booleano "true" (vero)
  * `boolFalseIcon`: icona/markup per il valore booleano "false" (falso)
  * `sortAscArrowIcon`: icona/markup per la freccia di ordinamento asc
  * `sortDescArrowIcon`: icona/markup per la freccia di ordinamento desc
  * `sortNoneArrowIcon`: icona/markup per ordinamento non applicato — 3 icone distinte al posto dell'unica `sortArrowIcon` ruotata via CSS della prima versione di json-table: vedi "incongruenze"

* `searchInputClass` : Classe alternativa per l'input di ricerca (sovrascrive quella predefinita, tranne eventuali stili legati al layout, styles.xxxx). **default da definire**
* `searchInputTitle` : attributo title per l'input di ricerca, default: 'Filtra record: inserisci un termine per eseguire la ricerca'
* `searchInputPlaceholder` : placeholder per l'input di ricerca, default: 'Inserisci il termine da cercare'
* `searchInputAriaLabel` : Aria-label per l'input di ricerca. default 'Filtra risultati',
* `trCallback` : Callback invocata dopo il rendering di ogni riga (<tr>). default null,

### incongruenze e punti da chiarire (emersi dal merge)

* **"Extra" vs sostituzione integrale**: `tableWrapperExtraClass`, `mainWrapperExtraClass`, `outerInfoExtraClassName`, `infoExtraClassName` sono nominati come classi "extra" (farebbe pensare a un'aggiunta alla classe di default), ma il testo dice che "sostituiscono interamente i valori di default" — comportamento e nome sono in contraddizione. Nella prima versione di json-table le `*ExtraClassName` erano invece additive per davvero. Da decidere: comportamento additivo (allora va bene "Extra" nel nome) o sostitutivo integrale (allora il nome andrebbe cambiato, es. `tableWrapperClass`)
* **naming incoerente `Class` vs `ClassName`**: quasi tutti i parametri hanno perso il suffisso "Name" (`tableWrapperExtraClass`, `mainWrapperExtraClass`, `boolValuesClass`, `boolTrueClass`, `boolFalseClass`, `searchInputClass`, `inlineEndAlignClass`, ...), ma `outerInfoExtraClassName` e `infoExtraClassName` lo mantengono ancora — scegliere un'unica convenzione
* **icone di ordinamento**: passando da un'unica `sortArrowIcon` ruotata via CSS (come nella prima versione di json-table, con relative custom properties di rotazione già documentate) a tre icone distinte (asc/desc/none), le eventuali custom properties di rotazione previste in fase 4 (CSS/token) diventano superflue — da tenere presente quando si arriva a quella fase
* **`role="button"` sul `<th>` invece di un `<button>` annidato**: rischio di regressione di accessibilità. Il blocco di note ARIA già presente nel codice attuale (`set-sort-listeners.js`) raccomanda esplicitamente un `<button>` reale dentro il `<th>`, con `aria-sort` sul `<th>` stesso — un `role="button"` diretto sul `<th>` rimuove la sua semantica nativa di intestazione di colonna per gli screen reader e richiede gestione manuale di focus/tastiera. Da verificare con attenzione prima di escludere il `<button>` annidato. Inoltre i parametri restano chiamati `sortButtonAriaLabelXxx` pur non esistendo più un vero `<button>`: da rinominare se si conferma la scelta, o da riconsiderare la scelta stessa
* **doppia firma di `render`** (`row => {}` vs `({row, cell, ...}) => {}`) distinta "analizzando il tipo dell'argomento, se stringa od oggetto": in entrambi i casi l'argomento è un oggetto (la riga, oppure l'oggetto opzioni), non una stringa — il criterio descritto non sembra poter funzionare così com'è. Da chiarire il criterio reale (es. arità della funzione `fn.length`, oppure evitare il problema chiamando sempre con l'oggetto completo e lasciando che chi scrive `render` destrutturi solo `row` se gli basta: `render: ({row}) => {}`)
* `stickyThead`/`stickyInfo` (presenti nella prima versione di json-table) non compaiono più nell'elenco parametri sopra: coerentemente con "ignoriamo per ora la parte sticky", li considero rimandati a una fase successiva, non eliminati dai requisiti — da confermare

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

## pulizia preliminare (fatto)

* rimosso `_work/OLD/`: copia più vecchia e interamente superata dell'attuale `src/`
  (stessi file, versioni precedenti verificate via diff — nessuna informazione persa)
* rimosso `src/__json-table-react/`: duplicato parziale e identico (diff vuoto su tutti
  i file in comune) di `_work/__json-table-react/`, finito per errore dentro `src/`
* rimosso `src/TODO.md` (conteneva solo "check tutte le occorrenze di `this.params.ajax`"):
  verifica già fatta in fase di analisi, occorrenze elencate più sotto in "Analisi codice esistente"
* NON toccati (restano in `_work/` come materiale da valutare in seguito, fuori dallo scope
  di questo piano):
  * `_work/__json-table-react/` — primissimo esperimento con versione React, non più
    mantenuto né da proseguire: resta solo come riferimento da cui recuperare eventuali
    parti riciclabili (es. logica di paginazione/formattazione), non come base di codice
  * `_work/download-excel.js`, `_work/download-button.js`, `_work/pagination.js`,
    `_work/pagination-array-builder.js`, `_work/set-download-filename.js`,
    `_work/table-info.js`, `_work/arrow.svg`, `_work/archived/table-to-csv.js` —
    frammenti di feature non ancora implementate (download excel, paginazione), utili
    come riferimento quando quelle fasi verranno affrontate
  * `_work/da decidere/get-cell-data.js`, `_work/___JsonTable.jsx`, `_work/___StaticTable.jsx`
    — marcati esplicitamente "da decidere", nessuna azione presa

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

## analisi codice esistente (`src/`)

Punti emersi rileggendo l'attuale abbozzo, da tenere presenti per non ripartire da zero
ma nemmeno per portare avanti parti rotte:

* **funzionante/solido, riusabile**: sistema `dataTypes` (`default-columns-data-types.js`:
  string/date/datetime/num/perc/percDecimal/euro/bool, con `render`/`sortValueParser`/
  `searchValueParser`/`colDefaultsOverrides`), `parseParams`/`defaults.js` (merge
  defaults → `data-params` attr → custom_params, validazione colonne/sorting), struttura
  a CSS module per file (`table`, `main-builder`, `info-section`, `icons`, `utility`)
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
    commentato e mai adattato — da buttare e riscrivere
  * nessuna paginazione, né lato statico né lato ajax, nonostante sia il primo punto dei
    "requisiti funzionali" sopra
* **import da pacchetti esterni non più esistenti in minimo** (retaggio del vecchio repo
  standalone `@massimo-cassandro/json-table`): `@massimo-cassandro/js-utilities` (cestinato,
  vedi CLAUDE.md § _wrk) e `@massimo-cassandro/dom-builder` (ora interno a minimo). File
  coinvolti: `main-builder.js`, `table-builder.js`, `parse-data-row.js`, `table-thead.js`,
  `info-section.js`, `set-sort-listeners.js` — da ripuntare rispettivamente a
  `src/utilities/classnames.js` e `src/utilities/dom-builder/dom-builder.js` di minimo
* `table.module.css` referenzia direttamente un token generico di minimo (`var(--green-2…)`),
  in violazione della regola di indipendenza dei design token nei componenti (vedi CLAUDE.md)

---

## fase 1 — da classe a custom element light DOM

* trasformare `JsonTable` da classe plain (`new JsonTable(params)`) a `HTMLElement`
  custom (tag `<json-table>`), light DOM (no shadow DOM) — stesso approccio di
  `SimpleDatatableAdapter` in `s-datatable-component.js`
* adottare lo stesso pattern di risoluzione parametri di s-datatable: `_getParam(name, default)`
  con precedenza `init()` (script) > attributo HTML > default interno, auto-parse JSON per
  array/oggetti e boolean per attributi HTML idiomatici (vedi `_getParam` in
  `s-datatable-component.js`)
* lifecycle `connectedCallback`/`disconnectedCallback` con gestione delle race condition tra
  attach al DOM e chiamata `init()` da script (stessi flag `_initCalledProgrammatically`/
  `_loadStarted`/`_loadGeneration` già collaudati in s-datatable)
* API pubblica equivalente: `init(config)`, `destroy()`, `reload(overrides)`
* mantenere l'evento custom `jt:ready` già presente (buona pratica, dispatch a microtask
  già implementato correttamente) — valutare se rinominarlo per coerenza con la convenzione
  `<tagname>:evento` usata altrove (`datatable:search` ecc. in s-datatable) — **da decidere**
* nessuna dipendenza esterna richiesta (a differenza di s-datatable/simple-datatables):
  ordinamento, ricerca e paginazione vanno implementati internamente in vanilla JS

---

## fase 2 — completamento funzionalità core

* riscrivere l'ordinamento per tabelle statiche (`staticDataSorting` è attualmente un no-op)
* riscrivere la ricerca: fix del bug `this.ajax`/`this.params.ajax`, sostituire la dipendenza
  da `this.parsedData` (mai popolato) con una fonte dati coerente
* implementare davvero il rendering ajax (oggi è un placeholder vuoto), inclusi
  ricerca/ordinamento lato server per quella modalità
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
* aria-sort/aria-label sui pulsanti di ordinamento (nota già presente nel codice attuale ma
  mai implementata) — nomi parametro definiti (`sortButtonAriaLabelAsc/Desc/None`), ma vedi
  "parametri e confronto con s-datatable" per il dubbio aperto su `role="button"` sul `<th>`
  al posto di un `<button>` annidato (possibile rischio di accessibilità da chiarire prima
  di implementare)
* valutare se portare anche `_collapseKey`/`_collapsePlaceholder`/`_collapseClass` di
  s-datatable (raggruppamento visivo di valori ripetuti su righe consecutive) — feature
  aggiuntiva rispetto ai requisiti originali, ma segnalata come pattern utile — **da decidere**

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

* creare `json-table.minimo.tokens.mjs` colocato nella cartella del componente, sul modello
  di `modal-alert` e `inner-nav` (vedi CLAUDE.md, "Indipendenza dei design token nei
  componenti"): le custom properties del CSS restano tutte namespaced `--jt-*` (già ben
  impostate nella maggior parte dei file attuali), la risoluzione verso i token generici di
  minimo avviene solo nel file token, in fase di build
* eliminare l'unico riferimento diretto a un token generico trovato in `table.module.css`
  (`var(--green-2…)`), sostituendolo con una custom property `--jt-*` propria, mappata nel
  nuovo file token
* mantenere l'impostazione a CSS module già in uso, coerente con gli altri web-component

---

## fase 5 — import da pacchetti esterni non più esistenti

* sostituire tutti gli import di `@massimo-cassandro/js-utilities` con
  `src/utilities/classnames.js` di minimo (file coinvolti: `main-builder.js`,
  `table-builder.js`, `parse-data-row.js`, `table-thead.js`, `info-section.js`)
* sostituire l'import di `@massimo-cassandro/dom-builder` con
  `src/utilities/dom-builder/dom-builder.js` di minimo (file coinvolto: `set-sort-listeners.js`,
  oltre a `main-builder.js` già in elenco sopra)

---

## fase 6 — demo e build

* il componente porta ancora con sé una toolchain demo interamente separata (proprio
  `webpack.config.mjs`, `postcss.config.cjs`, `.browserslistrc`, `_package.json`,
  `json-server` per l'endpoint ajax) ereditata da quando era pubblicato come pacchetto
  standalone `@massimo-cassandro/json-table` — da dismettere in favore dell'integrazione
  nella demo centrale di minimo (`demo/demo-files/`, come già avviene per modal-popup,
  slide-up-down-toggle, unsplash-page, modal-alert)
* rimuovere, a migrazione completata: `_package.json`, `demo/webpack.config.mjs`,
  `demo/webpack-modules/`, `demo/postcss.config.cjs`, `demo/.browserslistrc`
* verificare se riusare così com'è `docs-builder/` (script che genera
  `docs/custom-props-list.md`) o allinearlo agli altri strumenti di documentazione di minimo

---

## fase 7 — finalizzazione

* rinominare la cartella da `TODO json-table` a `json-table` (rimuovere il prefisso
  convenzionale "TODO ")
* verificare che il glob `files` di `package.json` (root) copra il nuovo web component
  (dovrebbe già essere incluso da `src/**/*.{js,mjs,css,svg,md}`)
* pianificare la rimozione di `s-datatable-component` (già marcato `@deprecated` nel
  codice) in una versione futura, dopo che json-table sarà stabile in produzione
* aggiornare `README.md` (oggi orientato all'API della vecchia classe `new JsonTable(...)`)
  con l'uso da markup/script del nuovo custom element, sul modello di
  `s-datatable-component/docs.md`

