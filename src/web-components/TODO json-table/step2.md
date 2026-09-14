# step 2

proseguimento attività avviata da [TODO](TODO.md).
riprende e sostituisce alvune parti in TODO.md: 'parametri per `cols`' e 'data-types'


## 1. modifiche parte già elaborata (struttura "esterna" json-table)

* aggiunta parametri `classes` e `labels`, mutuati da quelli omonimi in [s-datatable-component.js](../s-datatable-component/s-datatable-component.js), adattandoli dove serve ma utilizzando gli stessi valori di default
* aggiunta variabile `locale` (default `it-IT`), da utilizzare per le rappresentazioni di numeri e date, verrà utilizzata in data-types (vedi dopo)
* aggiunta parametro `template`, analaogo a quello di `s-datatable-component.js`, ma con la differenza che qui è un array domBuilder, il default corrisponde all'attuale struttura costruita in [main-builder.js](../json-table/src/main-builder.js)
* non trovo traccia nel [readme](../json-table/readme.md) di alcune cose richieste in TODO.md, paragtrafo `### parametri di <json-table> (attributi html o proprietà js):`, ad esempio le icone, i nomi delle classi di allineamento del test ecc. Non so se mancano solo nelr eadme o sosno state saltate: integrarle nel codice e nel readme
* Sezione `info` della struttura: deve essere popolata da una funzione definita nei parametri ks o tramita stringa mustache-like da attributo: deve restituire il contenuto della parte info; default: `labels.info`. La stringa può contenere questi segnaposti da sostituire con i dati reali:
  * {start}: indice del primo record attualmente visualizzato
  * {end}: indice dell'ultimo record attualmente visualizzato
  * {totRec}: totale dei record non filtrati restiuiti dal json (o in data). Nel caso di json paginato (situazione ancora da approfondire), `totRec` sarà uno dei parametri richiesti nel json dati, accanto a quello indicato in `jsonDataField`, anzi aggiungiamo per coerenza un parametro `totRecField` (default `totRec`) analogo a `jsonDataField`, Il valore contenuto deve essere nuimerico, in sua assenza si assume che il json non sia paginato e che totRec corrisponda al length dei dati
  * {filteredRec}: totale dei record dopo un filtro, anche da parametri esterni (ad esempio un form che imposti ua dei filtri sul record)
* `tfoot`, se true stampa il tfoot
* `updateFooterOnPageChange`     Se true, la callback `footerRender` riceve i soli record della pagina corrente (subtotale di pagina). Se false (default), riceve l'intero set filtrato indipendentemente dalla paginazione (totale complessivo). Quando è false il footer si aggiorna solo al cambio di filtro, non al cambio pagina. (default: false). NB: FORSE GIà INDICATO IN TODO


## 2. data-types

Uno dei parametri degli oggetti in `cols` sarà `type` o `dataType` (renderli equivalenti), il cui valore è la chiave dell'array `dataTypes` (da generare sulla base di `./src/js/default-columns-data-types.js` e `../s-datatable-component/src/parse-cols.js`)

Il suo scopo è semplificare la configurazione di tipi di dati ricorrenti (può essere modificato da setDefault) ma può essere rivisto per singolo campo, con degli ovverrides. Ad esempio: il datatType `num` ha di default un classe `text-end`, ma posso sovrascriverle con una classe ad hoc in una colonna specifica lasciando inalterati gli altri parametri di `num`



### 3. parametri per `cols`

Corrisponde al merge modificato tra i parametri `columns` di json-table e `cols` di s-datatable.

È un array di oggetti in cui per ognuno sono utilizzabili questi parametri:


* `key` - OBBLIGATORIO: chiave dell'oggetto JSON (= nome colonna nel DB).
* `title` - OBBLIGATORIO: Titolo della colonna (testo del `th`, può essere una stringa HTML, un elemento domBuilder). Nel caso di colonna in cui sia abilitato il sorting è il tersto del pulsante contenuto nel th,
* `dataType` o `type`: 'string' - Tipo di dato della cella; deve corrispondere a una delle chiavi di `dataTypes`. facolltativo
* `render` - Funzione di rendering per la cella, accetta come argomenti, nell'ordine: 
  
  * `row` (l'oggetto data corrispondenta alla riga in esame), default null
  * `tr`: l'elemento dom corrispomnedente al tr della riga in esame, default null
  * `td`: l'elemento dom corrispondete al `td`, default null

  Tutti gli aromenti sono facoltativi, NON vanno gestiti come oggetto, ma come argomenti, in quest'ordine, per semplificarne l'uso

* tfootRender: analogo a render, ma per il tfoot (se `tfoot` è true). Se null la cella corrisponde del foot veine renderizzata vuota. Riceve come argomento l'intero set di dati filtrati se `updateFooterOnPageChange` è false, oppure solo quelli visualizzati al omento se true
* `parse` - Funzione di parsing per la cella. ??? da valutare, aveva un senso forse in jsonTable. sembra tutto sommatto un duplicati di render
* `rowHeading` - Se true, la cella è un'intestazione di riga (`th[scope=row]`). default false
* `searchable` se true (default) attiva la funzionalità di ricerca per la colonna
* `sortable` se true (default) attiva la funzionalità di sorting per la colonna
* `sortValue`: valore o funzione analoga a render (ma solo con parametro row) per definire il valore da utilizzare per l'ordinamento della colonna
* `searchValue`: analogo a sortValue, ma per la ricerca, default null
* `condition` (rendering condizionale colonna, dai "requisiti funzionali" più sotto) 
* `headerClass` e `cellClass`: Classi assegnata al th o alla cella; sovrascrive quelle predefinite. Quando solo una delle due è presente, quella mancante va impostata automaticamente come quella presente. Questo prevale su eventuali impostazioni dei `dataTypes`


### note
* `hidden` (o analogo) è un parametro presente nelle altre versioni (vecchio json-table o s-datatable), serviva a non visualizzare una colonna pur tenendola in conto per rendering, ordinamento ecc. Con l'implementazione attuale mi sembra inutile. DA VALUTARE



