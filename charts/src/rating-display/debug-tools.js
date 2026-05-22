import { G } from '@svgdotjs/svg.js';
import { polarToCartesian, polarToCartesianString } from '../../chart-utils.js';

export function run({
  mainDisplayCenter,
  width,
  height,
  mainRadius,
  // centerGap,
  // scaleEndThickness,
  centroSx,
  rSx,
  centroDx,
  rDx
}) {

  const debug_group = new G();
  // centro display e rotazione asticella
  debug_group.attr({
    'data-debug-info': 'centro rotazione asticella',
    stroke: '#585151',
    fill: 'none',
    'stroke-width': .5,
    class: 'debug-info'
  });

  // assi orizzontali e verticali
  debug_group.line({
    x1: 0,
    y1: mainDisplayCenter.y,
    x2: width,
    y2: mainDisplayCenter.y}
  )
    .attr({'data-debug-info': 'Asse orizzontale'});
  debug_group.line({
    x1: mainDisplayCenter.x,
    y1: 0,
    x2: mainDisplayCenter.x,
    y2: height}
  )
    .attr({'data-debug-info': 'Asse verticale'});


  debug_group.path(
    `M${polarToCartesianString(210, mainDisplayCenter.x, mainDisplayCenter.y, mainRadius)}`+
    `L${mainDisplayCenter.x},${mainDisplayCenter.y}` +
    `L${polarToCartesianString(330, mainDisplayCenter.x, mainDisplayCenter.y, mainRadius)}`
  ).attr({'data-debug-info': 'Raggi 210° e 330°'});

  debug_group.path(
    `M${mainDisplayCenter.x},${mainDisplayCenter.y}` +
    `L${polarToCartesianString(30, mainDisplayCenter.x, mainDisplayCenter.y, mainRadius)}`
  ).attr({'data-debug-info': 'raggio 30°'});


  // centri circonferenze
  const braccioCrocino = 20;
  const radiusAttrs = {
    'stroke-width': 2,
    'stroke-dasharray': '8 3'
  };

  debug_group.path(
    `M${centroSx.x - braccioCrocino},${centroSx.y}`+
    `L${centroSx.x + braccioCrocino},${centroSx.y}` +
    `M${centroSx.x},${centroSx.y - braccioCrocino}`+
    `L${centroSx.x},${centroSx.y + braccioCrocino}`
  ).attr({'data-debug-info': 'Centro C', stroke: '#2C7D06'});

  // circonferenza verde e raggio
  debug_group
    .circle(rSx * 2)
    .move(centroSx.x - rSx, centroSx.y - rSx)
    .attr({
      'data-debug-info': 'Circ. c',
      stroke: '#3C8A00',
      'stroke-width': 2,
    });

  debug_group
    .path(
      `M${centroSx.x},${centroSx.y}`+
      `L${polarToCartesianString(120, centroSx.x, centroSx.y, rSx)}`
    )
    .attr({
      'data-debug-info': 'Raggio circ. c',
      stroke: '#3C8A00',
      ...radiusAttrs
    });



  // circonferenza rossa e raggio
  debug_group.path(
    `M${centroDx.x - braccioCrocino},${centroDx.y}`+
    `L${centroDx.x + braccioCrocino},${centroDx.y}` +
    `M${centroDx.x},${centroDx.y - braccioCrocino}`+
    `L${centroDx.x},${centroDx.y + braccioCrocino}`
  ).attr({'data-debug-info': 'Centro B', stroke: '#c00'});


  debug_group
    .circle(rDx * 2)
    .move(centroDx.x - rDx, centroDx.y - rDx)
    .attr({
      'data-debug-info': 'Circ. b',
      stroke: '#c00',
      'stroke-width': 2,
    });

  debug_group
    .path(
      `M${centroDx.x},${centroDx.y}`+
      `L${polarToCartesianString(60, centroDx.x, centroDx.y, rDx)}`
    )
    .attr({
      'data-debug-info': 'Raggio circ. b',
      stroke: '#c00',
      ...radiusAttrs
    });


  return debug_group;
}
