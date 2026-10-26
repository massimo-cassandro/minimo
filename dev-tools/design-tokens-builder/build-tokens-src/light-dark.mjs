/*
  build-tokens-src/light-dark.mjs
  Supporta l'opzione di config `useLightDarkFunc` (vedi config.mjs): con una
  build sourceModes (vedi build-source-modes.mjs) che definisce sia una modalità `light`
  sia una `dark`, le custom properties DI COLORE presenti in ENTRAMBE — individuate per
  nome — vengono scritte una sola volta, come `--name: light-dark(<valore-light>, <valore-dark>);`,
  invece di essere divise tra il blocco `:root { ... }` di primo livello della modalità base
  e un blocco `@media (prefers-color-scheme: dark) { ... }`. Se i due
  valori sono identici, light-dark() sarebbe ridondante: viene scritto invece
  il valore semplice, ad es. `--name: <valore>;` (qualunque sia il tipo).

  Solo colori: light-dark() accetta esclusivamente valori di colore, con qualsiasi altro
  valore (ad es. `url(...)`, una dimensione, un gradiente) la dichiarazione non è valida
  e il browser la ignora. Le proprietà non di colore, anche se presenti in entrambe le
  modalità, restano quindi divise come con useLightDarkFunc disattivato: valore light
  nel blocco della propria modalità, valore dark in `@media (prefers-color-scheme: dark)`.
  Il criterio è il `$type` del token di origine (vedi lastPropTypes in formats/css.mjs):
  `color` → light-dark(), qualsiasi altro tipo → divisione `@media`. Per le proprietà
  senza tipo (ad es. quelle conservate da mergeCustomProps) si usa un controllo prudente
  sul valore (vedi isColorValue()): in caso di dubbio non si usa light-dark(), così il
  caso peggiore è una divisione `@media` in più, mai una dichiarazione non valida.

  Sono interessate solo `light` e `dark`:
    - una terza modalità (ad es. una chiave personalizzata `high-contrast` in sourceModes) resta
      del tutto intatta, sempre annidata nella propria regola
      `@media (prefers-color-scheme: <modalità>) { ... }`
    - una proprietà presente in una sola tra `light`/`dark` resta nel blocco della
      propria modalità — sempre dietro la regola `@media` di quella modalità, a meno che quella
      modalità non sia la modalità base configurata
    - una proprietà presente in entrambe ma non di colore (vedi sopra) è trattata esattamente
      come una proprietà presente in una sola modalità: ognuna delle due resta nel blocco
      della propria modalità

  Le dichiarazioni `light-dark()` condivise finiscono sempre nel blocco della modalità
  base configurata (il `sourceModesBase` di build-source-modes.mjs, qualunque sia tra
  `light`, `dark` o una terza modalità) — mai specificamente nel blocco di `light`
  o di `dark` — dato che la funzione light-dark() si risolve in base al
  `color-scheme` effettivo, indipendentemente dal fatto che la dichiarazione stessa
  si trovi dentro una regola `@media (prefers-color-scheme: ...)` o meno.

  Interazione con `mergeCustomProps`: le dichiarazioni preesistenti `light-dark(X, Y)` vengono
  scomposte in X (light) e Y (dark) già in fase di lettura (vedi loadExistingCustomPropsScoped()
  in ../merge-css.mjs), così da non essere ricombinate annidate. Per il resto il merge
  per modalità con le custom properties preesistenti (vedi ../merge-css.mjs)
  viene già eseguito prima, dentro computeFinalProps() (formats/css.mjs), prima che
  questo modulo veda le proprietà. Quindi un file preesistente scritto con la
  classica divisione `@media (prefers-color-scheme: dark)` (cioè generato prima che
  useLightDarkFunc fosse attivato) viene riconciliato in chiamate light-dark()
  come i valori appena generati, individuando le proprietà per nome. Poiché i valori
  uniti in questo modo non erano mai stati pensati per essere combinati in chiamate light-dark(),
  contenuti preesistenti inattesi (ad es. una proprietà aggiunta a mano il cui nome
  collide per caso tra le modalità) possono produrre un valore combinato non valido —
  da correggere a cura dell'utente, come ogni altro caso limite di mergeCustomProps.
*/

import { buildCssBlock } from './formats/css.mjs';

/*
  Divide la coda di una dichiarazione (come prodotta da computeFinalProps(): valore +
  `;` finale + eventuale commento finale) nel suo valore CSS semplice e nel suo
  commento finale, così che il valore possa essere inserito come argomento di light-dark()
  senza trascinare con sé `;`/commento.
*/
/** @param {string} tail @returns {{value: string, comment: string}} */
const splitTail = (tail) => {
  const match = /^(.*?);\s*(\/\*.*\*\/)?\s*$/.exec(tail.trim());
  if (!match) return { value: tail.trim().replace(/;$/, ''), comment: '' };
  return { value: match[1].trim(), comment: match[2] ?? '' };
};

/*
  Controllo di riserva per le proprietà senza `$type`: true solo per valori che sono
  sicuramente un colore (esadecimale, funzioni di colore, `transparent`/`currentcolor`).
  Esclusi esplicitamente immagini (url(), image-set(), *-gradient()) e numeri/dimensioni;
  tutto il resto (incluso un semplice `var(--x)`, che potrebbe essere qualsiasi cosa)
  è considerato dubbio e quindi non di colore.
*/
/** @param {string} value @returns {boolean} */
const isColorValue = (value) => {
  const v = value.trim().toLowerCase();
  if (/url\(|image-set\(|gradient\(/.test(v)) return false;
  if (/^[-+.\d]/.test(v)) return false;
  return /^#[\da-f]{3,8}$/.test(v)
    || /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/.test(v)
    || v === 'transparent'
    || v === 'currentcolor';
};

/**
 * @param {object} opts
 * @param {Record<string, Record<string,string>>} opts.modeFinalProps  mappa modalità → (nome → coda della dichiarazione), una voce per ogni chiave di sourceModes — come catturata da computeFinalProps()/lastFinalProps (vedi formats/css.mjs) subito dopo ogni chiamata per modalità a sd.formatPlatform('css') in build-source-modes.mjs
 * @param {Record<string, Record<string,string>>} [opts.modePropTypes]  mappa modalità → (nome → `$type` del token di origine), come catturata da lastPropTypes (vedi formats/css.mjs); le proprietà assenti vengono valutate in base al valore (default: {})
 * @param {string[]} opts.modeNames  tutte le chiavi di sourceModes, nell'ordine della config
 * @param {string}   opts.baseMode   modalità il cui blocco viene stampato come `:root` (o selettore personalizzato) di primo livello, senza condizioni — vedi sourceModesBase in config.mjs
 * @param {string}   [opts.selector] customPropsSelector — passato invariato a buildCssBlock() (default: ':root')
 * @param {{name:string,prefixes:string[]}[]} [opts.customPropsGroups]
 * @returns {{blocks: Record<string,string>, counts: Record<string,number>, excluded: string[]}|null}
 *   Testo del blocco CSS ricostruito + conteggio delle custom props, indicizzato per modalità, per ogni modalità
 *   toccata dalla riconciliazione (`light`, `dark` e `baseMode`, che possono
 *   coincidere), più l'elenco delle proprietà presenti in entrambe le modalità ma escluse
 *   da light-dark() perché non di colore — oppure null quando sourceModes non definisce
 *   sia `light` sia `dark` (useLightDarkFunc non ha allora alcun effetto, vedi config.mjs)
 */
export const applyLightDarkFunc = ({ modeFinalProps, modePropTypes = {}, modeNames, baseMode, selector, customPropsGroups }) => {
  if (!modeNames.includes('light') || !modeNames.includes('dark')) return null;

  const lightProps = modeFinalProps.light;
  const darkProps = modeFinalProps.dark;
  const lightTypes = modePropTypes.light ?? {};
  const darkTypes = modePropTypes.dark ?? {};
  const commonNames = Object.keys(lightProps).filter((name) => name in darkProps);

  /*
    Colore se il `$type` (di una o di entrambe le modalità) è `color` e nessuna delle due
    indica un tipo diverso; senza tipo, entrambi i valori devono superare isColorValue().
  */
  /** @param {string} name @param {string} lightValue @param {string} darkValue */
  const isColorProp = (name, lightValue, darkValue) => {
    const types = [lightTypes[name], darkTypes[name]].filter(Boolean);
    if (types.length) return types.every((type) => type === 'color');
    return isColorValue(lightValue) && isColorValue(darkValue);
  };

  /** @type {Record<string,string>} */
  const sharedProps = {};
  /** @type {string[]} */
  const excluded = [];
  for (const name of commonNames) {
    const light = splitTail(lightProps[name]);
    const dark = splitTail(darkProps[name]);
    // Preferisce il commento finale lato light (ad es. una $description del token);
    // ripiega su quello lato dark se light non ne ha.
    const comment = light.comment || dark.comment;
    let value;
    if (light.value === dark.value) {
      // Valori light/dark uguali: light-dark(x, x) sarebbe ridondante — usa
      // direttamente il valore semplice, qualunque sia il tipo.
      value = light.value;
    } else if (isColorProp(name, light.value, dark.value)) {
      value = `light-dark(${light.value}, ${dark.value})`;
    } else {
      // Non di colore: resta divisa tra le due modalità, come se fosse presente
      // in una sola di esse (non viene rimossa da light/dark qui sotto).
      excluded.push(name);
      continue;
    }
    sharedProps[name] = `${value};${comment ? ` ${comment}` : ''}`;
  }

  const sharedNames = Object.keys(sharedProps);
  const stripShared = (props) => {
    const copy = { ...props };
    for (const name of sharedNames) delete copy[name];
    return copy;
  };

  /** @type {Record<string, Record<string,string>>} */
  const updatedFinalProps = { ...modeFinalProps };
  updatedFinalProps.light = stripShared(lightProps);
  updatedFinalProps.dark = stripShared(darkProps);
  /*
    Le dichiarazioni condivise finiscono sempre nella mappa della modalità base — reinserendole
    se la modalità base è proprio `light` o `dark` (la cui mappa è appena stata ripulita
    qui sopra), oppure nella mappa di una terza modalità.
  */
  updatedFinalProps[baseMode] = { ...updatedFinalProps[baseMode], ...sharedProps };

  /*
    Il valore `color-scheme` della modalità base viene sempre normalizzato in
    "light dark [...altre modalità]", con `light` prima di `dark`, indipendentemente dall'
    ordine in cui le chiavi di sourceModes sono dichiarate nella config o da quale delle
    due sia la modalità base configurata — light-dark() stessa è posizionale
    (prima il valore light, poi quello dark), quindi la dichiarazione
    `color-scheme` che l'accompagna segue la stessa lettura prevedibile. Le modalità
    diverse da light/dark, se presenti, vengono aggiunte dopo, senza modifiche.
  */
  const restModes = modeNames.filter((mode) => mode !== 'light' && mode !== 'dark');
  const colorScheme = ['light', 'dark', ...restModes].join(' ');

  /*
    Solo `light`, `dark` e la modalità base (che può essere una delle due, oppure
    una terza modalità) devono essere renderizzate di nuovo: ogni altra chiave di sourceModes
    non viene toccata e conserva il blocco già costruito (vedi build-source-modes.mjs).
  */
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

  return { blocks, counts, excluded };
};
