/*
  build-tokens-src/formats/css.mjs
  Registra il format 'css/variables-sorted'.
  Genera un blocco :root { ... } con le custom properties ordinate alfabeticamente.
  I token tipografici vengono scomposti in più proprietà CSS:
    - una shorthand `font` (quando sono presenti sia fontSize sia fontFamily)
    - proprietà singole per letterSpacing, textTransform, textDecoration
*/

import StyleDictionary from 'style-dictionary';
import { mergeCustomProps, parseCustomProps } from '../merge-css.mjs';

const BASE_FONT_SIZE = 16;

// Converte un valore px in rem. Restituisce la stringa originale per i valori non px.
const toRem = (val) => {
  if (val === undefined || val === null) return '0';
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num) || num === 0) return num === 0 ? '0' : str;
  if (str.endsWith('px')) return `${num / BASE_FONT_SIZE}rem`;
  return str;
};

// Sostituisce i riferimenti {a.b.c} con var(--token-name) usando la mappa tokenByPath.
const makeResolveRefs = (tokenByPath) => (str) =>
  String(str).replace(/\{([^}]+)\}/g, (_, p) => {
    const ref = tokenByPath[p];
    return ref ? `var(--${ref.name})` : `{${p}}`;
  });

// ── Builder dei tipi complessi ───────────────────────────────────────────────

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

/*
  Costruisce le custom properties CSS per un token tipografico.
  Produce una shorthand `font` quando sono presenti sia fontSize sia fontFamily,
  più proprietà separate per letterSpacing, textTransform e textDecoration.
*/
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
    // Fallback: espone size/family singolarmente se non è stato possibile costruire la shorthand
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

/*
  Costruisce un commento CSS finale (stile slash-asterisco) dal $description di un token, da
  accodare alla fine della sua dichiarazione di custom prop generata (sulla stessa riga).
  I a capo vengono compattati (le dichiarazioni sono lette una riga alla volta, vedi
  parseCustomProps in ../merge-css.mjs) e la sequenza di chiusura del commento viene sottoposta a escape perché il commento
  non possa essere chiuso prematuramente dal proprio contenuto.
*/
const buildDescriptionComment = (description) => {
  if (!description) return '';
  const flat = String(description).replace(/\s*\n\s*/g, ' ').trim().replace(/\*\//g, '* /');
  return flat ? ` /* ${flat} */` : '';
};

// Costruisce il commento di titolo di un customPropsGroups, ad es.:
//   /* ****** LAYOUT ****** */
// Gli asterischi riempiono una larghezza totale fissa così che i titoli siano allineati a prescindere dalla lunghezza del nome.
const DECORATOR_LENGHT = 6;
const buildGroupTitle = (name) => {
  return `  /** ${'*'.repeat(DECORATOR_LENGHT)} ${name} ${'*'.repeat(DECORATOR_LENGHT)} **/`;
};

// ── Registrazione del format ─────────────────────────────────────────────────

// Contatore esportato — letto da build-tokens.mjs per la riga finale del log
export let customPropsCount = 0;

/*
  Live binding esportato che contiene la mappa nome → coda della dichiarazione calcolata per ultima
  da computeFinalProps() (vedi sotto), cioè il risultato strutturato della
  chiamata più recente al format 'css/variables-sorted'. Letto da
  build-tokens-src/build-source-modes.mjs subito dopo ogni chiamata per modalità a
  sd.formatPlatform('css') (sincrono, stesso schema di
  customPropsCount) — serve a build-tokens-src/light-dark.mjs per riconciliare
  le proprietà light/dark condivise in chiamate light-dark(), lavorando sulle
  props strutturate invece che sul testo CSS già reso.
*/
export let lastFinalProps = {};

/**
 * Calcola la mappa finale `nome -> coda della dichiarazione` per un dizionario di token:
 * risolve il valore CSS di ogni token (inclusi i builder dei tipi complessi qui sopra),
 * poi vi unisce le eventuali custom properties preesistenti tramite mergeCustomProps()
 * (vedi ../merge-css.mjs e l'opzione di config `mergeCustomProps`).
 * @param {object} dictionary  dizionario dei token risolto di Style Dictionary (argomento `dictionary` di format())
 * @param {object} options     argomento `options` di format() — qui vengono lette solo `outputReferences` e `mode`
 * @returns {Record<string,string>} nome → coda della dichiarazione (valore + `;` finale + eventuale commento finale)
 */
export const computeFinalProps = (dictionary, options) => {
  const tokenByPath = {};
  for (const token of dictionary.allTokens) {
    tokenByPath[token.path.join('.')] = token;
  }

  const resolveRefs = makeResolveRefs(tokenByPath);

  const sequenceList = [
    'xxs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', 'xxl', 'xxxl', '2xl', '3xl',
    'xlight', 'light', 'regular', 'medium', 'semibold', 'bold', 'xbold'
  ];

  const sortFunction = (a, b) => {
    const idxA = sequenceList.indexOf(a.name);
    const idxB = sequenceList.indexOf(b.name);

    // Entrambi nella lista → ordine arbitrario
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;

    // Solo A nella lista → A viene prima
    if (idxA !== -1) return -1;

    // Solo B nella lista → B viene prima
    if (idxB !== -1) return 1;

    // Nessuno nella lista → ordine alfabetico
    return a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' });
  };

  /*
    I token caricati tramite `include` (sourceModes: token della modalità base resi
    disponibili alle altre modalità) restano in tokenByPath, quindi i riferimenti a essi
    si risolvono in var(--name), ma non vengono dichiarati nel blocco di questa modalità.
    nome della proprietà → file sorgente del token, usato da mergeCustomProps quando il
    merge è limitato ad alcuni file sorgente (un token può generare più
    proprietà, ad es. la tipografia)
  */
  const sourceFileMap = {};
  const trackSource = (token, tokenLines) => {
    for (const name of Object.keys(parseCustomProps(tokenLines.join('\n')))) {
      sourceFileMap[name] = token.filePath;
    }
    return tokenLines;
  };

  const lines = dictionary.allTokens
    .filter((token) => token.isSource !== false)
    // .sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true, sensitivity: 'base'}))
    .sort((a, b) => sortFunction(a,b))
    .flatMap((token) => {
      const type = token.$type ?? token.type;
      const orig = token.original?.$value ?? token.original?.value;
      const description = token.$description ?? token.description ?? token.comment;
      const commentSuffix = buildDescriptionComment(description);

      if (type === 'typography') {
        const typographyLines = buildTypography(token.name, orig ?? {}, resolveRefs)
          .split('\n')
          .map((line) => `${line}${commentSuffix}`)
          .join('\n');
        return trackSource(token, [typographyLines]);
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
        /*
          Copre sia i semplici alias sia le funzioni CSS che contengono {riferimenti}
          ad es. color-mix(in srgb, {btn.secondary.background.color} 60%, #000)
          I {riferimenti} vengono sostituiti con var(--name); le operazioni aritmetiche ottengono calc().
        */
        const resolved = resolveRefs(orig);
        /*
          Rimuove var(...) e le chiamate a funzioni CSS (caratteri di parola + trattini seguiti da '(')
          prima di cercare gli operatori aritmetici, così che i trattini in nomi come
          "color-mix" o "linear-gradient" non attivino un calc() spurio.
        */
        const stripped = resolved
          .replace(/var\([^)]+\)/g, '0')
          .replace(/[\w-]+\(/g, '(');
        const isCalcNeeded = /[+\-*/]/.test(stripped);
        value = isCalcNeeded ? `calc(${resolved})` : resolved;

      } else {
        value = String(token.$value ?? token.value);
      }

      /*
        I valori su più righe (ad es. gli easing linear() di Open Props) vengono compattati
        su una sola riga: le dichiarazioni sono lette una riga alla volta (vedi
        parseCustomProps in ../merge-css.mjs), quindi un valore su più righe
        verrebbe troncato alla prima riga.
      */
      value = String(value)
        .replace(/\s*\n\s*/g, ' ')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')');

      return trackSource(token, [`  --${token.name}: ${value};${commentSuffix}`]);
    });

  /*
    Costruisce una mappa nome → coda della dichiarazione dalle dichiarazioni generate
    qui sopra, poi la unisce alle eventuali custom properties preesistenti caricate tramite
    loadExistingCustomProps() / loadExistingCustomPropsScoped() (vedi
    ../merge-css.mjs). I valori preesistenti (inclusi i commenti finali)
    hanno priorità quando esistono entrambi; le proprietà presenti solo nel preesistente vengono mantenute.
    options.mode (solo build sourceModes, vedi ../build-source-modes.mjs)
    limita il merge a quella modalità, così che proprietà con lo stesso nome ma valori
    diversi tra le modalità non vengano mai confuse.
  */
  const generatedProps = parseCustomProps(lines.join('\n'));
  return mergeCustomProps(generatedProps, options.mode ?? null, sourceFileMap);
};

/**
 * Costruisce il testo finale del blocco CSS (`<selector> { ... }`) a partire da una mappa
 * nome → coda della dichiarazione già calcolata (vedi computeFinalProps() qui sopra):
 * ordina le proprietà alfabeticamente, estrae i customPropsGroups, antepone una
 * dichiarazione `color-scheme` opzionale e, se richiesto, racchiude il risultato in
 * `@layer <addLayer> { ... }`.
 *
 * Estratta come funzione a sé (invece che inline nella chiamata a format()
 * più sotto) così che build-tokens-src/light-dark.mjs possa rieseguirla su una mappa
 * di props modificata — ad es. dopo aver spostato le proprietà condivise da `light` e `dark` in
 * un'unica dichiarazione `light-dark()` — e ottenere un blocco correttamente ordinato e
 * raggruppato, invece di accodare testo grezzo a posteriori.
 * @param {object} opts
 * @param {Record<string,string>} opts.finalProps  nome → coda della dichiarazione, come restituito da computeFinalProps()
 * @param {string} [opts.selector] selettore CSS che racchiude il blocco (default: ':root')
 * @param {string} [opts.colorScheme] valore opzionale per una dichiarazione `color-scheme: <valore>;` anteposta al blocco
 * @param {{name:string,prefixes:string[]}[]} [opts.customPropsGroups] gruppi nominati di prefissi di nome, spostati in cima al blocco nell'ordine dell'elenco (default: [])
 * @param {string|null} [opts.addLayer] racchiude il blocco in `@layer <addLayer> { ... }` (default: null — nessun layer)
 * @returns {string}
 * @example
 * buildCssBlock({
 *   finalProps: { 'accent-color': '#123;' },
 *   selector: ':root', // default: ':root'
 *   colorScheme: 'light dark', // default: undefined — nessuna riga color-scheme
 *   customPropsGroups: [], // default: []
 *   addLayer: null, // default: null
 * });
 */
export const buildCssBlock = ({
  finalProps,
  selector = ':root',
  colorScheme,
  customPropsGroups = [],
  addLayer = null,
}) => {
  /*
    L'output finale è sempre ordinato alfabeticamente in modo crescente per nome della
    proprietà, a prescindere dal merge — questo mantiene in ordine anche le proprietà
    presenti solo nel preesistente (da merge-css.mjs) invece di accodarle alla fine.
  */
  const sortedProps = Object.entries(finalProps)
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

  /*
    customPropsGroups: le proprietà il cui primo segmento del nome (separato da trattini)
    corrisponde a uno dei prefissi di un gruppo vengono estratte, etichettate con il
    nome di quel gruppo e collocate, nell'ordine dell'elenco dei gruppi, all'inizio del
    file di output. Una proprietà corrisponde al primo gruppo (in ordine di elenco) i cui
    prefissi la includono.
  */
  const groupedProps = customPropsGroups.map(() => []);
  const restProps = [];
  for (const entry of sortedProps) {
    const prefix = entry[0].split('-')[0];
    const groupIndex = customPropsGroups.findIndex((g) => g.prefixes?.includes(prefix));
    if (groupIndex !== -1) {
      groupedProps[groupIndex].push(entry);
    } else {
      restProps.push(entry);
    }
  }
  groupedProps.forEach((props, i) => {
    const prefixes = customPropsGroups[i].prefixes;
    props.sort(([a], [b]) => {
      const idxA = prefixes.indexOf(a.split('-')[0]);
      const idxB = prefixes.indexOf(b.split('-')[0]);
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
    });
  });

  /*
    Viene inserita una riga vuota tra i blocchi di proprietà che condividono lo stesso
    primo segmento separato da trattini (ad es. tutte le `btn-*` insieme), per raggruppare
    visivamente le custom properties correlate nel file generato.
  */
  const outLines = [];

  if (colorScheme) {
    outLines.push(`  color-scheme: ${colorScheme};`, '');
  }

  let prevPrefix = null;
  const appendBlock = (props) => {
    for (const [name, tail] of props) {
      const prefix = name.split('-')[0];
      if (prevPrefix !== null && prefix !== prevPrefix) {
        outLines.push('');
      }
      outLines.push(`  --${name}: ${tail}`);
      prevPrefix = prefix;
    }
  };

  const hasGroups = groupedProps.some((props) => props.length);
  let isFirstBlock = true;
  groupedProps.forEach((props, i) => {
    if (!props.length) return;
    if (!isFirstBlock) outLines.push('');
    isFirstBlock = false;
    outLines.push(buildGroupTitle(customPropsGroups[i].name));
    appendBlock(props);
    prevPrefix = null;
  });
  if (hasGroups && restProps.length) {
    outLines.push('', '  /* ---------------------- */', '');
    prevPrefix = null;
  }
  appendBlock(restProps);

  const block = `${selector} {\n${outLines.join('\n')}\n}\n`;

  // addLayer: racchiude l'intero blocco in `@layer <name> { ... }`.
  // L'indentazione è lasciata al passaggio di fix di stylelint (eseguito subito dopo la build).
  return addLayer
    ? `@layer ${addLayer} {\n\n${block}}\n`
    : block;
};

StyleDictionary.registerFormat({
  name: 'css/variables-sorted',
  format: ({ dictionary, options }) => {
    const finalProps = computeFinalProps(dictionary, options);
    lastFinalProps = finalProps;
    customPropsCount = Object.keys(finalProps).length;

    return buildCssBlock({
      finalProps,
      selector: options.selector,
      colorScheme: options.colorScheme,
      customPropsGroups: options.customPropsGroups,
      addLayer: options.addLayer,
    });
  },
});
