/*! minimo - buildPictureTag */
import { classnames } from '../classnames.js';

/**
 * @typedef {Object} PictureSizeEntry
 * @property {number} [from] - Breakpoint (px) the size applies from (`width >=` media condition); omitted in the (single) mobile-first default entry.
 * @property {number | [number, number]} size - Rendered width (px, height computed with `ratio`, if set) or explicit `[width, height]` pair (px).
 */

// TODO aggiungere compatibilità con immagini Unsplash basate su imgix
// TODO parametri viewer: le convenzioni attuali (`bb=WxH`, `bb=Wx` per il resize width-only,
// `q`, `fd`, `f`) sono legate al viewer interno; prevedere un meccanismo di astrazione
// per altri servizi con parametri diversi (es. imgix/Unsplash)

/**
 * Creates a `picture` domBuilder item for an image rendered through the viewer.
 *
 * Every `source`/`img` `srcset` is built with width descriptors (`w`): for each entry
 * of `sizes`, a candidate is generated for every integer density from 1 to `dpr`.
 * The `sizes` attribute is built mobile-first: the entry without `from` is the
 * default, and every other entry applies from its `from` breakpoint up, as a
 * `(width >= …)` media condition (range syntax).
 *
 * @example
 * // fixed-width thumb (250px, 1x and 2x candidates); with no `ratio` nor explicit
 * // heights, the viewer gets a width-only resize (bb=250x) and the `img` has no
 * // `height` attribute
 * buildPictureTag({ baseSrc: 'https://img-viewer.example.com/abc123', alt: '…' });
 * // sizes="250px", srcset="… 250w, … 500w"
 *
 * @example
 * // responsive image: 250px by default, 500px from 576px, 800px from 992px.
 * // NB: the entry without `from` is the mobile-first default (exactly one is
 * // expected); a bare number or [width, height] pair is a shorthand for it
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [250, { from: 576, size: 500 }, { from: 992, size: 800 }],
 * });
 * // sizes="(width >= 992px) 800px, (width >= 576px) 500px, 250px"
 *
 * @example
 * // custom ratio for numeric sizes and candidates up to 3x
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [250, { from: 768, size: 500 }],
 *   ratio: 4/3,
 *   dpr: 3,
 * });
 *
 * @example
 * // different aspect ratio per breakpoint: explicit [width, height] pairs
 * // (can be mixed with numeric sizes, which use `ratio`)
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [[250, 250], { from: 576, size: [800, 450] }], // square on mobile, 16:9 on desktop
 * });
 *
 * @example
 * // dev environment (no avif) and above-the-fold img (no loading="lazy")
 * buildPictureTag({ baseSrc, devMode: true, lazy: false });
 *
 * @example
 * // onLoad callback: reveal the image once it has finished loading
 * buildPictureTag({
 *   baseSrc,
 *   imgExtraClass: 'img-loading',
 *   onLoad: img => img.classList.remove('img-loading'),
 * });
 *
 * @param {Object} args
 * @param {string} args.baseSrc - Image base URL (viewer endpoint); its query params are preserved.
 * @param {(number | [number, number] | PictureSizeEntry)[]} [args.sizes=[250]] - Rendered image sizes, in any order. Each entry is a `{from, size}` object (see {@link PictureSizeEntry}); a bare number or `[width, height]` pair is a shorthand for the mobile-first default entry (the one without `from`), expected exactly once. (default: [250])
 * @param {number|null} [args.ratio=null] - Default aspect ratio (width / height, as in the CSS `aspect-ratio` property) used to compute the height of numeric sizes. When null, no height is computed: the height-related output (`height` attribute, height in the `bb` param) is omitted and the viewer preserves the image's own ratio. (default: null)
 * @param {number} [args.dpr=2] - Maximum pixel density (integer): `srcset` candidates are generated for every density from 1 to `dpr`. (default: 2)
 * @param {[string, string|number][]} [args.img_params=[['q','60']]] - Query params (`[name, value]` pairs) added to every generated URL. (default: [['q','60']])
 * @param {string[]} [args.formats=['avif','webp','pjpg']] - Image formats: the last one is used for the `img` fallback element, the others for the `source` elements. (default: ['avif','webp','pjpg'])
 * @param {boolean} [args.devMode=false] - When true, `avif` is excluded from `formats` (not supported by the local dev environment). (default: false)
 * @param {boolean} [args.lazy=true] - When true, the `img` element gets `loading="lazy"`. (default: true)
 * @param {'high'|'low'|null} [args.fetchpriority=null] - `fetchpriority` attribute for the `img` element: use `high` for the LCP/above-the-fold image (typically with `lazy: false`). When null the attribute is omitted (browser default `auto`). (default: null)
 * @param {((img: HTMLImageElement) => void) | null} [args.onLoad=null] - Called once the image has finished loading, receiving the `img` element (called immediately if the image is already complete). (default: null)
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything. (default: true)
 * @param {boolean} [args.legacyMediaSyntax=false] - When true, the `sizes` media conditions use `(min-width: …)` instead of the range syntax `(width >= …)`, for older browsers (pre Chrome/Edge 104, Firefox 102, Safari 16.4). (default: false)
 * @param {string|null} [args.pictureExtraClass=null] - Extra class(es) for the `picture` element. (default: null)
 * @param {Object<string, *>} [args.pictureExtraAttrs={}] - Extra attributes for the `picture` element. (default: {})
 * @param {string|null} [args.imgExtraClass=null] - Extra class(es) for the `img` element. (default: null)
 * @param {Object<string, *>} [args.imgExtraAttrs={}] - Extra attributes for the `img` element. (default: {})
 * @param {string} [args.alt=''] - `alt` text for the `img` element. (default: '')
 * @returns {DomBuilderItem|null} The `picture` domBuilder item, or `null` when `baseSrc` is missing or `condition` is false.
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
