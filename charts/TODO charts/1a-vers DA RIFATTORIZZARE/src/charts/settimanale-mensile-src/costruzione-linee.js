export function costruzioneLinee(cfg) {

  // area range positivo negativo
  const rangeScenari = cfg.svgCanvas.group().attr({
    'data-cfg.debug-info': cfg.debug? 'Range positivo-negativo' : null
  });
  if(cfg.mostraRangeScenari) {
    rangeScenari
      .path(
        'M ' +
        cfg.coords.budget_positivo.map(item => `${item.join(',')}`).join(' L') +
        cfg.coords.budget_negativo.toReversed().map(item => `L${item.join(',')}`).join(' ') +
        ' Z'
      )
      .attr({
        ...cfg.rangeScenariAttrs

      });
  }
  // linee (opzionali) bordi negativo e positivo
  if(Object.keys(cfg.lineeRangeScenari).length) {
    rangeScenari
      .polyline(cfg.coords.budget_positivo)
      .attr(cfg.lineeRangeScenari);

    rangeScenari
      .polyline(cfg.coords.budget_negativo)
      .attr(cfg.lineeRangeScenari);

  }

  // spostamento in primo piano della griglia, sopra il range
  cfg.gridGroup.front();

  cfg.lineeGroup = cfg.svgCanvas.group()
    .attr({
      'data-cfg.debug-info': cfg.debug? 'Linee' : null
    });


  // linee
  [
    {
      data         : cfg.coords.budget_standard,
      attrs        : cfg.budget_standard_line_attrs,
      points_attrs : cfg.budget_standard_points_attrs,
      debug_info   : 'Budget standard'
    },
    {
      data         : cfg.coords.consolidato_prec,
      attrs        : cfg.consolidato_prec_line_attrs,
      points_attrs : cfg.consolidato_prec_point_attrs,
      debug_info   : 'consolidato anno prec.'
    },
    {
      data         : cfg.coords.consolidato,
      attrs        : cfg.consolidato_line_attrs,
      points_attrs : cfg.consolidato_points_attrs,
      debug_info   : 'consolidato'
    },

    ...(
      cfg.showConsolidatoForecast
        ?  [{
          data         : cfg.coords.consolidato_forecast,
          attrs        : cfg.consolidato_forecast_line_attrs,
          points_attrs : cfg.consolidato_forecast_point_attrs,
          debug_info   : 'consolidato forecast'
        }]
        : []
    )
  ].forEach(line => {


    cfg.lineeGroup
      .polyline(line.data)
      .attr({...line.attrs, fill: 'none'});

    if(Object.keys(line.points_attrs??{}).length) {


      const thisPointsGroup = cfg.lineeGroup.group()
        .attr({
          'data-cfg.debug-info': cfg.debug? `Punti ${line.debug_info}` : null,
          ...{...line.points_attrs, r: null, cx: null, cy: null},
        });

      line.data.forEach(point => {
        thisPointsGroup.circle({
          r: line.points_attrs.r,
          cx: point[0],
          cy: point[1]
        });
      });
    }
  });



  return cfg;
}
