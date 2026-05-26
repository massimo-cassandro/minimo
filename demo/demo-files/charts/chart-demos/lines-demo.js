import { linesChart } from '@minimoCharts/index.js';

export async function linesTest(chartInstance, nodeCfg = null) {


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
      valori numerici per la definizione delle linee
      è un array di array, in cui ogni subarray contiene i valori di una singola linea
    */
    values: [
      [1050, 1400, 3450, 1230, 1450, 1203],
      [1600, 1404, 3106, 3085, 1730, 2405],
      [1765, 3407, 1598, 3555, 4416, 1051],
    ],

    /**
      etichette corrispondenti ai vari valori. Sono posizionate sull'asse X
    */
    xLabels: ['Zucchine', 'Peperoni', 'Cetrioli', 'Patate', 'Insalata', 'Melanzane'],

    /**  suddivisioni asse Y */
    stepY_count: 5,

    ticksLength: 12,

    /**  parametri legenda (vedi componente ada-charts/src/components/legenda.js) */
    legenda: {items:[{text:'Serie 1'}, {text: 'Serie 2'}, {text: 'Serie 3'}]},

    yAxisTitle: 'Titolo asse Y',
    xAxisTitle: 'Titolo asse X',

    yAxisLabelWidth: 80,

    // data_lines_attrs: {
    //   ...default_grid_lines_attrs,
    //   'stroke-width': 2
    // },
    data_points_attrs: {
      r: [4,4,6]
    },

    // /** colori delle linee */
    // data_colors: null,

    data_lines_widths: [null, null, 4],

    labelYFormatter: etiValue => etiValue.toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
  };

  // ricalcolo min e max per avere valori "tondi"
  const max = Math.ceil(Math.max(0, ...opts.values.flat()) / 1000) * 1000;
  const min = Math.floor(Math.min(max, ...opts.values.flat()) / 1000) * 1000;

  // versione senza titoli
  linesChart(chartInstance, { // il return è necessario per i test node
    ...opts,
    yAxisTitle: null,
    xAxisTitle: null,
    legenda: null,
    max_value: max,
    min_value: min,
    container: '#lines2',

    ...(nodeCfg??{})
  });

  return linesChart(chartInstance, { // il return è necessario per i test node
    ...opts,
    max_value: max,
    min_value: min,
    container: '#lines',

    ...(nodeCfg??{})
  });


}



