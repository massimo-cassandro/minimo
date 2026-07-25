
export async function mcnNodeTest(cfg) {


  const opts = {
    debug: true,
    svgBackground: '#fff',
    labelMargin: 8,
    // barsCircleGap
    labelFont: {
      // family: 'sans-serif',
      size: 18,
      // stretch: 'normal',
      // style: 'normal',
      // variant: 'normal',
      weight: 700
    },
    labelFill: '#333',
    labelYearFill: '#035869',
    labelFontFilePath: cfg.fontFile.bold,
    miniLabelFontFilePath: cfg.fontFile.regular,
    valuesFontFilePath: cfg.fontFile.regular,
    mcnFontFilePath: cfg.fontFile.extrabold,
    barsNullFontFilePath: cfg.fontFile.italic,
    mcnNullFontFilePath: cfg.fontFile.lightItalic,
  };

  let svgFile = await cfg.charts.mcn({
    ...opts,
    direction: 'right',
    mese: 3,
    anno: 2025,
    values: {
      tv: 99458.55,
      tv_budget: null,
      ricavi: 26458.88,
      costi: 9458.4,
      compenso: 35811,
      mcn: null
    },
    // showValues: false
  });

  await cfg.writeFile(svgFile, 'mcn1.svg');

  svgFile = await cfg.charts.mcn({
    ...opts,
    direction: 'left',
    label: 'conguaglio',
    isCurrentYear: false,
    values: {
      tv: 99458.55,
      tv_budget: 82797.82,
      ricavi: 26458.88,
      costi: 39458.4,
      compenso: -35811,
      mcn: -0.1842
    },
    // showValues: true,
  });

  await cfg.writeFile(svgFile, 'mcn2.svg');

}
