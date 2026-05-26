import { barsChart } from '@minimoCharts/index.js';

export async function barsTest(chartInstance, nodeCfg = null) {


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
    // values: [
    //   [1050, 1008, 3450, 1230, 1450, 1203, 1307, 1467, 1809, 4969, 7175, 4298],
    //   [1600, 1404, 3106, 3085, 1730, 2405, 1371, 3866, 1448, 2419, 7024, 2628],
    //   [1765, 3407, 1598, 3555, 4416, 1051, 1573, 3225, 6412, 1698, 6840],
    // ],
    values: [
      [50,  8, 50, 30, 50, 63, 77, 67, 49, 69, 75, 249.6],
      [30, 14,  6, 85, 30, 65, 71, 66, 48, 19, 24, 28],
      [65, 37, 98, 55, 16, 61, 73, 25, 42, 98, 40],
    ],

    /** spazio tra una barra e l'altra */
    barsGap: 5,

    /** spazio tra una serie e l'altra */
    seriesGap: 20,

    /** bars top corner radius */
    barsCornerRadius: 12,

    showXgrid: true, // griglia verticale
    showYgrid: true, // griglia orizzontale

    /**
      etichette corrispondenti ai vari valori. Sono posizionate sull'asse X
    */
    xLabels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],

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
  // const max = Math.ceil(Math.max(0, ...opts.values.flat()) / 1000) * 1000;
  // const min = Math.floor(Math.min(max, ...opts.values.flat()) / 1000) * 1000;

  return barsChart(chartInstance, { // il return è necessario per i test node
    ...opts,
    // max_value: max,
    min_value: 0, //min,
    container: '#bars',

    ...(nodeCfg??{})
  });


}



