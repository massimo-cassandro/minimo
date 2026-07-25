// evidenziazione settiman / mese correnti (solo per anno in corso)

export function displayCurrent(cfg) {

  if(cfg.showCurrent && cfg.anno === new Date().getFullYear()) {

    if(cfg.isSettimanale) {

      const x = cfg.chart_area.left + (cfg.currentWeek - 1) * cfg.stepX_size;
      cfg.svgCanvas
        .line(
          x, cfg.chart_area.top,
          x, cfg.chart_area.bottom
        )
        .attr({
          'data-cfg.debug-info': cfg.debug? 'Settimana corrente' : null,
          ...cfg.currentWeekAttrs
        });

    } else {

      // TODO showCurrent per mese
    }
  }

  return cfg;
}
