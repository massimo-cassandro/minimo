// costruisce un sistema di assi cartesiani
// restituisce due gruppi delle assi X e Y da posizionare successivamente

import { G } from '@svgdotjs/svg.js';
import { createTextEl } from './create-text-element.js';

/**
  dispatcher: orientation 'vertical' (barre/linee verticali, default) o 'horizontal' (barre orizzontali).
  Gli argomenti sono gli stessi per entrambi gli orientamenti (vedi cartesianAxisVertical),
  interpretati diversamente da ciascun ramo (vedi commenti in cartesianAxisHorizontal)
*/
export async function cartesianAxis(chartInstance, params) {
  return params.orientation === 'horizontal'
    ? cartesianAxisHorizontal(chartInstance, params)
    : cartesianAxisVertical(chartInstance, params);
}

async function cartesianAxisVertical(chartInstance, {
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
  zero_y,
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
      // viene omessa solo la linea che coincide con l'asse X (la linea dello zero)
      if(showYgrid && Math.abs(y - zero_y) > 0.01) {
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
        chart_area.left, zero_y,
        chart_area.right, zero_y
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

/**
  Variante orizzontale (barre orizzontali): rispetto a cartesianAxisVertical i ruoli sono invertiti:
    - l'asse dei VALORI (numerico, formattato con labelYFormatter) è fisso in basso (come l'asse X
      di cartesianAxisVertical), con griglia verticale. La linea dello zero (baseline delle barre)
      è una linea verticale che si sposta in base al segno dei dati (zero_y qui è una coordinata X)
    - l'asse delle CATEGORIE (testuale, da xLabels) è fisso a sinistra (come l'asse Y di
      cartesianAxisVertical), con griglia orizzontale
  stepY_count/stepY_size/stepY_value/zero_y e stepX_size/stepX_count sono gli stessi campi
  restituiti da parseStdAxisOpts con orientation:'horizontal' (vedi commenti lì)
*/
async function cartesianAxisHorizontal(chartInstance, {
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
  zero_y: zero_x, // rinominato per chiarezza: qui è una coordinata X
  stepX_size,
  stepX_count,
  ticksLength,
  showXgrid = true, // griglia orizzontale (asse categorie)
  showYgrid = true, // griglia verticale (asse valori)
  gridLinesAttrs = {},

  yAxisTitle = null, // titolo asse categorie (a sinistra)
  yAxisTitleAttrs = {},
  yAxisTitleFontFilePath = null,

  xAxisTitle = null, // titolo asse valori (in basso)
  xAxisTitleAttrs = {},
  xAxisTitleFontFilePath = null,

  xLabels, // array con le etichette di categoria, mostrate sull'asse verticale (a sinistra)
  xLabelsOnTicks = true,
  labelYFormatter = null, // funzione, formatta le etichette numeriche dell'asse valori (in basso)
}) {

  try {

    const cartesianAxisGroup = new G();
    cartesianAxisGroup.attr({ 'data-debug-info': debug? 'Gruppo Base Assi Cartesiani (orizzontale) ed elementi correlati' : null });

    // =>> ASSE VALORI (in basso, fisso — analogo all'asse X di cartesianAxisVertical)
    // *****************************************
    const valueAxisGroup = cartesianAxisGroup.group();
    valueAxisGroup
      .attr({ 'data-debug-info': debug? 'Gruppo Asse Valori' : null })
      .line(
        chart_area.left, chart_area.bottom,
        chart_area.right, chart_area.bottom
      )
      .attr({
        'data-debug-info': debug? 'Asse Valori' : null,
        ...axisAttrs
      });

    // =>> ticks ed etichette asse valori (da sinistra a destra)
    const ticksValueGroup = valueAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo ticks Asse Valori' : null,
    });
    const labelsValueGroup = valueAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo etichette Asse Valori' : null,
    });

    // gruppo per griglia asse valori (verticale, ortogonale all'asse)
    let valueGridGroup = null;
    if(showYgrid) {
      valueGridGroup = cartesianAxisGroup.group()
        .attr({ 'data-debug-info': debug? 'Gruppo Griglia Asse Valori' : null });
    }

    for await (const stepIdx of Array.from(Array(stepY_count + 1).keys())) {

      const x = chart_area.left + (stepY_size * stepIdx)
        ,label = labelYFormatter(min_value + stepY_value * stepIdx);

      // =>> ticks asse valori
      ticksValueGroup
        .line(
          x, chart_area.bottom,
          x, chart_area.bottom + ticksLength
        )
        .attr(ticksAttrs);

      // =>> etichette asse valori
      const labelEl = await createTextEl(chartInstance, {
          text: label,
          textFill: labelYAttrs.fill?? '#000',
          fontAttr: labelYAttrs,
          fontFilePath: labelYFontFilePath,
          parentElement: labelsValueGroup
        }),
        label_bbox = labelEl.bbox();

      labelEl.move(
        x - label_bbox.width / 2,
        chart_area.bottom + ticksLength + 2 // 2 è un distanziatore tra l'etichetta e la linea
      );

      // eventuale correzione ultima etichetta (evita che esca dal margine destro dell'svg)
      if(stepIdx === stepY_count) {
        const labelX2 = labelEl.bbox().x2;

        if(labelX2 > width - padding) {
          labelEl.dx(-(labelX2 - width + padding/2));
        }
      }

      // =>> griglia verticale (ortogonale all'asse valori)
      // viene omessa solo la linea che coincide con l'asse categorie (la linea dello zero)
      if(showYgrid && Math.abs(x - zero_x) > 0.01) {
        valueGridGroup.line(
          x, chart_area.top,
          x, chart_area.bottom
        ).attr(gridLinesAttrs);
      }

    } // end for await stepIdx

    // =>> titolo asse valori (in basso)
    if(xAxisTitle) {
      const titleEl = await createTextEl (chartInstance, {
          text: xAxisTitle,
          textFill: xAxisTitleAttrs.fill?? '#000',
          fontAttr: xAxisTitleAttrs,
          fontFilePath: xAxisTitleFontFilePath,
          parentElement: valueAxisGroup
        }),
        title_bbox = titleEl.bbox();

      titleEl.move(
        chart_area.left + (chart_area.width - title_bbox.width) / 2,
        height - padding - title_bbox.height
      );
    }



    // =>> ASSE CATEGORIE (a sinistra — analogo all'asse Y di cartesianAxisVertical;
    // la linea dell'asse è quella dello zero, si sposta in base al segno dei dati)
    // *****************************************
    const categoryAxisGroup = cartesianAxisGroup.group();
    categoryAxisGroup
      .attr({ 'data-debug-info': debug? 'Gruppo Asse Categorie' : null })
      .line(
        zero_x, chart_area.top,
        zero_x, chart_area.bottom
      )
      .attr({
        'data-debug-info': debug? 'Asse Categorie' : null,
        ...axisAttrs
      });

    // =>> ticks ed etichette asse categorie (dall'alto verso il basso)
    const ticksCategoryGroup = categoryAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo ticks Asse Categorie' : null,
    });
    const labelsCategoryGroup = categoryAxisGroup.group().attr({
      'data-debug-info': debug? 'Gruppo etichette Asse Categorie' : null,
    });

    // coordinata x per il posizionamento delle etichette (a sinistra dei ticks, fisse su chart_area.left)
    const labelX = chart_area.left - ticksLength - 2; // 2 è un distanziatore tra l'etichetta e la linea

    // gruppo per griglia asse categorie (orizzontale, ortogonale all'asse)
    // il gruppo viene sempre creato, perché anche se non si stampa la griglia viene
    // cmq aggiunta l'ultima linea in basso
    const categoryGridGroup = cartesianAxisGroup.group()
      .attr({ 'data-debug-info': debug? 'Gruppo Griglia Asse Categorie' : null });

    for (let i = 0; i <= stepX_count - 1; i++) {

      const thisLabel = (Array.isArray(xLabels) ? xLabels[i] : undefined) ?? '',
        labelIdx = i,
        isLastStep = labelIdx === stepX_count - 1,
        y = chart_area.top + (stepX_size * labelIdx);

      // =>> ticks categorie
      ticksCategoryGroup
        .line(
          chart_area.left - ticksLength, y,
          chart_area.left, y
        )
        .attr(ticksAttrs);

      // =>> etichette categorie
      const labelEl = await createTextEl (chartInstance, {
          text: thisLabel,
          textFill: labelXAttrs.fill?? '#000',
          fontAttr: labelXAttrs,
          fontFilePath: labelXFontFilePath,
          parentElement: labelsCategoryGroup
        }),
        label_bbox = labelEl.bbox();

      // posizionamento (allineate a destra sulla linea dei ticks)
      labelEl.move(
        labelX - label_bbox.width,
        y - label_bbox.height / 2 + (xLabelsOnTicks? 0 : stepX_size / 2)
      );

      // =>> griglia orizzontale
      // la prima linea coincide con l'asse valori (in basso, essendo la prima categoria in alto)
      // l'ultima linea in basso viene stampata sempre
      if((showXgrid && labelIdx > 0) || isLastStep ) {
        categoryGridGroup.line(
          chart_area.left, y,
          chart_area.right, y
        ).attr(gridLinesAttrs);
      }

    } // end for thisLabel

    // =>> titolo asse categorie (a sinistra, ruotato)
    if(yAxisTitle) {
      const titleGroup = categoryAxisGroup.group(); // per la rotazione
      titleGroup.attr({
        'data-debug-info': debug? 'Titolo asse Categorie' : null,
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

    return cartesianAxisGroup;

  } catch(e) {
    console.error( 'MinimoCharts → cartesianAxis (horizontal)', e ); // eslint-disable-line
  }
}
