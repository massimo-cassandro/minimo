import { domBuilder, classnames } from '@massimo-cassandro/minimo';
import { unsplashParams, unsplashPictureTag } from './unsplash-utilities.js';
import { unsplashGetImgs } from './unsplash-get-imgs.js';
import * as styles from './unsplash-imgs-display.module.css';
import imageIcon from '../icons/image.svg?inline';

let displayContainer;

// elemento .imgDisplayWrapper attualmente trascinato (drag and drop riordinamento)
let draggedItem = null;


// abilita il trascinamento di wrapperEl tramite la maniglia handleEl
function initSortHandle(handleEl, wrapperEl){
  handleEl.addEventListener('mousedown', () => {
    wrapperEl.draggable = true;
  });
  handleEl.addEventListener('mouseup', () => {
    wrapperEl.draggable = false;
  });

  wrapperEl.addEventListener('dragstart', e => {
    draggedItem = wrapperEl;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', wrapperEl.dataset.imgId);
    wrapperEl.classList.add(styles.dragging);
  });

  wrapperEl.addEventListener('dragend', () => {
    wrapperEl.draggable = false;
    wrapperEl.classList.remove(styles.dragging);
    draggedItem = null;
    updateHiddenFieldOrder();
  });
}

// aggiorna il value del campo hidden in base al nuovo ordine (DOM) degli .imgDisplayWrapper
function updateHiddenFieldOrder(){
  const data = JSON.parse(unsplashParams.hiddenField.value || '[]');
  const order = [...displayContainer.querySelectorAll(`.${styles.imgDisplayWrapper}`)]
    .map(el => el.dataset.imgId);

  data.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  unsplashParams.hiddenField.value = JSON.stringify(data);
}


// markup placeholder
const placeHolderObjEl = {
  className: styles.placeholder,
  content: imageIcon
};


export function unsplashImgsDisplayInit(){

  domBuilder([

    'p.my-0.small Utilizzare il pulsante “Seleziona immagine” per inserire un termine di ricerca e quindi selezionare ' +
      `almeno un’immagine <strong>(massimo ${unsplashParams.maxImgs})</strong>.`,
    'p-my-0.small Se vuoi sostituire una foto, prima rimuovila dall’elenco delle immagini selezionate (qui sotto) ' +
      'e quindi selezionane una nuova.',
    'p.my-0.small Per pubblicare un gruppo, è necessario che sia presente almeno un’immagine; '+
      '<strong>la prima sarà utilizzata come copertina</strong> (puoi variare l’ordinamento, se necessario, trascinando l’icona in fondo ad ogni card immagine).',

    {
      className: styles.displayContainer,
      callback: el => displayContainer = el
    },
    {
      className: 'mt-lg text-right',
      children: [
        {
          tag: 'button',
          attrs: {
            class: 'btn btn-outline-secondary',
            type: 'button'
          },
          content: 'Seleziona immagini',
          callback: el => {
            el.addEventListener('click', () => {
              unsplashGetImgs();
            });
          }
        }
      ]
    }

  ], unsplashParams.hiddenField, {insertMode: 'before'});

  // aggiunta displayContainer ad unsplashParams perché utilizzato anche dall'applicazione principale
  unsplashParams.displayContainer = displayContainer;


  // =>> listener rimozione foto
  displayContainer.addEventListener('click', e => {
    if(e.target.classList.contains(styles.closeBtn)) {
      const imgId = e.target.imgId;

      e.target.closest(`.${styles.imgDisplayWrapper}`).remove();

      // aggiornamento value hidden
      let data = JSON.parse(unsplashParams.hiddenField.value || '[]');
      data = data.filter(row => row.id !== imgId);
      unsplashParams.hiddenField.value = JSON.stringify(data);

      displayContainer.insertAdjacentElement('beforeend', domBuilder([placeHolderObjEl]));

    }
  });

  // riordinamento via drag and drop (maniglia: styles.sortArea > div)
  // le card sono disposte in griglia su un'unica riga (grid-template-columns: repeat(maxImgs, 1fr)),
  // quindi l'inserimento prima/dopo si basa sulla posizione orizzontale del cursore
  displayContainer.addEventListener('dragover', e => {
    if(!draggedItem) {
      return;
    }
    e.preventDefault();

    const targetWrapper = e.target.closest(`.${styles.imgDisplayWrapper}`);
    if(!targetWrapper || targetWrapper === draggedItem) {
      return;
    }

    const rect = targetWrapper.getBoundingClientRect();
    const insertBefore = (e.clientX - rect.left) < rect.width / 2;

    targetWrapper.parentNode.insertBefore(
      draggedItem,
      insertBefore? targetWrapper : targetWrapper.nextSibling
    );
  });
}

export function unsplashImgsDisplay(data = null){

  if(data == null) {
    data = JSON.parse(unsplashParams.hiddenField.value || '[]');
  }


  domBuilder([
    ...data.map( row => (
      {
        className: styles.imgDisplayWrapper,
        attrs: { 'data-img-id': row.id },
        // inizializzazione trascinamento: a questo punto l'intero sotto-albero
        // (incluso styles.sortArea) è già collegato al wrapper
        // l'intera area sortArea (non solo l'icona al suo interno) fa da maniglia
        callback: el => initSortHandle(el.querySelector(`.${styles.sortArea}`), el),
        children: [
          ...unsplashPictureTag(row, {
            width: 300,
            addPopover: true,
            popoverImgWidth: 800,
            imgExtraClass: styles.img,
            imgExtraAttrs: {draggable: 'false'}
          }),

          {
            className: styles.imgDisplayInfo,
            children: [
              {
                tag: 'ul',
                children: [
                  `li ${row.description}`,
                  {
                    tag: 'li',
                    children: [
                      row.author_tag
                    ]
                  }
                ]
              },
              {
                tag: 'button',
                className: classnames('btn-close', styles.closeBtn),
                callback: el => el.imgId = row.id
              }
            ]
          },

          {
            className: styles.sortArea,
            children: [
              'div'
            ]
          }
        ]
      }
    )),
    ...(Array.from({length: unsplashParams.maxImgs - data.length}, () => placeHolderObjEl ))
  ], displayContainer, {emptyParent: true});
}
