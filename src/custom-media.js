/*
Definizioni delle custom media del progetto: unica fonte dei breakpoint,
usata sia per generare custom-media.css (vedi custom-media-builder.mjs,
`npm run "build custom media"`) sia direttamente in JS.

NB: dopo ogni modifica rigenerare custom-media.css (la generazione è
comunque eseguita all'avvio delle build webpack DEV e PROD).

I valori sono duplicati nei `media` scritti a mano dei template Twig
(home.html.twig e home_incl/hero.incl.html.twig): vanno aggiornati a mano.

90rem    : 1440px xxlarge (large desktop)
80rem    : 1280px xlarge (desktop)
64rem    : 1024px large (small desktop)
47.5rem  : 760px  medium (tablet)
25rem    : 400px  small (phone)

tablet alt:
53.75rem : 860px  medium (tablet)
*/

/* TODO valutare rinomina dei breakpoint in nomi semantici (es. dsk/lap/tab/mob,
   vedi scripts/build-margin-padding-css.mjs) per coerenza con la scala `sizes`,
   che usa la stessa nomenclatura xs/sm/md/lg/xl e genera ambiguità nelle
   utility responsive. Non banale: i tier attuali (xxlarge/xlarge/large/medium/
   small, con varianti -only/-down) sono numerosi e in parte sovrapposti (es.
   "large" = "small desktop") e non si riducono in modo pulito a poche
   categorie semantiche; inoltre il nome è usato in molti file (grid.css,
   display.css, visibility.css, text.css, sf-macro.css, json-table, oltre ai
   file margin-padding-*-media.css) ed è parte di un template pensato per
   essere personalizzato dall'utente: rinominarlo qui non aggiorna le copie
   già in uso nei progetti che lo hanno importato. */

export const breakpoints = {
  xxlarge: '90rem',
  xlarge: '80rem',
  large: '64rem',
  medium: '47.5rem',
  small: '25rem',
};

const bp = breakpoints;

/**
 * Custom media del progetto: chiave = nome della custom media (senza `--`),
 * valore = media query.
 *
 * @example
 * import customMedia from './custom-media.js';
 * const mql = matchMedia(customMedia['media-medium-viewport-up']); // '(width >= 47.5rem)'
 */
const customMedia = {
  'media-xxlarge-viewport-up': `(width >= ${bp.xxlarge})`,
  'media-xlarge-viewport-up': `(width >= ${bp.xlarge})`,
  'media-large-viewport-up': `(width >= ${bp.large})`,
  'media-medium-viewport-up': `(width >= ${bp.medium})`,
  'media-small-viewport-up': `(width >= ${bp.small})`,

  'media-xxlarge-viewport-only': `(width >= ${bp.xxlarge})`,
  'media-xlarge-viewport-only': `(${bp.xlarge} <= width < ${bp.xxlarge})`,
  'media-large-viewport-only': `(${bp.large} <= width < ${bp.xlarge})`,
  'media-medium-viewport-only': `(${bp.medium} <= width < ${bp.large})`,
  'media-small-viewport-only': `(width < ${bp.medium})`,

  'media-xxlarge-viewport-down': `(width < ${bp.xxlarge})`,
  'media-xlarge-viewport-down': `(width < ${bp.xlarge})`,
  'media-large-viewport-down': `(width < ${bp.large})`,
  'media-medium-viewport-down': `(width < ${bp.medium})`,
  'media-small-viewport-down': `(width < ${bp.small})`,
};

export default customMedia;
