// build-tokens-src/formats/css.mjs
// Registers the 'css/variables-sorted' format.
// Generates a :root { ... } block with custom properties sorted alphabetically.
// Typography tokens are exploded into multiple CSS properties:
//   - a `font` shorthand (when both fontSize and fontFamily are present)
//   - individual properties for letterSpacing, textTransform, textDecoration

import StyleDictionary from 'style-dictionary';
import { padColorName } from '../lib/color-scale.mjs';

const BASE_FONT_SIZE = 16;

// Converts a px value to rem. Returns the original string for non-px values.
const toRem = (val) => {
  if (val === undefined || val === null) return '0';
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num) || num === 0) return num === 0 ? '0' : str;
  if (str.endsWith('px')) return `${num / BASE_FONT_SIZE}rem`;
  return str;
};

// Replaces {a.b.c} references with var(--token-name) using the tokenByPath map.
const makeResolveRefs = (tokenByPath) => (str) =>
  String(str).replace(/\{([^}]+)\}/g, (_, p) => {
    const ref = tokenByPath[p];
    return ref ? `var(--${ref.name})` : `{${p}}`;
  });

// ── Complex-type builders ────────────────────────────────────────────────────

const buildShadow = (original, resolveRefs) => {
  const shadows = Array.isArray(original) ? original : [original];
  return shadows.map((s) => {
    const offsetX = toRem(s.offsetX ?? s.x);
    const offsetY = toRem(s.offsetY ?? s.y);
    const blur    = toRem(s.blur);
    const spread  = toRem(s.spread);
    const color   = resolveRefs(s.color ?? 'transparent');
    const inset   = s.inset ? 'inset ' : '';
    return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
  }).join(', ');
};

const buildGradient = (original, resolveRefs) => {
  const { type = 'linear', angle = 90, stops = [] } = original;
  const stopsList = stops.map((s) => {
    let color = resolveRefs(s.color ?? 'transparent');
    if (s.alpha !== undefined) {
      color = `color-mix(in srgb, ${color} ${s.alpha * 100}%, transparent)`;
    }
    const position = s.position !== undefined ? ` ${s.position * 100}%` : '';
    return `${color}${position}`;
  }).join(', ');

  if (type === 'radial') return `radial-gradient(circle, ${stopsList})`;
  if (type === 'conic')  return `conic-gradient(from ${angle}deg, ${stopsList})`;
  return `linear-gradient(${angle}deg, ${stopsList})`;
};

const buildBorderLike = (original, resolveRefs) => {
  const parts = [resolveRefs(String(original.width ?? '1px'))];
  if (original.style !== undefined && original.style !== null && original.style !== '') {
    parts.push(resolveRefs(String(original.style)));
  }
  parts.push(resolveRefs(String(original.color ?? 'transparent')));
  return parts.join(' ');
};

const buildTransition = (original, resolveRefs) => [
  resolveRefs(String(original.duration       ?? '0s')),
  resolveRefs(String(original.timingFunction ?? 'ease')),
  resolveRefs(String(original.delay          ?? '0s')),
  resolveRefs(String(original.property       ?? 'all')),
].join(' ');

const buildAnimation = (original, resolveRefs) => [
  resolveRefs(String(original.duration       ?? '0s')),
  resolveRefs(String(original.timingFunction ?? 'ease')),
  resolveRefs(String(original.delay          ?? '0s')),
  resolveRefs(String(original.iterationCount ?? '1')),
  resolveRefs(String(original.direction      ?? 'normal')),
  resolveRefs(String(original.fillMode       ?? 'none')),
  resolveRefs(String(original.playState      ?? 'running')),
  resolveRefs(String(original.name           ?? 'none')),
].join(' ');

// Builds CSS custom properties for a typography token.
// Produces a `font` shorthand when both fontSize and fontFamily are present,
// plus separate properties for letterSpacing, textTransform and textDecoration.
const buildTypography = (tokenName, original, resolveRefs) => {
  const {
    fontStyle, fontVariant, fontWeight, fontStretch,
    fontSize, lineHeight, fontFamily,
    letterSpacing, textTransform, textDecoration,
  } = original;

  const lines = [];

  if (fontSize && fontFamily) {
    const parts = [];
    if (fontStyle)   parts.push(resolveRefs(String(fontStyle)));
    if (fontVariant) parts.push(resolveRefs(String(fontVariant)));
    if (fontWeight)  parts.push(resolveRefs(String(fontWeight)));
    if (fontStretch) parts.push(resolveRefs(String(fontStretch)));

    const sizeSlash = lineHeight
      ? `${resolveRefs(String(fontSize))}/${resolveRefs(String(lineHeight))}`
      : resolveRefs(String(fontSize));

    parts.push(sizeSlash);
    parts.push(resolveRefs(String(fontFamily)));
    lines.push(`  --${tokenName}-font: ${parts.join(' ')};`);
  }

  const EXTRA_PROPS = {
    letterSpacing:  ['letter-spacing',  letterSpacing],
    textTransform:  ['text-transform',  textTransform],
    textDecoration: ['text-decoration', textDecoration],
    // Fallback: expose size/family individually if the shorthand could not be built
    ...(!fontSize   ? { fontSize:   ['font-size',   original.fontSize]   } : {}),
    ...(!fontFamily ? { fontFamily: ['font-family', original.fontFamily] } : {}),
  };

  for (const [, [cssProp, val]] of Object.entries(EXTRA_PROPS)) {
    if (val !== undefined) {
      lines.push(`  --${tokenName}-${cssProp}: ${resolveRefs(String(val))};`);
    }
  }

  return lines.join('\n');
};

// ── Format registration ──────────────────────────────────────────────────────

// Exported counter — read by build-tokens.mjs for the final log line
export let customPropsCount = 0;

StyleDictionary.registerFormat({
  name: 'css/variables-sorted',
  format: ({ dictionary, options }) => {
    const selector = options.selector ?? ':root';

    const tokenByPath = {};
    for (const token of dictionary.allTokens) {
      tokenByPath[token.path.join('.')] = token;
    }

    const resolveRefs = makeResolveRefs(tokenByPath);

    const colorScalePrefixes = options.colorScalePrefixes ?? [];

    const lines = dictionary.allTokens
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((token) => {
        const type = token.$type ?? token.type;
        const orig = token.original?.$value ?? token.original?.value;

        // Apply zero-padding to color scale names (e.g. --neutral-80 -> --neutral-080)
        const tokenName = (type === 'color')
          ? padColorName(token.name, colorScalePrefixes)
          : token.name;

        if (type === 'typography') {
          return [buildTypography(tokenName, orig ?? {}, resolveRefs)];
        }

        let value;

        if (type === 'shadow' && options.outputReferences) {
          value = (typeof orig === 'string' && orig.startsWith('{'))
            ? resolveRefs(orig) : buildShadow(orig, resolveRefs);

        } else if (type === 'gradient' && options.outputReferences) {
          value = (typeof orig === 'string' && orig.startsWith('{'))
            ? resolveRefs(orig) : buildGradient(orig, resolveRefs);

        } else if ((type === 'border' || type === 'outline') && options.outputReferences) {
          value = (typeof orig === 'string' && orig.startsWith('{'))
            ? resolveRefs(orig) : buildBorderLike(orig, resolveRefs);

        } else if (type === 'transition' && options.outputReferences) {
          value = (typeof orig === 'string' && orig.startsWith('{'))
            ? resolveRefs(orig) : buildTransition(orig, resolveRefs);

        } else if (type === 'animation' && options.outputReferences) {
          value = (typeof orig === 'string' && orig.startsWith('{'))
            ? resolveRefs(orig) : buildAnimation(orig, resolveRefs);

        } else if (options.outputReferences && typeof orig === 'string' && orig.includes('{')) {
          // Resolve {references} to var(--name). If arithmetic operators remain
          // after substitution the value is a math expression and must be wrapped
          // in calc() to produce valid CSS.
          const resolved = resolveRefs(orig);
          const isCalcNeeded = /[+\-*/]/.test(resolved.replace(/var\([^)]+\)/g, '0'));
          value = isCalcNeeded ? `calc(${resolved})` : resolved;

        } else {
          value = String(token.$value ?? token.value);
        }

        return [`  --${tokenName}: ${value};`];
      });

    customPropsCount = lines.length;
    return `${selector} {\n${lines.join('\n')}\n}\n`;
  },
});
