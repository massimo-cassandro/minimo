/**
 * rating display OLD
 *
 * Mostra un indicatore tipo contachilometri su una scala da 1 a 4 o 5
 */

import { parseContainer, toRadians } from '../src/chart-utils.js';
import { createTextEl } from '../src/create-text-element.js';

export async function ratingDisplay({

  // SECTION args

  /** container (selettore o elemento DOM), se null viene restituito il codice SVG */
  container = null,


  /** eventuali classi da aggiungere all'elemento svg */
  svgAttrs = {},

  /** modalità debug, se attiva mostra dei riferimenti grafici */
  debug = false,

  /**
    valore da rappresentare
    in base a questo viene assegnato il posizionamento rispetto alla scala:
    1-1,99 : prima fascia
    2-2,99 : seconda ...
    La scala parte da 1
    L'ultima porzione rappresenta tutti i valori >= 4 per la versione a 4 porzioni
    e i valori >= 5 per l'altra
  */
  value = null,

  /**
    Valore di partenza della scala
  */
  scaleStartValue = 0,

  /**
    se true, l'asticella viene posizionata al centro del colore corrispondente
    se false, viene posizionata in proporzione al valore effettivo
  */
  rodPositionForceCenter = false,

  /**
    fill, traccia e classe dello sfondo del display principale
    oggetto analogo a
    {
      fill: null,
      strokeWidth: null,
      strokeColor: null,
      className: null,
    }
  */
  displayBackgroundAttrs = {
    fill: 'none',
  },

  /** numero di porzioni del tachimetro  */
  portions = 5, // 3, 4 o 5

  /**
    colori da applicare alle porzioni del tachimetro. Se non impostati vengono usati quelli di base
    I colori vengono assegnati agli elementi della scala secondo il loro ordine, a partire dal proimo a sinistra
    Se un colore non è presente viene usato il nero (#000)
  */
  scaleColors = null,
  scaleAttrs = {},

  /**
    segni di separazione degli elementi della scala
    vengono aggiunti anche `stroke-width="1" fill="none" stroke-linecap="butt"`
    se `scaleticksColor` è null, vengono usati gli stessi colori di `scaleColors`
  */
  scaleticksColor = null,

  /**
    asticella
  */
  rodAttrs = {fill: '#000'},

  /**
    etichetta principale
    se presente è un array in cui ogni elemento corrisponde ad una riga (max 2)
    dell'etichetta:

    displayLabel: [
      {
        label: <text> || null,
        font: obj || null, // oggetto analogo a chartInstance.defaults.font
        fill: <color>,
        fontFilePath: path // percorso al file del font, utilizzato se `this.textToPath === true`,
      },
      {...}
    ]
  */
  displayLabel = null,

  /** distanza della prima riga di etichetta dalla base dell'asticella */
  displayLabelTopMargin = 4,

  /** distanza tra le due righe dell'etichetta */
  displayLabelRowGap = 2,


  // =>> minidisplay
  /**
    minidisplay
    se impostato è un array di uno o due elementi, in cui ognuno di questo
    è un oggetto così impostato:

    miniDisplay = [
      {
        position: 'sx' | 'dx' (aliases: left | right),
        value: number,
        type: 'gauge' || 'value'   // gauge = mini tachimetro, value: mostra il valore indicato in value
        typeValueFont: obj || null // oggetto analogo a quelli definito in displayLabel per la rappresentazione
                                   //  di `type: value`. Se typeValueFont.label non è presente, viene utilizzato
                                   //  `value` (arrotondato all'intero)
        mdLabel: array || null     // array di oggetti (uno per ogni riga di etichetta) analogo a quello
                                   // indicato nel display principale (displayLabel)

        mdArc: {                   // oggetto simile a displayBackgroundAttrs, è relativo all'arco che avvolge il mini display
          fill: null,
          strokeWidth: null,
          strokeColor: null,
          className: null,
        }
      }
      ...
    ],

    se
  */
  miniDisplay = null,

  /** distanza dalla base del display principale */
  miniDisplayTopMargin = 0,

  /** distanza della prima riga di etichette dalla base del minidisplay */
  miniDisplayLabelTopMargin = 0,

  /** distanza tra le due righe dell'etichetta */
  miniDisplayLabelRowGap = 2,


  animation = false,
  // animation_ms = 100, // number
  // animation_fps = 60, // number

  // !SECTION

}) {

  const chartInstance = this;

  try {

    scaleColors??= chartInstance.defaults.colors;

    // 30 gradi in radianti
    // ampiezza dell'angolo della parte eccedente il raggio della circonferenza che include l'arco di cerchio
    const rad30 = toRadians(30),

      // assicura che il valore sia entro i limiti gestiti dal grafico
      getSanitizedColorIndex = value => Math.max(
        0,
        Math.min(
          portions - 1,
          Math.floor(value) - scaleStartValue
        )
      ),
      getColorFromValue = value => scaleColors[getSanitizedColorIndex(value)]
    ;

    // =>> sizes

    const sizes = {
      // display principale
      mainDisplay: {


        // TODO il raggio deve considerare lo spessore della traccia per la scala non è costruita dinamicamente
        // ripristinare il raggio statico se la scala (e l'asticella) vengono generate dinamicamente

        // r: 110,
        get r() {
          return 110 -  ((displayBackgroundAttrs?.strokeWidth??0) / 2);
        },

        get w() {
          return this.r * 2 +
            // spessore traccia arco esterno, se presente
            (displayBackgroundAttrs?.strokeWidth??0);
        },
        /*
          altezza dell'area del display
          è pari al raggio + la distanza corrispondente ad uno spostamento di 30°
          (l'arco di cerchio dell'area display è di 240°),
          distanza che corrisponde al centro di rotazione dell'asticella.
          La base dell'area del display principale è quindi la corda posizionata agli estremi dell'arco
        */
        get h() { return this.r + ( this.r * Math.sin(rad30) ) +
            // spessore traccia arco esterno, se presente
            ((displayBackgroundAttrs?.strokeWidth??0) / 2);
        },

        /*
          centro di rotazione dell'asticella
          corrisponde al centro della circonferenza che include l'arco dell'area display
          viene considerato anche l'eventuale spessore dell'arco
        */
        get cx() {
          return this.r + ((displayBackgroundAttrs?.strokeWidth??0) / 2);
        },
        get cy() {
          return this.r + ((displayBackgroundAttrs?.strokeWidth??0) / 2);
        }
      }
    };

    // =>> dimensione dell'intero svg
    sizes.mainSvg  = {
      w: sizes.mainDisplay.w,
      h: sizes.mainDisplay.h // altezza provvisoria, andrà ricalcolata dopo il rendering dei miniDisplay
    };

    // =>> verifiche e impostazioni di base
    if(value == null || typeof value !== 'number') {
      throw '`value` is requested and must be a number';
    }
    if([3,4,5].indexOf(portions) === -1) {
      throw '`portions` must be 3, 4 or 5';
    }

    value = Math.min(value, portions);

    /*
      la scala parte da 1 e arriva a `portions` (viene tolta una piccola
      porzione finale per maggiore precisione)
    */
    const parsedDisplayValue = rodPositionForceCenter? Math.floor(value) + .499 : value;


    // =>> animazione e posizione iniziale dell'asticella (rod)
    let rotazioneAsticella = 0;

    if(animation) {

      // TODO animazione
      // const display_animation = () => {
      //   const runAnimation = () => {

      //     const animationStepValue = parsedDisplayValue / animation_ms;

      //     let fpsInterval = animation_ms / animation_fps,
      //       currentDisplayValue = scaleStartValue, // valore iniziale. La scala parte da 1
      //       startTimestamp = Date.now(),
      //       animationEnd = false;

      //     const step = () => {
      //       let now = Date.now(),
      //         elapsed = now - startTimestamp;

      //       currentDisplayValue = Math.min(currentDisplayValue, parsedDisplayValue);

      //       if(currentDisplayValue >= parsedDisplayValue) {
      //         animationEnd = true;
      //       }

      //       // request another frame
      //       const animationRequest = window.requestAnimationFrame(step);

      //       // if enough time has elapsed, draw the next frame
      //       if (elapsed >= fpsInterval) {

      //         // Get ready for next frame by setting startTimestamp=now, but...
      //         // Also, adjust for fpsInterval not being multiple of 16.67
      //         startTimestamp = now - (elapsed % fpsInterval);

      //         svgElement.style.setProperty(
      //           '--rd-rot',
      //           Math.max(0, ((currentDisplayValue - scaleStartValue) * 240) / (portions - .001))
      //         );

      //         if(animationEnd) {
      //           window.cancelAnimationFrame(animationRequest);

      //         } else {
      //           currentDisplayValue += animationStepValue;
      //           // easing out a 2/3 del valore
      //           // if(currentDisplayValue >= parsedDisplayValue * 2/3) {
      //           //   fpsInterval += 1;
      //           // }

      //         }
      //       }

      //     };// end step

      //     step();
      //   }; // end animazione_arco

      //   runAnimation();

      // }; // end display_animation

      // // NB la mutazione non è rilevata se la card è già visibile nel viewport
      // // per questo è presente l'if iniziale
      // if(inViewport) {
      //   display_animation();
      // }

    } else {
      rotazioneAsticella = Math.max(0, ((parsedDisplayValue  - scaleStartValue) * 240) / (portions - .001));
    }

    // container element
    parseContainer(container);

    // =>> definizione SVG
    const svgCanvas = chartInstance.createSvgCanvas(container);
    svgCanvas
      // .viewbox(0, 0, sizes.mainSvg.w, sizes.mainSvg.h)
      // .size(sizes.mainSvg.w, sizes.mainSvg.h)
      .attr({
        fill: 'none',
        ...svgAttrs
      });


    // =>> gruppo Display Principale
    const mainDisplayGroup = svgCanvas.group()
      .attr({
        'data-debug-info': debug? 'Gruppo Display Principale' : null,
      });


    // =>> function getDisplayArcPath
    const getDisplayArcPath = (radius, cx, cy) => {
      const startPointX = cx - (radius * Math.cos(rad30)),
        startPointY = cy + (radius * Math.sin(rad30)),

        endPointX = cx + (radius * Math.cos(rad30)),
        endPointY = cy + (radius * Math.sin(rad30));

      return `M ${startPointX},${startPointY} ` +
        // rx ry x-axis-angle large-arc-flag sweep-flag end-x end-y
        `A ${radius} ${radius} 0 1 1 ${endPointX} ${endPointY}`;
    };

    // =>> display principale
    mainDisplayGroup.path(
      // 'M14.5589,164.7274C5.2967,148.6096,0,129.9234,0,110,0,49.2487,49.2487,0,110,0s110,49.2487,110,110c0,20.0586-5.3689,38.8632-14.748,55.0552l-190.6931-.3278Z'
      getDisplayArcPath(sizes.mainDisplay.r, sizes.mainDisplay.cx, sizes.mainDisplay.cy)
    )
      .attr({
        'data-debug-info': debug? 'area display principale' : null,
        class: displayBackgroundAttrs?.className, // se il valore è null o undefined l'attributo viene ignorato
        fill: displayBackgroundAttrs?.fill?? 'none',
        stroke: displayBackgroundAttrs?.strokeColor,
        'stroke-width': displayBackgroundAttrs?.strokeWidth,
        'stroke-linecap': displayBackgroundAttrs?.strokeWidth? 'butt' : null,
      });


    // TODO generare dinamicamente
    // =>> portions & ticks

    let ticks_paths, scale_paths;
    if(portions === 3) {
      ticks_paths = [
        'M44.32 27.94L56.5 42.53',
        'M179.45 31.06L158.99 55.29'
      ];

      scale_paths = [
        'M53.26,38.62c0.56-0.33,1.1-0.68,1.67-1.01c16.15-9.16,33.99-12.88,51.31-11.75c2.11-0.01,2.04,0.12,4,0.35c18.01,1.96,35.26,9.19,49.25,21.01l16.38-19.45c-18.69-14.98-41.94-23.05-65.63-23.08c-1.63-0.02-2.06,0.14-4,0.07C89.69,5.37,73.04,9.91,57.69,18.77c-4.76,2.75-9.22,5.83-13.37,9.17L53.26,38.62z',
        'M40.49,31.15c-8.57,7.59-15.68,16.4-21.22,26.01c0,0,0,0-1.93,3.51C1.09,91.51,0.54,129.77,19.26,162.2l-0.04-0.31c-14.08-33.52-12-69.73,5.94-96.72c0.87-1.42,2.3-3.29,2.3-3.29C33.22,54.05,40.41,47.1,49,41.32L40.49,31.15z',
        'M201.15,57.25L201.15,57.25l-2.07-3.42c-5.46-8.7-12.02-16.34-19.38-22.84l-16.48,19.57c5.04,4.76,9.58,10.17,13.49,16.18l2.11,3.4c0.01,0.01,0.02,0.02,0.02,0.04c11.4,19.83,12.28,45,0.02,66.23c-1.95,3.38-4.15,6.52-6.57,9.42l28.91,16.28C219.23,130.73,220.53,90.86,201.15,57.25z'
      ];

    } else if(portions === 4) {
      ticks_paths = [
        'M31.8145,64.3924l-12.5627-7.253',
        'M110.2255,31.2336V4.6702',
        'M174.4747,72.6224l26.6597-15.3919'
      ];

      scale_paths = [
        'M25.1449,65.1604l-7.8217-4.5158C1.0679,91.4936,.5203,129.7554,19.2431,162.1841l-.0406-.3084c-14.0813-33.5175-11.9978-69.7327,5.9424-96.7153Z',
        'M106.2255,4.745c-16.5541,.6089-33.2051,5.1472-48.5497,14.0065-16.5527,9.5566-29.5166,22.9407-38.4241,38.3877l8.1965,4.7322c7.0425-9.5853,16.1881-17.8798,27.4637-24.2736,16.1538-9.16,33.9923-12.8843,51.3135-11.7545V4.745Z',
        'M199.0645,53.8066C179.2813,22.2909,145.2283,4.7195,110.2255,4.6702V26.1936c26.4244,2.8778,51.228,17.0771,66.4696,40.528l22.3694-12.915Z',
        'M201.1344,57.2305l-22.3293,12.8918c.0073,.0126,.0153,.0248,.0227,.0374,11.402,19.8312,12.2809,44.9971,.02,66.2336-1.9507,3.3787-4.1538,6.5209-6.5719,9.4163l28.9064,16.2815c18.0334-31.3837,19.3337-71.2517-.0479-104.8605Z'
      ];

    } else { // 5
      ticks_paths = [
        'M22.1717,81.0456l-11.8401-3.8471',
        'M76.5125,33.9593l-9.0032-20.2213',
        'M140.9257,40.7459l12.0048-26.963',
        'M180.4367,86.9106l29.6283-9.6269'
      ];

      scale_paths = [
        'M15.9428,83.2275l-6.7733-2.2007c-7.4723,26.3461-4.7006,55.5677,10.0736,81.1573l-.0406-.3084c-11.1296-26.4916-12.1697-54.674-3.2596-78.6482Z',
        'M63.8892,15.4414c-2.0916,1.0298-4.1652,2.1275-6.2134,3.3101-23.385,13.5013-39.6072,34.641-47.3442,58.447l7.0957,2.3055c7.2439-17.1207,19.7513-31.8504,37.4847-41.9061,5.0895-2.886,10.3474-5.2258,15.7025-7.0513l-6.7253-15.1052Z',
        'M149.2476,12.2204C123.5877,1.9537,94.1199,1.8658,67.5094,13.7379l6.9424,15.593c21.8262-6.3824,44.9893-4.3134,64.9426,5.0201l9.8533-22.1306Z',
        'M184.0155,81.542l24.7449-8.04c-2.0469-5.5565-4.5906-11.0154-7.6519-16.3178-11.5244-19.9607-28.6157-34.6992-48.178-43.4012l-9.9482,22.3439c14.4784,7.5615,27.0454,19.0628,35.8455,34.0328,2.0891,3.6336,3.8213,7.4476,5.1877,11.3823Z',
        'M185.2117,85.3591c4.668,16.5795,2.9308,34.935-6.364,51.0341-1.9507,3.3787-4.1538,6.5209-6.5719,9.4163l28.9064,16.2815c14.5532-25.327,18.2002-56.1781,8.8828-84.8073l-24.8533,8.0754Z'
      ];
    }

    const ticksGroup = mainDisplayGroup.group()
      .attr({
        'data-debug-info': debug? 'ticks' : null,
        fill: 'none',
        'stroke-width': .5,
        'stroke-linecap': 'butt',

      });
    ticks_paths.forEach((p, idx) => {
      ticksGroup.path(p)
        .attr({
          stroke: scaleticksColor? scaleticksColor : scaleColors?.[idx + 1]?? '#000',
        });
    });

    const scaleGroup = mainDisplayGroup.group().attr({
      'data-debug-info': debug? 'scales' : null,
      stroke: 'none',
      ...scaleAttrs
    });
    scale_paths.forEach((p, idx) => {
      scaleGroup.path(p)
        .attr({
          fill: scaleColors?.[idx]?? '#000'
        });
    });


    // =>> asticella
    const rodGroup = mainDisplayGroup.group()
      .attr({
        'data-debug-info': debug? 'asticella' : null,
        ...rodAttrs
      });

    // centro

    // versione statica
    // rodGroup.path('M120.5713,103.6898c3.3137,5.7395,1.3472,13.0786-4.3923,16.3923-5.7395,3.3137-13.0786,1.3472-16.3923-4.3923s-1.3472-13.0786,4.3923-16.3923c5.7395-3.3137,13.0786-1.3472,16.3923,4.3923Zm-13.8923-.0622c-3.348,1.933-4.4952,6.2141-2.5622,9.5622s6.2141,4.4952,9.5622,2.5622,4.4952-6.2141,2.5622-9.5622-6.2141-4.4952-9.5622-2.5622Z');

    // versione con path calcolato
    // https://www.smashingmagazine.com/2019/03/svg-circle-decomposition-paths/
    const ringPath = ({cx, cy, outerRadius, innerRadius}) => {

      return `M ${cx - outerRadius/2}, ${cy}`+
      `a ${outerRadius/2},${outerRadius/2} 0 1,0 ${outerRadius},0 ` +
      `a ${outerRadius/2},${outerRadius/2} 0 1,0 -${outerRadius},0 ` +

      `M ${cx - innerRadius/2}, ${cy} ` +
      `a ${innerRadius/2},${innerRadius/2} 0 1,0 ${innerRadius},0 ` +
      `a ${innerRadius/2},${innerRadius/2} 0 1,0 -${innerRadius},0`;
    };

    rodGroup.path(ringPath({
      cx: sizes.mainDisplay.cx,
      cy: sizes.mainDisplay.cy,
      outerRadius: 24,
      innerRadius: 14
    }))
      .attr({'fill-rule': 'evenodd'});

    // bbox del solo anello di base dell'asticella
    // usato per il posizionamento delle etichette
    const rodGroupBaseBbox = rodGroup.bbox();

    // asta
    // TODO generare dinamicamente
    rodGroup.polygon('59.1813 139.0943 59.1813 139.0943 98.8572 108.491 105.5448 120.0899 59.1813 139.0943')
      .transform({

        origin: {
          x: sizes.mainDisplay.cx,
          y: sizes.mainDisplay.cy,
        },
        rotate: rotazioneAsticella
      })
      .attr({
        'data-debug-info': debug? `Value: ${parsedDisplayValue}, color index: ${getSanitizedColorIndex(parsedDisplayValue)},  {Angolo: ${rotazioneAsticella}, Start value: ${scaleStartValue}` : null,
      });


    // =>> function setLabel
    const setLabel = async ({
      labelObj,
      baseX,
      baseY,
      dy,
      rowGap = 0, // ulteriore correzione tra le distanze delle due righe
      parentEl = svgCanvas
    }) => {
      if(labelObj?.label) {

        const [label_bbox, labelEl] = await createTextEl (chartInstance, {
          text: labelObj.label,
          textFill: labelObj.fill??= '#000',
          fontAttr: labelObj.font??{},
          fontFilePath: labelObj.fontFilePath,
          parentElement: parentEl
        });

        // posizionamento Y
        // dy è lo spostamento aggiuntivo pari all'altezza dell'eventuale riga precedente
        const labelY = baseY + (dy? dy + rowGap : 0);

        // posizionamento, al centro sotto l'asticella
        labelEl.move(
          baseX - label_bbox.width / 2,
          labelY
        )
          .attr({
            'data-debug-info': debug? `label “${labelObj.label}”` : null
          });

        return label_bbox.height;

      }
    };

    // =>> displayLabel
    if(displayLabelTopMargin != null && typeof displayLabelTopMargin !== 'number') {
      throw '`displayLabelTopMargin` must be null or a number';
    }

    displayLabel??=[];
    if(displayLabel.length > 2) {
      throw 'No more than 2 `displayLabel` elements can be defined';
    }

    let prevLabelHeight = 0;
    for await (const labelObj of displayLabel) {

      prevLabelHeight = await setLabel({
        labelObj: labelObj,
        baseX: sizes.mainDisplay.cx,
        baseY: rodGroupBaseBbox.y2 + (displayLabelTopMargin??0),
        dy: prevLabelHeight,
        rowGap: displayLabelRowGap,
        parentEl: mainDisplayGroup
      });
    }

    // =>> ricalcolo altezza gruppo principale
    const mainDisplayGroupBbox = mainDisplayGroup.bbox();
    sizes.mainSvg.h = mainDisplayGroupBbox.y + mainDisplayGroupBbox.y2;

    // SECTION miniDisplay
    if(miniDisplayTopMargin != null && typeof miniDisplayTopMargin !== 'number') {
      throw '`miniDisplayTopMargin` must be null or a number';
    }

    miniDisplay??=[];
    if(miniDisplay.length > 2) {
      throw 'No more than 2 `miniDisplay` elements can be defined';
    }


    let miniDisplayIdx = 1, miniDisplayMaxHeight = 0, mdArcHeight = null;
    for await (const md of miniDisplay) {


      const errorPrefix = `miniDisplay #${miniDisplayIdx}`;

      // =>> controlli
      ['position', 'type', 'value'].forEach(item => {
        if(md[item] == null) {
          throw `${errorPrefix}: '${item}' is requested`;
        }
      });

      if(['sx', 'dx', 'left', 'right'].indexOf(md.position) === -1) {
        throw `${errorPrefix}: 'position' must be one of 'sx', 'dx', 'left' or 'right'`;
      }

      if(typeof md.value !== 'number') {
        throw `${errorPrefix}: 'value' must be a number`;
      }

      if(['gauge', 'value'].indexOf(md.type) === -1) {
        throw `${errorPrefix}: 'type' must be one of 'gauge' or 'value'`;
      }

      // default
      md.mdArc ??= {};
      md.mdArc.strokeWidth ??= 0;


      // =>> dimensioni
      const
        // raggio circonferenza che include l'arco
        mdRadius = 26,

        mdWidrh = (mdRadius * 2) + (md.mdArc?.strokeWidth??0), // impegna sia la parte destra che la sinistra

        // margine orizzontale dal bordo esterno dell'SVG
        xMargin = 20,

        // coordinate dell'origine del miniDisplay
        mdOrigin = {
          y: sizes.mainSvg.h + (miniDisplayTopMargin?? 0),
          x: (md.position === 'sx' || md.position === 'left')
            ? xMargin
            : sizes.mainSvg.w - xMargin - mdWidrh
        }
      ;


      // =>> mdGroup
      const mdGroup = svgCanvas.group()
        .attr({
          'data-debug-info': debug? `miniDisplay #${miniDisplayIdx}` : null,
        });

      // =>> definizione arco
      const
        // coordinate del centro della circonferenza che include l'arco
        mdArcCx= mdOrigin.x + mdRadius, // + md.mdArc.strokeWidth / 2,
        mdArcCy= mdOrigin.y + mdRadius // + md.mdArc.strokeWidth / 2,
      ;

      // minidisplay arc
      mdGroup.path(getDisplayArcPath(mdRadius, mdArcCx, mdArcCy))
        .attr({
          'data-debug-info': debug? `miniDisplay #${miniDisplayIdx}: arco` : null,
          class: md.mdArc.className, // se il valore è null o undefined l'attributo viene ignorato
          fill: md.mdArc.fill?? 'none',
          stroke: md.mdArc.strokeWidth > 0? md.mdArc.strokeColor : null,
          'stroke-width': md.mdArc.strokeWidth > 0? md.mdArc.strokeWidth : null,
          'stroke-linecap': md.mdArc.strokeWidth > 0? 'round' : null,
        });

      // altezza arco, per il posizionamento delle etichette
      // viene misurato solo il primo arco, in modo che le etichette siano comq allineate
      // se necessario, utilizzare il parametro miniDisplayLabelTopMargin per distanziare il testo dalla base dell'arco
      if(mdArcHeight == null) {
        mdArcHeight = mdGroup.bbox().height;
      }


      // =>> modalità "value"
      if(md.type === 'value') {

        md.typeValueFont ??= {};
        md.typeValueFont.label ??= String(Math.floor(md.value));

        const [value_bbox, valueEl] = await createTextEl (chartInstance, {
          text: md.typeValueFont.label,
          textFill: md.typeValueFont.fill??= '#000',
          fontAttr: md.typeValueFont.font??{},
          fontFilePath: md.typeValueFont.fontFilePath,
          parentElement: mdGroup
        });

        valueEl.move(
          mdArcCx - value_bbox.w/2,
          mdArcCy - value_bbox.h/2 - 2, // 2: spostamento basline verso l'alto
        )
          .attr({
            'data-debug-info': debug? `miniDisplay #${miniDisplayIdx}: value` : null,
          });

      // =>> modalità "gauge"
      } else {

        // segmento indicatore colore
        const segmentStrokeWidth = 6
          // spazio segmento arco
          ,distanzaSegmentoArco = 2
          // correzione raggio per dare spazio allo spessore della traccia
          ,segmentRadius = mdRadius - segmentStrokeWidth/2 - distanzaSegmentoArco
          // ampiezza angolo che sottende il segmento circolare
          // 30 è l'angolo del punto iniziale
          ,segmentAngle = toRadians(240/portions - 30)

          ,startPointX = mdArcCx - (segmentRadius * Math.cos(rad30))
          ,startPointY = mdArcCy + (segmentRadius * Math.sin(rad30))
          ,endPointX = mdArcCx - (segmentRadius * Math.cos(segmentAngle))
          ,endPointY = mdArcCy - (segmentRadius * Math.sin(segmentAngle))

          ,segmentPath = `M ${startPointX},${startPointY} ` +
            // rx ry x-axis-angle large-arc-flag sweep-flag end-x end-y
            `A ${segmentRadius} ${segmentRadius} 0 0 1 ${endPointX} ${endPointY}`

          ,segmentGroup = mdGroup.group()
        ;

        // =>> segmento mini display gauge
        segmentGroup.path(segmentPath)
          .attr({
            stroke: getColorFromValue(md.value),
            'stroke-width': segmentStrokeWidth,
          });

        // =>> anello mini asticella
        const ringOuterRadius = 12;
        mdGroup.path( ringPath({
          cx: mdArcCx,
          cy: mdArcCy,
          outerRadius: ringOuterRadius,
          innerRadius: 6
        }))
          .attr({'fill-rule': 'evenodd'})
          .attr({
            ...rodAttrs
          });

        // =>> mini asticella
        // viene prima creata allineata con l'asse X del mini display e poi ruotata al centro della porzione d'inizio
        // in seguito, la rotazione applicata al gruppo la porta nella posizione definitiva
        segmentGroup.polygon(
          `${mdArcCx - ringOuterRadius/2 + 2},${mdArcCy - 3} `+
          `${mdArcCx - segmentRadius + 6},${mdArcCy} `+
          `${mdArcCx - ringOuterRadius/2 + 2},${mdArcCy + 3}`
        )
          .attr({
            ...rodAttrs
          })
          .transform({
            origin: {
              x: mdArcCx,
              y: mdArcCy,
            },
            rotate: ((240/portions) / 2)  - 30
          })
        ;

        segmentGroup.transform({
          origin: {
            x: mdArcCx,
            y: mdArcCy,
          },
          rotate: (240/portions) * getSanitizedColorIndex(md.value) - scaleStartValue
        });
      }

      // =>> label mini display

      if(miniDisplayLabelTopMargin != null && typeof miniDisplayLabelTopMargin !== 'number') {
        throw `${errorPrefix}: 'miniDisplayLabelTopMargin' must be null or a number`;
      }

      md.mdLabel??=[];
      if(md.mdLabel.length > 2) {
        throw `${errorPrefix}: No more than 2 'mdLabel' elements can be defined`;
      }


      let prevLabelHeight = 0;
      for await (const labelObj of md.mdLabel) {

        prevLabelHeight = await setLabel({
          labelObj: labelObj,
          baseX: mdArcCx,
          baseY: mdOrigin.y + mdArcHeight + (miniDisplayLabelTopMargin??0),
          dy: prevLabelHeight,
          rowGap: miniDisplayLabelRowGap,
          parentEl: mdGroup
        });
      }



      // =>> indicatori per debug
      if(debug) {
        // centro mini display
        const gap = 10;
        const debug_group = mdGroup.group()
          .attr({
            'data-debug-info': 'centro mini display',
            stroke: '#05923e',
            fill: 'none',
            'stroke-width': .5,
            class: 'debug-info'
          });
        debug_group.line({x1: mdArcCx - gap, y1: mdArcCy, x2: mdArcCx + gap, y2: mdArcCy});
        debug_group.line({x1: mdArcCx, y1: mdArcCy - gap, x2: mdArcCx, y2: mdArcCy + gap});

        // origine mini display
        // debug_group.line({x1: mdOrigin.x - gap, y1: mdOrigin.y, x2: mdOrigin.x + gap, y2: mdOrigin.y});
        // debug_group.line({x1: mdOrigin.x, y1: mdOrigin.y - gap, x2: mdOrigin.x, y2: mdOrigin.y + gap});
      }

      // =>> ricalcolo miniDisplayMaxHeight
      miniDisplayMaxHeight = Math.max(
        miniDisplayMaxHeight,
        mdGroup.bbox().h + (miniDisplayTopMargin?? 0) + md.mdArc.strokeWidth // strokeWidth: spessore traccia nel caso non ci sia testo
      );
      miniDisplayIdx++;

    }

    // !SECTION end miniDisplay

    // =>> aggiornamento dimensioni SVG
    sizes.mainSvg.h += miniDisplayMaxHeight;
    // sizes.mainSvg.w = mainDisplayGroupBbox.w;

    svgCanvas.viewbox(0, 0, sizes.mainSvg.w, sizes.mainSvg.h);


    // indicatori per debug
    if(debug) {
      // centro display e rotazione asticella
      const gap = sizes.mainDisplay.r;
      const debug_group1 = svgCanvas.group()
        .attr({
          'data-debug-info': 'centro rotazione asticella',
          stroke: '#e20613',
          fill: 'none',
          'stroke-width': .5,
          class: 'debug-info'
        });
      debug_group1.line({x1: sizes.mainDisplay.cx - gap, y1: sizes.mainDisplay.cy, x2: sizes.mainDisplay.cx + gap, y2: sizes.mainDisplay.cy});
      debug_group1.line({x1: sizes.mainDisplay.cx, y1: sizes.mainDisplay.cy - gap, x2: sizes.mainDisplay.cx, y2: sizes.mainDisplay.cy + gap});
    }

    if(!container) {
      return svgCanvas.svg();
    }

  } catch(e) {
    console.error( 'AdaCharts → ratingDisplay:', e ); // eslint-disable-line
  }
}
