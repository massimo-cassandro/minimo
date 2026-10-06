/*! minimo - unsplashPage */
import { domBuilder } from '../../utilities/dom-builder/dom-builder.js';
import { classnames } from '../../utilities/classnames.js';

import { fetchUnsplashData } from './fetch-unsplash-data.js';
import imageIcon from '../../icons/image-duotone.svg?inline';
import arrowIcon from '../../icons/arrow-fat-lines-left-duotone.svg?inline';
import { decode } from 'blurhash';
import * as styles from './unsplash-page.module.css';

/**
 * Inizializza una foto Unsplash a pagina intera con placeholder blurhash, elemento picture responsive
 * e overlay di attribuzione.
 * @param {Object} settings
 * @param {HTMLElement | null} settings.targetElement - Elemento contenitore in cui verrà renderizzata la foto.
 * @param {string | null} [settings.className=null] - Classe extra aggiunta al contenitore (default: null)
 * @param {string | null} settings.unsplashDataUrl - URL che restituisce il JSON della foto Unsplash.
 * @param {string | null} settings.utmSource - Valore utm_source per i link di attribuzione.
 * @param {string | null} settings.title - Testo del titolo principale.
 * @param {string | null} [settings.text=null] - Testo opzionale del corpo (default: null)
 * @param {string | null} [settings.backLink=null] - HTML opzionale del link di ritorno (default: null)
 * @param {boolean} [settings.hidePhotoLink=true] - Se true, il link a Unsplash viene mostrato solo al passaggio del mouse (default: true)
 * @returns {Promise<void>}
 */

// TODO aggiungere la personalizzazione del file dell'icona e altre custom props per il box del messaggio

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

    const formats = ['avif', 'webp', 'pjpg']; // parametro `fm`, in ordine di utilizzo

    /*
      - dimensioni dell'immagine raggruppate per aspect ratio: ogni gruppo diventa un tag <source>
        per formato (avif/webp/pjpg)
      - ogni aspect ratio è espresso come [w, h] (es. [16, 9]); `widths` elenca le larghezze
        di rendering di destinazione per quel gruppo, usate sia come parametro imgix `w` sia come
        descrittore `Nw` in `srcset`. L'altezza è derivata per ogni larghezza dal ratio del gruppo e
        passata a imgix come `h` (vedi buildImgixUrl), quindi i gruppi possono riutilizzare senza problemi lo stesso
        elenco `widths` (es. 9/16 e 9/20) richiedendo comunque un'altezza di crop diversa
      - l'orientamento e la media feature aspect-ratio sono derivati dal ratio stesso:
        ratio >= 1 -> landscape + min-aspect-ratio, ratio < 1 -> portrait + max-aspect-ratio
      - NB: l'ordine conta. <picture> usa "vince il primo <source> che corrisponde" (a differenza della
        cascata CSS, dove vince l'ultima regola corrispondente), quindi i gruppi devono essere ordinati dal più al
        meno restrittivo: i gruppi landscape dal ratio più largo al più stretto, i gruppi portrait
        dal ratio più stretto al più largo. L'orientamento rende le due famiglie
        mutuamente esclusive, quindi il loro ordine relativo non conta
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
      // portrait 3/4 (tablet)
      {
        ar: [3,4],
        widths: [1200, 1024, 840]
      }
    ];

    // `url`/`searchParams` e i parametri imgix statici (fit/crop/q) vengono impostati una sola volta qui
    // e riutilizzati a ogni chiamata: `fm`/`w`/`h` sono le uniche parti che cambiano per immagine, e
    // la stringa restituita viene sempre consumata in modo sincrono prima che la chiamata successiva le modifichi
    /** @type {(w: number, h: number, fmt: string) => string} */
    const buildImgixUrl = (() => {
      const url = new URL(imgData.base_url),
        searchParams = new URLSearchParams(url.search);

      searchParams.set('fit', 'crop');
      searchParams.set('crop', 'faces,entropy,edges'); // top, bottom, left, right, faces, focalpoint, edges ed entropy
      searchParams.set('q', '60');

      return (w, h, fmt) => {
        searchParams.set('fm', fmt);
        searchParams.set('w', String(w));
        searchParams.set('h', String(h));

        url.search = searchParams.toString();
        return url.toString();
      };
    })();

    // larghezza minima del gruppo più largo (il più comune), usata come semplice <img> di fallback
    // per i browser senza supporto a <picture>: i tag <source> qui sopra coprono tutto il resto
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

          // =>> img e il suo listener
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
                              content: arrowIcon,
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
                          content: imageIcon
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
