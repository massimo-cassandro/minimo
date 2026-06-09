export function hBarsTest(cfg) {

  const barsOpts = {

    values: Object.values(cfg.testValues),
    labels: Object.keys(cfg.testValues),
    showValues: true,
    barsStrokeWidth: 4,
    barsStrokeColor: '#333',
    // textBarsGap: 8,
    // barsGap: 10,
    // barsHeight: 40,
    // barsCornerRadius: 5,
    labelsFont: {
      // family: 'Roboto Condensed',
      size: 16,
      // stretch: 'normal',
      // style: 'normal',
      // variant: 'normal',
      weight: 800
    },
    valuesFont: {
      // family: 'Roboto Condensed',
      size: 14,
      // stretch: 'normal',
      style: 'italic',
      // variant: 'normal',
      weight: 400
    },
  };


  cfg.charts.hbars({
    ...barsOpts,
    container: '#hbars',
    height: 250,
    showValuesAs: 'percent',
    // barsDirection: 'right', // <- default

  });

  cfg.charts.hbars({
    ...barsOpts,
    container: '#hbars-dx-sx',
    height: 'auto',
    showValuesAs: 'euro',
    barsDirection: 'left',
  });
}



