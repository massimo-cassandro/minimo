import { params } from './params.js';
import * as styles from './img-area.module.css';

import { initCropper } from '@src/cropper.js';
import { updImgInfo, imgInfoTable } from '@src/img-info.js';
import { updImgsList } from '@src/imgs-list.js';

// permette il caricamento di una o più immagini
// se più di una non viene lanciato cropper, ma le immagini vengono aggiunte ad appdata.files

export function imgLoadSetup(){

  // listener
  // ------------------

  // file input
  params.fileInput.addEventListener('change', e => loadFile(e.target.files), true);

  // drag'n'drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    params.imgArea.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    }, true);
  });


  ['dragover', 'dragenter'].forEach(eventName => {
    params.imgArea.addEventListener(eventName, () => {
      params.imgArea.classList.add( styles.dragover );
    }, true);
  });

  ['dragleave', 'dragend'].forEach(eventName => {
    params.imgArea.addEventListener(eventName, () => {
      params.imgArea.classList.remove( styles.dragover );
    }, true);
  });

  params.imgArea.addEventListener('drop', e => {
    params.imgArea.classList.remove(styles.dragover);
    if (e.dataTransfer.files.length > 0) {
      loadFile(e.dataTransfer.files);
    }
  }, true);

}


// crea l'oggetto di descrizione del file in appData.files
// se il file esiste già, il record viene comq riscritto per eventuali aggiornamenti
async function loadFile(files) {

  // Forza 'files' ad essere un array se viene passato un file singolo
  if (!(files instanceof FileList) && !Array.isArray(files)) {
    files = [files];
  }

  if(!params.appData.files) {
    params.appData.files = {};
  }

  let skipped = 0, existing = 0;


  const loadPromises = [...files].map(file => {

    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        skipped++;
        return resolve(); // Salta i file non immagine
      }

      // conteggio già caricate
      if(params.appData.files[file.name]) {
        existing++;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Img = e.target.result;

        // immagine già presente in appData (e con la miniatura avente le stesse dimensioni di quelle in params)
        // annullato: il record viene cmq riscritto
        // if (params.appData.files[file.name] && params.appData.files[file.name].thumbnailSize === params.thumbnailSize) {
        //   params.currentImageId = file.name;
        //   params.imgArea.classList.add(styles.hasImg);
        //   initCropper(params.appData.files[file.name].data);
        //   updImgInfo(params.currentImageId);
        //   return;
        // }

        // miniatura e dimensioni originali
        const img = new Image();

        img.onload = () => {
          let thumbWidth = img.width;
          let thumbHeight = img.height;
          if (thumbWidth > thumbHeight) {
            if (thumbWidth > params.thumbnailSize) {
              thumbHeight *= params.thumbnailSize / thumbWidth;
              thumbWidth = params.thumbnailSize;
            }
          } else {
            if (thumbHeight > params.thumbnailSize) {
              thumbWidth *= params.thumbnailSize / thumbHeight;
              thumbHeight = params.thumbnailSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = thumbWidth;
          canvas.height = thumbHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

          const thumbnailBase64 = canvas.toDataURL('image/webp', 0.8);

          // Salvataggio dati
          params.appData.files[file.name] = {

            crops: {},
            altText: null,

            ...(params.appData.files[file.name] ?? {}), // conserva alcune informazioni se presenti

            data: base64Img, // TODO sostituire con path del file in un'applicazione electron (???)
            thumbnail: thumbnailBase64 ?? null,

            info: {
              name: file.name,
              size: file.size,
              sizeFormatted: printSize(file.size),
              type: file.type,
              originalWidth: img.width,
              originalHeight: img.height
            }
          };

          // singolo file -> cropper
          if (files.length === 1) {
            params.currentImageId = file.name;
            params.imgArea.classList.add(styles.hasImg);
            initCropper(base64Img);
            updImgInfo();
            updImgsList();
          }

          resolve();
        };
        img.src = base64Img;
      };
      reader.readAsDataURL(file);
    });
  });

  await Promise.all(loadPromises);

  if (files.length > 1) {
    cleanImgArea();
    imgInfoTable([
      ['Added files', files.length],
      ['Not images', skipped],
      ['Already loaded', existing]
    ]);
    updImgsList();
  }

}



export function cleanImgArea(){
  params.imgInfoPanelWrapper.innerHTML = '&mdash;';

  params.cropImg?.remove();
  params.cropBadge?.remove();
  params.cropper?.destroy();

  params.cropImg = null;
  params.cropBadge = null;
  params.cropper = null;
  params.currentImageId = null;

  params.imgArea.classList.remove(styles.dragover, styles.hasImg);
}

function printSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [ 'Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[ i ];
}
