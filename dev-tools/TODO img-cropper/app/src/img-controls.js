import { params } from './params.js';
import { domBuilder, classnames } from '@massimo-cassandro/minimo';

import imageDropIcon from '@icons/image-drop.svg?inline';
import arrowsOutIcon from '@icons/arrows-out-line-vertical.svg?inline';
import arrowsInIcon from '@icons/arrows-in-line-vertical.svg?inline';

import * as styles from './img-controls.module.css';
import * as layoutStyles from './layout.module.css';

export function imgControlsInit(){

  // params.imgControlsWrapper.classList.add(styles.imgControlsWrapper);

  domBuilder([

    {
      className: styles.imgControlsInner,
      children: [
        {
          tag: 'label',
          className: classnames(styles.iconBtn, 'btn-reset'),
          content: imageDropIcon,

          children: [
            {
              tag: 'input',
              // id: styles.fileInput,
              className: styles.fileInput,
              attrs: {
                type: 'file',
                accept: 'image/*',
                multiple: true
              },
              callback: el => params.fileInput = el
            }
          ]
        },
        {
          tag: 'button',
          className: classnames(styles.iconBtn, 'btn-reset'),
          attrs: {
            type: 'button',
            title: 'Espandi area immagine',
            disabled: true,
            'data-expand': true
          },
          content: arrowsOutIcon,
          callback: el => params.expandOnBtn = el
        },
        {
          tag: 'button',
          className: classnames(styles.iconBtn, 'btn-reset'),
          attrs: {
            type: 'button',
            title: 'Riduci area immagine',
            disabled: true,
            'data-expand': false
          },
          content: arrowsInIcon,
          callback: el => params.expandOffBtn = el
        },

      ]
    }

  ], params.imgControlsWrapper);


  params.imgControlsWrapper.addEventListener('click', e => {

    const expandBtn = e.target.closest('[data-expand');
    if(expandBtn) {
      params.mainWrapper.classList.toggle(layoutStyles.expanded, expandBtn.dataset.expand === 'true');
      params.expandOnBtn.disabled = params.mainWrapper.classList.contains(layoutStyles.expanded);
      params.expandOffBtn.disabled = !params.mainWrapper.classList.contains(layoutStyles.expanded);

      // params.cropper.clear(); // Pulisce l'area di ritaglio
      params.cropper.resize(); // Ricalcola le dimensioni del contenitore
      params.cropper.render();

      // TODO ripristinare il cropbox sulla base delle dimensioni del ritaglio esistenti (si perde nel cambiamento delle dimensioni del container)
    }
  });
}

