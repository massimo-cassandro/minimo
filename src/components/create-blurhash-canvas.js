import { decodeBlurHash } from 'fast-blurhash';

// https://github.com/mad-gooze/fast-blurhash
// https://github.com/woltapp/blurhash/tree/master/TypeScript
// https://blurha.sh/

/**
 * restituisce un elemento canvas della stringa blurhash indicata
 *
 * @param {string} str - blurhash string
 * @param {number} width
 * @param {number} height
 * @returns HTMLElement
 */

export function createBlurhashCanvas({str, width, height, className = null}) {

  try {

    if(str && width && height) {
      // decode blurHash image
      const pixels = decodeBlurHash(str, width, height),

        // draw it on canvas
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        imageData = ctx.createImageData(width, height);

      if(className) {
        canvas.className = className;
      }

      canvas.width = width;
      canvas.height = height;
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);

      return canvas;
    }

  } catch(e) {
    /* eslint-disable no-console */
    console.error( e );
    /* eslint-enable no-console */
  }

}
