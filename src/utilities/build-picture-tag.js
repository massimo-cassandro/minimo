import { classnames } from './classnames.js';

/** @typedef {import('./dom-builder/dom-builder.js').DomBuilderItem} DomBuilderItem */

// TODO aggiungere compatibilità con immagini Unsplash basate su imgix

/**
 * Creates a `picture` domBuilder item for an image rendered through the viewer.
 *
 * Every `source`/`img` `srcset` is built with width descriptors (`w`): for each entry
 * of `sizes`, a candidate is generated for every integer density from 1 to `dpr`.
 * The `sizes` attribute pairs each entry of `sizes` with the corresponding `breakpoints`
 * entry as a `(max-width: …)` media condition; the last entry (without breakpoint) is
 * the default, so `breakpoints` is expected to have one element less than `sizes`.
 *
 * @example
 * // fixed-width thumb (250px, 16:9 ratio, 1x and 2x candidates)
 * buildPictureTag({ baseSrc: 'https://img-viewer.example.com/abc123', alt: '…' });
 * // sizes="250px", srcset="… 250w, … 500w"
 *
 * @example
 * // responsive image: 250px up to 576px, 500px up to 992px, 800px beyond.
 * // NB: `breakpoints` has one entry less than `sizes`: the missing one
 * // corresponds to the *last* `sizes` entry, used as default beyond the last breakpoint
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [250, 500, 800],
 *   breakpoints: [576, 992],
 * });
 * // sizes="(max-width: 576px) 250px, (max-width: 992px) 500px, 800px"
 *
 * @example
 * // custom ratio for numeric entries and candidates up to 3x
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [250, 500],
 *   breakpoints: [768],
 *   ratio: 4/3,
 *   dpr: 3,
 * });
 *
 * @example
 * // different aspect ratio per breakpoint: explicit [width, height] pairs
 * // (can be mixed with numeric entries, which use `ratio`)
 * buildPictureTag({
 *   baseSrc,
 *   sizes: [[250, 250], [800, 450]], // square on mobile, 16:9 on desktop
 *   breakpoints: [576],
 * });
 *
 * @example
 * // dev environment (no avif) and above-the-fold img (no loading="lazy")
 * buildPictureTag({ baseSrc, devMode: true, lazy: false });
 *
 * @param {Object} args
 * @param {string} args.baseSrc - Image base URL (viewer endpoint); its query params are preserved.
 * @param {(number | [number, number])[]} [args.sizes=[250]] - Rendered image sizes, in ascending width order, one per breakpoint plus the default. Each entry is a width (px, height computed with `ratio`) or an explicit `[width, height]` pair (px), allowing a different aspect ratio per breakpoint.
 * @param {number} [args.ratio=16/9] - Default aspect ratio (width / height, as in the CSS `aspect-ratio` property) used to compute the height of numeric `sizes` entries.
 * @param {number} [args.dpr=2] - Maximum pixel density (integer): `srcset` candidates are generated for every density from 1 to `dpr`.
 * @param {number[]} [args.breakpoints=[]] - `max-width` breakpoints (px) paired with `sizes` (one element less than `sizes`).
 * @param {[string, string|number][]} [args.img_params=[['q','60'],['fd',1]]] - Query params (`[name, value]` pairs) added to every generated URL.
 * @param {string[]} [args.formats=['avif','webp','pjpg']] - Image formats: the last one is used for the `img` fallback element, the others for the `source` elements.
 * @param {boolean} [args.devMode=false] - When true, `avif` is excluded from `formats` (not supported by the local dev environment).
 * @param {boolean} [args.lazy=true] - When true, the `img` element gets `loading="lazy"`.
 * @param {boolean} [args.condition=true] - When false, the function returns `null` without building anything.
 * @param {string|null} [args.pictureExtraClass=null] - Extra class(es) for the `picture` element.
 * @param {Object<string, *>} [args.pictureExtraAttrs={}] - Extra attributes for the `picture` element.
 * @param {string|null} [args.imgExtraClass=null] - Extra class(es) for the `img` element.
 * @param {Object<string, *>} [args.imgExtraAttrs={}] - Extra attributes for the `img` element.
 * @param {string} [args.alt=''] - `alt` text for the `img` element.
 * @returns {DomBuilderItem|null} The `picture` domBuilder item, or `null` when `baseSrc` is missing or `condition` is false.
 */
export function buildPictureTag({
  baseSrc,
  sizes = [250],
  ratio = 16/9,
  dpr = 2,
  breakpoints = [],
  img_params = [ ['q', '60'] ],
  formats = ['avif', 'webp', 'pjpg'],
  devMode = false,
  lazy = true,
  condition = true,
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

  const base_url = new URL(baseSrc)
    ,searchParams = new URLSearchParams(base_url.search)

    // sizes normalizzato in coppie [width, height]:
    // per le entry numeriche l'altezza è calcolata con `ratio`
    ,sizePairs = sizes.map(size => Array.isArray(size)
      ? size
      : /** @type {[number, number]} */ ([size, Math.floor(size / ratio)])
    )

    // dimensioni dei candidati srcset (una per ogni densità in `dpr`),
    // senza duplicati (per larghezza), in ordine crescente
    ,srcsetSizes = sizePairs
      .flatMap(([w, h]) => dprList.map(d => /** @type {[number, number]} */ ([w * d, h * d])))
      .filter((pair, idx, arr) => arr.findIndex(p => p[0] === pair[0]) === idx)
      .sort((a, b) => a[0] - b[0])

    // attributo `sizes`: ogni size è abbinata al breakpoint corrispondente (max-width),
    // l'ultima (senza breakpoint) è il valore di default
    ,sizesAttr = sizePairs
      .map(([w], i) => i < breakpoints.length? `(max-width: ${breakpoints[i]}px) ${w}px` : `${w}px`)
      .join(', ')

    // dimensioni intrinseche dell'elemento img (la size più grande)
    ,[imgWidth, imgHeight] = sizePairs[sizePairs.length - 1]

    // indice del candidato srcset usato come src di default dell'img:
    // il candidato 1x della size mediana (mediana inferiore se le size sono pari)
    ,defaultSrcIdx = srcsetSizes.findIndex(([w]) => w === sizePairs[Math.floor((sizePairs.length - 1) / 2)][0])
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
        searchParams.set('bb', `${w}x${h}`);
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
            ...imgExtraAttrs
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
