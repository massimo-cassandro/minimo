/**
 * Raccolta di utilità condivise per la gestione dei grafici.
 */

/**
 * Tronca un numero a un numero specifico di decimali.
 * @param {number} number - Il numero da troncare.
 * @param {number} [decimals=4] - Il numero di decimali da mantenere.
 * @returns {number} Il numero troncato.
 */
export function truncateDecimal(number, decimals = 4) {
  return +parseFloat((number).toFixed(decimals));
}

/**
 * Converte un angolo da gradi in radianti.
 * @param {number} degrees_angle - L'angolo in gradi.
 * @returns {number} L'angolo in radianti.
 */
export const toRadians = degrees_angle => (degrees_angle * Math.PI) / 180.0;

/**
 * Trasforma le coordinate polari (centro + raggio) in coordinate cartesiane (x, y).
 * @param {number} degrees_angle - L'angolo in gradi.
 * @param {number} cx - Coordinata X del centro.
 * @param {number} cy - Coordinata Y del centro.
 * @param {number} circleRadius - Il raggio del cerchio.
 * @returns {{x: number, y: number}} Le coordinate cartesiane risultanti.
 */
export function polarToCartesian(degrees_angle, cx, cy, circleRadius) {
  const radians = toRadians(degrees_angle);

  return {
    x: truncateDecimal(Math.abs(cx + circleRadius * Math.cos(radians))),
    y: truncateDecimal(Math.abs(cy - circleRadius * Math.sin(radians)))
  };

}

// come il precedente, ma restituisce una stringa
export function polarToCartesianString(degrees_angle, cx, cy, circleRadius) {
  const {x,y} = polarToCartesian(degrees_angle, cx, cy, circleRadius);

  return `${x},${y}`;
}

/**
 * Concatena i nomi delle classi filtrando i valori falsy.
 * @param {...any} args - I nomi delle classi o condizioni.
 * @returns {string} Una stringa di nomi di classi separati da spazio.
 */
export function classnames(...args) {
  return args.filter(Boolean).join(' ');
}

/**
 * Concatena i nomi delle classi filtrando i valori falsy; restituisce null se il risultato è una stringa vuota.
 * @param {...any} args - I nomi delle classi o condizioni.
 * @returns {string|null} Una stringa di nomi di classi o null.
 */
export function classnamesNull(...args) {
  return args.filter(Boolean).join(' ') || null;
}

/**
 * Calcola le coordinate per un elemento `path` di tipo arco (arc).
 * Lo `start_angle` è il punto di inizio e `percentage` è la lunghezza percentuale dell'arco rispetto a `max_angle`.
 *
 * @param {Object} options - Opzioni di configurazione.
 * @param {number} [options.start_angle=0] - Angolo di partenza in gradi.
 * @param {number|null} options.percentage - Lunghezza dell'arco in percentuale (da 0 a 1).
 * @param {number} [options.max_arc=360] - L'estensione massima dell'arco in gradi.
 * @param {Object} options.center - Coordinate del centro.
 * @param {number|null} options.center.x - Coordinata X del centro.
 * @param {number|null} options.center.y - Coordinata Y del centro.
 * @param {number|null} options.radius - Raggio dell'arco.
 * @param {boolean} [options.clockwise=true] - Direzione oraria se true.
 * @returns {{arc_length: number, start: {x: number, y: number}, end: {x: number, y: number}}} Coordinate di inizio, fine e lunghezza.
 */
export function calcArcCoords(options) {
  const default_options = {
    start_angle: 0,
    percentage: null,
    max_arc: 360,
    center: { x: null, y: null },
    radius: null,
    clockwise: true
  };

  options = { ...default_options, ...options };

  try {
    if (options.percentage == null ||
      options.center?.x == null ||
      options.center?.y == null ||
      options.start_angle == null ||
      options.radius == null ||
      options.max_arc == null
    ) {
      throw 'Errore parametri in `calcArcCoords`';
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  // Angolo dell'arco corrispondente alla percentuale data
  let arc_length = options.max_arc * options.percentage,
    end_angle = options.start_angle + (options.clockwise ? -arc_length : arc_length);

  if (options.percentage === 1) {
    end_angle -= .001; // Per evitare errori di arrotondamento nel disegno dell'arco completo
  }

  return {
    arc_length: arc_length,
    start: polarToCartesian(options.start_angle, options.center, options.radius),
    end: polarToCartesian(end_angle, options.center, options.radius),
  };
}

/**
 * Calcola l'attributo `d` per un elemento SVG path che rappresenta un arco.
 * Accetta le stesse opzioni di `calcArcCoords`.
 * * @param {Object} options - Opzioni per il calcolo dell'arco.
 * @returns {string} La stringa da utilizzare nell'attributo `d` del path SVG.
 */
export function calcAttrD(options) {
  const points = calcArcCoords(options);

  return [
    `M${points.start.x},${points.start.y}`,
    `A${options.radius},${options.radius}`,
    0, // xAxisRotation
    (points.arc_length <= 180 ? 0 : 1), // largeArcFlag
    options.clockwise && points.arc_length < 360 ? 1 : 0, // sweepFlag
    `${points.end.x},${points.end.y}`
  ].join(' ');
}

/**
 * Recupera un elemento DOM da un selettore stringa o lo restituisce se è già un elemento.
 * @param {string|Element|null} container - Il selettore CSS o l'elemento DOM.
 * @returns {Element|null} L'elemento DOM o null.
 */
export function getElementFromContainer(container) {
  if (!container) {
    return null;
  } else if (typeof container === 'string') {
    return document.querySelector(container);
  } else if (container instanceof Element) {
    return container;
  } else {
    return null;
  }
}

/**
 * Analizza il contenitore e restituisce informazioni sulle sue dimensioni, eseguendo alcune azioni di base.
 * @param {Object} params - Parametri di input.
 * @param {string|Element|null} [params.container=null] - Il contenitore del grafico.
 * @param {number|null} [params.width=null] - Larghezza predefinita (opzionale).
 * @param {number|null} [params.height=null] - Altezza predefinita (opzionale).
 * @returns {[Element|null, number|null, number|null]} Un array contenente l'elemento, la larghezza e l'altezza.
 */
export function parseContainer({ container = null, width = null, height = null }) {
  const containerElement = getElementFromContainer(container);

  // Calcolo delle dimensioni del grafico
  width = width || (containerElement ? containerElement.clientWidth : null);
  height = height || (containerElement ? containerElement.clientHeight : null);

  return [containerElement, width, height];
}
