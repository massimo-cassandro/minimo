import { toRadians, polarToCartesianString } from '../helpers/chart-utils.js';

/**
 * 30 gradi in radianti: ampiezza dell'angolo della parte eccedente il raggio
 * della circonferenza che include l'arco di cerchio.
 * @type {number}
 */
export const rad30 = toRadians(30);

/**
 * Calcola il path dell'elemento di background del display (un arco di 240° aperto nella parte inferiore),
 * usato anche per i miniDisplay.
 * @param {number} radius - Raggio dell'arco
 * @param {number} cx - Coordinata x del centro
 * @param {number} cy - Coordinata y del centro
 * @returns {string} Il valore dell'attributo `d` del path
 */
export function getDisplayBackgroundPath(radius, cx, cy) {
  const startPointX = cx - (radius * Math.cos(rad30)),
    startPointY = cy + (radius * Math.sin(rad30)),

    endPointX = cx + (radius * Math.cos(rad30)),
    endPointY = startPointY;

  return `M${startPointX},${startPointY}` +
    // rx ry x-axis-angle large-arc-flag sweep-flag end-x end-y
    `A${radius} ${radius} 0 1 1 ${endPointX} ${endPointY}`;
};




/**
 * Restituisce la proiezione di un punto della circonferenza esterna sulla circonferenza interna
 * di centro e raggio dati (vecchia versione, non più utilizzata).
 * @param {Object} centro - Coordinate del centro della circonferenza interna
 * @param {number} centro.x - Coordinata x del centro
 * @param {number} centro.y - Coordinata y del centro
 * @param {number} r - Raggio della circonferenza interna
 * @param {number} alphaDeg - Angolo alpha in gradi
 * @returns {{x: number, y: number}} Coordinate {x, y}
 */
function calcolaProiezionePuntoOLD(centro, r, alphaDeg) {

  // Conversione da gradi a radianti
  const alphaRad = toRadians(alphaDeg);

  return {
    x: centro.x + r * Math.cos(alphaRad),
    y: centro.y + r * Math.sin(alphaRad)
  };
}


/**
 * Riconduce un angolo all'intervallo 0–360 (360 escluso).
 * @param {number} angle - Angolo in gradi, anche negativo o maggiore di 360
 * @returns {number} L'angolo normalizzato
 */
export function normalizeAngle(angle) {
  angle = angle % 360;
  if (angle < 0) angle += 360;

  return angle;
}

/**
 * Indica se l'angolo dato ricade nella parte di scala che fa riferimento alla circonferenza interna destra
 * (*b* nella documentazione), ovvero se non è compreso tra 30° (escluso) e 210° (incluso).
 * @param {number} nomalizedAngle - Angolo in gradi, normalizzato con `normalizeAngle`
 * @returns {boolean} true per la circonferenza destra, false per la sinistra
 */
export function isCircleDx(nomalizedAngle) {
  return (nomalizedAngle > 30 && nomalizedAngle <= 210)? false : true;
}

/**
 * Calcola il punto della circonferenza interna per l'angolo dato.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * calcolaPuntoInterno({
 *   angoloDeg: 120, // angolo normalizzato (gradi), OBBL
 *   centroSx: { x: 90, y: 105 }, // centro circonferenza sinistra, OBBL
 *   rSx: 80, // raggio circonferenza sinistra, OBBL
 *   centroDx: { x: 110, y: 95 }, // centro circonferenza destra, OBBL
 *   rDx: 60, // raggio circonferenza destra, OBBL
 *   mainCenter: { x: 100, y: 100 }, // centro circonferenza principale, FAC
 *   centerGap: 11, // distanza tra i centri, OBBL
 * });
 *
 * @param {Object} params - Parametri del calcolo
 * @param {number} params.angoloDeg - Angolo in gradi (normalizzato)
 * @param {{x: number, y: number}} params.centroSx - Coordinate del centro della circonferenza sinistra (C)
 * @param {number} params.rSx - Raggio della circonferenza sinistra (c)
 * @param {{x: number, y: number}} params.centroDx - Coordinate del centro della circonferenza destra (B)
 * @param {number} params.rDx - Raggio della circonferenza destra (b)
 * @param {{x: number, y: number}} [params.mainCenter] - Coordinate dell'origine A, centro della circonferenza principale (al momento non utilizzato nel calcolo)
 * @param {number} params.centerGap - Distanza d tra `mainCenter` e i centri delle circonferenze interne
 * @returns {string} Coordinate "x,y" del punto
 */
export function calcolaPuntoInterno({ angoloDeg, centroSx, rSx, centroDx, rDx, mainCenter, centerGap }) {

  // nella documentazione:
  // mainRadius corrisponde a rA
  // mainCenter corrisponde al punto A (centro della circonferenza a)
  // centerGap corrisponde a d
  // scaleEndThickness corrisponde a s

  let phi, r, center;

  if(isCircleDx(angoloDeg)) {
    center = centroDx;
    r = rDx; // raggio rB
    phi = 330;

  } else {
    center = centroSx;
    r = rSx; // raggio rC
    phi = 210;
  }

  // Differenza angoli e conversione in radianti
  const delta = toRadians(angoloDeg) - toRadians(phi);

  // rho1 = ipotenusa del triangolo rettangolo in centroDx o centroSx
  // rho2 = ipotenusa per coseno angolo adiacente al cateto rho2
  // vedi documentazione
  const rho =
    Math.sqrt(Math.pow(r, 2) - Math.pow(centerGap * Math.sin(delta), 2)) + // rho1
    centerGap * Math.cos(delta); // rho2


  return polarToCartesianString(angoloDeg, center.x, center.y, rho);

}
