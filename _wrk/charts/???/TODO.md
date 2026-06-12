decidere se includere anche il grafico settimanale o no


documentare modalità di estensione della classe

https://claude.ai/share/551e5453-02fd-4a6c-8147-1197d6908a8d

```javascript
// my-project/charts/index.js
import { AdaCharts, barsChart, goalChart } from 'ada-charts'; // re-export originali
import { myCustomBar } from './my-custom-bar.js';
import { myTimeline } from './my-timeline.js';

// wrapper per i grafici del progetto (stesso pattern)
export const myCustomBarChart = (chartInstance, params) =>
  myCustomBar.call(chartInstance, params);

export const myTimelineChart = (chartInstance, params) =>
  myTimeline.call(chartInstance, params);

// re-esporta tutto dalla libreria base
export { AdaCharts, barsChart, goalChart };
```

custom chart:

```javascript
// my-project/charts/my-custom-bar.js
export function myCustomBar(params) {
  // `this` è l'istanza AdaCharts
  const { data, color = '#333' } = params;

  // usa i metodi/proprietà di AdaCharts normalmente
  const svg = this.createSVG(); // o come AdaCharts espone il canvas

  // logica del grafico...
  return svg;
}
```
