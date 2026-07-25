export const default_opts = {
  /** mostra info utile per il debug */
  debug: false,

  /** container (selettore o elemento DOM), se null viene restituito il codice SVG */
  container: null,

  /**
    larghezza e altezza del grafico (px),
    Se il container è presente e i parametro `width` o `height` sono `null`,
    quelli mancanti vengono ricavati dallaìe dimensioni del container
  */
  width: null,
  height: null,

  /** TODO resizeObserver
    Se true, il grafico viene ricalcolato al variare delle dimensioni del container (richiesto)
    il parametro `width` anche se impostato, viene ignorato
  */
  resizeObserver: false,

  /** attributi facoltativi per l'svg */
  svgAttrs: {},

  /** griglia orizzontale e verticale */
  horizGrid: true,
  horizGridAttrs: {},

  vertGrid: true,
  vertGridAttrs: {},

  /** settimanale o mensile */
  modo: 'settimanale',

  /**  spazio extra attorno al bordo */
  padding: 10,

  /**  suddivisioni asse Y */
  stepY_count: 4,

  /**  px, altezza o larghezza ticks (secondo l'orientamento) */
  ticksLength: 5,

  /**  parametri legenda (vedi componente ada-charts/src/components/legenda.js) */
  legenda: {},

  /**
    larghezza area etichette asse y
  */
  eti_asseY_width: 60,

  /**  altezza area etichette asse x */
  eti_asseX_height: 30,

  /** titoli assi */
  asseYTitle: null,
  asseYTitleAttrs: null,
  asseYTitleFontFilePath: null,

  asseXTitle: null,
  asseXTitleAttrs: null,
  asseXTitleFontFilePath: null,

  /**
    solo settimanale.
    la settimana zero corrisponde ai dati al 31/12 dell'anno precedente a quello in esame
    se true la settimana zero non viene rappresentata nel grafico
    e l'origine x del grafico corrisponde alla settimana 1
    (il motivo è che la settimana 0 ha generalmente un valore molto più elevato
    degli altri e rende il grafico illeggibile)
  */
  skipWeek0: true,

  /** evidenzia la griglia verticale corrispondente alla settimana / mese correnti */
  showCurrent: true,
  currentWeekAttrs: {},
  currentMonthAttrs: {},

  /**
    Aree di evidenziazione dei mesi (settimanale)
  */
  monthsAreasAttrs: {},

  /**  se true mostra un area di relativa ai valori min/max degli scenari */
  mostraRangeScenari: true,
  rangeScenariAttrs: {},

  /**
    se `lineeRangeScenari` non è un oggetto vuoto, vengono mostrate
    le linee positive/negativo secondo gli attributi svg.js indicati.
    Questa opzione è indipendente da `mostraRangeScenari`
  */
  lineeRangeScenari: {},

  /**  anno esaminato */
  anno: new Date().getFullYear(),

  /**  parametri infoBox (vedi componente) */
  infoBoxItems: null,
  infoBoxPositionRefs: null,

  /**
    array dati

    Ogni elemento deve avere questa struttura
    {
      w: <num>,   // numero settimana (se settimanale)
      m: <num>,   // numero mese (se mensile)

      s: <num>,   // valore scenario standard
      p: <num>,   // valore scenario positivo
      n: <num>,   // valore scenario negativo
      c: <num>,   // valore consolidato anno corrente (può essere null)
      cp: <num>,   // valore consolidato anno precedente
      cf: <num>    // valore consolidato forecast (può non essere presente o null)
    }
  */
  chartData: [],

  /**
    classi e attributi dei vari elementi.
    Per gli attributi, ogni variabile è un oggetto di attributi svg.js, es:

    {
      stroke: '#414141',
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',

      // oppure
      class: 'xxxx'
    }

  */
  axisAttrs: {},

  ticksAttrs: {},

  labelXAttrs: {}, // contiene gli attributi fonts (come in AdaCharts.defaults.font) e l'attributo `fill`
  labelXFontFilePath: null,  // percorso font per textToPath
  labelXShowEvensOnly: false,

  // attributi per la seconda riga di etichette X, in sua assenza il default è dati dagli attributi della prima riga
  label2XAttrs: null,
  labelX2FontFilePath: null,  // percorso font per textToPath
  label2TopGap: 2, // spazio aggiuntivo tra la prima e lasecondas riga di etichette

  labelYAttrs: {}, // contiene gli attributi fonts (come in AdaCharts.defaults.font) e l'attributo `fill`
  labelYFontFilePath: null,  // percorso font per textToPath

  /**
    attributi delle varie linee
    se l'oggetto `line***PointsAttrs`, dove presente, non è vuoto,
    viene aggiunto un cerchio ad ogni punto della linea
    (NB: non aggiungere `cx` o cy`)
  */
  budget_standard_line_attrs: {},
  budget_standard_points_attrs: {},

  budget_positivo_line_attrs: {},
  budget_negativo_line_attrs: {},

  consolidato_line_attrs: {},
  consolidato_points_attrs: {},

  consolidato_prec_line_attrs: {},
  consolidato_prec_point_attrs: {},

  // TODO verificare
  showConsolidatoForecast: false, // porzione di consolidato nomn ancora maturato (si usa il budget)
  consolidato_forecast_line_attrs: {},
  consolidato_forecast_point_attrs: {},


  /**
    Funzione per formattare le etichette dei valori dell'asse Y.
    Null per nessuna eleborazione.
    La funzione di default assume che il valore sia di tipo numerico
  */
  labelYFormatter: labelValue =>  Math.ceil(labelValue / 1e3)
    .toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) +
    (labelValue > 0? '\u2009K' : ''), // \u2009 = thin space (https://www.compart.com/en/unicode/U+2009)
};
