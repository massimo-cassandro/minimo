import './dialog-content.css';
import x_icon from '@icone/x.svg?inline';
import { spinner } from './spinner';
/**
  `indicator_class`: classe da aggiungere al wrapper per indicare in modo univoco il dialog
 */
export function content_dialog_markup(indicator_class) {

  return `<dialog class="${indicator_class} content-dialog">` +
    '<div class="content-dialog-inner">' +
      '<div class="content-dialog-close">' +
        `<button type="button" class="btn-reset content-dialog-close-btn" aria-label="Chiudi finestra">${x_icon}</button>` +
      '</div>' +
      '<div class="content-dialog-body"></div>' +
    '</div>'+
  '</dialog>';
}


/**
  `content_url`    : url del file contenente il contenuto da caricare via ajax
  `indicator_class`: classe da aggiungere al wrapper per indicare in modo univoco il dialog
  `once_callback`  : callback da invocare solo la prima volta,  alla creazione del dialog
 */
let dialog_list = {};
export async function show_ajax_content_dialog({content_url, class_identifier, once_callback = null}){

  const close_dialog = (class_identifier) => {
      dialog_list[class_identifier].close();
      document.body.classList.remove('overflow-hidden');
    }
    ,open_dialog = (class_identifier) => {
      dialog_list[class_identifier].showModal();
      document.body.classList.add('overflow-hidden');
    }
  ;


  if(!Object.keys(dialog_list).includes(class_identifier)) {
    document.body.insertAdjacentHTML('beforeend',
      content_dialog_markup(class_identifier)
    );

    const dialog = document.querySelector(`.content-dialog.${class_identifier}`);
    dialog_list[class_identifier] = dialog;
    dialog.querySelector('.content-dialog-close-btn').addEventListener('click', () => {
      close_dialog(class_identifier);
    }, false);


    const dialog_body = dialog.querySelector('.content-dialog-body');
    dialog_body.innerHTML = spinner();
    open_dialog(class_identifier);

    const url = content_url;
    (async () => {
      const response = await fetch(url),
        content = await response.text();
      return content;
    })()
      .then(content => {
        dialog_body.innerHTML = content;

        if(once_callback && typeof once_callback === 'function') {
          once_callback(dialog_body);
        }
      })
      .catch(err => {
        /* eslint-disable no-console */
        console.error(url);
        console.error(err);
        /* eslint-enable no-console */

        alert('Si è verificato un errore.\n'+
          'Ricarica la pagina e ripeti l’operazione');
      });

  } else {
    open_dialog(class_identifier);

  }
}
