/*
  build-tokens-src/transforms.mjs
  Registra tutte le transform personalizzate di Style Dictionary.
  Importato una sola volta da build-tokens.mjs prima di chiamare buildAllPlatforms().
*/

import StyleDictionary from 'style-dictionary';
import { getSourcePrefix } from './source-prefixes.mjs';

const BASE_FONT_SIZE = 16;

// Converte un valore px in rem. Restituisce invariata la stringa originale per i
// valori non px, e '0' per i valori zero indipendentemente dall'unità.
const toRem = (val) => {
  if (val === undefined || val === null) return '0';
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  if (num === 0) return '0';
  if (str.endsWith('px')) return `${num / BASE_FONT_SIZE}rem`;
  return str;
};

/*
  ---------------------------------------------------------------------------
  1. Shadow
  Converte gli oggetti token shadow (singoli o array) in una stringa CSS box-shadow.
  I valori px vengono convertiti in rem. I riferimenti alias vengono risolti in modo transitivo.
  ---------------------------------------------------------------------------
*/
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

    // È già una stringa CSS risolta (ad es. da un alias)
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

/*
  ---------------------------------------------------------------------------
  2. px → rem (solo token dimension, salta i valori già in rem, %, em, ...)
  ---------------------------------------------------------------------------
*/
StyleDictionary.registerTransform({
  name: 'size/pxToRem-smart',
  type: 'value',
  filter: (token) => {
    const value = token.$value || token.value;
    return (token.$type === 'dimension' || token.type === 'dimension')
      && typeof value === 'string'
      && value.endsWith('px');
  },
  transform: (token) => {
    const value      = token.$value || token.value;
    const floatValue = parseFloat(value);
    if (isNaN(floatValue)) return value;
    return `${floatValue / BASE_FONT_SIZE}rem`;
  },
});

/*
  ---------------------------------------------------------------------------
  3. Passthrough dei colori
  Garantisce che il valore risolto venga restituito così com'è, supportando sia i campi $value sia
  i campi value legacy e la risoluzione transitiva degli alias.
  ---------------------------------------------------------------------------
*/
StyleDictionary.registerTransform({
  name: 'color/css-modern',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'color' || token.type === 'color',
  transform: (token) => {
    const original = token.original?.$value ?? token.original?.value;
    // Se il valore originale è una funzione CSS che contiene {riferimenti},
    // lo restituisce intatto così che il format css possa risolvere i riferimenti in var(--...)
    if (typeof original === 'string' && original.includes('{') && !original.startsWith('{')) {
      return original;
    }
    return token.$value ?? token.value;
  },
});

/*
  ---------------------------------------------------------------------------
  4. Gradient
  Converte gli oggetti token gradient in funzioni CSS gradient.
  Supporta i tipi linear, radial e conic. I riferimenti alias vengono risolti
  in modo transitivo; le stringhe già risolte vengono restituite invariate.
  ---------------------------------------------------------------------------
*/
StyleDictionary.registerTransform({
  name: 'gradient/css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'gradient' || token.type === 'gradient',
  transform: (token) => {
    const original = token.original?.$value ?? token.original?.value;

    // Se l'originale è una funzione CSS che contiene {riferimenti}, lo restituisce
    // intatto così che il format css possa risolvere i riferimenti in var(--...).
    if (typeof original === 'string' && original.includes('{') && !original.startsWith('{')) {
      return original;
    }

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

/*
  ---------------------------------------------------------------------------
  5. Composite (border, outline, transition, animation)
  Converte gli oggetti token composite nei corrispondenti shorthand CSS.
  Applicata solo ai valori oggetto; le stringhe passano invariate.
  ---------------------------------------------------------------------------
*/
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

/*
  ---------------------------------------------------------------------------
  6. Passthrough della tipografia
  Restituisce il valore del token così com'è. Il format css/variables-sorted
  si occupa di scomporre i token tipografici nelle singole proprietà CSS.
  ---------------------------------------------------------------------------
*/
StyleDictionary.registerTransform({
  name: 'typography/css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'typography' || token.type === 'typography',
  transform: (token) => token.$value ?? token.value,
});

/*
  ---------------------------------------------------------------------------
  7. Nome in kebab-case con prefisso per sorgente
  Come il name/kebab predefinito, ma antepone il prefisso registrato per il
  file sorgente del token (voci `{ src, prefix }` di `source`/`sourceModes`, vedi
  source-prefixes.mjs), ad es. gray.0 di Open Props con prefisso 'op' -> op-gray-0.
  Cambia solo il nome: il percorso del token resta intatto, quindi i {riferimenti} continuano a
  essere risolti e vengono resi come var(--<nome-prefissato>). I file senza
  prefisso ottengono esattamente il risultato del name/kebab predefinito.
  ---------------------------------------------------------------------------
*/
StyleDictionary.registerTransform({
  name: 'name/kebab-prefixed',
  type: 'name',
  transform: (token, options) => {
    const kebab = StyleDictionary.hooks.transforms['name/kebab'].transform;
    const prefix = getSourcePrefix(token.filePath);
    return kebab(prefix ? { ...token, path: [prefix, ...token.path] } : token, options);
  },
});
