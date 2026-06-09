// radial bars


export async function radialBars({
  container          = null, // container (selettore o elemento)
  svgClassName       = null,
  gap                = 5, // px
  strokeWidth        = 20, // px
  clockwise          = true,
  start              = 'bottom', // bottom | top
  circleRadius       = null,  // se null è calcolato dalla larghezza del container

  barClassName       = null,  // classe per le barre (solo web)
  barStrokeLinecap   = 'round',  // bars stroke-linecap (round, butt, square)
  barColors          = null, // array di colori per le barre, se non presente vengono utilizzati i colori di default

  labelsClassName     = null,  // classe per tutte le etichette
  labelsFillColor     = null,  // fill per tutte le etichette, se null viene usato il colore impostato in `data`
  labelsFontFilePath  = null,  // percorso font per textToPath
  labelsFont          = null,  // obj || null, -> oggetto analogo a this.defaults.font

  data               = [],

  debug              = false, // draws a circle under each bar
} = {}) {

  const bars_data_defaults = {
    label                 : '_label_',
    labelFillColor        : '#000', // se null viene utilizzato il valore globale `labelFillColor` o, se `null` quello della barra
    barFillColor          : null, // fill specifico per la barra
    barStrokeColor        : null, // stroke specifico per la barra, bypassa il valore di barColors
    value                 : 0,

    barClassName          : null, // optional extra class for bar
    labelClassName        : null  // optional extra class for label
  };

  data = (data?? []).map(item => { return {...bars_data_defaults, ...item}; });

  barColors??= this.defaults.colors;
  labelsFont = {...this.defaults.font, ...(labelsFont??{}) };

  try {

    if(['top', 'bottom'].indexOf(start) === -1) {
      throw 'The `start` option must be `top` or `bottom`';
    }

    let [, width, height] = this.utils.parseContainer(container);

    if(circleRadius) {
      width = height = circleRadius * 2;

    } else if (width) {
      circleRadius??= width / 2;

    } else {
      throw 'Devi specificare almeno uno tra `container` e `circleRadius`';
    }

    const viewBox = [
      -strokeWidth / 2,
      -strokeWidth / 2,
      circleRadius * 2 + strokeWidth,
      circleRadius * 2 + strokeWidth
    ].join(' ');


    const svgCanvas = this.createSvgCanvas(container)
      .size(width, height)
      .viewbox(viewBox)
      .attr({
        class: this.utils.classnamesNull('radial-bars-chart', svgClassName)
      });

    if(!this.textToPath) {
      svgCanvas.css('--stroke-width', strokeWidth + 'px');
    }


    const start_angle = start === 'bottom'? 270 : 90,
      max_value = Math.max(...data.map(i => i.value)),
      center = {
        x: circleRadius,
        y: circleRadius
      };

    for await (const [idx, item] of data.entries()) {

      const barGroup = svgCanvas.group()
          .attr({'data-debug-info': debug? `radial-bars: gruppo ${idx}` : null})

        ,radius = circleRadius - (idx * (strokeWidth + gap))
        ,thisBarColor = barColors[idx]?? '#ccc'
      ;

      // guide
      if(debug) {
        barGroup.circle()
          .attr({
            'data-debug-info': debug? `radial-bars: guida ${idx}` : null,
            cx: center.x,
            cy: center.y,
            r : radius,
            // 'stroke-width': strokeWidth,
            // stroke: 'hsla(208, 18%, 80%, 0.302)',
            'stroke-width': '.5px',
            stroke: '#f104ed',
            fill: 'none'
          });

      } // end if(debug)

      // bar
      barGroup.path(this.utils.calcAttrD({
        start_angle   : start_angle,
        percentage    : item.value / max_value,
        max_arc       : 270,
        center        : center,
        radius        : radius,
        clockwise     : clockwise
      }))
        .attr({
          'data-debug-info' : debug? `radial-bars: barra ${idx}` : null,
          'stroke-width'    : strokeWidth,
          fill              : item.barFillColor?? 'none',
          'stroke-linecap'  : barStrokeLinecap,
          stroke            : item.barStrokeColor?? thisBarColor,
          class: this.utils.classnamesNull(barClassName,item.barClassName)
        })
      ;

      // label
      let text_align = 'start',
        text_margin = 20;

      if((start === 'top' && clockwise) || (start === 'bottom' && !clockwise)) {
        text_align = 'end';
        text_margin = -20;
      }

      const [label_bbox, labelEl] = await this.createTextEl ({
        text: item.label,
        textFill: item.labelFillColor?? labelsFillColor,
        fontAttr: labelsFont,
        fontFilePath: labelsFontFilePath,
        parentElement: barGroup
      });

      labelEl
        .move(
          circleRadius + text_margin,
          start === 'top'
            ? idx * (strokeWidth + gap)
            : (circleRadius * 2 - idx * (strokeWidth + gap)) - label_bbox.height / 2
        )
        .attr({
          'text-anchor': !this.textToPath? text_align : null,
          // 'dominant-baseline': !this.textToPath? 'middle': null,

          class: this.utils.classnamesNull(labelsClassName, item.labelClassName)
        });

      if(start === 'top') {
        labelEl.dy(-label_bbox.height / 2);
      }

    } // end for await data

    if(!container) {
      return svgCanvas.svg();
    }

  } catch(e) {
    console.error( 'AdaCharts → radialBars', e ); // eslint-disable-line
  }
}
