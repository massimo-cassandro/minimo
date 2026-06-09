
export function pie({

  /** container (selettore o elementio DOM), se null viene restituito il codice SVG */
  container = null,

  /** raggio del cerchio */
  radius = 60,

  /** raggio cerchio interno, da impostare nel caso si voglia creare un grafico a ciambella */
  innerRadius = null,

  /** valori da associare alle "fette" del grafico */
  values = [],

  /**
    array dei colori delle fette da associare ai corrispondenti valori in base al loro indice.
    Impostare solo se non si vogliono usare i colori di default
  */
  colors = null,

  /** se false le classi vengono ignorate */
  useClasses = false,

  /** array di eventuali classi da associare ai corrispondenti valori in base al loro indice */
  valClasses = null,

  /** valore angolo (in gradi) da cui avviare il disegno */
  startAt = 90,

  /** verso del grafico */
  clockwise = true,

  /** se true, attiva l'animazione */ // NB non attivo
  // animazione      = false, // non implementato

  /** frame per secondo dell'animazione */ // NB non attivo
  // fps = 60
} = {}) {

  // TODO animazione
  const animazione = false;

  try {

    // colori forniti o di default
    colors??= this.defaults.colors;

    this.utils.parseContainer(container);

    const svgCanvas = this.createSvgCanvas(container);


    const isDonut = innerRadius != null
      ,donutWidth = radius - innerRadius
      ,baseColor = '#ccc' // colore neutro per gli elementi di sfondo
      ,circleCenter = { x: radius, y: radius }

      // restituisce l'attributo `d` dell'arco di cerchio descritto dall'angolo
      // corrispondente alla percentuale data e alle percentuali del punto finale
      ,generateAttrD = (params) => {

        let d = [
          `M${params.start.x},${params.start.y}`,
          `A${radius},${radius}`,
          0, //xAxisRotation,
          (params.arcAngle <= 180 ? 0 : 1), // largeArcFlag
          clockwise && params.arcAngle < 360? 1 : 0, // sweepFlag
          `${params.end.x},${params.end.y}`,
          ...(isDonut? [] : [
            `L${circleCenter.x},${circleCenter.y}`,
            'Z'
          ])
        ].join(' ');

        return d;
      }

      // CALCOLO PARAMETRI
      ,calcolaParametri = (perc, angolo_inizio) => {

        let parametri = {};

        // angolo corrispondente alla percentuale indicata
        parametri.arcAngle = 360/100 * perc;

        parametri.angolo_fine = clockwise? angolo_inizio - parametri.arcAngle :
          angolo_inizio + parametri.arcAngle;

        // questo non dovrebbe servire mai,
        // ma potrebbe verificarsi per somma di arrotondamenti
        angolo_inizio = angolo_inizio >= 360? Math.abs(360 - angolo_inizio) : angolo_inizio;
        parametri.angolo_fine = parametri.angolo_fine >= 360? Math.abs(360 - parametri.angolo_fine) : parametri.angolo_fine;

        if(perc === 100) {
          angolo_inizio = 0;
          parametri.angolo_fine = 359.9999;

        } else if(perc === 0) {
          parametri.angolo_fine = angolo_inizio;
        }

        // coordinate inizio e fine
        parametri.start = this.utils.polarToCartesian(angolo_inizio, circleCenter, radius);
        parametri.end = this.utils.polarToCartesian(parametri.angolo_fine, circleCenter, radius);

        parametri.perc = perc; // serve per eliminare eventuali valori nulli
        parametri.angolo_inizio = angolo_inizio; // per debug

        // console.log(parametri);

        return parametri;
      }
    ;



    // determinazione sezioni della torta
    let angolo_inizio = startAt; // angolo di partenza del grafico (viene aggiornato per ogni arco)
    const totale = values.reduce((a,b) => a + b, 0),
      pieSlices = values.map( (val, idx) => {
        let params= calcolaParametri(val / totale * 100, angolo_inizio);
        angolo_inizio = params.angolo_fine;


        // associazione colore e classe
        params.color = colors? colors[idx] : null;
        params.className = (valClasses != null && useClasses)? valClasses[idx]?? null : null;

        return params;
      }).filter(item => item.perc > 0);


    if(isDonut) {
      svgCanvas.viewbox(-donutWidth/2, -donutWidth/2, radius * 2 + donutWidth, radius * 2 + donutWidth);
    } else {
      svgCanvas.viewbox(0, 0, radius * 2, radius * 2);
    }

    svgCanvas.circle({
      ...(isDonut
        ? {'stroke-width': donutWidth, stroke: baseColor,  fill: 'none'}
        : {fill: baseColor}
      ),
      cx: radius,
      cy: radius,
      r: radius
    });

    const sectionsGroup = svgCanvas.group(useClasses? {class: 'mChart-pie-sections-wrapper'}: {});

    if(!animazione) {

      pieSlices.forEach(params => {
        sectionsGroup.path(generateAttrD(params))
          .attr({
            ...(useClasses? {class: this.utils.classnames('mChart-pie-section', params.className)} : {}),
            ...(isDonut
              ? {'stroke-width': donutWidth, stroke: params.color, fill: 'none'}
              : {fill: params.color}
            )
          });
      });
    }

    if(!container) {
      return svgCanvas.svg();
    }
  } catch(e) {
    console.error( 'AdaCharts → pie', e ); // eslint-disable-line
  }
}



// TODO animazione
// if(animazione) {

//   let idx = 0;

//   const animazione_arco = () => {

//     let animationRequest,
//       parametri_arco=pieSlices[idx],
//       arco, d, arco_path,
//       this_perc = 0,
//       start_timestamp = Date.now(),
//       fine_animazione = false,
//       elapsed, now,
//       fps = fps,
//       fpsInterval = 1000/fps;


//     const step = () => {
//       now = Date.now();
//       elapsed = now - start_timestamp;

//       if((this_perc >= parametri_arco.perc) ) {
//         this_perc = parametri_arco.perc;
//         fine_animazione = true;
//       }

//       // request another frame
//       animationRequest = window.requestAnimationFrame(step);

//       // if enough time has elapsed, draw the next frame
//       if (elapsed > fpsInterval) {

//         // Get ready for next frame by setting start_timestamp=now, but...
//         // Also, adjust for fpsInterval not being multiple of 16.67
//         start_timestamp = now - (elapsed % fpsInterval);

//         if( this_perc === 0 ) {
//           arco = generateArcPathTag(
//             calcolaParametri(0, parametri_arco.angolo_inizio),
//             colors[idx]
//           );
//           chart_container.insertAdjacentHTML('afterbegin', arco.chart_segment );
//           arco_path = chart_container.querySelector(`.chart-arc.item-${idx}`);

//         } else {
//           arco = calcolaParametri(this_perc, parametri_arco.angolo_inizio);
//           d = generateAttrD(arco);
//           arco_path.setAttribute('d', d);
//         }

//         if(fine_animazione) {
//           window.cancelAnimationFrame(animationRequest);
//           idx++;
//           if(idx < pieSlices.length) {
//             animazione_arco();
//           }
//         } else {
//           this_perc++;
//         }
//       }

//     };// end step

//     step();
//   }; // end animazione_arco

//   animazione_arco();

// } // end if animazione
