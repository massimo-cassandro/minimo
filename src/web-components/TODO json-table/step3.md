# step 3

alla fine, per ogni punto elenca cosa hai fatto

* IMPORTANTE: chiarire meccanismo di paginazione del json secondo quanto indicato in TODO.md
  
>* `jsonMaxLength`: lunghezza massima di record del json. In base alla paginazione e al numero di record per pagina, quando la pagina richiesta supera il numero indicato deve partire una nuova richiesta per un nuovo set di dati. Ovviamente questo richiede che lato backend sia definito un controller in grado di ricevere i parametri necessari. **Da capire come gestire casi in cui il 'cambio' di set dati cade a metà di una pagina** Inoltre: l'eventuale nuovo set si aggiunge all'esistente o lo sostituisce (quindi navigando all'indietro si richiede nuovamente il set già chiesto in precedenza)? Se null (default) nessuna paginazione
>* `jsonPaginationParams`: entra in gioco solo se `jsonMaxLength` è diverso da null. È un oggetto (o una stringa json da elaborare con JSON.parse) che contiene i parametri da accodare all'url json per richiedere un nuovo set di dati. Default `{start:<start>, pag:<pag>, perPage: 1500, ...}`. I primi due sono alternativi (in caso siano presenti entrambi prevale `pag`) e uno dei due deve essere presente, gli altri sono definibili liberamente. `pag` indica la pagina (il set di dati) da richiedere, il secondo il record da cui far partire l'eventuale query lato server (ad esempio con mysql avremmo `LIMIT {start},{perPage}`). Usando i valori di default, avremmo, ad esempio, per una seconda pagina di dati, una richiesta ajax di questo tipo: `${jsonUrl}?pag=${pag}&perPage=${perPage}`. **Da definire meglio e capire si si può semplificare**
* posizione caption: va messo di default sotto la tabella, a sinistra; a destra va la pulsantoera di navigazione per le pagine
* demo 4 (Colonne generate automaticamente), non serve. rimuovere demo e anche eventuale parte relativa nello script json-table. Cols deve essere obbligatorio, senza cols deve essere restituito un errore
* problema della demo, non legato strettamente a json-table: ho verificato che il css caricato nell demo json-table contine altri css (sicuramente quello della demo charts, ad esempio). Il problema credo sia strutturale in `demo/routes.js` dove tutti gli script demo vengono caricati e questo si porta dietero i vari css. Se c'è soluzione rapida risolvi, altrimenti è un task da rimandare
* parametro `perPage` mancamte e non applicato, rivedi tutti i file TODO e step*: era citato. controlla di non aver tralasciato altro, di conseguenza va sistemata la navigazione per pagine
* il tipo `/** @type {JsonTable} */` mi sembra molto usato: vale la pena inserirlo in types o declarations.d.ts perché possa essere utilizzato da scriupt consumer?
* nel readme elencare le varie opzioni aggregate `@sum`, `@svg` ecc...
* Il pattern di rendering dei datetime produce:
`<time datetime="2014-05-09T00:32:16.000Z">9 mag 2014&nbsp;<small>02:32</small></time>`
l'ho modificato, prendi nota se necessario, ho modificato anche altre cosette, ora produce
`<time datetime="2019-01-28T08:01:19.000Z"><span>28 gen 2019</span> <small>09:01</small></time>`, lo span però dovrebbe avere la classe nowrap che non viene applicata
* nello stesso punto c'è un TODO per ora da ignorare
* ci sono errori ts in data-types.js
* l'odinamento delle colonne va implementato, se i dati sono paginati, deve partire per forza di cose un nuova richiesta json con un parametro che inneschi il sort lato server DA DEFINIRE
* per quanto riguarda il css, continua a rimanere sull'essenziale, lo vedremo in dettaglio più avanti
* IMPORTANTE: il tfoot per come è concepito ora ha senso solo i dati NON sono paginati, ci sono possibili soluzioni a questa cosa, ma per ora non ce ne occupiamo, vincola solo la presenza del tfoot al fatto che i dati NON siano pagiunati
