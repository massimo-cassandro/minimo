import { G } from '@svgdotjs/svg.js';
import { createTextEl } from './create-text-element.js';

/**
 * Parametri di `cartesianAxis`: corrispondono a quelli dei grafici con assi (`bars`, `hbars`, `lines`),
 * con l'aggiunta dei valori calcolati da `parseStdAxisOpts`.
 * NB: i nomi `stepY_*`, `yLabel*` e `showYgrid` si riferiscono sempre all'asse dei valori,
 * `stepX_*`, `xLabel*`, `xLabels` e `showXgrid` all'asse delle categorie, anche con orientamento orizzontale
 * (dove l'asse dei valori è in basso e quello delle categorie a sinistra).
 * @typedef {Object} CartesianAxisParams
 * @property {'vertical'|'horizontal'} [orientation] - Orientamento del grafico (default: "vertical")
 * @property {boolean} [debug] - Se true aggiunge gli attributi `data-debug-info` agli elementi (default: false)
 * @property {import('./parse-std-axis-opts.js').ChartArea} chart_area - Area del grafico, calcolata da `parseStdAxisOpts`
 * @property {number} [padding] - Spazio intorno ai bordi del grafico (default: 0)
 * @property {number} width - Larghezza dell'svg
 * @property {number} height - Altezza dell'svg
 * @property {Object} [axisAttrs] - Attributi svg.js delle linee degli assi (default: {})
 * @property {Object} [ticksAttrs] - Attributi svg.js dei ticks (default: {})
 * @property {import('./core.js').ChartFontAttrs} [yLabelAttrs] - Attributi font delle etichette dell'asse dei valori (default: {})
 * @property {string|null} [yLabelFontFilePath] - Percorso del file del font delle etichette dell'asse dei valori (solo textToPath) (default: null)
 * @property {import('./core.js').ChartFontAttrs} [xLabelAttrs] - Attributi font delle etichette dell'asse delle categorie (default: {})
 * @property {string|null} [xLabelFontFilePath] - Percorso del file del font delle etichette dell'asse delle categorie (solo textToPath) (default: null)
 * @property {number} stepY_count - Numero di suddivisioni dell'asse dei valori
 * @property {number} stepY_size - Lunghezza in px di ogni suddivisione dell'asse dei valori
 * @property {number} stepY_value - Valore corrispondente a ogni suddivisione dell'asse dei valori
 * @property {number} min_value - Valore minimo dell'asse dei valori
 * @property {number} zero_y - Coordinata della linea dello zero (y con orientamento verticale, x con orientamento orizzontale)
 * @property {number} stepX_size - Lunghezza in px di ogni suddivisione dell'asse delle categorie
 * @property {number} stepX_count - Numero di suddivisioni dell'asse delle categorie
 * @property {number} [ticksLength] - Lunghezza dei ticks in px (default: 0)
 * @property {boolean} [showXgrid] - Mostra la griglia ortogonale all'asse delle categorie (verticale, oppure orizzontale con orientamento orizzontale) (default: true)
 * @property {boolean} [showYgrid] - Mostra la griglia ortogonale all'asse dei valori (orizzontale, oppure verticale con orientamento orizzontale) (default: true)
 * @property {Object} [gridLinesAttrs] - Attributi svg.js delle linee della griglia (default: {})
 * @property {string|null} [yAxisTitle] - Titolo dell'asse a sinistra (default: null)
 * @property {import('./core.js').ChartFontAttrs} [yAxisTitleAttrs] - Attributi font del titolo dell'asse a sinistra (default: {})
 * @property {string|null} [yAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse a sinistra (solo textToPath) (default: null)
 * @property {string|null} [xAxisTitle] - Titolo dell'asse in basso (default: null)
 * @property {import('./core.js').ChartFontAttrs} [xAxisTitleAttrs] - Attributi font del titolo dell'asse in basso (default: {})
 * @property {string|null} [xAxisTitleFontFilePath] - Percorso del file del font del titolo dell'asse in basso (solo textToPath) (default: null)
 * @property {Array<string|number>} [xLabels] - Etichette dell'asse delle categorie
 * @property {boolean} [xLabelsOnTicks] - Se true le etichette di categoria sono posizionate in corrispondenza dei ticks, altrimenti sono centrate nello spazio di ogni suddivisione (default: true)
 * @property {((value: number) => string|number)|null} [yLabelFormatter] - Funzione per formattare le etichette dell'asse dei valori; se null viene mostrato il valore senza elaborazione (default: null)
 */

/**
 * Costruisce un sistema di assi cartesiani completo di ticks, etichette, griglia e titoli degli assi.
 * Smista la richiesta in base a `params.orientation`: `vertical` (barre/linee verticali, default)
 * o `horizontal` (barre orizzontali). Gli argomenti sono gli stessi per entrambi gli orientamenti,
 * interpretati diversamente da ciascun ramo (vedi `cartesianAxisVertical` e `cartesianAxisHorizontal`).
 * Il gruppo restituito non è aggiunto ad alcun svg. In caso di errore lo registra in console e rilancia l'errore.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * await cartesianAxis(chartInstance, { // istanza di MinimoCharts, OBBL
 *   axisAttrs: {}, // attributi linee degli assi, FAC
 *   chart_area: parsed.chart_area, // area del grafico (da parseStdAxisOpts), OBBL
 *   debug: false, // attributi data-debug-info, FAC
 *   gridLinesAttrs: {}, // attributi linee griglia, FAC
 *   height: 300, // altezza dell'svg, OBBL
 *   min_value: parsed.min_value, // valore minimo asse valori, OBBL
 *   orientation: 'vertical', // orientamento del grafico, FAC
 *   padding: 0, // spazio intorno ai bordi, FAC
 *   showXgrid: true, // griglia asse categorie, FAC
 *   showYgrid: true, // griglia asse valori, FAC
 *   stepX_count: 6, // suddivisioni asse categorie, OBBL
 *   stepX_size: parsed.stepX_size, // px per suddivisione asse categorie, OBBL
 *   stepY_count: parsed.stepY_count, // suddivisioni asse valori, OBBL
 *   stepY_size: parsed.stepY_size, // px per suddivisione asse valori, OBBL
 *   stepY_value: parsed.stepY_value, // valore per suddivisione asse valori, OBBL
 *   ticksAttrs: {}, // attributi ticks, FAC
 *   ticksLength: 8, // lunghezza ticks, FAC
 *   width: 600, // larghezza dell'svg, OBBL
 *   xAxisTitle: null, // titolo asse in basso, FAC
 *   xAxisTitleAttrs: {}, // font titolo asse in basso, FAC
 *   xAxisTitleFontFilePath: null, // file font titolo asse in basso, FAC
 *   xLabelAttrs: {}, // font etichette asse categorie, FAC
 *   xLabelFontFilePath: null, // file font etichette asse categorie, FAC
 *   xLabels: [], // etichette di categoria, FAC
 *   xLabelsOnTicks: true, // etichette di categoria sui ticks, FAC
 *   yAxisTitle: null, // titolo asse a sinistra, FAC
 *   yAxisTitleAttrs: {}, // font titolo asse a sinistra, FAC
 *   yAxisTitleFontFilePath: null, // file font titolo asse a sinistra, FAC
 *   yLabelAttrs: {}, // font etichette asse valori, FAC
 *   yLabelFontFilePath: null, // file font etichette asse valori, FAC
 *   yLabelFormatter: null, // formattazione etichette asse valori, FAC
 *   zero_y: parsed.zero_y, // coordinata della linea dello zero, OBBL
 * });
 *
 * @param {import('./core.js').MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {CartesianAxisParams} params - Parametri degli assi (vedi `CartesianAxisParams`)
 * @returns {Promise<import('@svgdotjs/svg.js').G>} Il gruppo svg.js con assi, ticks, etichette, griglia e titoli
 */
export async function cartesianAxis(chartInstance, params) {
  return params.orientation === 'horizontal'
    ? cartesianAxisHorizontal(chartInstance, params)
    : cartesianAxisVertical(chartInstance, params);
}

/**
 * Variante verticale (barre/linee verticali): asse dei valori a sinistra (asse Y), con griglia orizzontale;
 * asse delle categorie in basso (asse X), disegnato sulla linea dello zero, con griglia verticale.
 * @param {import('./core.js').MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {CartesianAxisParams} params - Parametri degli assi (vedi `CartesianAxisParams`)
 * @returns {Promise<import('@svgdotjs/svg.js').G>} Il gruppo svg.js con assi, ticks, etichette, griglia e titoli
 */
async function cartesianAxisVertical(chartInstance, {
  debug = false,
  chart_area = /** @type {import('./parse-std-axis-opts.js').ChartArea} */ ({}),
  padding = 0,
  width,
  height,
  axisAttrs = {},
  ticksAttrs = {},
  yLabelAttrs = {},
  yLabelFontFilePath = null,
  xLabelAttrs = {},
  xLabelFontFilePath = null,
  stepY_count,
  stepY_size,
  stepY_value,
  min_value,
  zero_y,
  stepX_size,
  stepX_count,
  ticksLength = 0,
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
  yLabelFormatter = null, // funzione
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
        ,stepValue = min_value + stepY_value * stepIdx
        ,label = yLabelFormatter? yLabelFormatter(stepValue) : stepValue; // senza funzione il valore non viene elaborato

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
          textFill: yLabelAttrs.fill?? '#000',
          fontAttr: yLabelAttrs,
          fontFilePath: yLabelFontFilePath,
          parentElement: labelsYGroup
        }),
        label_bbox = labelEl.bbox();

      labelEl.move(
        chart_area.left - ticksLength - 2 - label_bbox.width, // 2 è un distanziatore tra l'etichetta e la linea
        y - label_bbox.height / 2
      );

      // =>> griglia orizzontale (ortogonale all'asse Y)
      // viene omessa solo la linea che coincide con l'asse X (la linea dello zero)
      if(yGridGroup && Math.abs(y - zero_y) > 0.01) {
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
          textFill: xLabelAttrs.fill?? '#000',
          fontAttr: xLabelAttrs,
          fontFilePath: xLabelFontFilePath,
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
    throw e;
  }
}

/**
 * Variante orizzontale (barre orizzontali): rispetto a `cartesianAxisVertical` i ruoli sono invertiti:
 * - l'asse dei VALORI (numerico, formattato con `yLabelFormatter`) è fisso in basso (come l'asse X
 *   di `cartesianAxisVertical`), con griglia verticale. La linea dello zero (baseline delle barre)
 *   è una linea verticale che si sposta in base al segno dei dati (`zero_y` qui è una coordinata X)
 * - l'asse delle CATEGORIE (testuale, da `xLabels`) è fisso a sinistra (come l'asse Y di
 *   `cartesianAxisVertical`), con griglia orizzontale
 *
 * `stepY_count`/`stepY_size`/`stepY_value`/`zero_y` e `stepX_size`/`stepX_count` sono gli stessi campi
 * restituiti da `parseStdAxisOpts` con `orientation: 'horizontal'` (vedi commenti lì).
 * @param {import('./core.js').MinimoCharts} chartInstance - Istanza di `MinimoCharts`
 * @param {CartesianAxisParams} params - Parametri degli assi (vedi `CartesianAxisParams`)
 * @returns {Promise<import('@svgdotjs/svg.js').G>} Il gruppo svg.js con assi, ticks, etichette, griglia e titoli
 */
async function cartesianAxisHorizontal(chartInstance, {
  debug = false,
  chart_area = /** @type {import('./parse-std-axis-opts.js').ChartArea} */ ({}),
  padding = 0,
  width,
  height,
  axisAttrs = {},
  ticksAttrs = {},
  yLabelAttrs = {},
  yLabelFontFilePath = null,
  xLabelAttrs = {},
  xLabelFontFilePath = null,
  stepY_count,
  stepY_size,
  stepY_value,
  min_value,
  zero_y: zero_x, // rinominato per chiarezza: qui è una coordinata X
  stepX_size,
  stepX_count,
  ticksLength = 0,
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
  yLabelFormatter = null, // funzione, formatta le etichette numeriche dell'asse valori (in basso)
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
        ,stepValue = min_value + stepY_value * stepIdx
        ,label = yLabelFormatter? yLabelFormatter(stepValue) : stepValue; // senza funzione il valore non viene elaborato

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
          textFill: yLabelAttrs.fill?? '#000',
          fontAttr: yLabelAttrs,
          fontFilePath: yLabelFontFilePath,
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
      if(valueGridGroup && Math.abs(x - zero_x) > 0.01) {
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
          textFill: xLabelAttrs.fill?? '#000',
          fontAttr: xLabelAttrs,
          fontFilePath: xLabelFontFilePath,
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
    throw e;
  }
}
