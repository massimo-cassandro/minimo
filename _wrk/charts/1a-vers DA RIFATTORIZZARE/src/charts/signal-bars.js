/**
 * signal bars (grafico a tacche)
 *
 * Mostra una serie di barre analoghe a quelle del segnale dei cellulari
 * in cui le barre vengono mostrate attive se il valore di riferimento è maggiore o uguale
 * a uno degli indici del range dato e inferiore al successivo.
 * Di conseguenza, se il valore di riferimento è più basso del valore minimo del range
 */


export async function signalBars({


  /** container (selettore o elemento DOM), se null viene restituito il codice SVG */
  container = null,

  /**
    larghezza e altezza del grafico (px),
    Se il container è presente e i parametro `width` e `height` sono `null`,
    vengono utilizzate le dimensioni  del container.
    Se uno dei due valori non è impostato o ricavabile, viene generato un errore.
    NB: il padding del container viene considerato nelle dimensioni del grafico,
    è preferibile non impostarlo.
    Il valore 'auto' di height fa sì che l'altezza dell'svg sia calcolata sulla base
    del numero di barre e dei valori `barsGap` e `barsHeight`
  */
  width = null, // null || <value>
  height = 300, // <value> || null

  /**
    range di valori che corrispondono alle varie tacche,
    un valore inferiore al primo non "accende" nessuna tacca,
    tra il primo (incluso), e il secondo (escluso), una tacca e così via.
    Il numero di elementi determina il numero delle tacche
  */
  ranges = [1,2,3,4],

  /**
    se fornito, le barre 'accese' non vengono calcolate, ma si uutilizza questo valore
    corrisponde al numero di barre attivate da sinistra verso destra.
    Se presente, `value` può essere omesso ed è comunque ignorato
  */
  activeBars = null,

  /** Valore da rappresentare */
  value = null,

  /**
    etichetta da mostrare a destra o sotto le tacche. Se nulla mostra il valore di `value`,
    stringa vuota o false per non avere etichetta
  */
  label = null,


  /** posizione dell'etichetta */
  labelPosition = 'right', // right o bottom

  /**
    Impostazioni font e colori per le etichette
    Impostare solo se non si vogliono usare i colori di default
    se impostato, è un oggetto analogo a quello definito in src/utils/init.js
  */
  labelFont = null,
  labelFill = '#000',

  /** path del file font per la conversione in tracciati */
  labelFontFilePath = null,

  /** spazio tra l'etichetta e il grafico */
  textBarsGap = 8,

  /** spazio tra una barra e la successiva */
  barsGap = 10,

  /** corner radius */
  barsCornerRadius = 3,

  /**
    come il precedente, ma relatuvo alla larghezza della barra,
    ad esempio un valore di `.5' crea della barre dalle estremità tonde
    Se presente, il valore di `barsCornerRadius` viene ignorato
  */
  barsRelativeCornerRadius = null,

  /**
    attributi barre attive e disattive
    ad esclusione di `stroke-width` da gestire separatamente con barsStrokeWidth per esigenze di calcolo
    vedi https://svgjs.dev/docs/3.2/manipulating/#attributes
  */
  barsStrokeWidth = 3,
  barsOnAttr = {
    fill: '#000'
    // ,'fill-opacity': 0.5
    ,stroke: '#000'
    ,'stroke-width': 3
  },
  barsOffAttr = {
    fill: '#000'
    // ,'fill-opacity': 0.5
    ,stroke: '#fff'
    ,'stroke-width': 3
  },

  /** seimpostato, il valore massimo della larghezz delle barre */
  maxBarWidth = null,

  /** eventuali classi da aggiungere al grafico */
  svgClassName = null,
  labelClassName = null,
  barOnClassName = null,
  barOffClassName = null,


} = {}) {

  try {


    if(ranges.filter(v => isNaN(v)).length) {
      throw 'There are non-numeric values';
    }

    if(ranges.length < 2) {
      throw '`ranges`: sono necessari alemno due valori';
    }

    if(typeof barsStrokeWidth !== 'number') {
      throw '`barsStrokeWidth` deve essere un numero';
    }

    if((value == null || typeof value !== 'number') && (activeBars == null || typeof activeBars !== 'number')) {
      throw 'Almeno uno tra `value` e `activeBars` deve essere presente e deve essere un numero ' +
        `(value: ${value}, activeBars: ${activeBars})`;
    }

    if(!['right', 'bottom'].includes(labelPosition)) {
      throw '`labelPosition` deve essere`right` o `bottom`';
    }

    // container
    [, width, height] = this.utils.parseContainer(container, width, height);


    if(barsGap == null) {
      throw '`barsGap` deve essere impostato';
    }


    if(!width || !height) {
      throw `width e/o height mancanti: width: ${width}, height: ${height}`;
    }

    const svgCanvas = this.createSvgCanvas(container).size(width, height);
    svgCanvas.viewbox(0, 0, width, height);

    if(svgClassName) {
      svgCanvas.addClass(svgClassName);
    }

    let labelX, labelY, barsAreaWidth, barWidth, barsAreaHeight, labelEl, label_bbox;
    const barsCount = ranges.length;

    if(label !== '' && label !== false) {

      if(label == null) {
        label = value.toLocaleString('it-IT', { maximumFractionDigits: 2 });
      }

      // =>> calcolo dimensioni del testo per ricavare lo spazio utile per le barre
      // in base al posizionamento dell'etichetta

      // =>> label
      [label_bbox, labelEl] = await this.createTextEl ({
        text: label,
        textFill: labelFill,
        fontAttr: labelFont,
        fontFilePath: labelFontFilePath,
        parentElement: svgCanvas
      });


      if(labelPosition === 'right') {
        labelX = width - label_bbox.width;
        labelY = (height - label_bbox.height) / 2;
        barsAreaWidth = width - label_bbox.width - textBarsGap;
        barsAreaHeight = height;

      } else {
        labelX = (width - label_bbox.width) / 2;
        labelY = height - label_bbox.height;
        barsAreaWidth = width;
        barsAreaHeight = height - label_bbox.height - textBarsGap;
      }

      // posizionamento etichetta
      labelEl.move(labelX, labelY);

      if(labelClassName) {
        labelEl.addClass(labelClassName);
      }


    } else {
      barsAreaWidth = width;
      barsAreaHeight = height;
    }

    barWidth = (
      barsAreaWidth -
      (barsGap * (barsCount - 1)) -
      ((barsStrokeWidth?? 0) * barsCount) // lo spessore della traccia è divisa tra interno ed esterno
    ) / barsCount;
    barWidth = Math.min(maxBarWidth?? Infinity, barWidth);

    const barsMaxHeight = barsAreaHeight - (barsStrokeWidth?? 0),
      barsModuleHeight = barsMaxHeight / barsCount;


    // coordinate x e y e altezza della prima barra
    let barX = (
        barsAreaWidth -
        (barWidth * barsCount) -
        (barsGap * (barsCount - 1)) -
        ((barsStrokeWidth?? 0) * barsCount)
      ) / 2 + ((barsStrokeWidth?? 0)/2),
      barHeight = barsModuleHeight,
      barY = barsAreaHeight - barHeight - ((barsStrokeWidth?? 0) / 2);


    // indice dell'ultima barra da rappresentare con riempimento attivo
    ranges.sort((a,b) => a - b);
    let lastActiveBarIndex;

    if(activeBars) {
      lastActiveBarIndex = activeBars - 1;

    } else {
      const closestRangeValue = ranges.reduce((prev, curr) => {
        return (Math.abs(Math.ceil(curr - value)) < Math.abs(Math.ceil(prev - value)) ? curr : prev);
      });
      lastActiveBarIndex = ranges.indexOf(closestRangeValue);
    }

    const bar_group = svgCanvas.group();

    ranges.forEach((val, idx) => {

      const barIsOn = idx <= lastActiveBarIndex;

      const bar = bar_group.rect({
        x: barX,
        y: barY,
        width: barWidth,
        height: barHeight,
        ...(barIsOn? barsOnAttr : barsOffAttr),
      });

      if(barsRelativeCornerRadius != null || barsCornerRadius != null) {

        barsCornerRadius= barsRelativeCornerRadius != null? barWidth/2 : barsCornerRadius;

        bar.radius(barsCornerRadius);
      }

      if( barsStrokeWidth > 0 ) {
        bar.stroke({ width: barsStrokeWidth });
      }

      if(barOnClassName && barIsOn) {
        bar.addClass(barOnClassName);
      }
      if(barOffClassName && !barIsOn) {
        bar.addClass(barOffClassName);
      }

      barHeight += barsModuleHeight;
      barX += barWidth + barsStrokeWidth + barsGap;
      barY -= barsModuleHeight;
    });

    if(!container) {
      return svgCanvas.svg();
    }


  } catch(e) {
    console.error( 'AdaCharts → signalBars', e ); // eslint-disable-line
  }

}
