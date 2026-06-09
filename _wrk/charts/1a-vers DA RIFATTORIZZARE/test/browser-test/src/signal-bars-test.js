
export function signalBarsTest(cfg) {

  const signalBarsOpts = {
    height: 250,
    ranges: [1,2,3,4,5],
    labelFont: {
      // family: 'Roboto Condensed',
      size: 72,
      // stretch: 'normal',
      // style: 'italic',
      // variant: 'normal',
      weight: 700
    },
    labelFill: '#051b52',
    barsStrokeWidth: 4,
    barsOnAttr: {
      fill: '#4664af',
      opacity: 0.5,
      stroke: '#213c7f'
    },
    barsOffAttr: {
      fill: '#fff',
      stroke: '#213c7f'
    }
  };

  cfg.charts.signalBars({
    ...signalBarsOpts,
    container: '#signalBars1',
    height: 150,
    value: 3.63,
    label: null,
    labelPosition: 'right',
  });

  cfg.charts.signalBars({
    ...signalBarsOpts,
    // height: 150,
    container: '#signalBars2',
    value: 3.33,
    // maxBarWidth: 40,
    barsRelativeCornerRadius: .5,
    label: '' // fa sì che nessuna etichetta sia mostrata
  });

  cfg.charts.signalBars({
    ...signalBarsOpts,
    container: '#signalBars3',
    // value: 2.83,
    label: 'Tra 1 e 2',
    labelPosition: 'bottom',
    maxBarWidth: 40,
    barsStrokeWidth: 0,
    barsOnAttr: {
      fill: '#0c811c',
    },
    barsOffAttr: {
      fill: '#c00',
    },
    activeBars: 1,
    svgClassName: 'test-class'
  });
}
