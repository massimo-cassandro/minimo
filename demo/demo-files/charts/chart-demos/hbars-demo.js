import { hBarsChart } from '@minimoCharts/index.js';

export async function hBarsTest(chartInstance, nodeCfg = null) {


  const opts = {

    /** mostra info utili per il debug */
    debug: true,

    /**
      larghezza e altezza del grafico (px),
      Se il container è presente e i parametro `width` o `height` sono `null`,
      quelli mancanti vengono ricavati dallaìe dimensioni del container
    */
    width: null,
    height: null,

    /**
      valori numerici per la definizione delle barre
      è un array di array, in cui ogni subarray contiene i valori di una singola serie di barre
    */
    values: [
      [50,  8, 49, 69, 75, -49.6],
      [30, 14, 48, -19, 24, 28],
      [65, 37, -42, 98, 40],
    ],

    /** spazio tra una barra e l'altra */
    barsGap: 5,

    /** spazio tra un gruppo di categoria e l'altro */
    seriesGap: 20,

    /** bars corner radius */
    barsCornerRadius: 12,

    showXgrid: true, // griglia orizzontale (asse categorie)
    showYgrid: true, // griglia verticale (asse valori)

    /**
      etichette di categoria, posizionate sull'asse verticale (a sinistra)
    */
    xLabels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],

    /**  suddivisioni asse dei valori */
    stepY_count: 5,

    ticksLength: 12,

    /**  parametri legenda (vedi componente ada-charts/src/components/legenda.js) */
    legenda: {items:[{text:'Serie 1'}, {text: 'Serie 2'}, {text: 'Serie 3'}]},

    yAxisTitle: 'Titolo asse categorie',
    xAxisTitle: 'Titolo asse valori',

    yAxisLabelWidth: 80,

    labelYFormatter: etiValue => etiValue.toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
  };

  return hBarsChart(chartInstance, { // il return è necessario per i test node
    ...opts,
    container: '#hbars',

    ...(nodeCfg??{})
  });


}
