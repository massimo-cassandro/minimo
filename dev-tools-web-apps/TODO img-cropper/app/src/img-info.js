import { params } from './params.js';
import { domBuilder, snackbar } from '@massimo-cassandro/minimo';
import * as styles from './img-info.module.css';
import { updImgsList } from '@src/imgs-list.js';

export function imgInfoInit() {
  // params.imgInfoPanelWrapper.classList.add(styles.imgInfoPanelWrapper);
  params.imgInfoPanelWrapper.innerHTML = '&mdash;';

  params.imgInfoPanelWrapper.addEventListener('click', e => {
    if(e.target.classList.contains('upd-alt-btn')) {
      params.appData.files[params.currentImageId].altText = e.target.previousSibling.value;
      updImgsList();
      snackbar('<em>alt</em> text saved');
    }
  });
}


// FIX css controllo testo alt (bloccare btn sulla stessa riga)

export function updImgInfo() {
  const infoObj = params.appData.files[params.currentImageId].info;
  imgInfoTable([
    ['File', infoObj.name],
    ['Type', infoObj.type],
    ['Size', `${infoObj.originalWidth}&hairsp;&times;&hairsp;${infoObj.originalHeight}px (${infoObj.sizeFormatted})`],
    ['Alt text', [
      'label.form-label.visually-hidden(for=imgAltText) Alt text',
      {
        className: 'input-group',
        children: [
          {
            tag: 'input',
            id: 'imgAltText',
            className: 'form-control',
            attrs: {
              type: 'text',
              placeholder: 'Image description',
              value: params.appData.files[params.currentImageId].altText
            }
          },
          {
            tag: 'button',
            className: 'btn btn-primary btn-sm upd-alt-btn',
            attrs: {
              type: 'button'
            },
            content: 'Update'
          }
        ]
      }
    ]]
  ]);
}


export function imgInfoTable(rows){

  // rows è un array di array, ognuno di due elemnti: [ [th, td], [th, td], ...]

  // domBuilder([
  //   {
  //     tag: [`table.${styles.table}`, 'tbody'],
  //     children: rows.map(row => ({
  //       tag: 'tr',
  //       children: [
  //         {
  //           tag: 'th',
  //           content: row[0] + ':'
  //         },
  //         {
  //           tag: 'td',
  //           content: row[1]
  //         }
  //       ]
  //     }))
  //   }
  // ], params.imgInfoPanelWrapper);


  domBuilder([
    {
      className: styles.infoTable,
      children: rows.map(row => ({
        className: styles.infoRow,
        children: [
          {
            className: styles.infoKey,
            content: row[0] + ':'
          },
          {
            // className: styles.infoValue,
            ...(
              Array.isArray(row[1])
                ? { children : row[1] }
                : { content: row[1] }
            )
          }
        ]
      }))
    }
  ], params.imgInfoPanelWrapper, {emptyParent: true});
}
