/*! minimo - unsplashPage */
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';
import imageIcon from '../../icons/image-duotone.svg';
import arrowIcon from '../../icons/arrow-fat-lines-left-duotone.svg';
import { fetchUnsplashData } from './fetch-unsplash-data.js';
import { decode } from 'blurhash';
import * as styles from './unsplash-page.module.css';

/**
 * Initialises an Unsplash full-page photo with blurhash placeholder, responsive picture element,
 * and attribution overlay.
 * @param {Object} settings
 * @param {HTMLElement | null} settings.targetElement - Container element where the photo will be rendered.
 * @param {string | null} [settings.className=null] - Extra class added to the container.
 * @param {string | null} settings.unsplashDataUrl - URL returning Unsplash photo JSON.
 * @param {string | null} settings.utmSource - UTM source value for attribution links.
 * @param {string | null} settings.title - Main heading text.
 * @param {string | null} [settings.text=null] - Optional body text.
 * @param {string | null} [settings.backLink=null] - Optional back-link HTML.
 * @param {boolean} [settings.hidePhotoLink=true] - When true, the Unsplash link is shown only on hover.
 * @returns {Promise<void>}
 */


export async function unsplashPage(settings) {

  const default_settings = {
      targetElement    : null,
      className        : null,
      unsplashDataUrl  : null,
      utmSource        : null,
      title            : null,
      text             : null,
      backLink         : null,
      hidePhotoLink    : true,
      cssModulesObj    : null
    },
    required_settings = ['targetElement', 'unsplashDataUrl', 'utmSource', 'title'];

  settings = {...default_settings, ...settings};


  try {

    const settingsMap = /** @type {Record<string, unknown>} */ (settings);
    if(required_settings
      .map(i => settingsMap[i])
      .filter(i => i !== null && i !== '').length !== required_settings.length) {

      throw new Error( `I parametri ${required_settings.map(i => `\`${i}\``).join(',')} sono obbligatori` );
    }

    const targetElement = /** @type {HTMLElement} */ (settings.targetElement);

    const container = /** @type {HTMLElement} */ (domBuilder([
      {
        className: classnames( styles.container, settings.className ),
        children: [
          {
            className: styles.loaderWrapper,
            children: [
              `div.${styles.loader}`
            ]
          }
        ]
      }
    ], targetElement));


    const imgData = await fetchUnsplashData({unsplash_data_url: settings.unsplashDataUrl});
    if (!imgData) return;

    const pixels = decode(imgData.blur_hash, container.offsetWidth, container.offsetHeight);

    const canvas = document.createElement('canvas');
    canvas.className = styles.canvas;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imageData = ctx.createImageData(container.offsetWidth, container.offsetHeight);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    }

    container.insertAdjacentElement('afterbegin', canvas);

    const formats = ['avif', 'webp', 'pjpg']; // `fm` parameter, in order of use

    /*
      - image dimensions grouped by aspect ratio: each group becomes one <source> tag
        per format (avif/webp/pjpg)
      - each aspect ratio is expressed as [w, h] (e.g. [16, 9]); `widths` lists the target
        render widths for that group, used both as the `w` imgix param and as the `Nw`
        descriptor in `srcset`. Height is derived per width from the group's ratio and
        passed to imgix as `h` (see buildImgixUrl), so groups can safely reuse the same
        `widths` list (e.g. 9/16 and 9/20) while still requesting a different crop height
      - orientation and the aspect-ratio media feature are derived from the ratio itself:
        ratio >= 1 -> landscape + min-aspect-ratio, ratio < 1 -> portrait + max-aspect-ratio
      - NB: order matters. <picture> uses "first matching <source> wins" (unlike the CSS
        cascade, where the last matching rule wins), so groups must be ordered from most to
        least restrictive: landscape groups from the widest ratio to the narrowest, portrait
        groups from the narrowest ratio to the widest. Orientation makes the two families
        mutually exclusive, so their relative order doesn't matter
      */
    const sizes = [
      // landscape 16/9
      {
        ar: [16,9],
        widths: [2560, 1920, 1440, 1200, 800, 570]
      },
      // landscape 4/3
      {
        ar: [4,3],
        widths: [1536, 1440, 1280, 840, 570]
      },
      // portrait 9/20 (very tall phones)
      {
        ar: [9,20],
        widths: [1080, 960, 768, 570, 400]
      },
      // portrait 9/16
      {
        ar: [9,16],
        widths: [1080, 960, 768, 570, 400]
      },
      // portrait 3/4 (tablets)
      {
        ar: [3,4],
        widths: [1200, 1024, 840]
      }
    ];

    // `url`/`searchParams` and the static imgix params (fit/crop/q) are set up once here
    // and reused on every call: `fm`/`w`/`h` are the only parts that change per image, and
    // the returned string is always consumed synchronously before the next call mutates them
    /** @type {(w: number, h: number, fmt: string) => string} */
    const buildImgixUrl = (() => {
      const url = new URL(imgData.base_url),
        searchParams = new URLSearchParams(url.search);

      searchParams.set('fit', 'crop');
      searchParams.set('crop', 'faces,entropy,edges'); // top, bottom, left, right, faces, focalpoint, edges, and entropy
      searchParams.set('q', '60');

      return (w, h, fmt) => {
        searchParams.set('fm', fmt);
        searchParams.set('w', String(w));
        searchParams.set('h', String(h));

        url.search = searchParams.toString();
        return url.toString();
      };
    })();

    // smallest width of the widest (most common) group, used as the plain <img> fallback
    // for browsers without <picture> support: the <source> tags above cover everything else
    const default_group = sizes[0],
      default_w = default_group.widths[default_group.widths.length - 1],
      default_h = Math.round(default_w * default_group.ar[1] / default_group.ar[0]);

    // https://unsplash.com/documentation#supported-parameters
    // https://docs.imgix.com/apis/rendering/size/w
    // https://docs.imgix.com/apis/rendering/size/h
    // https://docs.imgix.com/apis/rendering/size/ar
    // https://docs.imgix.com/apis/rendering/size/fit
    // https://docs.imgix.com/apis/rendering/size/crop
    // https://docs.imgix.com/apis/rendering/format/q
    domBuilder([
      {
        tag: 'picture',
        children: [
          ...sizes.flatMap(({ar, widths}) => {
            const ratio = ar[0] / ar[1],
              orientation = ratio >= 1 ? 'landscape' : 'portrait',
              aspectFeature = orientation === 'landscape' ? 'min-aspect-ratio' : 'max-aspect-ratio',
              media = `(orientation: ${orientation}) and (${aspectFeature}: ${ar[0]}/${ar[1]})`;

            return formats.map(fmt => {
              const is_default_fmt = fmt === formats.at(-1),
                srcset = widths
                  .map(w => {
                    const h = Math.round(w * ar[1] / ar[0]);
                    return `${buildImgixUrl(w, h, fmt)} ${w}w`;
                  })
                  .join(', ');

              return {
                tag: 'source',
                attrs: {
                  type: is_default_fmt? null : `image/${fmt}`,
                  media,
                  sizes: '100vw',
                  srcset
                }
              };
            });
          }),

          // =>> img and its listener
          {
            tag: 'img',
            className: styles.unsplashPhoto,
            attrs: {
              src: buildImgixUrl(default_w, default_h, formats[formats.length - 1]),
              alt: imgData.alt_description ?? `${imgData.author} / Unsplash`
            },
            callback: el => {
              el.onload = () => {
                try {
                  container.querySelector(`.${styles.loaderWrapper}`)?.remove();
                  container.classList.add(styles.show);

                  domBuilder([
                    {
                      className: styles.messageBox,
                      children: [
                        {
                          className: styles.message,
                          children: [
                            { tag: 'h1', content: settings.title },
                            {
                              tag: 'p',
                              content: settings.text,
                              condition: !!settings.text
                            },
                            {
                              tag: 'p',
                              className: styles.backLink,
                              content: settings.backLink,
                              condition: !!settings.backLink
                            },
                            {
                              className: styles.arrowWrapper,
                              attrs: { role: 'button' },
                              children: [
                                { tag: 'img', attrs: { src: arrowIcon, alt: 'Icona freccia' } }
                              ],
                              callback: arrowEl => {
                                arrowEl.addEventListener('click', e => {
                                  const target = /** @type {HTMLElement} */ (e.target);
                                  target.closest(`.${styles.message}`)?.classList.toggle(styles.hidden);
                                }, false);
                              }
                            }
                          ]
                        },
                        {
                          className: styles.credits,
                          children: [
                            { tag: 'em', content: imgData.image_description },
                            {
                              tag: 'span',
                              content: `Photo <a href="${imgData.author_profile}?utmSource=${settings.utmSource}&utm_medium=referral">${imgData.author} / Unsplash</a>`
                            }
                          ]
                        }
                      ]
                    },
                    {
                      className: classnames( styles.unsplashPhotoLink, settings.hidePhotoLink ? styles.showOnHover : null ),
                      children: [
                        {
                          tag: 'a',
                          attrs: {
                            href: `${imgData.unsplash_url}?utm_source=${settings.utmSource}&utm_medium=referral`,
                            target: '_blank',
                            rel: 'noopener noreferrer'
                          },
                          children: [
                            { tag: 'img', attrs: { src: imageIcon, alt: 'Icona immagine' } }
                          ]
                        }
                      ]
                    }
                  ], container);

                } catch(e) {
                  console.error( '[Unsplash Page] ' + e ); // eslint-disable-line
                }
              };

              el.onerror = () => {
                console.error( '[Unsplash Page] Errore nel caricamento dell\'immagine' ); // eslint-disable-line
                container.querySelector('.' + styles.loaderWrapper)?.remove();
              };
            }
          }
        ]
      }
    ], container);


  } catch(e) {
    console.error( '[Unsplash Page] ' + e ); // eslint-disable-line
  }

}
