
import { params } from './params.js';
import { domBuilder } from '@massimo-cassandro/minimo';

// cropper.js v.1.x
import 'cropperjs/dist/cropper.css';
import Cropper from 'cropperjs';

import * as styles from './cropper.module.css'; /* la personalizzazione di cropper è separata per facilitare eventuali upgrade alla v.2 */

// https://fengyuanchen.github.io/cropperjs/v1/
// https://github.com/fengyuanchen/cropperjs/blob/v1/README.md
export function initCropper(src) {

  if(!params.cropImg) {
    domBuilder([
      {
        tag: 'img',
        className: styles.cropImg,
        callback: el => params.cropImg = el
      },
      {
        className: styles.cropBadge,
        callback: el => params.cropBadge = el
      }
    ], params.imgArea);

  }

  if (params.cropper) params.cropper.destroy();

  params.cropImg.src = src;

  params.cropper = new Cropper(params.cropImg, {
    viewMode: 1,
    zoomable: false,
    autoCropArea: 0.8,
    ready() {
      const data = params.cropper.getImageData();
      params.cropBadge.innerHTML = `${Math.round(data.naturalWidth)}&hairsp;&times;&hairsp;${Math.round(data.naturalHeight)}px`;
      // applyLabelPreset();

      // TODO ridimensionare cropArea sulla base dell'ultima immagine o, se l'immagine è già presente, con le  dimensioni registrate
    },
    crop(event) {
      const w = Math.round(event.detail.width);
      const h = Math.round(event.detail.height);
      params.cropBadge.innerText = `${w} x ${h}`;
      params.cropBadge.style.display = 'block';
      const box = params.cropper.getCropBoxData();
      params.cropBadge.style.left = (box.left + (box.width / 2) - (params.cropBadge.offsetWidth / 2)) + 'px';
      params.cropBadge.style.top = (box.top + box.height + 10) + 'px';
    },
    cropend() {
      // autoSaveCurrentCrop();
    }
  });
}
