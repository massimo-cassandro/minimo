# json-table

Piano di sviluppo per trasformare json-table nel web component light DOM che sostituirà
`s-datatable-component` (vedi CLAUDE.md, sezione "json-table ★"). Bozza da rivedere prima
di iniziare l'implementazione: correggere/integrare liberamente prima di procedere.

Stato attuale: in `src/` esiste solo una primissima versione, una classe plain JS
(`new JsonTable(params)`, non un custom element) con parti abbozzate e altre incomplete
o non funzionanti (vedi "Analisi codice esistente" più sotto). `s-datatable-component.js`
resta il riferimento architetturale per il pattern "custom element light DOM" da adottare,
pur non condividendone la dipendenza esterna (simple-datatables).

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
* prevedere possibilità di accedere a un set di dati molto grandi, da paginare, con un parametro che indichi da quale "punto" richiedere un nuovo json al server (es, maxDataLength: 1000)
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
  grandi dataset (parametro tipo `maxDataLength`)
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
  mai implementata)
* valutare se portare anche `_collapseKey`/`_collapsePlaceholder`/`_collapseClass` di
  s-datatable (raggruppamento visivo di valori ripetuti su righe consecutive) — feature
  aggiuntiva rispetto ai requisiti originali, ma segnalata come pattern utile — **da decidere**

---

## fase 3 — bug noti di s-datatable da non ereditare

* **parseCols**: mai sostituire per intero l'oggetto di definizione colonna nei preset
  (`renderMode`/`dataType`) — sempre merge con le proprietà utente, mai override secco
  (bug osservato in s-datatable: `_renderMode: 'numeric'` cancellava silenziosamente
  `_cellRender`/`_sortValue`/`_searchValue` della colonna)
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
