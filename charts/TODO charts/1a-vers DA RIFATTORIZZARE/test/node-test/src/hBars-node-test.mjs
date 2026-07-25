
export async function hBarsNodeTest(cfg) {
  const bars_params = {
    width: 400,
    height: 350,
    values: Object.values(cfg.testValues),
    labels: Object.keys(cfg.testValues),
    showValues: true,
    showValuesAs: 'percent',
    barsStrokeWidth: 4,
    barsStrokeColor: '#333',
    // barsDirection: 'right', // default
    labelsFont: {
      family: 'Roboto Flex',
      size: 16,
      // stretch: 'normal',
      // style: 'normal',
      // variant: 'normal',
      weight: 800
    },
    valuesFont: {
      family: 'Roboto Flex',
      size: 14,
      // stretch: 'normal',
      style: 'italic',
      // variant: 'normal',
      // weight: 400
    },
    labelsFontFilePath: cfg.fontFile.medium,
    valuesFontFilePath: cfg.fontFile.regular,
  };
  let hbars_svg = await cfg.charts.hbars(bars_params);

  await cfg.writeFile(hbars_svg, 'hbars.svg');


  hbars_svg = await cfg.charts.hbars({...bars_params, barsDirection: 'left'});
  await cfg.writeFile(hbars_svg, 'hbars-dx-sx.svg');

}
