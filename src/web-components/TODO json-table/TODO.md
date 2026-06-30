# json-table

## core
* meccanismo acquisizione json per grandi quantità di records basato sulla paginazione
* opzione `condition` per renderizzare o meno una colonna (vedi opzione `hidden` di simple-datatable)
* in generale ogni elemento (cella) deve acceyyare contenuti in forma di stringa plain text, stringa html, elemento DOM, array domBuilder...
* possibilità di utilizzare un campo solo a fini di ricerca senza mostrarlo nella tabella
* possibilità di definire valori per ordinamento e ricerca diversi da quelli effettivamente presenti nel josn. Il default dovrebbe corrispondere a quanto mostrato
  
## altro
* nei campi di tipo numerico prevedere classi di default text-end e text-numeric o classe ad hoc socrascrivibile
* footerRender: possibilità di funzioni predefinite per calcoli base (somma, media ecc) di una determinata colonna
