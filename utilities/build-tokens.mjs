// StyleDictionary v.5
import StyleDictionary from 'style-dictionary';
import path from 'path';
import { pathToFileURL } from 'url';
import { styleText } from 'node:util'; 

import { homedir } from 'os';

import stylelint from 'stylelint';

// ---------------------------------------------------------------------------
// Risoluzione del config file tramite flag --config
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const configFlagIndex = args.indexOf('--config');

if (configFlagIndex === -1 || !args[configFlagIndex + 1]) {
  console.error('Errore: devi specificare il file di configurazione con --config ./path/to/config/file');
  process.exit(1);
}

let customPropsCount;

// Il percorso passato è relativo alla CWD (root del progetto)
const configArgPath = args[configFlagIndex + 1];
const configAbsPath = path.resolve(process.cwd(), configArgPath);

// La directory del config file: usata come base per risolvere i percorsi interni
const configDir = path.dirname(configAbsPath);

// Importa il config dinamicamente (usa fileURL per compatibilità ESM su Windows)
const buildConfig = (await import(pathToFileURL(configAbsPath))).default;

// Helper: risolve un percorso relativo rispetto alla dir del config file.
// Se il percorso è già assoluto lo lascia intatto.
const resolveFromConfig = (p) => path.resolve(configDir, p);

// Risolve tutti i percorsi dichiarati nel config
const stylelintConfigPath = resolveFromConfig(buildConfig.stylelintConfigPath);
const buildPath           = resolveFromConfig(buildConfig.buildPath);
const destFile            = buildConfig.destFile; // nome file, non un percorso da risolvere

// source può contenere glob/percorsi: li risolviamo tutti rispetto alla configDir.
// path.resolve non gestisce i glob, quindi usiamo path.posix per mantenere le slash
// forward anche su Windows (fast-glob le richiede).
const source = buildConfig.source.map((s) => {
  if (path.isAbsolute(s)) return s; // già assoluto, niente da fare

  // Unisce configDir + s e normalizza, poi ri-converte in forward-slash per fast-glob
  const joined = path.join(configDir, s);
  // Su Windows path.join usa '\', fast-glob vuole '/': normalizziamo sempre
  return joined.split(path.sep).join('/');
});

const stylelintConfig = await import(pathToFileURL(stylelintConfigPath)).then(m => m.default);

// ---------------------------------------------------------------------------
// 1. Shadow Transform
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'shadow/css',
  type: 'value',
  transitive: true,
  filter: (token) => (token.$type === 'shadow' || token.type === 'shadow'),
  transform: (token) => {
    const original = token.original?.$value ?? token.original?.value;

    const value = (typeof original === 'string' && original.startsWith('{'))
      ? (token.$value ?? token.value)
      : (original ?? token.$value ?? token.value);

    const shadows = Array.isArray(value) ? value : [value];

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

// ---------------------------------------------------------------------------
// 2. PX to REM Transform
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
    const baseFontSize = 16;
    const value = token.$value || token.value;
    const floatValue = parseFloat(value);

    if (isNaN(floatValue)) return value;

    return `${floatValue / baseFontSize}rem`;
  }
});

// ---------------------------------------------------------------------------
// 3. Color passthrough
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'color/css-modern',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'color' || token.type === 'color',
  transform: (token) => {
    const value = token.$value ?? token.value;
    if (typeof value === 'string') return value;
    return value;
  }
});

// ---------------------------------------------------------------------------
// 4. Gradient Transform
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
    if (type === 'conic') return `conic-gradient(from ${angle}deg, ${stopsList})`;

    return `linear-gradient(${angle}deg, ${stopsList})`;
  }
});

// ---------------------------------------------------------------------------
// Format: css/variables-sorted
// ---------------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: 'css/variables-sorted',
  format: ({ dictionary, options }) => {
    const selector = options.selector ?? ':root';

    const tokenByPath = {};
    for (const token of dictionary.allTokens) {
      tokenByPath[token.path.join('.')] = token;
    }

    const resolveRefs = (str) =>
      String(str).replace(/\{([^}]+)\}/g, (_, p) => {
        const ref = tokenByPath[p];
        return ref ? `var(--${ref.name})` : `{${p}}`;
      });

    const BASE_FONT_SIZE = 16;
    const toRem = (val) => {
      if (val === undefined || val === null) return '0';
      const str = String(val).trim();
      const num = parseFloat(str);
      if (isNaN(num) || num === 0) return num === 0 ? '0' : str;
      if (str.endsWith('px')) return `${num / BASE_FONT_SIZE}rem`;
      return str;
    };

    const buildShadow = (original) => {
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

    const buildGradient = (original) => {
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

    const lines = dictionary.allTokens
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((token) => {
        const type = token.$type ?? token.type;
        const orig = token.original?.$value ?? token.original?.value;

        let value;

        if (type === 'shadow' && options.outputReferences) {
          if (typeof orig === 'string' && orig.startsWith('{')) {
            value = resolveRefs(orig);
          } else {
            value = buildShadow(orig);
          }
        } else if (type === 'gradient' && options.outputReferences) {
          if (typeof orig === 'string' && orig.startsWith('{')) {
            value = resolveRefs(orig);
          } else {
            value = buildGradient(orig);
          }
        } else if (options.outputReferences && typeof orig === 'string' && orig.includes('{')) {
          value = resolveRefs(orig);
        } else {
          value = String(token.$value ?? token.value);
        }

        return `  --${token.name}: ${value};`;
      });

    customPropsCount = lines.length;
    return `${selector} {\n${lines.join('\n')}\n}\n`;
  }
});

// ---------------------------------------------------------------------------
// Style Dictionary config
// ---------------------------------------------------------------------------
const config = {
  source,

  log: {
    verbosity: 'verbose'
  },

  platforms: {
    css: {
      buildPath: buildPath + '/',
      transforms: [
        'attribute/cti',
        'name/kebab',
        'time/seconds',
        'asset/url',
        'size/pxToRem-smart',
        'color/css-modern',
        'shadow/css',
        'gradient/css'
      ],
      files: [
        {
          destination: destFile,
          format: 'css/variables-sorted',
          options: {
            outputReferences: true,
            showFileHeader: true,
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



console.log(styleText(['yellow'], `[build-tokens] config file : ${configAbsPath.replace(homedir(), '~')}` ));
console.log(styleText(['yellow'], `[build-tokens] source      : ${source.map(i => i.replace(homedir(), '~'))}` ));
console.log(styleText(['yellow'], `[build-tokens] dest file   : ${path.join(buildPath, destFile).replace(homedir(), '~')}` ));

console.log(styleText(['green'], `[build-tokens] ${customPropsCount} custom props elaborate`));

console.log(styleText(['green'], '**** FINE ****'));