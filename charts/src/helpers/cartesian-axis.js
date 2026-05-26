// costruisce un sistema di assi cartesiani
// restituisce due gruppi delle assi X e Y da posizionare successivamente

import { G } from '@svgdotjs/svg.js';
import { createTextEl } from './create-text-element.js';

export async function cartesianAxis(chartInstance, {
  debug = false,
  chart_area = {},
  padding = 0,
  width,
  height,
  axisAttrs = {},
  ticksAttrs = {},
  labelYAttrs = {},
  labelYFontFilePath = null,
  labelXAttrs = {},
  labelXFontFilePath = null,
  stepY_count,
  stepY_size,
  stepY_value,
  min_value,
  stepX_size,
  stepX_count,
  ticksLength,
  showXgrid = true, // griglia verticale
  showYgrid = true, // griglia orizzontale
  gridLinesAttrs = {},

  yAxisTitle = null,
  yAxisTitleAttrs = {},
  yAxisTitleFontFilePath = null,

  xAxisTitle = null,
  xAxisTitleAttrs = {},
  xAxisTitleFontFilePath = null,

  xLabels, // array con le etichette dell'asseX
  // se true le etichette sono posizionate in corrispondenza dei ticks
  // altrimenti sono centrate nello spazio corispondente a stepX_size
  xLabelsOnTicks = true,
  labelYFormatter = null, // funzione
}) {

  try {

    const cartesianAxisGroup = new G();
    cartesianAxisGroup.attr({ 'data-debug-info': debug? 'Gruppo Base Assi Cartesiani ed elementi correlati' : null });

    // =>> ASSE Y
    // *****************************************
    const yAxisGroup = cartesianAxisGroup.group();
    yAxisGroup
      .attr({ 'data-debug-info': debug? 'Gruppo Asse Y' : null })
      .line(
        chart_area.left, chart_area.top,
        chart_area.left, chart_area.bottom
      )
      .attr({
        'data-debug-info': debug? 'Asse Y' : null,
        ...axisAttrs
      });


    // =>> ticks ed etichette asse Y (dal basso verso l'alto)
    const ticksYGroup = yAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo ticks Asse Y' : null,
    });
    const labelsYGroup = yAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo etichette Asse Y' : null,
    });

    // gruppo per griglia asseY
    let yGridGroup = null;
    if(showYgrid) {
      yGridGroup = cartesianAxisGroup.group()
        .attr({ 'data-debug-info': debug? 'Gruppo Griglia Asse Y' : null });
    }

    for await (const stepIdx of Array.from(Array(stepY_count + 1).keys())) {

      const y = chart_area.bottom - (stepY_size * stepIdx)
        ,label = labelYFormatter(min_value + stepY_value * stepIdx);

      // =>> ticks Y
      ticksYGroup
        .line(
          chart_area.left - ticksLength, y,
          chart_area.left, y
        )
        .attr(ticksAttrs);

      // =>> etichette Y
      const labelEl = await createTextEl(chartInstance, {
          text: label,
          textFill: labelYAttrs.fill?? '#000',
          fontAttr: labelYAttrs,
          fontFilePath: labelYFontFilePath,
          parentElement: labelsYGroup
        }),
        label_bbox = labelEl.bbox();

      labelEl.move(
        chart_area.left - ticksLength - 2 - label_bbox.width, // 2 è un distanziatore tra l'etichetta e la linea
        y - label_bbox.height / 2
      );

      // =>> griglia orizzontale (ortogonale all'asse Y)
      if(showYgrid && stepIdx > 0) { // la prima linea coincide con l'asse X
        yGridGroup.line(
          chart_area.left, y,
          chart_area.right, y
        ).attr(gridLinesAttrs);
      }

    } // end for await stepIdx

    // =>> titolo asse Y
    if(yAxisTitle) {
      const titleGroup = yAxisGroup.group(); // per la rotazione
      titleGroup.attr({
        'data-debug-info': debug? 'Titolo asse Y' : null,
      });

      const titleEl = await createTextEl(chartInstance, {
        text: yAxisTitle,
        textFill: yAxisTitleAttrs.fill?? '#000',
        fontAttr: yAxisTitleAttrs,
        fontFilePath: yAxisTitleFontFilePath,
        parentElement: titleGroup
      });

      titleEl.rotate(-90);
      const title_bbox = titleGroup.bbox();

      titleGroup.move(
        padding,
        (chart_area.bottom - title_bbox.height) / 2
      );
    }



    // =>> ASSE X
    // *****************************************
    const xAxisGroup = cartesianAxisGroup.group();
    xAxisGroup
      .attr({ 'data-debug-info': debug? 'Gruppo Asse X' : null })
      .line(
        chart_area.left, chart_area.bottom,
        chart_area.right, chart_area.bottom
      )
      .attr({
        'data-debug-info': debug? 'Asse X' : null,
        ...axisAttrs
      });

    // =>> ticks, etichette ecc asse X (da sinistra a destra)
    const ticksXGroup = xAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo ticks Asse X' : null,
    });
    const labelsXGroup = xAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo etichette Asse X' : null,
    });


    // coordinata y per il posizionamento delle etichette
    const labelY = chart_area.bottom + ticksLength + 2;

    // gruppo per griglia asseX (verticale, ortogonale all'asse X)
    // il gruppo viene sempre creato, perché anche se non si stampa la griglia viene
    // cmq aggiunta l'ultima linea a dx
    const xGridGroup = cartesianAxisGroup.group()
      .attr({ 'data-debug-info': debug? 'Gruppo Griglia Asse X' : null });


    for (let i = 0; i <= stepX_count - 1; i++) {

      const thisLabel = (Array.isArray(xLabels) ? xLabels[i] : undefined) ?? '',
        labelIdx = i,
        isLastStep = labelIdx === stepX_count - 1,
        x = chart_area.left + (stepX_size * labelIdx);

      // =>> ticks X
      ticksXGroup
        .line(
          x, chart_area.bottom + ticksLength,
          x, chart_area.bottom
        )
        .attr(ticksAttrs);

      // =>> etichette X
      const labelEl = await createTextEl (chartInstance, {
          text: thisLabel,
          textFill: labelXAttrs.fill?? '#000',
          fontAttr: labelXAttrs,
          fontFilePath: labelXFontFilePath,
          parentElement: labelsXGroup
        }),
        label_bbox = labelEl.bbox();

      // posizionamento
      labelEl.move(
        x - label_bbox.width / 2 + (xLabelsOnTicks? 0 : stepX_size / 2),
        labelY
      );

      // eventuale correzione ultima etichetta
      if(i === stepX_count - 1) {
        const labelX2 = labelEl.bbox().x2;

        if(labelX2 > width - padding) {
          labelEl.dx(-(labelX2 - width + padding/2));
        }
      }


      // =>> griglia verticale
      // la prima linea coincide con l'asse Y
      // l'ultima linea a dx viene stampata sempre
      if((showXgrid && labelIdx > 0) || isLastStep ) {
        xGridGroup.line(
          x, chart_area.bottom,
          x, chart_area.top
        ).attr(gridLinesAttrs);
      }

    } // end for await thisLabel


    // =>> titolo asse X
    if(xAxisTitle) {
      const titleEl = await createTextEl (chartInstance, {
          text: xAxisTitle,
          textFill: xAxisTitleAttrs.fill?? '#000',
          fontAttr: xAxisTitleAttrs,
          fontFilePath: xAxisTitleFontFilePath,
          parentElement: xAxisGroup
        }),
        title_bbox = titleEl.bbox();

      titleEl.move(
        chart_area.left + (chart_area.width - title_bbox.width) / 2,
        height - padding - title_bbox.height
      );

    }

    return cartesianAxisGroup;

  } catch(e) {
    console.error( 'MinimoCharts → cartesianAxis', e ); // eslint-disable-line
  }
}
