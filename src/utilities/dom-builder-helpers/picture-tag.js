/*! minimo - buildPictureTag */
import { classnames } from '../classnames.js';

/**
 * @typedef {Object} PictureSizeEntry
 * @property {number} [from] - Breakpoint (px) da cui si applica la size (condizione media `width >=`); omesso nell'(unica) entry predefinita mobile-first.
 * @property {number | [number, number]} size - Larghezza renderizzata (px, altezza calcolata con `ratio`, se impostato) oppure coppia esplicita `[width, height]` (px).
 */

// TODO aggiungere compatibilità con immagini Unsplash basate su imgix
// TODO parametri viewer: le convenzioni attuali (`bb=WxH`, `bb=Wx` per il resize width-only,
// `q`, `fd`, `f`) sono legate al viewer interno; prevedere un meccanismo di astrazione
// per altri servizi con parametri diversi (es. imgix/Unsplash)

/**
 * Crea un elemento domBuilder `picture` per un'immagine servita tramite il viewer.
 *
 * Ogni `srcset` di `source`/`img` è costruito con descrittori di larghezza (`w`): per ogni entry
 * di `sizes` viene generato un candidato per ogni densità intera da 1 a `dpr`.
 * L'attributo `sizes` è costruito in modalità mobile-first: l'entry senza `from` è il
 * default e ogni altra entry si applica dal proprio breakpoint `from` in su, come
 * condizione media `(width >= …)` (sintassi range).
 *
 * @example
 * // thumb a larghezza fissa (250px, candidati 1x e 2x); senza `ratio` né altezze
 * // esplicite, il viewer riceve un resize solo in larghezza (bb=250x) e l'`img` non ha
 * // l'attributo `height`
 * buildPictureTag({ baseSrc: 'https://img-viewer.example.com/abc123', alt: '...' });
 * // sizes="250px", srcset="… 250w, … 500w"
 *
 * @example
 * // immagine responsive: 250px di default, 500px da 576px, 800px da 992px.
 * // NB: l'entry senza `from` è il default mobile-first (ne è attesa esattamente
 * // una); un numero semplice o una coppia [width, height] ne è la scorciatoia
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [250, { from: 576, size: 500 }, { from: 992, size: 800 }],
 * });
 * // sizes="(width >= 992px) 800px, (width >= 576px) 500px, 250px"
 *
 * @example
 * // ratio personalizzato per le size numeriche e candidati fino a 3x
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [250, { from: 768, size: 500 }],
 *   ratio: 4/3,
 *   dpr: 3,
 * });
 *
 * @example
 * // aspect ratio diverso per breakpoint: coppie [width, height] esplicite
 * // (si possono mescolare con size numeriche, che usano `ratio`)
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [[250, 250], { from: 576, size: [800, 450] }], // quadrato su mobile, 16:9 su desktop
 * });
 *
 * @example
 * // ambiente di sviluppo (senza avif) e img above-the-fold (senza loading="lazy")
 * buildPictureTag({ baseSrc, devMode: true, lazy: false });
 *
 * @example
 * // callback onLoad: mostra l'immagine al termine del caricamento
 * buildPictureTag({
 *   baseSrc,
 *   imgExtraClass: 'img-loading',
 *   onLoad: img => img.classList.remove('img-loading'),
 * });
 *
 * @param {Object} args
 * @param {string} args.baseSrc - URL base dell'immagine (endpoint del viewer); i suoi parametri di query vengono conservati.
 * @param {(number | [number, number] | PictureSizeEntry)[]} [args.sizes=[250]] - Dimensioni renderizzate dell'immagine, in qualsiasi ordine. Ogni entry è un oggetto `{from, size}` (vedi {@link PictureSizeEntry}); un numero semplice o una coppia `[width, height]` è la scorciatoia per l'entry predefinita mobile-first (quella senza `from`), attesa esattamente una volta (default: [250])
 * @param {number|null} [args.ratio=null] - Aspect ratio predefinito (larghezza / altezza, come nella proprietà CSS `aspect-ratio`) usato per calcolare l'altezza delle size numeriche. Se null, l'altezza non viene calcolata: gli output legati all'altezza (attributo `height`, altezza nel parametro `bb`) vengono omessi e il viewer mantiene il ratio originale dell'immagine (default: null)
 * @param {number} [args.dpr=2] - Densità di pixel massima (intero): i candidati di `srcset` vengono generati per ogni densità da 1 a `dpr` (default: 2)
 * @param {[string, string|number][]} [args.img_params=[['q','60']]] - Parametri di query (coppie `[name, value]`) aggiunti a ogni URL generato (default: [['q','60']])
 * @param {string[]} [args.formats=['avif','webp','pjpg']] - Formati dell'immagine: l'ultimo viene usato per l'elemento `img` di fallback, gli altri per gli elementi `source` (default: ['avif','webp','pjpg'])
 * @param {boolean} [args.devMode=false] - Se true, `avif` viene escluso da `formats` (non supportato dall'ambiente di sviluppo locale) (default: false)
 * @param {boolean} [args.lazy=true] - Se true, l'elemento `img` riceve `loading="lazy"` (default: true)
 * @param {'high'|'low'|null} [args.fetchpriority=null] - Attributo `fetchpriority` per l'elemento `img`: usare `high` per l'immagine LCP/above-the-fold (tipicamente con `lazy: false`). Se null l'attributo viene omesso (default del browser `auto`) (default: null)
 * @param {((img: HTMLImageElement) => void) | null} [args.onLoad=null] - Chiamata al termine del caricamento dell'immagine, riceve l'elemento `img` (chiamata subito se l'immagine è già completa) (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {boolean} [args.legacyMediaSyntax=false] - Se true, le condizioni media di `sizes` usano `(min-width: …)` invece della sintassi range `(width >= …)`, per i browser più vecchi (precedenti a Chrome/Edge 104, Firefox 102, Safari 16.4) (default: false)
 * @param {string|null} [args.pictureExtraClass=null] - Classe/i extra per l'elemento `picture`. (default: null)
 * @param {Object<string, *>} [args.pictureExtraAttrs={}] - Attributi extra per l'elemento `picture`. (default: {})
 * @param {string|null} [args.imgExtraClass=null] - Classe/i extra per l'elemento `img`. (default: null)
 * @param {Object<string, *>} [args.imgExtraAttrs={}] - Attributi extra per l'elemento `img`. (default: {})
 * @param {string} [args.alt=''] - Testo `alt` per l'elemento `img`. (default: '')
 * @returns {DomBuilderItem|null} L'elemento domBuilder `picture`, oppure `null` quando `baseSrc` manca o `condition` è false.
 */
export function buildPictureTag({
  baseSrc,
  sizes = [250],
  ratio = null,
  dpr = 2,
  img_params = [ ['q', '60'] ],
  formats = ['avif', 'webp', 'pjpg'],
  devMode = false,
  lazy = true,
  fetchpriority = null,
  onLoad = null,
  condition = true,
  legacyMediaSyntax = false,
  pictureExtraClass = null,
  pictureExtraAttrs = {},
  imgExtraClass = null,
  imgExtraAttrs = {},
  // addPopover: false, // TODO popover, se attivato
  // popoverImgWidth: 600,
  alt = '',

}){

  if(baseSrc == null || !condition) {
    return null;
  }

  // avif non supportato dall'ambiente di sviluppo locale
  if(devMode) {
    formats = formats.filter(fmt => fmt !== 'avif');
  }

  // densità generate: da 1 a `dpr`
  const dprList = Array.from({length: dpr}, (_, i) => i + 1);

  // entry di `sizes` normalizzate in oggetti {from, width, height}
  // (per le size numeriche l'altezza è calcolata con `ratio`, se presente, altrimenti è null),
  // ordinate per breakpoint, con il default (from = null) per primo
  const sizeEntries = sizes.map(entry => {
    if(typeof entry === 'object' && !Array.isArray(entry)) {
      const [width, height] = Array.isArray(entry.size)? entry.size : [entry.size, ratio == null? null : Math.floor(entry.size / ratio)];
      return { from: entry.from ?? null, width, height };
    }
    const [width, height] = Array.isArray(entry)? entry : [entry, ratio == null? null : Math.floor(entry / ratio)];
    return { from: null, width, height };
  }).sort((a, b) => (a.from ?? 0) - (b.from ?? 0));

  // entry default (mobile-first, senza `from`): deve essere esattamente una
  const defaultEntry = sizeEntries.find(e => e.from == null) ?? sizeEntries[0]
    ,brkEntries = sizeEntries.filter(e => e.from != null && e !== defaultEntry);

  if(sizeEntries.filter(e => e.from == null).length !== 1) {
    // eslint-disable-next-line no-console
    console.warn('[buildPictureTag] `sizes` must contain exactly one entry without `from` (the mobile-first default)');
  }

  const base_url = new URL(baseSrc)
    ,searchParams = new URLSearchParams(base_url.search)

    // dimensioni dei candidati srcset (una per ogni densità da 1 a `dpr`),
    // senza duplicati (per larghezza), in ordine crescente
    ,srcsetSizes = sizeEntries
      .flatMap(({width, height}) => dprList.map(d => /** @type {[number, number|null]} */ ([width * d, height == null? null : height * d])))
      .filter((pair, idx, arr) => arr.findIndex(p => p[0] === pair[0]) === idx)
      .sort((a, b) => a[0] - b[0])

    // attributo `sizes` (mobile-first): le entry con breakpoint in ordine decrescente
    // (vince la prima condizione che matcha), il default per ultimo
    ,sizesAttr = brkEntries
      .map(({from, width}) => legacyMediaSyntax
        ? `(min-width: ${from}px) ${width}px`
        : `(width >= ${from}px) ${width}px`
      )
      .reverse()
      .concat(`${defaultEntry.width}px`)
      .join(', ')

    // dimensioni intrinseche dell'elemento img: la size più grande
    ,{width: imgWidth, height: imgHeight} = sizeEntries.reduce((max, entry) => entry.width > max.width? entry : max)

    // larghezza 1x della size mediana (mediana inferiore se le size sono pari)
    ,medianWidth = sizeEntries.map(({width}) => width).sort((a, b) => a - b)[Math.floor((sizeEntries.length - 1) / 2)]

    // indice del candidato srcset usato come src di default dell'img
    ,defaultSrcIdx = srcsetSizes.findIndex(([w]) => w === medianWidth)
  ;

  img_params.forEach(([name, value]) => searchParams.set(name, String(value)));

  // TODO popover, se attivato
  // // nome univoco per l'associazione anchor (Anchor Positioning API) tra thumb e popover di ingrandimento
  // const zoomAnchorName = `--zoom-${randomId()}`;

  // // riferimento al popover di ingrandimento, valorizzato dalla sua callback domBuilder
  // // (usato nel listener click della thumb, eseguito solo dopo che l'intera figure è stata costruita)
  // let zoomPopoverEl;

  /** @type {DomBuilderItem} */
  const pictureTag = {
    tag: 'picture',
    className: pictureExtraClass ?? undefined,
    attrs: {
      // style: options.addPopover? `anchor-name: ${zoomAnchorName};` : null, // TODO popover, se attivato
      ...pictureExtraAttrs
    },
    children: formats.map(fmt => {
      const is_default_fmt = fmt === formats.at(-1);
      /** @type {string[]} */
      const srcsetArray = [];

      searchParams.set('f', fmt);

      srcsetSizes.forEach(([w, h]) => {
        // TODO senza altezza `bb=<w>x` vale per questo viewer: prevedere altre convenzioni (es. imgix)
        searchParams.set('bb', `${w}x${h ?? ''}`);
        base_url.search = searchParams.toString();
        srcsetArray.push(`${base_url.toString()} ${w}w`);
      });

      if(is_default_fmt) {

        return {
          tag: 'img',
          className: classnames(imgExtraClass/* , options.addPopover && styles.hasPopover */), // TODO popover, se attivato
          attrs: {
            alt: alt,
            src: srcsetArray[defaultSrcIdx].split(' ')[0], // candidato 1x mediano, senza descrittore
            srcset: srcsetArray.join(','),
            sizes: sizesAttr,
            width: imgWidth,
            height: imgHeight,
            loading: lazy? 'lazy' : null,
            decoding: 'async',
            fetchpriority: fetchpriority,
            ...imgExtraAttrs
          },
          callback: onLoad == null? undefined : el => {
            const img = /** @type {HTMLImageElement} */ (el);
            if(img.complete) {
              onLoad(img);
            } else {
              img.addEventListener('load', () => onLoad(img), {once: true});
            }
          },
          // TODO classe popover, se attivato
          // callback: options.addPopover
          //   ? el => el.addEventListener('click', () => zoomPopoverEl.togglePopover())
          //   : null
        };

      } else {
        // TODO con sizes con ratio differenti, generare una `source` per breakpoint
        // con attributi `media`, `width` e `height`
        return {
          tag: 'source',
          attrs: {
            srcset: srcsetArray.join(','),
            sizes: sizesAttr,
            type: `image/${fmt}`,
            // width:
            // height:
            // media:
          }
        };
      }

    })
  };

  /* TODO popover, se attivato
  // popover di ingrandimento (Popover API + Anchor Positioning API)
  ...(options.addPopover
    ? [{
      tag: 'div',
      className: styles.zoomPopover,
      attrs: {
        popover: 'auto',
        style: `position-anchor: ${zoomAnchorName};`
      },
      callback: el => zoomPopoverEl = el,
      children: unsplashPictureTag(img_data, {width: options.popoverImgWidth, imgExtraClass: styles.popoverImg, addPopover: false})
    }]
    : []
  )

  return [ pictureTag, popoverTag ];
  */


  return pictureTag;

}
