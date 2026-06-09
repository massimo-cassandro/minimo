

export async function signalBarsNodeTest(cfg) {

  const signal_bars_svg = await cfg.charts.signalBars({
    height: 150,
    width: 350,
    ranges: [1,2,3,4,5],
    labelFontFilePath: cfg.fontFile.bold,
    labelFont: {
      // family: 'Roboto Flex',
      size: 72,
      // stretch: 'normal',
      // style: 'italic',
      // variant: 'normal',
      // weight: 700
    },
    labelFill: '#04780a',
    barsStrokeWidth: 4,
    barsOnAttr: {
      fill: '#0b3191',
      'fill-opacity': 0.5,
      stroke: '#0a1b45'
    },
    barsOffAttr: {
      fill: '#fff',
      stroke: '#0a1b45'
    },
    value: 3.63,
    label: null,
    labelPosition: 'right',
  });

  await cfg.writeFile(signal_bars_svg, 'signal-bars.svg');
}

