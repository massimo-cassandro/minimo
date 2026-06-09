import { MinimoCharts, ratingDisplayChart } from '../../index.js';

const chartInstance = new MinimoCharts();

ratingDisplayChart(chartInstance, {
  debug: true,
  container: '#rd-demo',
  portions: 3,

  value: 8.99,
  scaleStartValue: 0,
  rodPositionForceCenter: false,

  displayBackgroundAttrs: {
    fill: '#efefef',
    'stroke-width': 4,
    stroke: '#07914E',
  },

  displayLabel: [
    {
      label: 'Lorem ipsum',
      font: {
        family: 'Roboto Condensed',
        size: 18,
        // stretch: 'normal',
        // style: 'italic',
        // variant: 'normal',
        weight: 700
      },
      fill: '#000',
      // fontFilePath: path
    },
    {
      label: 'dolor sit amet',
      font: {
        family: 'Roboto Condensed',
        size: 12,
        // stretch: 'normal',
        // style: 'italic',
        // variant: 'normal',
        weight: 300
      },
      fill: '#666',
      // fontFilePath: path,
    }
  ],
  displayLabelRowGap: 2,

  miniDisplay: [
    {
      position: 'sx',
      value: 3.1,
      type: 'gauge', // gauge = mini tachimetro, value: mostra il valore indicato in value
      mdLabel: [
        {
          label: 'md#1',
          font: {
            family: 'Roboto Condensed',
            size: 14,
            // stretch: 'normal',
            // style: 'italic',
            // variant: 'normal',
            weight: 400
          },
          fill: '#333',
          // fontFilePath: path,
        },
        {
          label: 'xyz',
          font: {
            family: 'Roboto Condensed',
            size: 12,
            // stretch: 'normal',
            // style: 'italic',
            // variant: 'normal',
            weight: 300
          },
          fill: '#666',
          // fontFilePath: path,
        },
      ],
      mdArc: {
        // fill: '#ddd',
        'stroke-width': 1,
        stroke: '#666',
        class: null,
      }
    },
    {
      position: 'dx',
      value: 4,
      type: 'value', // gauge = mini tachimetro, value: mostra il valore indicato in value
      typeValueFont: {
        label: null,
        font: {
          family: 'Roboto Condensed',
          size: 32,
          // stretch: 'normal',
          // style: 'italic',
          // variant: 'normal',
          weight: 700
        },
        fill: '#036',
        // fontFilePath: path,
      },
      mdLabel: [{
        label: 'md#2',
        font: {
          family: 'Roboto Condensed',
          size: 14,
          // stretch: 'normal',
          // style: 'italic',
          // variant: 'normal',
          weight: 400
        },
        fill: '#333',
        // fontFilePath: path,
      }],
      mdArc: {
        // fill: '#ddd',
        'stroke-width': 2,
        stroke: '#036',
        class: null,
      }
    }
  ],
  miniDisplayTopMargin: 0,
  miniDisplayLabelTopMargin: 0,
  miniDisplayLabelRowGap: -4,

});
