// aree e ed etichette mesi
import { getWeekOfDate } from '../../week-utils.js';

export async function gridAreas(cfg, adaChartIstance) {

  // =>> settimane di inizio e fine, numero settimane, coordinata x e larghezza dei mesi aull'asse X,
  //
  cfg.months_weeks = [];
  for(let i = 0; i < 12; i++) {

    // NB: i (mese) è base 0, start_week e end_week sono base 1

    let start_week = i === 0 ? (cfg.skipWeek0? 1 : 0) : getWeekOfDate({date: new Date(cfg.anno, i, 1)}),
      end_week = i=== 11? cfg.weeks : getWeekOfDate({date: new Date(cfg.anno, i+1, 0)});

    // se due mesi adiacenti hanno settimane di fine e inizio diverse
    // la settimana intermedia viene suddivisa a metà

    if(i > 0 && start_week > cfg.months_weeks[i-1].end_week) {
      cfg.months_weeks[i-1].end_week += .5;
      start_week -= .5;
    }

    cfg.months_weeks.push({
      // mese: i,
      start_week: start_week,
      end_week: end_week,
    });

  }

  // post elaborazione, aggiunta elementi calcolati
  // viene eseguita in modo differito per evitare disallineamenti nella correzione
  // dei mesi con inizio e fine a metà settimana
  cfg.months_weeks = cfg.months_weeks.map(mese => {

    const weeks_count = mese.end_week - mese.start_week;
    return {
      ...mese,
      weeks_count: weeks_count,

      // coordinata x iniziale della porzione mese dell'asse X
      x: cfg.chart_area.left + ((mese.start_week - 1) * cfg.stepX_size),
      width:weeks_count * cfg.stepX_size
    };
  });


  // if(cfg.debug) {
  //   const lineeControlloMesi = cfg.svgCanvas.group().attr({
  //       'data-cfg.debug-info': cfg.debug? 'Linee controllo' : null,
  //       stroke: '#c00',
  //       'stroke-width': 2
  //     }),
  //     y1 = cfg.chart_area.bottom - 30,
  //     y2 = cfg.chart_area.bottom + 50;

  //   cfg.months_weeks.forEach((mese, idx) => {

  //     lineeControlloMesi.line(
  //       mese.x,
  //       y1,
  //       mese.x,
  //       y2
  //     );

  //     if(idx === 11) {
  //       lineeControlloMesi.line(
  //         mese.x + mese.width ,
  //         y1,
  //         mese.x + mese.width ,
  //         y2
  //       );
  //     }
  //   });
  // }



  // =>> etichette mesi (in mancanza di `label2XAttrs` usano le stesse impostazioni delle altre etichette asse X, `labelXAttrs`)
  const etiMesiGroup = cfg.svgCanvas.group().attr({
    'data-cfg.debug-info': cfg.debug? 'Gruppo etichette mesi asse X' : null,
  });

  if(cfg.label2XAttrs == null || !Object.keys(cfg.label2XAttrs).length) {
    cfg.label2XAttrs = cfg.labelXAttrs;
  }
  if(!cfg.labelX2FontFilePath) {
    cfg.labelX2FontFilePath = cfg.labelXFontFilePath;
  }


  let meseIdx = 0;
  for await (const thisMonth of cfg.months_weeks) {

    const [label_bbox, labelEl] = await adaChartIstance.createTextEl ({
      text: cfg.mesi[meseIdx],
      textFill: cfg.label2XAttrs.fill?? '#000',
      fontAttr: cfg.label2XAttrs,
      fontFilePath: cfg.labelX2FontFilePath,
      parentElement: etiMesiGroup
    });

    labelEl.move(
      thisMonth.x + (thisMonth.width / 2) - (label_bbox.width / 2),
      cfg.xLabelsEndY + cfg.label2TopGap// il numero è un distanziatore extra tra le due righe di etichette
    );
    meseIdx++;
  }

  // =>> aree colorate mesi
  const areeMesiGroup = cfg.svgCanvas.group().attr({
    'data-cfg.debug-info': cfg.debug? 'Gruppo aree mesi' : null,
    ...cfg.monthsAreasAttrs
  })
    .back(); // mette dietro al resto


  cfg.months_weeks
    .filter((mese, idx) => idx % 2)
    .forEach(mese => {
      areeMesiGroup
        .rect(mese.width, cfg.chart_area.height)
        .move(mese.x, cfg.chart_area.top);
    });


  return cfg;
}
