/*
Unsplash application id: 990728
Access Key: -qKEqroUmWhsDlw2e3SQI8ffeNPRWALiddQHTPtLOGo
Secret key: ROS_RInmZTID7KDKTGU3hHWOba2e1NEqPD0daMRuc_8

search_api: 'https://api.unsplash.com/search/photos'

API docs: https://unsplash.com/documentation#search-photos
*/

import { mAlert, bsSpinner } from '@src/index.js';
import Modal from '@src/ada-bs-modal/bs-modal.js';
import { bsModalElementBuilder } from '@src/ada-bs-modal/bs-modal-element-builder.js';
import { classnames, randomId, domBuilder } from '@massimo-cassandro/minimo';

import { parseUnsplashResult, unsplashPictureTag, setImgBtnText, setRequestUrl, unsplashParams } from './unsplash-utilities.js';
import { unsplashImgsDisplayInit, unsplashImgsDisplay } from './unsplash-imgs-display.js';

import * as styles from './unsplash-get-imgs.module.css';

const selectBtnClass = randomId(); // classe assegnata ia pulsanti seleziona/rimuovi immagine

let page = 1,
  selectedImgs = [],
  availableImgsCount = 0,
  availableImgsCountEl,
  searchString = null,
  searchField,
  searchBtn,
  resultContainer,
  resultInfoWrapper, resultInfoTextWrapper, resultInfoBtnPrev, resultInfoBtnNext;


// inizializzazione markup e rendering imgs preregistrate
unsplashImgsDisplayInit();
unsplashImgsDisplay();


// =>> helper func abilitazione/disabilitazione pulsanti aggiungi immagine altre immagini in base a `availableImgsCount`
function updAddImgBtns() {
  resultContainer.querySelectorAll(`.${styles.imgWrapper}:not(.${styles.selected}) .${selectBtnClass}`)
    .forEach(btn => {
      btn.disabled = availableImgsCount === 0;
    });
}


// =>> listener btn seleziona img di ogni singola card

document.body.addEventListener('click', e => {
  if(e.target.classList.contains(selectBtnClass)) {
    const imgWrapper = e.target.closest(`.${styles.imgWrapper}`);
    let isSelected = imgWrapper.classList.contains(styles.selected);

    // immagine precedentemente selzionata, rimozione
    if(isSelected) {
      selectedImgs = selectedImgs.filter(img => img.id !== imgWrapper.img_data.id);
      isSelected = false;
      imgWrapper.classList.remove(styles.selected);

    }

    // non selected, aggiunta immagine
    else if (availableImgsCount > 0) {
      selectedImgs.push(imgWrapper.img_data);
      isSelected = true;
      imgWrapper.classList.add(styles.selected);

    }


    availableImgsCount = unsplashParams.maxImgs - selectedImgs.length;
    availableImgsCountEl.textContent = availableImgsCount;
    e.target.textContent = setImgBtnText(isSelected);

    // abilitazione/disabilitazione pulsanti aggiungi immagine di altre immagini in base a `availableImgsCount`
    updAddImgBtns();
  }
});

// Esc con popover di ingrandimento aperto: chiude solo il popover, non l'intera modal
// (il listener Escape della modal Bootstrap è in bubble phase sull'elemento della modal:
// intercettando qui in capture phase e fermando la propagazione, l'evento non lo raggiunge mai,
// mentre la chiusura nativa del popover via Popover API avviene comunque)
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && document.querySelector(`.${styles.zoomPopover}:popover-open`)) {
    e.stopPropagation();
  }
}, true);

// *********************************

async function loadUnsplashJson() {

  const url = setRequestUrl(searchString, page);

  searchField.disabled = true;
  searchBtn.disabled = true;
  bsSpinner({
    addWrapper: true,
    wrapperExtraClass: 'mt-5',
    parent: resultContainer,
    overlay: true
  });

  try {
    const response = await fetch(url),
      data = await response.json();

    return data;

  } catch(err) {
    /* eslint-disable no-console */
    console.error(url);
    console.error(err);
    /* eslint-enable no-console */

  } finally {
    searchField.disabled = false;
    searchBtn.disabled = false;
  }
}


// imposta alcune classi del popup dei risultati in base alla presenza o meno di risultati
function toggleResultEnv(hasResult = false) {

  resultInfoWrapper.classList.toggle(styles.hidden, !hasResult);
  resultContainer.classList.toggle(styles.resultGrid, hasResult);

}


// =>> updateResult
async function updateResult(updPage = 0) {

  // aggiorna var page, e si assicura che il valore non sia mai inferiore a 1
  page = Math.max(1, page + updPage);

  // disabilita tutti i pulsanti che richoamano questa funzione ad evitare chiamate multiple
  resultInfoBtnPrev.disabled = true;
  resultInfoBtnNext.disabled = true;
  searchBtn.disabled = true;


  // load data
  const data = await loadUnsplashJson();

  searchBtn.disabled = false;

  /* data:
  {
    "total": 0, <- record trovati
    "total_pages": 0, <- pagine
    "results": []
  }
  */

  if(data.total > 0) {
    toggleResultEnv(true);
    resultInfoTextWrapper.textContent = `Immagini trovate: ${data.total.toLocaleString('it-IT', {useGrouping: 'always'})}` +
      ` - pagina ${page} di ${data.total_pages.toLocaleString('it-IT', {useGrouping: 'always'})}`;
    resultInfoBtnPrev.disabled = (page??1) === 1;
    resultInfoBtnNext.disabled = (page??1) === data.total_pages;

    // =>> domBuilder immagini
    domBuilder(data.results.map(row => {

      const img_data = parseUnsplashResult(row)
        ,isSelected = selectedImgs.some(img => img.id === img_data.id)
      ;

      return {
        tag: 'figure',
        className: classnames(styles.imgWrapper, isSelected && styles.selected),
        callback: el => {
          el.img_data = img_data;

        },
        children: [
          ...unsplashPictureTag(img_data, {
            pictureExtraClass: styles.thumb,
          }),
          {
            tag: 'figcaption',
            className: styles.imgInfo,
            children: [
              {
                content: img_data.description
              },
              img_data.author_tag,

              // =>> select btn
              {
                className: 'pt-2 mt-auto align-self-center',
                children: [
                  {
                    tag: 'button',
                    className: classnames('btn btn-sm btn-outline-secondary', selectBtnClass),
                    content: setImgBtnText(isSelected),
                    attrs: {
                      type: 'button'
                    },
                  }
                ]

              }
            ]
          }
        ]
      };
    }), resultContainer, { emptyParent: true });


    // abilitazione/disabilitazione pulsante aggiungi immagine
    updAddImgBtns();

  } else {
    toggleResultEnv(false);
    resultContainer.innerHTML = '<span class="text-danger">Nessuna immagine trovata</span>';
  }
}


// =>> handler btn aggiungi imgs principale
export function unsplashGetImgs(){

  // lettura immagini preregistrate, registrazione in `selectedImgs` e calcolo `availableImgsCount`
  selectedImgs = JSON.parse(unsplashParams.hiddenField.value || '[]');
  availableImgsCount = unsplashParams.maxImgs - selectedImgs.length;

  try {

    if(availableImgsCount === 0) {
      throw {
        mes: {
          type: 'warning',
          title: 'Hai già raggiunto il numero massimo di immagini',
          text: 'Per aggiungerne altre devi prima rimuoverne almeno una di quelle presenti'
        }
      };
    }

    const searchFiledId = randomId();

    // =>> main dialog
    const modalElement = bsModalElementBuilder({
      modalClassName: styles.uspDialog,
      modalTitle: '<strong>Seleziona immagini</strong>',
      modalBodyChildren: [
        'p.my-0 Inserisci un termine di ricera e seleziona una o più immagini e premi “Aggiungi Immagini”. Premi “Completato” per terminare. ' +
          'Per un buon risultato, seleziona immagini con il soggetto al centro della foto (puoi ingrandirla con un clic sulla miniatura). ' +
          `Ricorda che <strong>puoi associare alla tua offerta un massimo di ${unsplashParams.maxImgs} immagini</strong>.`,

        // =>> search wrapper
        {
          className: styles.searchWrapper,
          children: [
            `label.form-label.my-0.text-nowrap[for: ${searchFiledId}] Termine di ricerca`,
            {
              tag: 'input',
              id: searchFiledId,
              className: 'form-control',
              attrs: {
                type: 'search',
                placeholder: 'Es. Sicilia, Granada...',
                value: process.env.NODE_ENV === 'development'? 'Sicilia' : null
              },
              callback: el => searchField = el,
            },
            {
              tag: 'button',
              content: 'Cerca',
              attrs: {
                class: 'btn btn-outline-secondary',
                type: 'Search'
              },
              callback: el => {
                searchBtn = el;
                el.addEventListener('click', async () => {
                  resultContainer.innerHTML = '';
                  toggleResultEnv(false);

                  searchString = searchField.value.trim();

                  if(!searchString) {
                    resultContainer.innerHTML = '<span class="text-danger">Devi inserire un termine di ricerca</span>';
                    return;
                  }

                  updateResult();
                });
              }
            },

            // =>> img disponibili
            'div.ml-auto Immagini disponibili:',
            {
              tag: 'span',
              className: styles.avlCounter,
              content: availableImgsCount,
              callback: el => availableImgsCountEl = el
            }
          ]
        },
        {
          className: styles.result,
          callback: el => resultContainer = el
        }
      ],
      // =>> dialog footer
      footerChildren: [
        {
          className: classnames(styles.resultInfoWrapper, styles.hidden),
          callback: el => resultInfoWrapper = el,
          children: [
            {
              tag: 'button',
              content: '&larr; Prec.',
              attrs: {
                type: 'button',
                class: 'btn btn-sm btn-outline-secondary',
                disabled: true
              },
              callback: el => {
                resultInfoBtnPrev = el;

                el.addEventListener('click', () => {
                  updateResult(-1);
                });
              }
            },
            {
              className: styles.resultInfoText,
              callback: el => resultInfoTextWrapper = el
            },
            {
              tag: 'button',
              content: 'Succ. &rarr;',
              attrs: {
                type: 'button',
                class: 'btn btn-sm btn-outline-secondary',
                disabled: true
              },
              callback: el => {
                resultInfoBtnNext = el;

                el.addEventListener('click', () => {
                  updateResult(1);
                });
              }
            }
          ]
        },
        {
          tag: 'button',
          content: 'Aggiungi Immagini',
          attrs: {
            type: 'button',
            class: 'btn btn-secondary'
          },
          callback: el => {
            el.addEventListener('click', () => {
              unsplashImgsDisplay(selectedImgs);
              unsplashParams.hiddenField.value = JSON.stringify(selectedImgs);
              unsplashParams.displayContainer?.scrollIntoView(true);
              thisModal.hide();
            });
          }
        }
      ],
      // callback: null
    });

    const thisModal = new Modal(modalElement, {focus: false});
    thisModal.show();

    // modalElement.addEventListener('shown.bs.modal', () => {});
    modalElement.addEventListener('hidden.bs.modal', () => {
      thisModal.dispose();
      modalElement.remove();
    });

  } catch(e) {

    if(e.mes) {
      if(!e.mes.title && e.mes.text) {
        e.mes.title = e.mes.text;
        e.mes.text = null;
      }
      mAlert({
        type  : e.mes.type?? 'error',
        title : e.mes.title,
        mes   : e.mes.text?? null,
      });
    }

    if(e.err) {
      // eslint-disable-next-line no-console
      console.error('[unsplashGetImgs]', e.err);
    }
  }

}
