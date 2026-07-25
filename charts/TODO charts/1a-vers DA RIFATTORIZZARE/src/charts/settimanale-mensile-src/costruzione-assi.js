// costruisce un sistema di assi cartesiani
// TODO da unificare con ada-frontend/ada-charts/src/components/cartesian-axis.js

export async function costruzioneAssi({
  cfg,     // oggetto cfg come quello indicato in `charts/andamento-annuale-src/defaults.js`
  xLabels, // array con le etichette dell'asseX
  adaChartIstance  // istanza classe
}) {

  try {

    // =>> ASSE Y
    // *****************************************
    const yAxisGroup = cfg.svgCanvas.group();
    yAxisGroup
      .attr({ 'data-cfg.debug-info': cfg.debug? 'Gruppo Asse Y' : null })
      .line(
        cfg.chart_area.left, cfg.chart_area.top,
        cfg.chart_area.left, cfg.chart_area.bottom
      )
      .attr({
        'data-cfg.debug-info': cfg.debug? 'Asse Y' : null,
        class: cfg.axisClassName, // se il valore è null l'attributo viene ignorato
        ...cfg.axisAttrs
      });


    // =>> ticks ed etichette asse Y (dal basso verso l'alto)
    const ticksYGroup = yAxisGroup.group().attr({
      'data-cfg.debug-info': cfg.debug? 'Gruppo ticks Asse Y' : null,
      class: cfg.ticksClassName, // se il valore è null l'attributo viene ignorato
    });
    const labelsYGroup = yAxisGroup.group().attr({
      'data-cfg.debug-info': cfg.debug? 'Gruppo etichette Asse Y' : null,
      class: cfg.labelYClassName,
    });

    cfg.gridGroup = null; // inserita in cfg per poter essere riposizionata
    if(cfg.horizGrid) {
      cfg.gridGroup = cfg.svgCanvas.group().attr({
        'data-cfg.debug-info': cfg.debug? 'Gruppo griglia' : null
      });
    }

    for await (const stepIdx of Array.from(Array(cfg.stepY_count + 1).keys())) {

      const y = cfg.chart_area.bottom - (cfg.stepY_size * stepIdx)
        ,label = cfg.labelYFormatter(cfg.stepY_value * stepIdx);

      // =>> ticks Y
      ticksYGroup
        .line(
          cfg.chart_area.left - cfg.ticksLength, y,
          cfg.chart_area.left, y
        )
        .attr({
          'data-cfg.debug-info': cfg.debug? 'Ticks asse X' : null,
          ...cfg.ticksAttrs
        });

      // =>> etichette Y
      const [label_bbox, labelEl] = await adaChartIstance.createTextEl ({
        text: label,
        textFill: cfg.labelYAttrs.fill?? '#000',
        fontAttr: cfg.labelYAttrs,
        fontFilePath: cfg.labelYFontFilePath,
        parentElement: labelsYGroup
      });

      labelEl.move(
        cfg.chart_area.left - cfg.ticksLength - 2 - label_bbox.width, // 2 è un distanziatore tra l'etichetta e la linea
        y - label_bbox.height / 2
      );

      // =>> griglia orizzontale
      if(cfg.horizGrid && stepIdx > 0) { // la prima linea coincide con l'asse X
        cfg.gridGroup.line(
          cfg.chart_area.left, y,
          cfg.chart_area.right, y
        )
          .attr(cfg.horizGridAttrs);
      }

    } // end for await stepIdx

    // =>> titolo asse Y
    if(cfg.asseYTitle) {
      const [title_bbox, titleEl] = await adaChartIstance.createTextEl ({
        text: cfg.asseYTitle,
        textFill: cfg.asseYTitleAttrs.fill?? '#000',
        fontAttr: cfg.asseYTitleAttrs,
        fontFilePath: cfg.asseYTitleFontFilePath,
        parentElement: yAxisGroup
      });

      titleEl.move(
        cfg.padding - (title_bbox.width / 2) + (title_bbox.height / 2),
        (cfg.chart_area.bottom - title_bbox.height) / 2
      )
        .rotate(-90)
      ;
    }



    // =>> ASSE X
    // *****************************************
    const xAxisGroup = cfg.svgCanvas.group();
    xAxisGroup
      .attr({ 'data-cfg.debug-info': cfg.debug? 'Gruppo Asse X' : null })
      .line(
        cfg.chart_area.left, cfg.chart_area.bottom,
        cfg.chart_area.right, cfg.chart_area.bottom
      )
      .attr({
        'data-cfg.debug-info': cfg.debug? 'Asse X' : null,
        class: cfg.axisClassName,
        ...cfg.axisAttrs
      });

    // =>> ticks, etichette ecc asse X (da sinistra a destra)
    const ticksXGroup = xAxisGroup.group().attr({
      'data-cfg.debug-info': cfg.debug? 'Gruppo ticks Asse X' : null,
      class: cfg.ticksClassName,
    });
    const labelsXGroup = xAxisGroup.group().attr({
      'data-cfg.debug-info': cfg.debug? 'Gruppo etichette Asse X' : null,
      class: cfg.labelXClassName,
    });


    let labelIdx = 0;

    // coordinata y per il posizionamentoi delle etichette
    const labelY = cfg.chart_area.bottom + cfg.ticksLength + 2;

    // Y del blocco etichette (comprese le etichette stesse) per utilizzo in altre parti dello script
    cfg.xLabelsEndY = 0;

    for await (const thisLabel of xLabels) {
      const x = cfg.chart_area.left + (cfg.stepX_size * labelIdx);

      // =>> ticks X
      ticksXGroup
        .line(
          x, cfg.chart_area.bottom + cfg.ticksLength,
          x, cfg.chart_area.bottom
        )
        .attr({
          'data-cfg.debug-info': cfg.debug? 'Ticks asse X' : null,
          ...cfg.ticksAttrs
        });

      // =>> etichette X
      if(!cfg.labelXShowEvensOnly || thisLabel % 2 === 0 ) {
        const [label_bbox, labelEl] = await adaChartIstance.createTextEl ({
          text: thisLabel,
          textFill: cfg.labelXAttrs.fill?? '#000',
          fontAttr: cfg.labelXAttrs,
          fontFilePath: cfg.labelXFontFilePath,
          parentElement: labelsXGroup
        });

        labelEl.move(
          x - label_bbox.width / 2,
          labelY
        );

        // per la seconda riga di etichette
        cfg.xLabelsEndY = Math.max(cfg.xLabelsEndY, labelY + label_bbox.height);
      }

      // TODO sotto griglia verticale

      // =>> griglia verticale
      if(cfg.vertGrid && labelIdx > 0) { // la prima linea coincide con l'asse Y
        cfg.gridGroup.line(
          x, cfg.chart_area.bottom,
          x, cfg.chart_area.top
        )
          .attr(cfg.vertGridAttrs);
      }


      labelIdx++;

    } // end for await thisLabel


    // =>> titolo asse X
    if(cfg.asseXTitle) {
      const [title_bbox, titleEl] = await adaChartIstance.createTextEl ({
        text: cfg.asseXTitle,
        textFill: cfg.asseXTitleAttrs.fill?? '#000',
        fontAttr: cfg.asseXTitleAttrs,
        fontFilePath: cfg.asseXTitleFontFilePath,
        parentElement: xAxisGroup
      });

      titleEl.move(
        cfg.chart_area.left + (cfg.chart_area.width - title_bbox.width) / 2,
        cfg.height - cfg.padding - title_bbox.height
      );

    }

    return cfg;

  } catch(e) {
    console.error( 'AdaCharts → costruzioneAssi', e ); // eslint-disable-line
  }
}
