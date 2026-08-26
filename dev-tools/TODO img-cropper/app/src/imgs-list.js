
import { params } from './params.js';
import { domBuilder, snackbar } from '@massimo-cassandro/minimo';
import { cleanImgArea } from '@src/img-load-setup.js';

import * as styles from './imgs-list.module.css';

// FIX aggiungere scroll alla lista

export function imgsListInit(){

  params.imgsListWrapper.classList.add(styles.imgsListWrapper);

  domBuilder([
    {
      className: styles.listStatusWrapper,
      callback: el => params.listStatusWrapper = el,
      content: '&mdash;'
    },
    {
      className: styles.imgList,
      callback: el => params.imgList = el,
    },

  ], params.imgsListWrapper);

  // rimozione immagine
  params.imgList.addEventListener('click', e => {
    if(e.target.classList.contains(styles.closeBtn)) {

      const itemWrapper = e.target.closest(`.${styles.imgsListItem}`),
        fileId = itemWrapper.dataset.fileId,
        fileName = params.appData.files[fileId].info.name;

      if(confirm(`Confermi di voler rimuovere l’immagine “${fileName}”?`)) {

        delete params.appData.files[fileId];
        // updImgsList();
        itemWrapper.remove();
        updImgListStatus();

        if(params.currentImageId === fileId) {
          cleanImgArea();
        }

        snackbar(`L’immagine “${fileName}” è stata rimossa`);
      }
    }
  });

  // TODO drag reorder
  // TODO disabilitare immagine per conservarla ma non includere nell'esportazione

}


export function updImgsList(){

  params.imgList.innerHTML = '';
  /*
  params.appData.files": {
    "__fileId__": {
        "data": "data:image/webp;base64...",
        "thumbnail": "data:image/webp;base64...",
        "info": {
            "name": "annie-spratt-qckxruozjrg-unsplash.jpg",
            "size": 113897,
            "sizeFormatted": '113 KB'
            "type": "image/jpeg",
            "originalWidth": 1920,
            "originalHeight": 1280
        },
        ...
    },
    ...
  }
  */

  domBuilder(
    Object.keys(params.appData.files).map(fileId => {
      const file = params.appData.files[fileId];
      return {
        className: styles.imgsListItem,
        attrs: {
          'data-file-id': fileId
        },
        children: [
          {
            tag: [`div.${styles.thumbWrapper}`,'img'],
            attrs: {
              src: file.thumbnail?? file.data,
              alt: fileId
            }
          },
          {
            className: styles.imgsInfoWrapper,
            children: [
              `div.${styles.filename} ${file.info.name}`,
              `div ${file.info.originalWidth}&times;${file.info.originalHeight} (${file.info.sizeFormatted})`,
              `div <strong>alt text:</strong> ${file.altText?? '&mdash;'}`
            ]
          },
          {
            tag: 'button',
            className: ['btn-close', styles.closeBtn],
            attrs: {
              type: 'button'
            }
          }
        ]
      };
    }), params.imgList);

  updImgListStatus();
}

// Update the box with the number of total and incomplete images
export function updImgListStatus(){
  params.listStatusWrapper.innerHTML =
    `<div><strong>Tot. images:</strong> ${Object.keys(params.appData.files??{}).length}</div>` +
    `<div><strong>Incomplete:</strong> xxxx</div>`; // TODO definire file incompleti

}
