
import { goalChart } from '@minimoCharts/index.js';

export async function goalTest(chartInstance, nodeCfg = null) {

  const opts = {
    debug: true,

    /** obiettivo */
    goalValue: 25,

    /** attributi font valore current */
    currentValueFontAttrs: { size: 14 },
    currentValueFontFilePath: null,

  };

  const svgString = await goalChart(chartInstance, {
    ...opts,
    height: 60, // <value> || null
    container: '#goal',
    showCurrentValue: true,
    currentValue: 10,

    ...(nodeCfg??{})
  });


  if(nodeCfg != null) {
    return svgString;
  }

  goalChart(chartInstance, {
    ...opts,
    container: '#goal2',
    chartHeight: 60, // <value> || null

    /** eventuale etichetta da collocare sul lato destro */
    rightLabel: '25%',

    currentValue: 15,

    /** attributi font etichetta */
    rightLabelFontAttrs: { size: 18 },
    rightLabelFontFilePath: null,

    showCurrentValue: true,

    missingGoalAttrs: {
      fill: 'var(--rosso)'
    },

  });


}
