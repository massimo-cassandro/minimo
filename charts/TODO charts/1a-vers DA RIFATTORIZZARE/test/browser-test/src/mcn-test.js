
export async function mcnTest(cfg) {


  const opts = {
    // debug: true,
    // height: 200,
    width: null,
    hPadding: 20,
    // barsCircleGap
    labelFont: {
      // family: 'sans-serif',
      size: 18,
      // stretch: 'normal',
      // style: 'normal',
      // variant: 'normal',
      weight: 900
    },
    labelFill: '#333',
    labelYearFill: '#035869',
    labelCorrection: {
      dirRight: {top: 0, right: 1},
      dirLeft: {top: -1, left: -2}
    },
    // labelMargin: 10,
    textMargin: 8,
    showValues: true,
    mcnFont:  {
      // family: 'sans-serif',
      size: 24,
      // stretch: 'normal',
      // style: 'normal',
      // variant: 'normal',
      weight: 800
    },
  };

  await cfg.charts.mcn({
    ...opts,
    container: '#mcn1',
    direction: 'right',
    mese: 10,
    anno: 2025,
    isCurrentYear: true,
    values: {
      tv: null,
      tv_budget: null,
      ricavi: 26458.88,
      costi: -9458.4,
      compenso: 35811,
      mcn: null
    },
    // showValues: false
  });
  await cfg.charts.mcn({
    ...opts,
    container: '#mcn2',
    direction: 'left',
    label: 'conguaglio',
    labelMargin: 5,
    isCurrentYear: false,

    values: {
      tv: 99458.55,
      tv_budget: 82797.82,
      ricavi: 26458.88,
      costi: -39458.4,
      compenso: -35811,
      mcn: -0.1842
    }
  });


}
