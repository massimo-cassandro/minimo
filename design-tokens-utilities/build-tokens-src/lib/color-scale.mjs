// build-tokens-src/lib/color-scale.mjs
// Shared helper for color scale zero-padding.
//
// When colorScalePrefixes is configured, color tokens whose name matches
//   --<prefix>-<number>  (e.g. --primary-100, --neutral-80)
// have the numeric segment zero-padded to 3 digits:
//   --primary-100  ->  --primary-100  (unchanged, already 3 digits)
//   --neutral-80   ->  --neutral-080
//   --secondary-5  ->  --secondary-005
//
// The same transformation is applied to CSS custom property names and to
// Penpot DTCG token keys, so both outputs stay in sync.
//
// Configuration (in the project config file):
//   colorScalePrefixes: ['primary', 'secondary', 'neutral']
//
// Set to an empty array or omit to disable the feature entirely.

// ---------------------------------------------------------------------------
// padColorName
//
// Given a full token name (kebab-case, no leading --) and the list of
// configured prefixes, returns the name with the numeric segment zero-padded
// if applicable, or the original name unchanged otherwise.
//
// Examples:
//   padColorName('primary-100', ['primary'])  -> 'primary-100'
//   padColorName('neutral-80',  ['neutral'])  -> 'neutral-080'
//   padColorName('neutral-80',  [])           -> 'neutral-80'
//   padColorName('size-base',   ['primary'])  -> 'size-base'
// ---------------------------------------------------------------------------
export const padColorName = (name, prefixes) => {
  if (!prefixes || prefixes.length === 0) return name;

  // Match: <prefix>-<integer>  optionally followed by more segments
  // The number must be a pure integer (no decimals, no units).
  const pattern = new RegExp(
    `^(${prefixes.map(p => escapeRegex(p)).join('|')})-([0-9]+)(-.+)?$`
  );

  const match = name.match(pattern);
  if (!match) return name;

  const [, prefix, num, rest = ''] = match;
  const padded = num.padStart(3, '0');

  return `${prefix}-${padded}${rest}`;
};

// ---------------------------------------------------------------------------
// padTokenPath
//
// Applies the same zero-padding logic to a DTCG token path array.
// Used by the Penpot format to rename leaf keys and intermediate path segments.
//
// The segment to pad is the one immediately following the matching prefix.
// If the prefix occupies multiple path segments this function is intentionally
// conservative: it only pads when the prefix is a single path segment.
//
// Examples (path arrays):
//   ['primary', '100']     -> ['primary', '100']   (unchanged)
//   ['neutral', '80']      -> ['neutral', '080']
//   ['color', 'neutral', '80'] with prefix 'neutral' -> ['color', 'neutral', '080']
// ---------------------------------------------------------------------------
export const padTokenPath = (pathArr, prefixes) => {
  if (!prefixes || prefixes.length === 0) return pathArr;

  return pathArr.map((segment, i) => {
    // Is this segment a pure integer and is the previous segment a prefix?
    if (i === 0) return segment;
    const prev = pathArr[i - 1];
    if (!prefixes.includes(prev)) return segment;
    if (!/^[0-9]+$/.test(segment)) return segment;
    return segment.padStart(3, '0');
  });
};

// ---------------------------------------------------------------------------
// Internal: escape special regex characters in a prefix string
// ---------------------------------------------------------------------------
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
