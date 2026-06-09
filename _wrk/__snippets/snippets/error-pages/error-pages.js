import { unsplashPageJS } from '@massimo-cassandro/unsplash-page';
import './error-pages.css';

const errCode = document.documentElement.dataset.errCode || '500',
  errors = {
    '403': {
      title: 'Ops, non puoi accedere a questa pagina'
    },
    '404': {
      title: 'Ops, questa pagina non esiste'
    },
    '500': {
      title: 'Ops, si è verificato un errore'
    },
    '503': {
      title: 'Siamo spiacenti, il sito è temporaneamente in manutenzione'
    }
  }
  ,url = 'https://app.blunet.it/get-unsplash'
;

document.title = `Errore ${errCode}`;

unsplashPageJS({
  targetElement    : document.getElementById('root'),
  className        : 'error-page',
  unsplashDataUrl  : url,
  utmSource        : 'blunet.it',
  title            : errors[errCode].title,
  // text             : null,
  backLink         : errCode !== '503'? 'Torna alla <a href="/">Home</a>' : '',
  // hidePhotoLink    : true,
  // cssModules       : false,
  // cssModulesObj    : null
});
