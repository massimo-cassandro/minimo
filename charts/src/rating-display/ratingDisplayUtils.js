import { toRadians, polarToCartesianString } from '../../chart-utils.js';

// 30 gradi in radianti
// ampiezza dell'angolo della parte eccedente il raggio della circonferenza che include l'arco di cerchio
export const rad30 = toRadians(30);

// getDisplayBackgroundPath: calcola il path dell'elemento di background, usato anche per i miniDisplay
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
 * restituisce la proiezione di un punto sulla circonferenza esterna sulla circonferenza interna
// di centro e raggio dati
 * @param {object} centro - Coordinate del centro della circonferenza interna
 * @param {number} centro.x - Coordinata x del centro
 * @param {number} centro.y - Coordinata y del centro
 * @param {number} r - Raggio della circonferenza interna
 * @param {number} alphaDeg - Angolo alpha in gradi
 * @returns @returns {{x: number, y: number}} - Coordinate {x, y}
 */
function calcolaProiezionePuntoOLD(centro, r, alphaDeg) {

  // Conversione da gradi a radianti
  const alphaRad = toRadians(alphaDeg);

  return {
    x: centro.x + r * Math.cos(alphaRad),
    y: centro.y + r * Math.sin(alphaRad)
  };
}


export function normalizeAngle(angle) {
  angle = angle % 360;
  if (angle < 0) angle += 360;

  return angle;
}

export function isCircleDx(nomalizedAngle) {
  return (nomalizedAngle > 30 && nomalizedAngle <= 210)? false : true;
}

/**
 * Calcola il punto della circonferenza interna per l'angolo dato

 * @param {number} angoloDeg - angolo (normalizzato)
//  * @param {object} centroSx - Coordinate {x, y} del centro sinistro
//  * @param {object} centroDx - Coordinate {x, y} del centro destro
 * @param {number} rSx - Raggio della circonferenza sinistra (c)
 * @param {number} rDx - Raggio della circonferenza destra (b)
 * @param {object} mainCenter - Coordinate {x, y} dell'origine A
 * @param {number} centerGap - Distanza d tra mainCenter e i centri delle circonferenze interne
 * @returns {string} - Coordinate "x,y" del punto C
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
