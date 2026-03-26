// StyleDictionary v.5
import StyleDictionary from 'style-dictionary';

import stylelint from 'stylelint';

import stylelintConfig from '../../stylelint.config.mjs';

// import { homedir } from 'os';
import path from 'path';

// TODO spostare percorsi minimo su node modules
// const minimo_path = path.resolve(homedir(), 'Sites/minimo');

const buildPath = '../../src',
  destFile = 'custom-properties-default.css',
  source = [
    '../../src/tokens/*.jsonc'
  ]
;

// 1. Shadow Transform
StyleDictionary.registerTransform({
  name: 'shadow/css',
  type: 'value',
  transitive: true,
  filter: (token) => (token.$type === 'shadow' || token.type === 'shadow'),
  transform: (token) => {
    const original = token.original?.$value ?? token.original?.value;

    // Se l'originale è un riferimento stringa (es. "{panel.drop-shadow}"),
    // usa il valore già risolto da Style Dictionary
    const value = (typeof original === 'string' && original.startsWith('{'))
      ? (token.$value ?? token.value)
      : (original ?? token.$value ?? token.value);

    const shadows = Array.isArray(value) ? value : [value];

    // Se è già una stringa CSS risolta (es. proveniente da un riferimento),
    // restituiscila direttamente
    if (shadows.length === 1 && typeof shadows[0] === 'string') {
      return shadows[0];
    }

    const BASE_FONT_SIZE = 16;
    const toRem = (val) => {
      if (val === undefined || val === null) return '0';
      const str = String(val).trim();
      const num = parseFloat(str);
      if (isNaN(num)) return str;
      if (num === 0) return '0';
      if (str.endsWith('px')) return `${num / BASE_FONT_SIZE}rem`;
      return str;
    };

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
  }
});

// 2. PX to REM Transform
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
    const baseFontSize = 16;
    const value = token.$value || token.value;
    const floatValue = parseFloat(value);

    if (isNaN(floatValue)) return value;

    return `${floatValue / baseFontSize}rem`;
  }
});

// 3. Color passthrough — preserva rgb/hsl moderni con alpha
StyleDictionary.registerTransform({
  name: 'color/css-modern',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'color' || token.type === 'color',
  transform: (token) => {
    const value = token.$value ?? token.value;
    // Se il valore è già una stringa CSS valida (rgb, hsl, oklch…), lasciala intatta
    if (typeof value === 'string') return value;
    // Fallback per oggetti (es. { r, g, b, a }) — converti manualmente
    // (adatta se hai altri formati)
    return value;
  }
});

// 4. Gradient Transform
// con campo custom `alpha`
StyleDictionary.registerTransform({
  name: 'gradient/css',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'gradient' || token.type === 'gradient',
  transform: (token) => {
    const original = token.original?.$value ?? token.original?.value;

    // Se l'originale è un riferimento stringa, usa il valore già risolto
    const value = (typeof original === 'string' && original.startsWith('{'))
      ? (token.$value ?? token.value)
      : (original ?? token.$value ?? token.value);

    // Se è già una stringa CSS risolta, restituiscila direttamente
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
    if (type === 'conic') return `conic-gradient(from ${angle}deg, ${stopsList})`;

    return `linear-gradient(${angle}deg, ${stopsList})`;
  }
});

StyleDictionary.registerFormat({
  name: 'css/variables-sorted',
  format: ({ dictionary, options }) => {
    const selector = options.selector ?? ':root';

    // mappa nome-path → token, per risolvere i riferimenti manualmente
    const tokenByPath = {};
    for (const token of dictionary.allTokens) {
      tokenByPath[token.path.join('.')] = token;
    }

    const lines = dictionary.allTokens
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((token) => {
        let value;

        const originalValue = String(token.original?.$value ?? token.original?.value ?? '');

        if (options.outputReferences && originalValue.includes('{')) {
          // sostituisce tutti i {path.to.token} con var(--name)
          value = originalValue.replace(/\{([^}]+)\}/g, (_, path) => {
            const ref = tokenByPath[path];
            return ref ? `var(--${ref.name})` : `{${path}}`;
          });
        } else {
          value = String(token.$value ?? token.value);
        }

        return `  --${token.name}: ${value};`;
      });

    return `${selector} {\n${lines.join('\n')}\n}\n`;
  }
});


const config = {
  // include: [],

  source: source,
  log: {
    verbosity: 'verbose'
  },

  platforms: {
    css: {
      buildPath: buildPath,
      // transformGroup: 'css', // contiene il trasnform 'color/css' che trasforma tutti i colori in hex piatti
      // transforms: ['size/pxToRem-smart', 'color/css-modern', 'shadow/css'],
      transforms: [
        'attribute/cti',
        'name/kebab',        // genera i nomi kebab-case delle custom properties
        'time/seconds',
        // 'content/icon',
        'asset/url',
        'size/pxToRem-smart',
        'color/css-modern',  // al posto di color/css
        'shadow/css',
        'gradient/css'
      ],
      files: [
        {
          destination: destFile,
          // format: 'css/variables',
          format: 'css/variables-sorted',

          // https://styledictionary.com/reference/hooks/formats/predefined/#cssvariables
          options: {
            outputReferences: true,
            showFileHeader: true,

            // non tengono conto dei formati post-elaborati
            // sort: (a, b) => a.name.localeCompare(b.name)
            // sort: 'name'
          }
        }
      ]
    }
  }
};

const sd = new StyleDictionary(config);

await sd.buildAllPlatforms();


await stylelint.lint({
  config: stylelintConfig,
  files: [ path.join(buildPath, destFile) ],
  fix: true
});
