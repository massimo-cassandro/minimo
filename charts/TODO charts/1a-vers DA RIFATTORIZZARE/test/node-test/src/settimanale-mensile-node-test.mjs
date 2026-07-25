import { datiSettimanali } from '../../browser-test/src/settimanale-mensile-dati-settimanale.js';

export async function settimanaleMensileNodeTest(cfg) {

  const default_line_attrs = {
    stroke: '#3b3a3a',
    'stroke-width': 1,
    'shape-rendering': 'crispEdges',
    'stroke-linecap': 'round',
    fill: 'none'
  };

  const opts = {

    /** mostra info utile per il debug */
    debug: true,

    /**
      larghezza e altezza del grafico (px),
      Se il container è presente e i parametro `width` o `height` sono `null`,
      quelli mancanti vengono ricavati dallaìe dimensioni del container
    */
    width: 1300,
    height: 500,

    /** attributi facoltativi per l'svg */
    svgAttrs: {},

    /** griglia orizzontale e verticale */
    horizGrid: true,
    horizGridAttrs: {...default_line_attrs, stroke: '#b5b3b3'},

    vertGrid: true,
    vertGridAttrs: {...default_line_attrs, stroke: '#b5b3b3', 'stroke-dasharray': '0 4 0'},



    /**  suddivisioni asse Y */
    stepY_count: 4,

    /**  px, altezza o larghezza ticks (secondo l'orientamento) */
    ticksLength: 10,


    /**  larghezza area  etichette asse y */
    eti_asseY_width: 70,

    /**  altezza area etichette asse x */
    eti_asseX_height: 30,

    /**  altezza aggiuntiva area asse x per visualizzazione dei mesi (solo settimanale) */
    eti_asseX_additional_height: 30,

    /**  spazio extra attorno al bordo */
    padding: 10,


    /** titoli assi */
    asseYTitle: 'Travel Value',
    asseYTitleAttrs: {
      fill: '#999999',
      'font-size': 18,
      'font-weight': 600
    },
    asseYTitleFontFilePath: cfg.fontFile.medium,

    asseXTitle: 'Settimana',
    asseXTitleAttrs: {
      fill: '#999999',
      'font-size': 18,
      'font-weight': 600
    },
    asseXTitleFontFilePath: cfg.fontFile.medium,

    /**
      solo settimanale.
      la settimana zero corrisponde ai dati al 31/12 dell'anno precedente a quello in esame
      se true la settimana zero non viene rappresentata nel grafico
      e l'origine x del grafico corrisponde alla settimana 1
    */
    skipWeek0: true,

    /** evidenzia la griglia verticale corrispondente alla settimana / mese correnti */
    showCurrent: false,
    currentWeekAttrs: {},
    currentMonthAttrs: {},

    /**
      Aree di evidenziazione dei mesi (settimanale)
    */
    monthsAreasAttrs: {
      fill: '#e1e5e8'
    },

    /**  se true mostra un area di relativa ai valori min/max degli scenari */
    mostraRangeScenari: true,
    rangeScenariAttrs: {
      fill: '#e1d2e3'
    },

    /**
      se `lineeRangeScenari` non è un oggetto vuoto, vengono mostrate
      le linee positive/negativo secondo gli attributi svg.js indicati.
      Questa opzione è indipendente da `mostraRangeScenari`
    */
    lineeRangeScenari: {
      ...default_line_attrs,
      stroke: '#7d3c8567'
    },

    /**  anno esaminato */
    anno: new Date().getFullYear(),

    /**  parametri infoBox (vedi componente) */
    // infoBoxItems,
    // infoBoxPositionRefs,


    chartData: datiSettimanali,

    /**
    classi e attributi dei vari elementi.
    Per gli attributi, ogni variabile è un oggetto di attributi svg.js
    {
      stroke: '#414141',
      'stroke-width': 1,
      'shape-rendering': 'crispEdges'
    }
  */
    axisAttrs: default_line_attrs,
    ticksAttrs: default_line_attrs,

    gridLinesAttrs: {},

    labelXAttrs: {
      size: 14,
      weight: 400,
      fill: '#676565',
    },
    labelXFontFilePath: cfg.fontFile.regular,  // percorso font per textToPath

    labelYAttrs: {
      size: 14,
      weight: 400,
      fill: '#4c4949',
    },
    labelYFontFilePath: cfg.fontFile.regular,  // percorso font per textToPath

    budget_standard_line_attrs: {
      ...default_line_attrs,
      stroke: '#9a0b9a'
    },
    budget_positivo_line_attrs: {
      ...default_line_attrs,
      'stroke-width': 1
    },
    budget_negativo_line_attrs: {
      ...default_line_attrs,
      'stroke-width': 1
    },
    consolidato_line_attrs: {
      ...default_line_attrs,
      'stroke-width': 3,
      stroke: '#06407a'
    },
    consolidato_points_attrs: {
      r: 3,
      fill: '#06407a'
    },
    consolidato_prec_line_attrs: {
      ...default_line_attrs,
      'stroke-width': 3,
      stroke: '#6985ac',
      'stroke-dasharray': '.1 6'
    },

    showConsolidatoForecast: false,
    consolidato_forecast_line_attrs: {
      ...default_line_attrs,

    },

    /**
      Funzione per formattare le etichette dei valori dell'asse Y.
      Null per nessuna eleborazione.
      La funzione di default assume che il valore sia di tipo numerico
    */
    labelYFormatter: labelValue =>  (labelValue / 1e3)
      .toLocaleString('it-IT', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: 'always'
      }) +
      (labelValue > 0? '\u200AK' : ''), // \u2009 = thin space, \u200A hair space (https://www.compart.com/en/unicode/U+2009)

  };


  // voci legenda
  opts.legenda = {
    /** altezza legenda */
    height: 20,

    /** spazio tra gli elementi della legenda */
    elements_gap: 25,

    /** dimensioni delle forme della legenda */
    lines_width: 20,
    circles_radius: 16,

    /** attributi svg.js dei font del testo della legenda (null utilizza default) */
    fontAttrs: {
      fill: '#000',
      'font-size': 14,
      'font-weight': 400
    },
    fontFilePath: cfg.fontFile.regular,

    /** elementi della legenda */
    items: [
      {
        shape: 'line', // line || circle
        attrs: opts.consolidato_line_attrs, // attributi js di shape
        text: `Consolidato ${opts.anno}`, // testo della voce
      },
      {
        shape: 'line',
        attrs: opts.consolidato_prec_line_attrs, //
        text: `Consolidato ${opts.anno - 1}`,
      },
      {
        shape: 'line',
        attrs: opts.budget_standard_line_attrs,
        text: 'Budget',
      },
      {
        shape: 'circle',
        attrs: {...opts.lineeRangeScenari, ...opts.rangeScenariAttrs},
        text: 'Range positivo-negativo',
      },
    ],

  };

  let svg = await cfg.charts.settimanaleMensile({
    ...opts,
    modo: 'settimanale',

  });

  await cfg.writeFile(svg, 'settimanale-mensile.svg');



}



