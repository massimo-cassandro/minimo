# Minimo-Charts

Genera grafici SVG per browser o registrandoli su disco (tramite node)

GEN 2026
* refactoring per rendere la classe tree-shakeable

LUG-NOV 2025
* Versione alpha

Richiede i package:

* `@svgdotjs/svg.js`
* `*opentype.js`
* `svgdom`

Modalità d'utilizzo:

* Plain JS (index.js): modalità standard, importa `svg.js` come modulo
* Node mode (index-node.js): per utilizzo con scripts Node

Test ed esempi nella directory `test`.



## Uso (JS)

```javascript
import { MinimoCharts, barsChart } from '@minimoCharts/index.js';

const chartInstance = new MinimoCharts();

barsChart(chartInstance, { container: '#chart', values: [...] });
```


## Riferimenti ed esempi: 

* https://codepen.io/massimo-cassandro/pen/zYRBJyG?editors=1100
* https://datavizproject.com/data-type/circular-bar-chart/
* https://datavizcatalogue.com/methods/radial_bar_chart.html

