
export function ratingDisplayTest(cfg) {

  const ratingDisplayOpts = {
    displayValue: 3.2,
    svgAttrs: {class: 'some-class'},

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
          fill: '#ddd',
          'stroke-width': 2,
          stroke: '#036',
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
            size: 28,
            // stretch: 'normal',
            // style: 'italic',
            // variant: 'normal',
            weight: 700
          },
          fill: '#760592',
          // fontFilePath: path,
        },
        mdLabel: [
          {
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
          },
          {
            label: '(riga 2)',
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
          fill: '#ddd',
          'stroke-width': 3,
          stroke: '#036',
        }
      }
    ],
    miniDisplayTopMargin: 5,
    miniDisplayLabelTopMargin: 0,

  };

  cfg.charts.ratingDisplay({
    ...ratingDisplayOpts,
    container: '#ratingDisplay1',
    scale: 4,

    displayBackgroundAttrs: {
      fill: '#efefef',
      'stroke-width': 3,
      stroke: '#666',
      class: 'some-class',
    },

    displayValueForceCenter: false,
  });

  cfg.charts.ratingDisplay({
    ...ratingDisplayOpts,
    debug: true,
    container: '#ratingDisplay2',
    scale: 5,
    displayValueForceCenter: true,
  });
}
