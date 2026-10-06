# Svg Icons Tools

Svg Icons Tools fornisce alcune utilità per gestire e ottimizzare le icone SVG:

* ottimizza tutti i file con [SVGO](https://svgo.dev/)
* combina i file svg in un unico file, in cui ogni icona è racchiusa in un elemento `<symbol>` (ispirato a [svgstore](https://github.com/svgstore/svgstore))
* converte i file svg in JSX
* copia i file svg ottimizzati nella directory di destinazione
* rimuove i *pallet* dal markup delle icone (vedi il file di configurazione per maggiori dettagli).
* crea un file scss con le icone svg convertite in variabili sass
* solo per jsx e icone ottimizzate: possibilità di gestire sia icone con `fill` sia con `stroke`, aggiungendo classi opzionali per applicare proprietà css diverse

Questi strumenti sono poco utili se le icone vengono scaricate da una delle librerie disponibili sul web, ma se le si disegna da sé, *svg-icons-tools* può far risparmiare molto tempo nella pulizia e nell'ottimizzazione delle icone disegnate con Illustrator, Figma, Sketch ecc.

Inoltre, la maggior parte (o la totalità) delle librerie permette di scaricare solo icone con spessore fisso, ma spesso si possono scaricare versioni "di lavoro" in cui lo spessore è definito dall'attributo stroke. In questi casi è spesso presente un *pallet* che si può rimuovere facilmente.

Maggiori informazioni nel mio articolo [Building an Icon System in React](https://medium.com/better-programming/building-an-icon-system-in-react-16757d73cc35).

## Installazione

```bash
npm i -D @massimo-cassandro/svg-icons-tools
```

## Setup

Per prima cosa creare un file di configurazione per il progetto, eseguendo:

```bash
npx iconsTools init
```

Viene creata una directory `svg-icons-tools` che contiene il file di configurazione `svg-icons-tools.config.mjs`.

Rinominare la cartella a piacere e spostarla dove serve. Poi aprire e personalizzare il file `svg-icons-tools.config.mjs`.

## Esecuzione

Per lanciare lo script, aprire il terminale e usare il comando:

```bash
npx iconsTools --config ./path/to/svg-icons-tools.config.mjs
```

dove `--config` deve contenere il percorso, relativo alla directory corrente, del file di configurazione.

Se il parametro `--config` non è impostato, lo script cerca il file di configurazione nella directory corrente; se il file non viene trovato, viene generato un errore.


## Dettagli di configurazione

Vedi [src/default-config.mjs](src/default-config.mjs) per maggiori informazioni.

## Demo

Vedi [demo/readme](demo/readme.md).

## TODO
* documentazione in jsdoc
* formattare meglio l'output jsx (aggiornare la documentazione)
* attributi SVG in jsx (aggiornare la documentazione)
* opzione per ripulire la cartella di destinazione per jsx e ottimizzati (?)
* changelog automatico


## Changelog / Breaking change

### 1.1
* aggiunta la funzione predefinita per la creazione delle icone jsx

#### Breaking change
* nel file di configurazione, `config.jsx.icon_builder` diventa `config.jsx.custom_icon_builder`; se non definita, per i file jsx viene usata la funzione predefinita.

### 1.0
* Prima release di produzione
