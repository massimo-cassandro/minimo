
export function radialBarsTest(cfg) {

  const radialBarsOpts = {

    gap                : 10, // px
    strokeWidth        : 30, // px
    clockwise          : true,
    start              : 'bottom', // bottom | top
    circleRadius       : null,  // se null è calcolato dalla larghezza del container

    barStrokeLinecap   : 'round',  // bars stroke-linecap (round, butt, square)
    barColors          : null, // array di colori per le barre, se non presente vengono utilizzati i colori di default

    labelsFillColor     : '#000',  // fill per tutte le etichette, se null viene usato il colore impostato in `data`
    labelsFontFilePath  : null,  // percorso font per textToPath
    labelsFont          : {
      family: 'Roboto Condensed',
      size: 22,
      // stretch: 'normal',
      // style: 'italic',
      // variant: 'normal',
      weight: 400
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

  cfg.charts.radialBars({container: '#radialBars1', ...radialBarsOpts});
  cfg.charts.radialBars({container: '#radialBars2', ...radialBarsOpts, debug: true, clockwise: false});
  cfg.charts.radialBars({container: '#radialBars3', ...radialBarsOpts, start: 'top'});

}
