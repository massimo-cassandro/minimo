// estrae da un oggetto result di una singola riga, le informazioni necessarie
// all'applicazione e dove necessario esegue piccole post-eleborazioni

/*
raw data:

{
    "id": "uNvgvo2cs7k",
    "alternative_slugs": {...},
    "created_at": "2018-04-10T13:00:44Z",
    "updated_at": "2026-07-06T07:30:35Z",
    "promoted_at": "2018-04-11T07:34:53Z",
    "width": 3840,
    "height": 2565,
    "color": "#26260c",
    "blur_hash": "LoGuj:IVaKWX~XIqWBf6x]NeWDo0",
    "description": null,
    "breadcrumbs": [],
    "urls": {
        "raw"      : "https://images.unsplash.com/photo-1523365154888-8a758819b722?ixid=M3w5OTA3Mjh8MHwxfHNlYXJjaHwxfHxTaWNpbGlhfGl0fDF8MHx8fDE3ODMzMzA5NTN8MA&ixlib=rb-4.1.0",
        "full"     : "...",
        "regular"  : "...",
        "small"    : "...",
        "thumb"    : "...",
        "small_s3" : "..."
    },
    "likes": 1001,
    "liked_by_user": false,
    "bookmarked": false,
    "current_user_collections": [],
    "sponsorship": null,
    "topic_submissions": {...},
    "asset_type": "photo",
    "slug": "photo-of-house-near-cliff-and-body-of-water-uNvgvo2cs7k",
    "alt_description": "photo of house near cliff and body of water",
    "links": {
        "html": "https://unsplash.com/photos/photo-of-house-near-cliff-and-body-of-water-uNvgvo2cs7k",
        "self": "...",
        "download": "...",
        "download_location": "..."
    },
    "user": {
        ...
        "links": {
            "html": "https://unsplash.com/@samferrara"
            "self": "...",
            "photos": "...",
            "likes": "...",
        },
        "profile_image": {..},
        ...
        "social": {...}
    }
}

*/

import { getAppData } from '@src/index.js';
import { randomId, classnames } from '@massimo-cassandro/minimo';

import * as styles from './unsplash-get-imgs.module.css';

export const unsplashParams = {
  maxImgs: 4, // numero massimo di immagini totali
  hiddenField : document.getElementById('infoImmagini')
};



// Default query parameters for the Unsplash /search/photos endpoint.
// All params are optional except `query` (passed at call time).
const defaultUnsplashParams = {
    per_page: 18,           // results per page — max: 30
    // order_by: 'relevant',   // "relevant" | "latest"
    content_filter: 'high', // "low" | "high" — filters explicit content
    orientation: 'landscape', // "landscape" | "portrait" | "squarish"
    lang: 'it',

    // Other available params (not set by default):
    // page        : (int)    — page number, default 1
    // color       : (string) — "black_and_white" | "black" | "white" | "yellow" |
    //                          "orange" | "red" | "purple" | "magenta" |
    //                          "green" | "teal" | "blue"
    // collections : (string) — comma-separated collection IDs to narrow results
  }

  ,app_data = getAppData()
  ,SEARCH_API = app_data.apps + '/unsplash-browser'
;

export function setRequestUrl(query, page = null) {
  const searchParams = new URLSearchParams({
    query,
    ...defaultUnsplashParams,
    ...(page? {page} : {})
  });
  return `${SEARCH_API}?${searchParams}`;
}


export function parseUnsplashResult(data){

  const img_data = {
    id                  : data.id,
    color               : data.color,
    width               : data.width,
    height              : data.height,
    // description        : data.description,
    // location           : data.location.name,
    alt_description     : data.alt_description,
    // created_at       : data.created_at,
    raw_url             : data.urls?.raw,
    unsplash_url        : data.links.html,
    author              : data.user?.name?? data.user?.username,
    author_profile_url  : data.user?.links?.html,
    blur_hash           : data.blur_hash,
    description  : (() => {
      let location      = data.location?.name?? data.location?.city,
        description     = data.description?? data.alt_description;
      if(data.description && location) {
        location        = (new RegExp(location, 'i')).test(description)? null : location;
      }
      return [description, location]
        .filter(i       => i != null).join (' / ');
    })()
  };

  const author_profile_url = new URL(img_data.author_profile_url);
  author_profile_url.search = new URLSearchParams({ utm_source: 'xxxxxx', utm_medium: 'referral' });
  img_data.author_profile_full_url = author_profile_url.toString();

  img_data.author_tag = {
    tag: 'a',
    attrs: {
      href: img_data.author_profile_full_url,
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    content: `${img_data.author} / Unsplash`,
  };


  return img_data;
}


// restituisce l'array domBuilder per la costruizione di un tag picture da un'immagine unsplah
// NB con dati preelaborati da parseUnsplashResult
// https://unsplash.com/documentation#supported-parameters
// https://docs.imgix.com/apis/rendering/size/w
// https://docs.imgix.com/apis/rendering/size/h
// https://docs.imgix.com/apis/rendering/size/ar
// https://docs.imgix.com/apis/rendering/size/fit
// https://docs.imgix.com/apis/rendering/size/crop
// https://docs.imgix.com/apis/rendering/format/q
// https://docs.imgix.com/en-US/apis/rendering/device-pixel-ratio

export function unsplashPictureTag(img_data, options = {}){

  options = {
    fixedRatio: true, // utilizza l'aspect ratio originale della foto
    width: 300,
    pictureExtraClass: null,
    pictureExtraAttrs: {},
    imgExtraClass: null,
    imgExtraAttrs: null,
    addPopover: true,
    popoverImgWidth: 600,

    ...options
  };

  const formats = ['avif', 'webp', 'pjpg'] // `fmt` parameter, in order of use
    ,base_url = new URL(img_data.raw_url)
    ,searchParams = new URLSearchParams(base_url.search)
    ,img_params = [['q', '60']]
  ;


  if(options.fixedRatio) {
    img_params.push(
      ['w', options.width],
      // ['fit', 'crop'],
      // ['crop', 'faces,entropy,edges']
    );
    img_params.forEach(param => searchParams.set(...param));

    // nome univoco per l'associazione anchor (Anchor Positioning API) tra thumb e popover di ingrandimento
    const zoomAnchorName = `--unsplash-zoom-${randomId()}`;

    // riferimento al popover di ingrandimento, valorizzato dalla sua callback domBuilder
    // (usato nel listener click della thumb, eseguito solo dopo che l'intera figure è stata costruita)
    let zoomPopoverEl;

    return [
      {
        tag: 'picture',
        className: options.pictureExtraClass,
        attrs: {
          style: options.addPopover? `anchor-name: ${zoomAnchorName};` : null,
          ...options.pictureExtraAttrs
        },
        children: formats.map(fmt => {
          const is_default_fmt = fmt === formats.at(-1);
          const srcsetArray= [];

          searchParams.set('fm', fmt);

          [1,2,3].forEach(dpr => {
            searchParams.set('dpr', dpr);
            base_url.search = searchParams.toString();
            srcsetArray.push(base_url.toString() +` ${dpr}x`);
          });

          if(is_default_fmt) {

            return {
              tag: 'img',
              className: classnames(options.imgExtraClass, options.addPopover && styles.hasPopover),
              attrs: {
                alt: img_data.alt_description?? `${img_data.author} / Unsplash`,
                src: srcsetArray[0],
                srcset: srcsetArray.join(','),
                width: options.width,
                // height:
                ...options.imgExtraAttrs
              },
              callback: options.addPopover
                ? el => el.addEventListener('click', () => zoomPopoverEl.togglePopover())
                : null
            };

          } else {
            return {
              tag: 'source',
              attrs: {
                srcset: srcsetArray.join(','),
                type: `image/${fmt}`,
                // width:
                // height:
              }
            };
          }

        })
      },
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
    ];

  } else {

    // img_params.push(
    //   ['fit', 'crop'],
    //   ['crop', 'faces,entropy,edges'], // top, bottom, left, right, faces, focalpoint, edges, and entropy
    // );
    // const sizes = [
    //   {w: 2560, ratio: 16/9},
    //   {w: 1920, ratio: 16/9},
    //   {w: 1400, ratio: 16/9},
    //   {w: 1280, ratio: 16/9},
    //   {w: 1024, ratio: 4/3},
    //   {w: 760, ratio: 4/3},
    //   {w: 400, ratio: 9/21},
    // ].map(size => ({...size, h: Math.ceil(size.w / size.ratio)}) );

    // console.log(sizes);

    // const sizesAttr = sizes.map(s => `(width <= ${s.w}px and min-aspect-ratio: ${s.ratio.toFixed(3)}) ${s.w}px`).join(',');
    // img_params.forEach(param => searchParams.set(...param));

    // return [
    //   {
    //     tag: 'picture',
    //     children: formats.map(fmt => {
    //       const is_default_fmt = fmt === formats.at(-1);

    //       const srcsetArray = [];
    //       searchParams.set('fmt', fmt);

    //       sizes.forEach(size => {
    //         searchParams.set('w', size.w);
    //         searchParams.set('h', size.h);
    //         base_url.search = searchParams.toString();
    //         srcsetArray.push({url: base_url.toString(), size: size.w});
    //       });

    //       const srcsetAttr = srcsetArray.map(item => `${item.url} ${item.size}w`).join(',');

    //       if(is_default_fmt) {

    //         return {
    //           tag: 'img',
    //           className: 'up-img',
    //           attrs: {
    //             srcset: srcsetAttr,
    //             sizes: sizesAttr,
    //             alt: img_data.alt_description?? `${img_data.author} / Unsplash`,
    //             src: srcsetArray[Math.floor(srcsetArray.length / 2)].url,

    //             // width e height non necessari (e scorretti visto le differenti proporzioni delle varie foto)
    //             // le dimesnioni sono gestite  nel css
    //             // width:
    //             // height:
    //           }
    //         };

    //       } else {
    //         return {
    //           tag: 'source',
    //           attrs: {
    //             srcset: srcsetAttr,
    //             sizes: sizesAttr,
    //             type: `image/${fmt}`,
    //             // width:
    //             // height:
    //           }
    //         };
    //       }

    //     })
    //   }
    // ];
  }

}


// helper testo pulsante aggiuni/rimuovi img
export function setImgBtnText(imgIsSelected) {
  return imgIsSelected? 'Rimuovi' : 'Seleziona';
}
