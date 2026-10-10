# color set builder

Applicazione web per generare una scala di colori parnedo da un colore base inserito dall'utente

## funzionalità

* ispirato a https://hihayk.github.io/scale/ (https://github.com/hihayk/scale)
* applicazione in js vanilla, utilizzando il più possibile il fw minimo
* l'utente inserisce un colore, con possibilità di tuning tramite il picker nativo del browser e stabilisci quando valori nella gradazione chiara e quanti nella scura
* al set si deve poter stabilire un nome (ad esempio primary)
* possibilità di aggiungere ulteriori set di colori partendo da un nuovo colore base. Ogni set avraà il proprio nome
* l'insieme di set (uno o più) corrsipinde ad un progetto, con un proprio nome. Al suo salvataggio (nellp storage o nel config json, vedi dopo) vengono registrate automaticamente alcune info, data di creazione, data ultima modifica,ecc...? Possibilità inserimento descrizione facoltativa. Aggiunta automatica id univoco (decidere come generarlo)

* per ognuna delle due scale può variare tinta, luninosità e saturazione, le modifiche si applicano a tutti i colori ella relativa scala
* per ogni colore deve essere possibile impostare un nome. 
  * Quello inserito di default è `100`, 
  * per gli altri proporre una scala automatica sulla base di un incremento inserito da qualche parte nella pagina. Possibilmente due incrementi differenziati per scala colori chiari e scuri  (ad esempio `10` per i chiari e `50` per gli scuri)
  * Se il nome del valore base è numerico, i nomi degli altri colori del set sono generati automaticamente in base al valore di incremento, sottraendolo nei chiari e aumentandolo negli scur'. Ad esempio se il colore base è 100, avremo 90, 80, 70... per i colori chiari; e `150`, `200`  per i colori scuri
* valutare se permettere un tuning aggiuntivo per singolo colore
* possibilità di aggiungere un colore intermedio tra due colori esistenti, auto calcolato, con possibilità di tuning
* possibilità di indicare uno o più colori da confrontare con ognuno dei colori egnerati ed ottenere il valore di contratso ai fini dell'accessibilità, con relativo esito AAA, AA, fail ecc
  * valutare implementazione anche nuovk algoritmo contrasto


* il risultato finale si può scaricare in diversi modi:
  * file css custom properties
  * copia css custom properties
  * copia o file codice svg dei vari colori in forma di riquadri allineati (con il nome)

* le impostazioni vengono salvate automaticamente in un local storage (o indexeddb), aggiungendosi sd eventuali set già presenti
* all'apertura della pagina dell'app, l'interfaccia mostra un menu o un pulsante cha apra un popup dai quali sia possibile richiamare uno dei set esistente mostrandone nome progetto e data di creazione/modifica
  * possibilità di rimuovere un set esistente e di evitare il suo salvataggio automatico (default false)
* possibilità di salvare un file json (o altro) con tutta la configurazione e con possibilità di ricaricarlo. Qualora il progetto esistesse già nello storage, il sistema deve chiedere se sostituirlo con quello caricato oppure deve dare la possibilità di cambiare i nomi di entrambi, vecchio e nuovo. In ogni caso ogni progetto avrà un id univoco, quindi possono cmq convivere con lo stesso nome
