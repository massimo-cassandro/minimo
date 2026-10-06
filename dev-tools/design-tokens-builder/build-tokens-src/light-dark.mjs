/*
  build-tokens-src/light-dark.mjs
  Supporta l'opzione di config `useLightDarkFunc` (vedi config.mjs): con una
  build sourceModes (vedi build-source-modes.mjs) che definisce sia una modalità `light`
  sia una `dark`, le custom properties presenti in ENTRAMBE — individuate per nome —
  vengono scritte una sola volta, come `--name: light-dark(<valore-light>, <valore-dark>);`,
  invece di essere divise tra il blocco `:root { ... }` di primo livello della modalità base
  e un blocco `@media (prefers-color-scheme: dark) { ... }`. Se i due
  valori sono identici, light-dark() sarebbe ridondante: viene scritto invece
  il valore semplice, ad es. `--name: <valore>;`.

  Sono interessate solo `light` e `dark`:
    - una terza modalità (ad es. una chiave personalizzata `high-contrast` in sourceModes) resta
      del tutto intatta, sempre annidata nella propria regola
      `@media (prefers-color-scheme: <modalità>) { ... }`
    - una proprietà presente in una sola tra `light`/`dark` resta nel blocco della
      propria modalità — sempre dietro la regola `@media` di quella modalità, a meno che quella
      modalità non sia la modalità base configurata

  Le dichiarazioni `light-dark()` condivise finiscono sempre nel blocco della modalità
  base configurata (il `sourceModesBase` di build-source-modes.mjs, qualunque sia tra
  `light`, `dark` o una terza modalità) — mai specificamente nel blocco di `light`
  o di `dark` — dato che la funzione light-dark() si risolve in base al
  `color-scheme` effettivo, indipendentemente dal fatto che la dichiarazione stessa
  si trovi dentro una regola `@media (prefers-color-scheme: ...)` o meno.

  Interazione con `mergeCustomProps`: qui non serve nulla di speciale — il merge
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

/**
 * @param {object} opts
 * @param {Record<string, Record<string,string>>} opts.modeFinalProps  mappa modalità → (nome → coda della dichiarazione), una voce per ogni chiave di sourceModes — come catturata da computeFinalProps()/lastFinalProps (vedi formats/css.mjs) subito dopo ogni chiamata per modalità a sd.formatPlatform('css') in build-source-modes.mjs
 * @param {string[]} opts.modeNames  tutte le chiavi di sourceModes, nell'ordine della config
 * @param {string}   opts.baseMode   modalità il cui blocco viene stampato come `:root` (o selettore personalizzato) di primo livello, senza condizioni — vedi sourceModesBase in config.mjs
 * @param {string}   [opts.selector] customPropsSelector — passato invariato a buildCssBlock() (default: ':root')
 * @param {{name:string,prefixes:string[]}[]} [opts.customPropsGroups]
 * @returns {{blocks: Record<string,string>, counts: Record<string,number>}|null}
 *   Testo del blocco CSS ricostruito + conteggio delle custom props, indicizzato per modalità, per ogni modalità
 *   toccata dalla riconciliazione (`light`, `dark` e `baseMode`, che possono
 *   coincidere) — oppure null quando sourceModes non definisce sia `light` sia
 *   `dark` (useLightDarkFunc non ha allora alcun effetto, vedi config.mjs)
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
    // Preferisce il commento finale lato light (ad es. una $description del token);
    // ripiega su quello lato dark se light non ne ha.
    const comment = light.comment || dark.comment;
    // Valori light/dark uguali: light-dark(x, x) sarebbe ridondante — usa
    // direttamente il valore semplice.
    const value = light.value === dark.value
      ? light.value
      : `light-dark(${light.value}, ${dark.value})`;
    sharedProps[name] = `${value};${comment ? ` ${comment}` : ''}`;
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

  return { blocks, counts };
};
