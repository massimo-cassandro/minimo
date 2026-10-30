/*! minimo - buildPictureTag */
import { classnames } from '../classnames.js';

/*
 * TODO valori di `sizes` in rem/em: permettere di indicare `from` e `size` anche in unità relative
 * (es. `'40rem'`), oltre ai px numerici, sia nell'attributo `sizes` sia nelle condizioni media.
 * Da definire come calcolare le dimensioni in px dei candidati `srcset` (es. base font-size configurabile).
 *
 * TODO URL non gestiti dal viewer (`isViewer`) — da valutare
 *
 * `src: string | {src, isViewer}` nelle entry di `sizes`: se `isViewer` è true (default) si aggiungono i parametri
 * `bb`/`q`/`f`, altrimenti l'URL è usato tal quale. Una stringa semplice vale come `{src, isViewer: true}`.
 *
 * Dubbi da sciogliere:
 * - `formats`: un URL non gestito dal viewer non può essere convertito in avif/webp/pjpg. Proposta: usarlo tal
 *   quale in tutti gli `srcset`, con il formato a carico di chi lo passa. Alternativa: omettere le `source`.
 * - `dpr`: un URL non-viewer non è ridimensionabile, quindi un solo candidato per entry
 *   (descrittore `w` = larghezza della size) invece di uno per densità.
 *
 *
 * TODO `baseSrcset` — da valutare
 * Array parallelo a `sizes`, di stringhe o `{src, isViewer}`, come alternativa a `src` nelle entry: per ogni entry
 * si userebbe `baseSrcset[i]` al posto di `baseSrc`; se manca o è null, si userebbe `baseSrc`.
 * Dubbi da sciogliere: `sizes` viene riordinato per breakpoint, quindi `baseSrcset[i]` richiede di tracciare
 * l'indice originale prima del sort (fragile); servirebbe comunque una condizione `media` per ogni URL.
 *
 * TODO valutare implementazione `sizes=auto`: https://web.dev/blog/web-platform-09-2026?hl=en#sizesauto_for_lazy-loaded_images_becomes_baseline
 *
 * TODO aggiungere compatibilità con immagini Unsplash basate su imgix
 *
 * TODO valutare `imgParams` per le entry senza `src` (es. `q` diverso per size): oggi è ammesso solo sulle entry
 * con `src`, perché le altre condividono un solo `srcset`
 *
 */

/**
 * @typedef {Object} PictureSizeEntry
 * @property {number} [from] - Breakpoint (px) da cui si applica la size (condizione media `width >=`); omesso nell'(unica) entry predefinita mobile-first. Non si usa insieme a `src`: viene ignorato, la condizione è solo in `media`.
 * @property {number | [number, number]} size - Larghezza renderizzata (px, altezza calcolata con `ratio`, se impostato) oppure coppia esplicita `[width, height]` (px).
 * @property {string|null} [src] - URL di un'immagine diversa da `baseSrc`, da usare quando corrisponde `media`: l'URL viene risolto come `baseSrc`, conservando i suoi parametri di query. L'entry genera una `source` per ogni formato tranne l'ultimo e resta fuori da `srcset`, `sizes`, `width`, `height` e `src` di `img`. Se è presente ma `null`/`undefined` (foto opzionale) l'entry viene ignorata senza avvisi, anche se ha `media`; senza `media` viene ignorata con un avviso.
 * @property {[string, string|number][]|null} [imgParams] - Solo per le entry con `src`: sostituisce del tutto `imgParams` generale (vedi il parametro `imgParams` di {@link buildPictureTag} per i segnaposto). Su un'entry senza `src` viene ignorato con un avviso.
 * @property {string} [media] - Condizione media delle `source` dell'entry, usata tal quale (`legacyMediaSyntax` non la riguarda). Senza la proprietà `src` l'entry viene ignorata con un avviso.
 */

/**
 * Crea un elemento domBuilder `picture` per un'immagine servita tramite il viewer.
 *
 * Ogni `srcset` di `source`/`img` è costruito con descrittori di larghezza (`w`): per ogni entry
 * di `sizes` viene generato un candidato per ogni densità intera da 1 a `dpr`.
 * L'attributo `sizes` è costruito in modalità mobile-first: l'entry senza `from` è il
 * default e ogni altra entry si applica dal proprio breakpoint `from` in su, come
 * condizione media `(width >= …)` (sintassi range).
 *
 * Le entry con `src` e `media` usano un'immagine diversa da `baseSrc`: generano delle `source` proprie,
 * poste prima delle altre (vince la prima che corrisponde) e nell'ordine in cui sono scritte in `sizes`.
 * Per loro valgono `dpr`, `formats`, `devMode` e `ratio`, come per le altre entry, e `imgParams`,
 * a meno che non abbiano il proprio.
 *
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * buildPictureTag({
 *   baseSrc: 'path/to/viewer/...', // URL base del viewer, OBBL
 *   sizes: [250], // size renderizzate (px, [w, h], {from, size} o {media, size, src}), FAC
 *   ratio: null, // aspect ratio w/h per le size numeriche, FAC
 *   dpr: 2, // densità massima dei candidati srcset, FAC
 *   imgParams: [['q', '60']], // parametri query aggiunti agli URL (segnaposto {w}, {h}, {f}), FAC
 *   formats: ['avif', 'webp', 'pjpg'], // formati (l'ultimo per l'img), FAC
 *   devMode: false, // esclude avif, FAC
 *   lazy: true, // loading="lazy", FAC
 *   fetchpriority: null, // 'high' | 'low' | null, FAC
 *   onLoad: null, // callback(img) a caricamento completato, FAC
 *   condition: true, // se false restituisce null, FAC
 *   legacyMediaSyntax: false, // (min-width: …) invece di (width >= …), FAC
 *   pictureExtraClass: null, // classi extra picture, FAC
 *   pictureExtraAttrs: {}, // attributi extra picture, FAC
 *   imgExtraClass: null, // classi extra img, FAC
 *   imgExtraAttrs: {}, // attributi extra img, FAC
 *   alt: '', // testo alt, FAC
 * });
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
 * // immagine diversa da `baseSrc` in un solo caso: la foto alternativa è opzionale e, con `src`
 * // null o undefined, l'entry viene ignorata. La foto non può stare nello `srcset` comune,
 * // quindi l'entry genera due `source` proprie (avif, webp) prima di quelle normali
 * buildPictureTag({
 *   baseSrc: `/viewer/${imgId}`,
 *   sizes: [
 *     [430, 352],
 *     { from: 760, size: [600, 720] },
 *     {
 *       media: '(min-width: 47.5rem) and (max-width: 63.99rem) and (orientation: portrait)',
 *       size: [480, 720],
 *       src: alternativeImgId != null ? `/viewer/${alternativeImgId}` : null,
 *     },
 *   ],
 * });
 * // <source media="(min-width: 47.5rem) and …" sizes="480px"
 * //   srcset="/viewer/…&bb=480x720 480w,…" type="image/avif">
 *
 * @example
 * // immagine alternativa servita da un altro servizio
 * // (es. imgix): `imgParams` dell'entry sostituisce
 * // quello generale e i segnaposto indicano dove inserire dimensioni
 * // e formato al posto di `f` e `bb`
 * buildPictureTag({
 *   baseSrc: `/viewer/${imgId}`,
 *   imgParams: [['q', '70'], ['fd', '1']],
 *   sizes: [
 *     [430, 352],
 *     { from: 760, size: [600, 720] },
 *     {
 *       media: '(min-width: 47.5rem) and (orientation: portrait)',
 *       size: [480, 720],
 *       src: 'https://images.unsplash.com/photo-123',
 *       imgParams: [['q', '70'], ['fit', 'crop'], ['w', '{w}'], ['h', '{h}'], ['fm', '{f}']],
 *     },
 *   ],
 * });
 * // <source srcset="https://images.unsplash.com/photo-123?q=70&fit=crop&w=480&h=720&fm=avif 480w,…" …>
 *
 * @example
 * // tutta l'immagine da un altro servizio: i segnaposto valgono anche in `imgParams` generale.
 * // Senza altezza (né `ratio`) il parametro `h` viene omesso
 * buildPictureTag({
 *   baseSrc: 'https://images.unsplash.com/photo-123',
 *   sizes: [250, { from: 768, size: 500 }],
 *   imgParams: [['q', '60'], ['w', '{w}'], ['h', '{h}'], ['fm', '{f}']],
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
 * @param {string} args.baseSrc - URL base dell'immagine (endpoint del viewer); i suoi parametri di query vengono conservati. Un URL relativo (es. `/img/abc123`) viene risolto rispetto alla location corrente; se relativo alla root (inizia con `/`, ma non con `//`), resta tale anche negli URL generati.
 * @param {(number | [number, number] | PictureSizeEntry)[]} [args.sizes=[250]] - Dimensioni renderizzate dell'immagine, in qualsiasi ordine. Ogni entry è un oggetto `{from, size}` o, per un'immagine diversa da `baseSrc`, `{media, size, src}` (vedi {@link PictureSizeEntry}); un numero semplice o una coppia `[width, height]` è la scorciatoia per l'entry predefinita mobile-first (quella senza `from`), attesa esattamente una volta: se tra le entry non ne resta nessuna utilizzabile, viene emesso un avviso e la funzione restituisce `null` (default: [250])
 * @param {number|null} [args.ratio=null] - Aspect ratio predefinito (larghezza / altezza, come nella proprietà CSS `aspect-ratio`) usato per calcolare l'altezza delle size numeriche. Se null, l'altezza non viene calcolata: gli output legati all'altezza (attributo `height`, altezza nel parametro `bb`) vengono omessi e il viewer mantiene il ratio originale dell'immagine (default: null)
 * @param {number} [args.dpr=2] - Densità di pixel massima (intero): i candidati di `srcset` vengono generati per ogni densità da 1 a `dpr` (default: 2)
 * @param {[string, string|number][]} [args.imgParams=[['q','60']]] - Parametri di query (coppie `[name, value]`) aggiunti a ogni URL generato. Nei valori si possono usare i segnaposto `{w}` e `{h}` (dimensioni del candidato, già moltiplicate per la densità) e `{f}` (formato), per i servizi con convenzioni diverse da quelle del viewer interno. Se non ci sono segnaposto vengono aggiunti automaticamente `f` e `bb` (`bb=<w>x<h>`), altrimenti nessuno dei due. In assenza di altezza un parametro che vale solo `{h}` viene omesso, mentre dentro un valore più lungo `{h}` diventa vuoto (default: [['q','60']])
 * @param {string[]} [args.formats=['avif','webp','pjpg']] - Formati dell'immagine: l'ultimo viene usato per l'elemento `img` di fallback, gli altri per gli elementi `source` (default: ['avif','webp','pjpg'])
 * @param {boolean} [args.devMode=false] - Se true, `avif` viene escluso da `formats` (non supportato dall'ambiente di sviluppo locale) (default: false)
 * @param {boolean} [args.lazy=true] - Se true, l'elemento `img` riceve `loading="lazy"` (default: true)
 * @param {'high'|'low'|null} [args.fetchpriority=null] - Attributo `fetchpriority` per l'elemento `img`: usare `high` per l'immagine LCP/above-the-fold (tipicamente con `lazy: false`). Se null l'attributo viene omesso (default del browser `auto`) (default: null)
 * @param {((img: HTMLImageElement) => void) | null} [args.onLoad=null] - Chiamata al termine del caricamento dell'immagine, riceve l'elemento `img` (chiamata subito se l'immagine è già completa) (default: null)
 * @param {boolean} [args.condition=true] - Se false, la funzione restituisce `null` senza costruire nulla (default: true)
 * @param {boolean} [args.legacyMediaSyntax=false] - Se true, le condizioni media di `sizes` usano `(min-width: …)` invece della sintassi range `(width >= …)`, per i browser più vecchi (precedenti a Chrome/Edge 104, Firefox 102, Safari 16.4). Non riguarda `media` delle entry di `sizes` (default: false)
 * @param {string|null} [args.pictureExtraClass=null] - Classe/i extra per l'elemento `picture`. (default: null)
 * @param {Object<string, *>} [args.pictureExtraAttrs={}] - Attributi extra per l'elemento `picture`. (default: {})
 * @param {string|null} [args.imgExtraClass=null] - Classe/i extra per l'elemento `img`. (default: null)
 * @param {Object<string, *>} [args.imgExtraAttrs={}] - Attributi extra per l'elemento `img`. (default: {})
 * @param {string} [args.alt=''] - Testo `alt` per l'elemento `img`. (default: '')
 * @returns {DomBuilderItem|null} L'elemento domBuilder `picture`, oppure `null` quando `baseSrc` manca, `condition` è false o `sizes` non contiene entry utilizzabili.
 */
export function buildPictureTag({
  baseSrc,
  sizes = [250],
  ratio = null,
  dpr = 2,
  imgParams = [ ['q', '60'] ],
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

  // dimensioni di una size: per le size numeriche l'altezza è calcolata con `ratio`, se presente, altrimenti è null
  const parseSize = size => Array.isArray(size)? size : [size, ratio == null? null : Math.floor(size / ratio)];

  // candidati srcset di una size (uno per ogni densità da 1 a `dpr`)
  const getCandidates = ({width, height}) => dprList.map(d => /** @type {[number, number|null]} */ ([width * d, height == null? null : height * d]));

  // voci dell'attributo `srcset` per un'immagine e un formato
  const buildSrcset = (src, candidates, fmt, params = imgParams) => {
    // gli URL relativi (es. `/img/abc123`) vengono risolti rispetto alla location corrente
    const url = new URL(src, globalThis.location?.href)
      ,baseSearch = url.search

      // src relativo alla root: negli URL generati viene omessa l'origine aggiunta per la risoluzione
      ,isRootRelative = src.startsWith('/') && !src.startsWith('//')

      // senza segnaposto valgono le convenzioni del viewer interno
      ,allParams = params.some(([, value]) => /\{[whf]\}/.test(String(value)))
        ? params
        : [...params, ['f', '{f}'], ['bb', '{w}x{h}']];

    return candidates.map(([w, h]) => {
      const searchParams = new URLSearchParams(baseSearch);

      allParams.forEach(([name, value]) => {
        if(String(value) === '{h}' && h == null) {
          searchParams.delete(name);
        } else {
          searchParams.set(name, String(value)
            .replaceAll('{w}', String(w))
            .replaceAll('{h}', String(h ?? ''))
            .replaceAll('{f}', fmt)
          );
        }
      });

      url.search = searchParams.toString();
      return `${isRootRelative? url.pathname + url.search : url.toString()} ${w}w`;
    });
  };

  // entry con `src` e `media`: hanno `source` proprie e restano fuori da tutti i calcoli successivi
  /** @type {PictureSizeEntry[]} */
  const altEntries = [];

  const stdEntries = sizes.filter(entry => {
    if(typeof entry !== 'object' || Array.isArray(entry)) {
      return true;
    }

    // `src` presente ma nullo: foto opzionale assente, nessun avviso
    if('src' in entry && entry.src == null) {
      return false;
    }

    const hasSrc = entry.src != null
      ,hasMedia = !!entry.media?.trim();

    if(hasSrc && hasMedia) {
      altEntries.push(entry);
      return false;
    }

    // una `source` senza `media` corrisponderebbe sempre e nasconderebbe tutte le altre
    if(hasSrc || hasMedia) {
      // eslint-disable-next-line no-console
      console.warn(`[buildPictureTag] \`sizes\` entry ignored: \`src\` and \`media\` must be used together (${hasSrc? 'media' : 'src'} is missing)`);
      return false;
    }

    // le entry senza `src` condividono un solo `srcset`
    if(entry.imgParams != null) {
      // eslint-disable-next-line no-console
      console.warn('[buildPictureTag] `imgParams` ignored in a `sizes` entry without `src`');
    }

    return true;
  });

  // entry di `sizes` normalizzate in oggetti {from, width, height},
  // ordinate per breakpoint, con il default (from = null) per primo
  const sizeEntries = stdEntries.map(entry => {
    if(typeof entry === 'object' && !Array.isArray(entry)) {
      const [width, height] = parseSize(entry.size);
      return { from: entry.from ?? null, width, height };
    }
    const [width, height] = parseSize(entry);
    return { from: null, width, height };
  }).sort((a, b) => (a.from ?? 0) - (b.from ?? 0));

  // entry default (mobile-first, senza `from`): deve essere esattamente una
  const defaultEntry = sizeEntries.find(e => e.from == null) ?? sizeEntries[0]
    ,brkEntries = sizeEntries.filter(e => e.from != null && e !== defaultEntry);

  if(sizeEntries.filter(e => e.from == null).length !== 1) {
    // eslint-disable-next-line no-console
    console.warn('[buildPictureTag] `sizes` must contain exactly one entry without `from` (the mobile-first default)');
  }

  // tutte le entry sono state ignorate (o `sizes` è vuoto): non c'è una size da assegnare all'img
  if(!sizeEntries.length) {
    return null;
  }

  // dimensioni dei candidati srcset, senza duplicati (per larghezza), in ordine crescente
  const srcsetSizes = sizeEntries
      .flatMap(getCandidates)
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

  // `source` delle entry con `src` e `media`: una per ogni formato tranne l'ultimo (quello dell'img),
  // prima di quelle normali perché vince la prima che corrisponde
  const altSources = altEntries.flatMap(({src, media, size, imgParams: entryParams}) => {
    const [width, height] = parseSize(size);

    return formats.slice(0, -1).map(fmt => ({
      tag: 'source',
      attrs: {
        srcset: buildSrcset(src, getCandidates({width, height}), fmt, entryParams ?? imgParams).join(','),
        sizes: `${width}px`,
        type: `image/${fmt}`,
        media: media,
      }
    }));
  });

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
    children: [...altSources, ...formats.map(fmt => {
      const is_default_fmt = fmt === formats.at(-1)
        ,srcsetArray = buildSrcset(baseSrc, srcsetSizes, fmt);

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
        // TODO con sizes con ratio differenti e la stessa immagine, generare una `source` per breakpoint
        // con attributi `media`, `width` e `height` (`media` è già gestita per le entry con `src`, vedi `altSources`)
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

    })]
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
