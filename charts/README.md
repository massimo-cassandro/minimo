# Minimo-Charts

Genera grafici SVG per browser o registrandoli su disco (tramite node)

Richiede i package:

* `@svgdotjs/svg.js`: sempre necessario
* `svgdom`: solo per l'uso con Node
* `opentype.js`: solo per l'uso con Node, e solo se si attiva la conversione dei testi in tracciati (`textToPath`)

Nessuno di questi viene installato automaticamente con minimo: vedi [Uso (JS)](#uso-js).

Modalità d'utilizzo:

* Plain JS (index.js): modalità standard, importa `svg.js` come modulo
* Node mode (index-node.js): per utilizzo con scripts Node

Test ed esempi nella directory `test`.



## Uso (JS)

Installazione dei pacchetti aggiuntivi:

```bash
# sempre necessario (browser e Node)
npm install -S @svgdotjs/svg.js

# solo per l'uso con Node: fornisce window e document a svg.js
npm install -S svgdom

# solo per l'uso con Node, e solo se si attiva `textToPath` (testi convertiti in tracciati)
npm install -S opentype.js
```

`svgdom` non è una dipendenza di `@svgdotjs/svg.js`: va installato a parte, ed è richiesto da `src/node-helpers/create-svg-canvas-node.mjs`. `opentype.js` viene caricato con un import dinamico solo quando `textToPath` è attivo, quindi nel browser non serve.

Esempio: 

```javascript
import { MinimoCharts, barsChart } from '@massimo-cassandro/minimo/charts';

const chartInstance = new MinimoCharts();

barsChart(chartInstance, { container: '#chart', values: [...] });
```


## Riferimenti ed esempi: 

* https://codepen.io/massimo-cassandro/pen/zYRBJyG?editors=1100
* https://datavizproject.com/data-type/circular-bar-chart/
* https://datavizcatalogue.com/methods/radial_bar_chart.html


## Changelog

* gen 2026: refactoring per rendere la classe tree-shakeable
* lug-nov 2025: Versione alpha
