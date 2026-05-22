/**
 * Genera un indicatore grafico di tipo rating/tachimetro.
 * Mostra un'asticella mobile su una scala suddivisa in porzioni colorate.
 * Supporta la visualizzazione di etichette principali e fino a due mini-display secondari.
 *
 * @param {Object} options - Oggetto contenente i parametri di configurazione.
 * @returns {Promise<string|undefined>} Restituisce la stringa SVG se container è null, altrimenti la renderizza nel DOM.
 */


import { parseContainer, polarToCartesianString, polarToCartesian } from '../chart-utils.js';
import { createTextEl } from '../create-text-element.js';
import { rad30, getDisplayBackgroundPath, calcolaPuntoInterno, normalizeAngle, isCircleDx } from './ratingDisplayUtils.js';

export async function ratingDisplay({

  /**
   * @param {boolean} [debug=false] - Modalità debug: se attiva mostra i riferimenti grafici (centri di rotazione, angoli) e i metadati data-debug-info.
   */
  debug = false,

  /**
   * @param {HTMLElement|string|null} [container=null] - Elemento DOM o selettore CSS dove iniettare il grafico. Se null, la funzione restituisce l'SVG come stringa.
   */
  container = null,

  /**
   * @param {number|null} [width=null] - Larghezza del documento SVG. Obbligatoria se eseguito in ambiente Node.
   */
  width = null,

  /**
   * @param {number|function} [centerGap=r=>r/8] - Distanza tra il centro della circonferenza esterna e ciascuna delle circonferenze interne (*dA* e *dB* nella documentzione).
   * Numero o funzione del raggio dato.
   */
  centerGap = r => r/9,

  /**
   * @param {number|function} [scaleEndThickness=r=>r/8] - Spessore finale della scala (indicato con *s* nella documentazione).
   * Numero o funzione del raggio dato.
   */
  scaleEndThickness = r => r/5,

  /**
   * @param {number} [portions=5] - Numero di porzioni (sezioni di colore) in cui è diviso il tachimetro.
   */
  portions = 5,

  /**
   * @param {number} [portionGap=10] - Distanza tra una porzione e la successiva.
   * Corrisponde all'angolo in gradi tra le due semirette passanti per il centro della circonferenza esterna e i segmenti laterali delle porzioni.
   * Indicato con *gamma* nella documentazione
   */
  portionGap = 2,

  /**
   * @param {Object} [svgAttrs={}] - Attributi aggiuntivi (es. class, id) da applicare al tag SVG radice.
   */
  svgAttrs = {},

  /**
   * @param {Object} [displayBackgroundAttrs] - Attributi grafici (fill, stroke) per l'arco di sfondo esterno.
   */
  displayBackgroundAttrs = {
    fill: 'none',
  },

  /**
   * @param {number} [displayPadding=10] - Spazio tra il bordo del background e gli elementi interni del display.
   */
  displayPadding = 10,

  /**
   * @param {number} [scaleStartValue=0] - Valore minimo della scala numerica da cui parte il calcolo della posizione.
   */
  scaleStartValue = 0,

  /**
   * @param {boolean} [rodPositionForceCenter=false] - Se true, l'asticella punta sempre al centro della fascia; se false, segue la proporzione del valore esatto.
   */
  rodPositionForceCenter = false,


  /**
   * @param {number|null} [value=null] - Valore numerico da rappresentare. Determina il colore e la posizione dell'asticella.
   */
  value = null,

  /**
   * @param {string[]|null} [scaleColors=null] - Array di colori per le porzioni della scala. Se null, usa i colori di default della chartInstance.
   */
  scaleColors = null,

  /** * @param {Object|null} [scaleAttrs=null] - Attributi SVG aggiuntivi applicati ai percorsi (path) delle porzioni della scala.
   */
  scaleAttrs = null,

  /**
   * @param {string|null} [scaleTicksColor=null] - Colore dei segni di separazione tra le porzioni. Se null, usa lo stesso colore della porzione adiacente.
   */
  scaleTicksColor = null,

  /**
   * @param {Object} [rodAttrs] - Attributi per l'asticella indicatrice e il suo anello centrale.
   */
  rodAttrs = {
    fill: '#000'
  },

  /**
   * @param {Object[]|null} [displayLabel=null] - Testo centrale sotto l'asticella. Array di max 2 oggetti: {label, font, fill, fontFilePath}.
   */
  displayLabel = null,

  /**
   * @param {number} [displayLabelTopMargin=4] - Distanza verticale tra l'anello dell'asticella e la prima riga dell'etichetta.
   */
  displayLabelTopMargin = 4,

  /**
   * @param {number} [displayLabelRowGap=2] - Spazio verticale tra la prima e la seconda riga dell'etichetta principale.
   */
  displayLabelRowGap = 2,

  /**
   * @param {Object[]|null} [miniDisplay=null] - Configurazione mini display secondari (max 2). Srray di uno o due oggetti
   * @param {string} miniDisplay[].position - Posizione: 'sx' | 'dx' (alias: 'left' | 'right').
   * @param {number} miniDisplay[].value - Valore numerico da rappresentare.
   * @param {string} miniDisplay[].type - Tipo di visualizzazione: 'gauge' (tachimetro) o 'value' (testo di `value`).
   * @param {Object} [miniDisplay[].typeValueFont] - oggetto analogo a quelli definito in displayLabel per la rappresentazione di `type: value`. Se typeValueFont.label non è presente, viene utilizzato `value` (arrotondato all'intero)
   * @param {Object[]} [miniDisplay[].mdLabel] - Array di etichette per il mini display (stessa struttura di displayLabel).
   * @param {Object} [miniDisplay[].mdArcAttrs] - oggetto simile a displayBackgroundAttrs, è relativo all'arco che avvolge il mini display
   * @param {Object} [miniDisplay[].mdRodAttrs] - Attributi per l'asticella del mini display.
   */
  miniDisplay = null,

  /**
    * @param {number} [miniDisplayTopMargin=0] - Distanza verticale tra la base del display principale e l'inizio dei mini display.
   */
  miniDisplayTopMargin = 0,

  /**
    * @param {number} [miniDisplayLabelTopMargin=0] - Distanza verticale tra la base dell'arco del mini display e le sue etichette.
   */
  miniDisplayLabelTopMargin = 0,

  /**
   * @param {number} [miniDisplayLabelRowGap=2] - Distanza tra le righe di testo (mdLabel) del mini display.
   */
  miniDisplayLabelRowGap = 2,

  /**
   * @param {boolean} [animation=false] - Se true, abilita l'animazione dell'asticella (richiede implementazione specifica).
   */
  animation = false,

  // animation_ms = 100, // number
  // animation_fps = 60, // number


}) {

  const chartInstance = this;

  // TODO la rotazione dell'asticella deve tenere conto degli step, non può basarsi unicamente sul calcolo dell'angolo
  // in modo particale se i valori degli step non sono uguali
  // TODO opzione per prozioni disuguali basate sul loro valore? (es. 3 porzioni con rapporto 1 1 2, in cui l'ultima corrisponde ad un valore delle altre)
  // TODO valutare l'utilizzo di un ovale ancihé un cerchio per la figura base
  try {

    scaleColors??= chartInstance.defaults.colors;

    // colore e indice della porzione corrispondenti al valore
    const getColorFromValue = value => {
      const portionIndex = Math.max(
        0,
        Math.min( portions - 1, Math.floor(value) - scaleStartValue)
      );
      return [portionIndex, scaleColors[portionIndex]];
    };


    // container element e rilevamento larghezza se necessario
    // l'altezza viene calcolata alla fine
    [container, width] = parseContainer({ container: container, width: width });

    // =>> display principale
    // raggio circonferenza esterna
    const mainRadius = (width/2) - parseFloat(displayBackgroundAttrs?.['stroke-width']??0) - displayPadding??0,

      /*
        altezza dell'area del display
        è pari al raggio + la distanza corrispondente ad uno spostamento di 30°
        (l'arco di cerchio dell'area display è di 240°),
        distanza che corrisponde al centro di rotazione dell'asticella.
        La base dell'area del display principale è quindi la corda posizionata agli estremi dell'arco.
        In questa fase corrisponde all'altezza dell'SVG.
        Viene ricalcolato dopo l'eventuale aggiunta dei miniDisplay
      */
      height = mainRadius + (mainRadius * Math.sin(rad30)) +
          // spessore traccia arco esterno, se presente (solo per la parte superiore)
          parseFloat(displayBackgroundAttrs?.['stroke-width']??0) +
          // padding
          displayPadding??0 * 2,
      /*
        centro circonferenza principale = centro di rotazione dell'asticella
      */
      mainDisplayCenter = {x: width/2, y: width/2}
    ;

    centerGap = typeof centerGap === 'number'? centerGap : centerGap(mainRadius);
    scaleEndThickness = typeof scaleEndThickness === 'number'? scaleEndThickness : scaleEndThickness(mainRadius);


    // =>> verifiche e impostazioni di base
    if(value == null || typeof value !== 'number') {
      throw '`value` è obbligatorio e deve essere un numero';
    }

    // valore massimo rappresentabile
    value = Math.min(value, portions);


    // il centro `C` deve rimanere all'interno della circonferenza `a` per permettere la tangenza nel punto `Tc`:
    // dC < rA
    if(centerGap >= mainRadius) {
      throw 'Il valore `centerGap` deve essere minore della lunghezza del raggio principale `mainRadius`';
    }


    // lo spessore finale `s` della scala non deve portare il raggio `rB` a valori negativi o incoerenti:
    // dB + s < rA
    if(centerGap + scaleEndThickness >= mainRadius) {
      throw 'La somma dei valori `centerGap` e `scaleEndThickness` deve essere inferiore alla lunghezza del raggio principale `mainRadius`';
    }


    /*
      la scala parte da 1 e arriva a `portions` (viene tolta una piccola
      porzione finale per maggiore precisione)
    */
    const parsedDisplayValue = rodPositionForceCenter? Math.floor(value) + .499 : value;


    // =>> animazione e posizione iniziale dell'asticella (rod)
    let rotazioneAsticella = 0;

    if(animation) {

      // TODO animazione

      // // NB la mutazione non è rilevata se la card è già visibile nel viewport
      // // per questo è presente l'if iniziale
      // if(inViewport) {
      //   display_animation();
      // }

    } else {
      rotazioneAsticella = Math.max(0, ((parsedDisplayValue  - scaleStartValue) * 240) / (portions - .001));
    }



    // =>> definizione SVG (viewbox e size vengono impostati alla fine, perché vengono definiti durante l'elaborazione)
    const svgCanvas = chartInstance.createSvgCanvas(container);
    svgCanvas
      .fill('none')
      .attr({...svgAttrs})
    ;


    // =>> gruppo Display Principale
    const mainDisplayGroup = svgCanvas.group()
      .attr({
        'data-debug-info': debug? 'Gruppo Display Principale' : null,
      });


    // elemento che funge da background esterno del display
    // NB: è aperto nella parte inferiore, quindi in basso l'eventuale bordo non viene applicato


    // =>> area background
    // solo se esistono proprietà in `displayBackgroundAttrs`

    if(Object.keys(displayBackgroundAttrs??{}).length) {

      if(displayBackgroundAttrs.stroke && !displayBackgroundAttrs['stroke-width']) {
        displayBackgroundAttrs['stroke-width'] = 1;
      }

      mainDisplayGroup.path(
        getDisplayBackgroundPath(width/2 - parseFloat(displayBackgroundAttrs?.['stroke-width']??0)/2, mainDisplayCenter.x, mainDisplayCenter.y)
      )
        .attr({
          'data-debug-info': debug? 'area display principale' : null,
          ...(displayBackgroundAttrs??{})
        });
    }


    // =>> scala
    const scaleGroup = mainDisplayGroup.group().attr({
        'data-debug-info': debug? 'scales' : null,
        stroke: 'none',
        ...(scaleAttrs?? {}),
      }),
      ticksGroup = mainDisplayGroup.group().attr({
        'data-debug-info': debug? 'ticks' : null,
        fill: 'none',
        'stroke-width': .5,
        'stroke-linecap': 'butt',
      }),
      angoloInizio = 210,
      ampiezzaTotale = 240,
      ampiezzaPorzione = ampiezzaTotale / portions,

      // parametri condivisi dalla funzione di calcolo dei punti interni
      // i
      configCalcoloPuntiInterni = {
        // raggi della circonferenze di sinistra e destra (nella documentazione *c*, in verde, e *b*, in rosso)
        rSx: mainRadius - centerGap, // rB
        rDx: mainRadius - centerGap - scaleEndThickness, // rC

        // centri delle circonferenze, non necesarie alla funzione calcolaPuntoInterno ma incluse in questo oggetto per altri utilizzi
        centroSx: polarToCartesian(210, mainDisplayCenter.x, mainDisplayCenter.y, centerGap), // C nella documentazione
        centroDx: polarToCartesian(30, mainDisplayCenter.x, mainDisplayCenter.y, centerGap), // B

        mainCenter: mainDisplayCenter,
        centerGap: centerGap,

        // scaleEndThickness: scaleEndThickness
      };

    // =>> porzioni e ticks
    for(let p = 0; p < portions; p++) {

      // if(p < portions - 1) continue;

      let startDeg = angoloInizio - (p * ampiezzaPorzione),
        endDeg = startDeg - ampiezzaPorzione;


      // aggiunta gap
      if(p > 0) {
        startDeg -= portionGap/2;
      }
      if (p === portions - 1) {
        endDeg = angoloInizio - ampiezzaTotale; // -30
      } else {
        endDeg += portionGap/2;
      }

      startDeg = normalizeAngle(startDeg);
      endDeg = normalizeAngle(endDeg);


      // seguendo la documentazione, i 4 punti da indiduare per ogni porzione sono
      // punti esterni esternoSX (D nella documentazione) e esternoDX (E)
      // punti interni: internoSX (G) e internoDX (F)
      // nella porzione iniziale esternoSX e internoSX coincidono

      // punti esterni: corrispondono alle coordinate polari per l'angolo dato e il raggio mainRadius
      const esternoSX = polarToCartesianString(startDeg, mainDisplayCenter.x, mainDisplayCenter.y, mainRadius),
        esternoDX = polarToCartesianString(endDeg, mainDisplayCenter.x, mainDisplayCenter.y, mainRadius);

      // punti interni
      // sono ricavati da una funzione che calcola la distanza rho dal centro della circ. esterna (rA),
      // basandosi su:
      // l'angolo della semiretta che contiene il punto
      // la distanza centerGap tra il centro della circonferenza principale e quella interna in uso (d nella documentazione)
      // e lo spessore finale della scala (scaleEndThickness = s nella documentazione)

      // tutti i parametri, escluso l'angolo, sono uguali per tutti i punti e sono definiti
      // nell'oggetto configPuntiInterni, definito in precedenza

      const internoSX = calcolaPuntoInterno({angoloDeg: startDeg, ...configCalcoloPuntiInterni}), // sx
        internoDX = calcolaPuntoInterno({angoloDeg: endDeg, ...configCalcoloPuntiInterni}); // dx

      // se la porzione include l'angolo di 30° è necessario cambiare circonferenza
      let cambioCirconferenza = '';
      if(!isCircleDx(startDeg) && isCircleDx(endDeg)) {


        // coordinate punto sulla circonferenza interna rossa con angolo di 30 gradi
        const punto30 = polarToCartesianString(
          30,
          configCalcoloPuntiInterni.centroDx.x,
          configCalcoloPuntiInterni.centroDx.y,
          configCalcoloPuntiInterni.rDx
        );
        cambioCirconferenza =
          `A${configCalcoloPuntiInterni.centroDx.x},${configCalcoloPuntiInterni.centroDx.y} 0 0 0 ${punto30}`;
      }

      const path = `M${esternoSX}` + // punto esterno sx
        // rx ry x-axis-angle large-arc-flag sweep-flag end-x end-y
        `A${mainDisplayCenter.x},${mainDisplayCenter.y} 0 0 1 ${esternoDX}` + // punto esterno dx
        `L${internoDX}` + // punto interno dx
        cambioCirconferenza +
        `A${mainDisplayCenter.x},${mainDisplayCenter.y} 0 0 0 ${internoSX}` + // punto interno sx
        'z'

      ;

      console.log(p, path);

      scaleGroup.path(path).attr({
        fill: scaleColors?.[p]?? '#000',
        ...{fill: 'none', stroke: 'blue', 'stroke-width': 3},
      });


      // ticksGroup.path(p)
      //   .attr({
      //     stroke: scaleTicksColor? scaleTicksColor : scaleColors?.[idx + 1]?? '#000',
      //   });

    }


    // =>> anello e asticella
    const rodGroup = mainDisplayGroup.group()
      .attr({
        'data-debug-info': debug? 'asticella' : null
      });

    // anello
    // https://www.smashingmagazine.com/2019/03/svg-circle-decomposition-paths/
    const ringPath = ({cx, cy, outerRadius, innerRadius}) => {

      return `M${cx - outerRadius},${cy}`+
      // rx ry x-axis-angle large-arc-flag sweep-flag end-x end-y
      `A${outerRadius},${outerRadius} 0 1 0 ${cx+outerRadius},${cy}` +
      `A${outerRadius},${outerRadius} 0 1 0 ${cx-outerRadius},${cy}` +

      `M${cx - innerRadius},${cy}` +
      `A${innerRadius},${innerRadius} 0 1 0 ${cx+innerRadius},${cy}` +
      `A${innerRadius},${innerRadius} 0 1 0 ${cx-innerRadius},${cy}`;
    };

    // parametri condivisi tra asticella e anello
    const ringOuterRadius = mainRadius / 9,
      ringInnerRadius = mainRadius / 14
    ;

    rodGroup.path(ringPath({
      cx: mainDisplayCenter.x,
      cy: mainDisplayCenter.y,
      outerRadius: ringOuterRadius,
      innerRadius: ringInnerRadius
    }))
      .attr({
        'fill-rule': 'evenodd',
        ...(rodAttrs?? {})
      });

    // bbox del solo anello di base dell'asticella
    // usato per il posizionamento delle etichette
    const rodGroupBaseBbox = rodGroup.bbox();

    // asticella
    // rodGroup.polygon('59.1813 139.0943 59.1813 139.0943 98.8572 108.491 105.5448 120.0899 59.1813 139.0943')
    const ampiezzaAsticella = 90 // degrees
      ,lunghezzaAsticella = mainRadius * .55 // TODO considerare spessore finale scala
      // distanza dal centro della circonferenza alla base dell'asticella, deve essere interno al'anello
      ,distanzaCentroBaseAsticella = ringInnerRadius + (ringOuterRadius - ringInnerRadius)/2
    ;

    rodGroup.path(
      `M${polarToCartesianString(
        210,
        mainDisplayCenter.x, mainDisplayCenter.y,
        lunghezzaAsticella
      )}`+
      `L${polarToCartesianString(
        210 - (ampiezzaAsticella/2),
        mainDisplayCenter.x, mainDisplayCenter.y,
        distanzaCentroBaseAsticella
      )}`+

      // rx ry angle large-arc-flag sweep-flag x y
      `A${distanzaCentroBaseAsticella},${distanzaCentroBaseAsticella} ${ampiezzaAsticella} 0 0 `+
        `${polarToCartesianString(
          210 + (ampiezzaAsticella/2),
          mainDisplayCenter.x, mainDisplayCenter.y,
          distanzaCentroBaseAsticella
        )}`+
      'Z'
    )
      .transform({
        origin: {
          x: mainDisplayCenter.x,
          y: mainDisplayCenter.y,
        },
        rotate: rotazioneAsticella
      })
      .attr({
        'data-debug-info': debug? `Value: ${parsedDisplayValue},  {Angolo: ${rotazioneAsticella}, Start value: ${scaleStartValue}` : null,
        ...(rodAttrs?? {})
      });

/*
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
      throw '`displayLabelTopMargin` deve essere null o un numero';
    }

    displayLabel??=[];
    if(displayLabel.length > 2) {
      throw 'Non è possibile definire più di 2 elementi `displayLabel`';
    }

    let prevLabelHeight = 0;
    for await (const labelObj of displayLabel) {

      prevLabelHeight = await setLabel({
        labelObj: labelObj,
        baseX: mainDisplayCenter.x,
        baseY: rodGroupBaseBbox.y2 + (displayLabelTopMargin??0),
        dy: prevLabelHeight,
        rowGap: displayLabelRowGap,
        parentEl: mainDisplayGroup
      });
    }

    // =>> ricalcolo altezza gruppo principale
    const mainDisplayGroupBbox = mainDisplayGroup.bbox();
    height= mainDisplayGroupBbox.y + mainDisplayGroupBbox.y2;

    // SECTION miniDisplay
    if(miniDisplayTopMargin != null && typeof miniDisplayTopMargin !== 'number') {
      throw '`miniDisplayTopMargin` deve essere null o un numero';
    }

    miniDisplay??=[];
    if(miniDisplay.length > 2) {
      throw 'Non è possibile impostare più di 2 `miniDisplay`';
    }


    let miniDisplayIdx = 1, miniDisplayMaxHeight = 0, mdArcAttrsHeight = null;
    for await (const md of miniDisplay) {


      const errorPrefix = `miniDisplay #${miniDisplayIdx}`;

      // =>> controlli
      ['position', 'type', 'value'].forEach(item => {
        if(md[item] == null) {
          throw `${errorPrefix}: '${item}' è obbligatorio`;
        }
      });

      if(['sx', 'dx', 'left', 'right'].indexOf(md.position) === -1) {
        throw `${errorPrefix}: 'position' deve essere uno tra 'sx', 'dx', 'left' o 'right'`;
      }

      if(typeof md.value !== 'number') {
        throw `${errorPrefix}: 'value' deve essere un numero`;
      }

      if(['gauge', 'value'].indexOf(md.type) === -1) {
        throw `${errorPrefix}: 'type' deve essere uno tra 'gauge' o 'value'`;
      }

      // default
      md.mdArcAttrs = {
        // defaults
        ...{
          fill: 'none',
          'stroke-linecap': 'round',
          'stroke-width': 0
        },
        ...(md.mdArcAttrs??{})
      };


      // =>> dimensioni
      const
        // raggio circonferenza che include l'arco
        mdRadius = 26,

        mdWidrh = (mdRadius * 2) + (md.mdArcAttrs?.['stroke-width']??0), // impegna sia la parte destra che la sinistra

        // margine orizzontale dal bordo esterno dell'SVG
        xMargin = 20,

        // coordinate dell'origine del miniDisplay
        mdOrigin = {
          y: height+ (miniDisplayTopMargin?? 0),
          x: (md.position === 'sx' || md.position === 'left')
            ? xMargin
            : width - xMargin - mdWidrh
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
        mdArcAttrsCx= mdOrigin.x + mdRadius, // + md.mdArcAttrs.['stroke-width'] / 2,
        mdArcAttrsCy= mdOrigin.y + mdRadius // + md.mdArcAttrs.['stroke-width'] / 2,
      ;

      // minidisplay arc
      mdGroup.path(getDisplayBackgroundPath(mdRadius, mdArcAttrsCx, mdArcAttrsCy))
        .attr({
          'data-debug-info': debug? `miniDisplay #${miniDisplayIdx}: arco` : null,
          ...md.mdArcAttrs,
        });

      // altezza arco, per il posizionamento delle etichette
      // viene misurato solo il primo arco, in modo che le etichette siano comq allineate
      // se necessario, utilizzare il parametro miniDisplayLabelTopMargin per distanziare il testo dalla base dell'arco
      if(mdArcAttrsHeight == null) {
        mdArcAttrsHeight = mdGroup.bbox().height;
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
          mdArcAttrsCx - value_bbox.w/2,
          mdArcAttrsCy - value_bbox.h/2 - 2, // 2: spostamento basline verso l'alto
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

          ,startPointX = mdArcAttrsCx - (segmentRadius * Math.cos(rad30))
          ,startPointY = mdArcAttrsCy + (segmentRadius * Math.sin(rad30))
          ,endPointX = mdArcAttrsCx - (segmentRadius * Math.cos(segmentAngle))
          ,endPointY = mdArcAttrsCy - (segmentRadius * Math.sin(segmentAngle))

          ,segmentPath = `M ${startPointX},${startPointY} ` +
            // rx ry x-axis-angle large-arc-flag sweep-flag end-x end-y
            `A ${segmentRadius} ${segmentRadius} 0 0 1 ${endPointX} ${endPointY}`

          ,segmentGroup = mdGroup.group()
        ;

        // =>> segmento mini display gauge
        segmentGroup.path(segmentPath)
          .attr({
            stroke: getColorFromValue(md.value)[1],
            'stroke-width': segmentStrokeWidth,
          });

        // =>> anello mini asticella
        const ringOuterRadius = 12;
        mdGroup.path( ringPath({
          cx: mdArcAttrsCx,
          cy: mdArcAttrsCy,
          outerRadius: ringOuterRadius,
          innerRadius: 6
        }))
          .attr({
            ...(rodAttrs?? {}),
            'fill-rule': 'evenodd'
          });

        // =>> mini asticella
        // viene prima creata allineata con l'asse X del mini display e poi ruotata al centro della porzione d'inizio
        // in seguito, la rotazione applicata al gruppo la porta nella posizione definitiva
        segmentGroup.polygon(
          `${mdArcAttrsCx - ringOuterRadius/2 + 2},${mdArcAttrsCy - 3} `+
          `${mdArcAttrsCx - segmentRadius + 6},${mdArcAttrsCy} `+
          `${mdArcAttrsCx - ringOuterRadius/2 + 2},${mdArcAttrsCy + 3}`
        )
          .attr(rodAttrs?? {})
          .transform({
            origin: {
              x: mdArcAttrsCx,
              y: mdArcAttrsCy,
            },
            rotate: ((240/portions) / 2)  - 30
          })
        ;

        segmentGroup.transform({
          origin: {
            x: mdArcAttrsCx,
            y: mdArcAttrsCy,
          },
          rotate: (240/portions) * getColorIndexForValueXXXXX(md.value) - scaleStartValue
        });
      }

      // =>> label mini display

      if(miniDisplayLabelTopMargin != null && typeof miniDisplayLabelTopMargin !== 'number') {
        throw `${errorPrefix}: 'miniDisplayLabelTopMargin' deve essere null o un numero`;
      }

      md.mdLabel??=[];
      if(md.mdLabel.length > 2) {
        throw `${errorPrefix}: non è possibile definire più di 2 elementi 'mdLabel'`;
      }


      let prevLabelHeight = 0;
      for await (const labelObj of md.mdLabel) {

        prevLabelHeight = await setLabel({
          labelObj: labelObj,
          baseX: mdArcAttrsCx,
          baseY: mdOrigin.y + mdArcAttrsHeight + (miniDisplayLabelTopMargin??0),
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
        debug_group.line({x1: mdArcAttrsCx - gap, y1: mdArcAttrsCy, x2: mdArcAttrsCx + gap, y2: mdArcAttrsCy});
        debug_group.line({x1: mdArcAttrsCx, y1: mdArcAttrsCy - gap, x2: mdArcAttrsCx, y2: mdArcAttrsCy + gap});

        // origine mini display
        // debug_group.line({x1: mdOrigin.x - gap, y1: mdOrigin.y, x2: mdOrigin.x + gap, y2: mdOrigin.y});
        // debug_group.line({x1: mdOrigin.x, y1: mdOrigin.y - gap, x2: mdOrigin.x, y2: mdOrigin.y + gap});
      }

      // =>> ricalcolo miniDisplayMaxHeight
      miniDisplayMaxHeight = Math.max(
        miniDisplayMaxHeight,
        mdGroup.bbox().h + (miniDisplayTopMargin?? 0) + md.mdArcAttrs['stroke-width'] // strokeWidth: spessore traccia nel caso non ci sia testo
      );
      miniDisplayIdx++;

    }

    // !SECTION end miniDisplay


    // =>> aggiornamento dimensioni SVG
    height+= miniDisplayMaxHeight;
    // width = mainDisplayGroupBbox.w;
*/

    svgCanvas
      // .size(width, height)
      .viewbox(0, 0, width, height);


    // indicatori per debug
    if(debug) {
      import('./debug-tools.js').then(m => m.run({
        mainDisplayCenter: mainDisplayCenter,
        width: width,
        height: height,
        mainRadius: mainRadius,
        // centerGap: centerGap,
        // scaleEndThickness: scaleEndThickness

        ...configCalcoloPuntiInterni
      }).addTo(svgCanvas));

    }

    if(!container) {
      return svgCanvas.svg();
    }

  } catch(e) {
    console.error( 'MinimoCharts → ratingDisplay:', e ); // eslint-disable-line
  }
}
