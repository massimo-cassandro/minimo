// build-tokens-src/transforms.mjs
// Registers all custom Style Dictionary transforms.
// Imported once by build-tokens.mjs before buildAllPlatforms() is called.

import StyleDictionary from 'style-dictionary';

const BASE_FONT_SIZE = 16;

// Converts a px value to rem. Returns the original string unchanged for
// non-px values, and '0' for zero values regardless of unit.
const toRem = (val) => {
  if (val === undefined || val === null) return '0';
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  if (num === 0) return '0';
  if (str.endsWith('px')) return `${num / BASE_FONT_SIZE}rem`;
  return str;
};

// ---------------------------------------------------------------------------
// 1. Shadow
// Converts shadow token objects (single or array) to a CSS box-shadow string.
// px values are converted to rem. Alias references are resolved transitively.
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'shadow/css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'shadow' || token.type === 'shadow',
  transform: (token) => {
    const original = token.original?.$value ?? token.original?.value;

    const value = (typeof original === 'string' && original.startsWith('{'))
      ? (token.$value ?? token.value)
      : (original ?? token.$value ?? token.value);

    const shadows = Array.isArray(value) ? value : [value];

    // Already a resolved CSS string (e.g. from an alias)
    if (shadows.length === 1 && typeof shadows[0] === 'string') return shadows[0];

    return shadows
      .map((s) => {
        const offsetX = toRem(s.offsetX ?? s.x);
        const offsetY = toRem(s.offsetY ?? s.y);
        const blur    = toRem(s.blur);
        const spread  = toRem(s.spread);
        const color   = s.color ?? 'transparent';
        const inset   = s.inset ? 'inset ' : '';
        return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
      })
      .join(', ');
  },
});

// ---------------------------------------------------------------------------
// 2. px → rem (dimension tokens only, skips values already in rem)
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'size/pxToRem-smart',
  type: 'value',
  filter: (token) => {
    const value = token.$value || token.value;
    return (token.$type === 'dimension' || token.type === 'dimension')
      && typeof value === 'string'
      && !value.endsWith('rem');
  },
  transform: (token) => {
    const value      = token.$value || token.value;
    const floatValue = parseFloat(value);
    if (isNaN(floatValue)) return value;
    return `${floatValue / BASE_FONT_SIZE}rem`;
  },
});

// ---------------------------------------------------------------------------
// 3. Color passthrough
// Ensures the resolved value is returned as-is, supporting both $value and
// legacy value fields and transitive alias resolution.
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'color/css-modern',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'color' || token.type === 'color',
  transform: (token) => token.$value ?? token.value,
});

// ---------------------------------------------------------------------------
// 4. Gradient
// Converts gradient token objects to CSS gradient functions.
// Supports linear, radial and conic types. Alias references are resolved
// transitively; already-resolved strings are returned unchanged.
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'gradient/css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'gradient' || token.type === 'gradient',
  transform: (token) => {
    const original = token.original?.$value ?? token.original?.value;

    const value = (typeof original === 'string' && original.startsWith('{'))
      ? (token.$value ?? token.value)
      : (original ?? token.$value ?? token.value);

    if (typeof value === 'string') return value;

    const { type = 'linear', angle = 90, stops = [] } = value;

    const stopsList = stops
      .map((s) => {
        let color = s.color ?? 'transparent';
        if (s.alpha !== undefined) {
          color = `color-mix(in srgb, ${color} ${s.alpha * 100}%, transparent)`;
        }
        const position = s.position !== undefined ? ` ${s.position * 100}%` : '';
        return `${color}${position}`;
      })
      .join(', ');

    if (type === 'linear') return `linear-gradient(${angle}deg, ${stopsList})`;
    if (type === 'radial') return `radial-gradient(circle, ${stopsList})`;
    if (type === 'conic')  return `conic-gradient(from ${angle}deg, ${stopsList})`;

    return `linear-gradient(${angle}${typeof angle === 'number' ? 'deg' : ''}, ${stopsList})`;
  },
});

// ---------------------------------------------------------------------------
// 5. Composite (border, outline, transition, animation)
// Converts composite token objects to their CSS shorthand equivalents.
// Only applied to object values; strings pass through unchanged.
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'composite/css',
  type: 'value',
  transitive: true,
  filter: (token) => {
    const type  = token.$type ?? token.type;
    const value = token.$value ?? token.value;
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      ['border', 'outline', 'transition', 'animation'].includes(type)
    );
  },
  transform: (token) => {
    const type = token.$type ?? token.type;
    const v    = token.$value ?? token.value;

    if (type === 'border') {
      const parts = [v.width ?? '1px'];
      if (v.style !== undefined && v.style !== null && v.style !== '') parts.push(v.style);
      parts.push(v.color ?? 'transparent');
      return parts.join(' ');
    }

    if (type === 'outline') {
      return `${v.width ?? '1px'} ${v.style ?? 'solid'} ${v.color ?? 'transparent'}`;
    }

    if (type === 'transition') {
      return [
        v.duration       ?? '0s',
        v.timingFunction ?? 'ease',
        v.delay          ?? '0s',
        v.property       ?? 'all',
      ].join(' ');
    }

    if (type === 'animation') {
      return [
        v.duration       ?? '0s',
        v.timingFunction ?? 'ease',
        v.delay          ?? '0s',
        v.iterationCount ?? '1',
        v.direction      ?? 'normal',
        v.fillMode       ?? 'none',
        v.playState      ?? 'running',
        v.name           ?? 'none',
      ].join(' ');
    }
  },
});

// ---------------------------------------------------------------------------
// 6. Typography passthrough
// Returns the token value as-is. The css/variables-sorted format is
// responsible for exploding typography tokens into individual CSS properties.
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'typography/css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'typography' || token.type === 'typography',
  transform: (token) => token.$value ?? token.value,
});
