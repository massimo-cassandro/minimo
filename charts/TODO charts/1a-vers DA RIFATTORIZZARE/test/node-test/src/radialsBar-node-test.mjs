export async function radialsBarNodeTest(cfg) {

  const radialBarsCfg = {

    gap                : 5, // px
    strokeWidth        : 30, // px
    start              : 'bottom', // bottom | top
    circleRadius       : 150,  // se null è calcolato dalla larghezza del container

    barStrokeLinecap   : 'round',  // bars stroke-linecap (round, butt, square)
    barColors          : null, // array di colori per le barre, se non presente vengono utilizzati i colori di default

    labelsFillColor     : '#000',  // fill per tutte le etichette, se null viene usato il colore impostato in `data`
    labelsFontFilePath  : cfg.fontFile.bold,  // percorso font per textToPath
    labelsFont          : {
      size: 24
    },

    data: [

      {
        label: 'Lorem ipsum',
        value: 250,
      },

      {
        label: 'Dolor sit amet',
        value: 120,
      },
      {
        label: 'Consectuor',
        value: 90,
      }
    ]
  };

  let radialBarsSvg = await cfg.charts.radialBars({...radialBarsCfg, debug: true, clockwise: true});

  await cfg.writeFile(radialBarsSvg, 'radial-bars-clockwise-w-debug.svg');

  radialBarsSvg = await cfg.charts.radialBars({...radialBarsCfg, debug: false, clockwise: false, start: 'top'});
  await cfg.writeFile(radialBarsSvg, 'radial-bars-anticlockwise.svg');

}
