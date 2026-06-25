import imageIcon from '../../icons/image-duotone.svg';
import arrowIcon from '../../icons/arrow-fat-lines-left-duotone.svg';
import { breakpoints } from './img-breakpoints.js';
import { fetchUnsplashData } from './fetch-unsplash-data.js';
import { decode } from 'blurhash';

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
 * @param {Record<string, string> | null} [settings.cssModulesObj=null] - CSS Modules class map; when null, class names are used as-is.
 * @returns {void}
 */
export function unsplashPageJS(settings) {

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

    const cssClass = /** @param {string} classname */ classname =>
      settings.cssModulesObj? settings.cssModulesObj[classname] : classname;

    targetElement.innerHTML = `<div class="${cssClass('upContainer') + (settings.className? ` ${settings.className}` : '')}"></div>`;
    const container = /** @type {HTMLElement} */ (targetElement.querySelector('.' + cssClass('upContainer')));
    container.innerHTML = `<div class="${cssClass('upLoaderWrapper')}"><div class="${cssClass('upLoader')}"></div></div>`;

    fetchUnsplashData({unsplash_data_url: settings.unsplashDataUrl})
      .then(photo => {
        if (!photo) return;

        const pixels = decode(photo.blur_hash, container.offsetWidth, container.offsetHeight);

        const canvas = document.createElement('canvas');
        canvas.className = cssClass('upCanvas');
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

        container.insertAdjacentHTML('beforeend',
          '<picture>' +
            breakpoints.map((brk, idx) => {

              const is_last_brk = idx === breakpoints.length - 1;
              return formats.map(fmt => {
                const is_default_fmt = fmt === formats.at(-1);

                // https://unsplash.com/documentation#supported-parameters
                // https://docs.imgix.com/apis/rendering/size/w
                // https://docs.imgix.com/apis/rendering/size/h
                // https://docs.imgix.com/apis/rendering/size/ar
                // https://docs.imgix.com/apis/rendering/size/fit
                // https://docs.imgix.com/apis/rendering/size/crop
                // https://docs.imgix.com/apis/rendering/format/q

                let url = photo.base_url + (/\?/.test(photo.base_url)? '&' : '?') +
                  'fit=crop&crop=faces,entropy,edges' + // top, bottom, left, right, faces, focalpoint, edges, and entropy
                  '&q=60' +
                  `&w=${brk.w}&h=${brk.h}` +
                  `&fm=${fmt}`;

                if(is_last_brk && is_default_fmt) {

                  return '<img ' +
                    `class="${cssClass('unsplashPhoto')}" `+
                    `src="${url}" `+
                    `srcset="${url}${brk.dpr2? ` 1x, ${url}&dpr=2 2x` : ''}" `+
                    `alt="${photo.alt_description?? `${photo.author} / Unsplash`}" `+
                    `width="${brk.w}" height="${brk.h}">`;

                } else {
                  return '<source ' +
                    `srcset="${url}${brk.dpr2? ` 1x, ${url}&dpr=2 2x` : ''}" `+
                    (!is_default_fmt? `type="image/${fmt}" ` : '')+
                    `media="${brk.mq}" `+
                    `width="${brk.w}" height="${brk.h}">`;
                }
              }).join('');
            }).join('') +
          '</picture>'
        ); // end insert <picture>

        const img = /** @type {HTMLImageElement | null} */ (container.querySelector('.' + cssClass('unsplashPhoto')));
        if (img) {
          img.onload = () => {
            container.querySelector('.' + cssClass('upLoaderWrapper'))?.remove();
            container.classList.add(cssClass('show'));

            container.insertAdjacentHTML('beforeend', `<div class="${cssClass('upMessageBox')}">
              <div class="${cssClass('upMessage')}">
                <h1>${settings.title}</h1>
                ${settings.text? `<p>${settings.text}</p>` : ''}
                ${settings.backLink ? `<p class="${cssClass('upBackLink')}">${settings.backLink}</p>` : ''}

                <div class="${cssClass('upArrowWrapper')}" role="button">
                  <img src="${arrowIcon}" alt="Icona freccia">
                </div>
              </div>

              <div class="${cssClass('upCredits')}">
                <em>${photo.image_description}</em>
                <span>Photo
                  <a href="${`${photo.author_profile}?utmSource=${settings.utmSource}&utm_medium=referral`}">
                    ${photo.author} / Unsplash
                  </a>
                </span>
              </div>
            </div>
            <div class="${cssClass('unsplashPhotoLink')}${settings.hidePhotoLink? ` ${cssClass('upShowOnHover')}` : ''}">
              <a href="${`${photo.unsplash_url}?utm_source=${settings.utmSource}&utm_medium=referral`}" target="_blank" rel="noopener noreferrer">
                <img src="${imageIcon}" alt="Icona immagine" />
              </a>
            </div>`);

            container.querySelector('.' + cssClass('upArrowWrapper'))?.addEventListener('click', e => {
              const target = /** @type {HTMLElement} */ (e.target);
              target.closest(`.${cssClass('upMessage')}`)?.classList.toggle(cssClass('hidden'));
            }, false);

          }; // end img.onload
        }

      }); // end .then

  } catch(e) {
    console.error( e ); // eslint-disable-line
  }

}
