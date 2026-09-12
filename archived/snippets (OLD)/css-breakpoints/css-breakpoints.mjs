// questo file è utilizzato sia per la generazione del file `_css-breakpoints.scss`
// che per l'utilizzo negli script js
// i valori corrispondono a quelli di BS5

export const gridBreakpoints = {
  xs  : 0,
  sm  : 576,
  md  : 768,
  lg  : 992,
  xl  : 1200,
  xxl : 1400
};

// breakpoint nel quale si passa da mobile a desktop
const brkp = {
  desktopBreakpoint: 'md'
};

brkp.desktopBreakpointPx = gridBreakpoints[brkp.desktopBreakpoint];
brkp.desktopBreakpointsPxBefore = brkp.desktopBreakpointPx - 1;
brkp.desktopBreakpointRem = (brkp.desktopBreakpointPx/16).toFixed(4) + 'rem';
brkp.desktopBreakpointBeforeRem = (brkp.desktopBreakpointsPxBefore/16).toFixed(4) + 'rem';

export { brkp };
