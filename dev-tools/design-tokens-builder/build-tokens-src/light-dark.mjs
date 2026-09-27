// build-tokens-src/light-dark.mjs
// Supports the `useLightDarkFunc` config option (see config.mjs): with a
// sourceModes build (see build-source-modes.mjs) that defines both a `light`
// and a `dark` mode, custom properties present in BOTH — matched by name —
// are written once, as `--name: light-dark(<light-value>, <dark-value>);`,
// instead of being split across the base mode's top-level `:root { ... }`
// block and a `@media (prefers-color-scheme: dark) { ... }` block.
//
// Only `light` and `dark` are affected:
//   - a third mode (e.g. a custom `high-contrast` key in sourceModes) is left
//     completely untouched, still nested under its own
//     `@media (prefers-color-scheme: <mode>) { ... }` rule
//   - a property present in only one of `light`/`dark` is left in its own
//     mode's block — still behind that mode's `@media` rule, unless that mode
//     happens to be the configured base mode
//
// The shared `light-dark()` declarations always land in the configured base
// mode's block (build-source-modes.mjs' `sourceModesBase`, whichever of
// `light`, `dark`, or a third mode that is) — never specifically in `light`'s
// or `dark`'s own block — since the light-dark() function resolves against
// the effective `color-scheme`, regardless of whether the declaration itself
// sits inside a `@media (prefers-color-scheme: ...)` rule or not.
//
// Interaction with `mergeCustomProps`: nothing special is needed here — the
// per-mode merge with pre-existing custom properties (see ../merge-css.mjs)
// already runs earlier, inside computeFinalProps() (formats/css.mjs), before
// this module ever sees the props. So a pre-existing file written with the
// classic `@media (prefers-color-scheme: dark)` split (i.e. built before
// useLightDarkFunc was turned on) is reconciled into light-dark() calls just
// like freshly generated values, matched by property name. As the values
// merged in this way were never meant to be combined into light-dark() calls,
// unexpected pre-existing content (e.g. a manually-added property whose name
// happens to collide across modes) can produce an invalid combined value —
// left for the user to fix, same as any other mergeCustomProps edge case.

import { buildCssBlock } from './formats/css.mjs';

// Splits a declaration tail (as produced by computeFinalProps(): value +
// terminating `;` + optional trailing comment) into its bare CSS value and
// its trailing comment, so the value can be embedded as a light-dark()
// argument without dragging the `;`/comment along.
/** @param {string} tail @returns {{value: string, comment: string}} */
const splitTail = (tail) => {
  const match = /^(.*?);\s*(\/\*.*\*\/)?\s*$/.exec(tail.trim());
  if (!match) return { value: tail.trim().replace(/;$/, ''), comment: '' };
  return { value: match[1].trim(), comment: match[2] ?? '' };
};

/**
 * @param {object} opts
 * @param {Record<string, Record<string,string>>} opts.modeFinalProps  mode → (name → declaration tail) map, one entry per sourceModes key — as captured from computeFinalProps()/lastFinalProps (see formats/css.mjs) right after each per-mode sd.formatPlatform('css') call in build-source-modes.mjs
 * @param {string[]} opts.modeNames  all sourceModes keys, in config order
 * @param {string}   opts.baseMode   mode whose block is printed as a top-level, unconditioned `:root` (or custom selector) — see sourceModesBase in config.mjs
 * @param {string}   [opts.selector] customPropsSelector — passed through unchanged to buildCssBlock() (default: ':root')
 * @param {{name:string,prefixes:string[]}[]} [opts.customPropsGroups]
 * @returns {{blocks: Record<string,string>, counts: Record<string,number>}|null}
 *   Rebuilt CSS block text + custom-prop count, keyed by mode, for every mode
 *   touched by the reconciliation (`light`, `dark`, and `baseMode`, which may
 *   coincide) — or null when sourceModes does not define both `light` and
 *   `dark` (useLightDarkFunc then has no effect, see config.mjs)
 */
export const applyLightDarkFunc = ({ modeFinalProps, modeNames, baseMode, selector, customPropsGroups }) => {
  if (!modeNames.includes('light') || !modeNames.includes('dark')) return null;

  const lightProps = modeFinalProps.light;
  const darkProps = modeFinalProps.dark;
  const commonNames = Object.keys(lightProps).filter((name) => name in darkProps);

  /** @type {Record<string,string>} */
  const sharedProps = {};
  for (const name of commonNames) {
    const light = splitTail(lightProps[name]);
    const dark = splitTail(darkProps[name]);
    // Prefers the light-side trailing comment (e.g. a token $description);
    // falls back to the dark-side one if light has none.
    const comment = light.comment || dark.comment;
    sharedProps[name] = `light-dark(${light.value}, ${dark.value});${comment ? ` ${comment}` : ''}`;
  }

  const stripCommon = (props) => {
    const copy = { ...props };
    for (const name of commonNames) delete copy[name];
    return copy;
  };

  /** @type {Record<string, Record<string,string>>} */
  const updatedFinalProps = { ...modeFinalProps };
  updatedFinalProps.light = stripCommon(lightProps);
  updatedFinalProps.dark = stripCommon(darkProps);
  // The shared declarations always land in the base mode's own map — adding
  // them back in if the base mode happens to be `light` or `dark` itself
  // (whose map was just stripped above), or into a third mode's map.
  updatedFinalProps[baseMode] = { ...updatedFinalProps[baseMode], ...sharedProps };

  // The base mode's `color-scheme` value is always normalised to read
  // "light dark [...other modes]", with `light` before `dark`, regardless of
  // the order sourceModes keys were declared in config or of which of the
  // two is the configured base — light-dark() itself is positional
  // (light-value first, dark-value second), so the accompanying
  // `color-scheme` declaration follows the same, predictable reading. Modes
  // other than light/dark, if any, are appended after, unaffected.
  const restModes = modeNames.filter((mode) => mode !== 'light' && mode !== 'dark');
  const colorScheme = ['light', 'dark', ...restModes].join(' ');

  // Only `light`, `dark`, and the base mode (which may be one of the two, or
  // a third mode) need re-rendering: every other sourceModes key is
  // untouched and keeps its already-built block (see build-source-modes.mjs).
  const modesToRebuild = new Set(['light', 'dark', baseMode]);

  /** @type {Record<string,string>} */
  const blocks = {};
  /** @type {Record<string,number>} */
  const counts = {};
  for (const mode of modesToRebuild) {
    const finalProps = updatedFinalProps[mode];
    blocks[mode] = buildCssBlock({
      finalProps,
      selector,
      colorScheme: mode === baseMode ? colorScheme : mode,
      customPropsGroups,
    });
    counts[mode] = Object.keys(finalProps).length;
  }

  return { blocks, counts };
};
