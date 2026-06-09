/**
 *
 * Grafico andamento economico annuale
 * produce un grafico a linee con l'andamento annuale di un determinato parametro
 * con dettagli settimanali o mensili
 */

// vedi test per la definizione delle opzioni

// TODO metodo migliore per condivisione variabili
// TODO parte interattiva

import { parseStdAxisOpts } from '../components/parse-std-axis-opts.js';

import { costruzioneAssi } from './settimanale-mensile-src/costruzione-assi.js';
import { default_opts } from './settimanale-mensile-src/defaults.js';
import { parseOpts } from './settimanale-mensile-src/parse-opts.js';
import { pathsSetup } from './settimanale-mensile-src/paths-setup.js';
import { gridAreas } from './settimanale-mensile-src/grid-areas.js';
import { displayCurrent } from './settimanale-mensile-src/display-current.js';
import { costruzioneLinee } from './settimanale-mensile-src/costruzione-linee.js';


export async function settimanaleMensile(options) {

  // =>> parse container
  [options.container, options.width, options.height] = this.utils.parseContainer(options.container, options.width, options.height);

  let cfg = {...default_opts, ...options};

  cfg.debug = this.debug? this.debug : (cfg.debug?? false);


  // =>> prima elaborazione e controlli delle impostazioni
  cfg = parseOpts(cfg); // elaborazione specifica per questo grafico


  if(!cfg.container && (!cfg.width || !cfg.height)) {
    throw '`container` non impostato e almeno uno tra `width` e `height` mancante';
  }
  // valore massimo da rappresentare
  // se `skipWeek0 === true`, i dati della settimana zero non vanno inclusi nel calcolo

  cfg.max_value = cfg.chartData
    .filter(weekData => cfg.skipWeek0 === true? weekData.w > 0 : true)
    .reduce((prev, curr) => {
      return Math.max(prev, ...Object.values(curr));
    }, 0);

  const parsed_cfg = parseStdAxisOpts({ // elaborazione standard condivisa con grafici analoghi
    max_value: cfg.max_value,
    values: cfg.chartData.map(item => Object.values(item)).flat(),
    legenda: cfg.legenda,
    padding: cfg.padding,
    width: cfg.width,
    height: cfg.height,
    eti_asseX_height: cfg.eti_asseX_height,
    eti_asseY_width: cfg.eti_asseY_width,
    stepY_count: cfg.stepY_count,
    stepX_count: cfg.stepX_count,
    ticksLength: cfg.ticksLength,
  });
  cfg = {...cfg, ...parsed_cfg};


  // =>> svg
  cfg.svgCanvas = this.createSvgCanvas(cfg.container, cfg.debug)
    .size(cfg.width, cfg.height)
    .viewbox(0, 0, cfg.width, cfg.height)
    .attr(cfg.svgAttrs??{});


  // =>> elaborazione dati grafico, costruzione coordinate paths e punti
  cfg = pathsSetup(cfg);


  // =>> costruzione assi e griglia
  cfg = await costruzioneAssi({
    cfg: cfg,
    adaChartIstance: this,
    xLabels: cfg.isSettimanale? [...Array(cfg.weeks + 1).keys()].slice(cfg.skipWeek0? 1 : 0) : cfg.mesi,
  });

  // =>> aree colorate per l'evidenziazione dei mesi e seconda riga di etichette
  // solo settimanale
  if(cfg.isSettimanale) {
    cfg = await gridAreas(cfg, this);
  }

  // =>> costruzione linee
  cfg = costruzioneLinee(cfg);

  // =>> evidenziazione settimana / mese corrente
  cfg = displayCurrent(cfg);
  cfg.lineeGroup.front();

  // =>> Legenda
  const legendaEl = await this.legenda(cfg.legenda);
  legendaEl.attr({ 'data-cfg.debug-info': cfg.debug? 'Legenda' : null });
  const legendaBbox = legendaEl.bbox();

  legendaEl.dmove(
    (cfg.width - legendaBbox.width) / 2,
    cfg.padding
  );
  legendaEl.y(cfg.padding);

  legendaEl.x((cfg.width - legendaBbox.width) / 2);

  cfg.svgCanvas.add(legendaEl);

  if(!cfg.container) {
    return cfg.svgCanvas.svg();
  }

  if(cfg.debug) {

    /* eslint-disable no-console */
    console.log('\n****** grafico andamento annuale ******');
    console.log(cfg);
    console.log('************');
    /* eslint-enable no-console */
  }

}

