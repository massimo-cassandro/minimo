export async function linesNodeTest(cfg) {


  const svgFile = await cfg.charts.lines({

    yAxisTitleFontFilePath: cfg.fontFile.medium,
    xAxisTitleFontFilePath: cfg.fontFile.medium,
    labelXFontFilePath: cfg.fontFile.regular,
    labelYFontFilePath: cfg.fontFile.regular,



    /** mostra info utili per il debug */
    debug: true,

    /**
      larghezza e altezza del grafico (px),
      Se il container è presente e i parametro `width` o `height` sono `null`,
      quelli mancanti vengono ricavati dallaìe dimensioni del container
    */
    width: 800,
    height: 500,


    /**
      valori numerici per la definizione delle linee
      è un array di array, in cui ogni subarray contiene i valori di una singola linea
    */
    values: [
      [1000, 1400, 3450, 230, 450, 1203],
      [600, 1404, 3106, 3085, 730, 2405],
      [1765, 3407, 598, 3555, 3416, 1051],
    ],

    /**
      etichette corrispondenti ai vari valori. Sono posizionate sull'asse X
    */
    xLabels: ['A', 'B', 'C', 'D', 'E', 'F'],

    /**  suddivisioni asse Y */
    stepY_count: 5,

    /**  parametri legenda (vedi componente ada-charts/src/components/legenda.js) */
    legenda: {
      fontFilePath: cfg.fontFile.regular,
      items:[{text:'Serie 1'}, {text: 'Serie 2'}, {text: 'Serie 3'}]
    },

    yAxisTitle: 'Titolo asse Y',
    xAxisTitle: 'Titolo asse X',

    // data_lines_attrs: {
    //   ...default_grid_lines_attrs,
    //   'stroke-width': 2
    // },
    // data_points_attrs: {
    //   radius: 3
    // },

    // /** colori delle linee */
    // data_colors: null,

    data_lines_widths: [null, null, 4],

    labelYFormatter: etiValue => etiValue.toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
  });

  await cfg.writeFile(svgFile, 'lines.svg');

}
