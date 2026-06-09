import './cookie-consent.css';
import * as CookieConsent from 'vanilla-cookieconsent';
import { it_translation } from './src/it-translation.js';
// import { run_analytics } from './src/run-analytics.js';
import { run_recaptcha, disableRecaptcha } from './src/run-recaptcha.js';


// https://cookieconsent.orestbida.com/essential/getting-started.html
CookieConsent.run({
  hideFromBots: !(new URLSearchParams(document.location.search).get('cc-list-parser') !== null), // abilita il parsing dei cookie da cookies-list
  categories: {
    necessary: {
      enabled: true,
      readOnly: true
    },
    functionality: {
      enabled: true,
    },
    analytics: {
      enabled: true,
    }
  },
  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom right',
      flipButtons: false,
      equalWeightButtons: false
    },
    preferencesModal: {
      layout: 'box',
      // position: 'left right',
      flipButtons: false,
      equalWeightButtons: true
    },
  },
  language: {
    default: 'it',
    translations: it_translation
  },
  onConsent: ({cookie}) => {
    // if(cookie.categories.indexOf('analytics') !== -1) {
    //   run_analytics();
    // }
    if(cookie.categories.indexOf('functionality') !== -1) {
      run_recaptcha();
    }
  },
  // https://cookieconsent.orestbida.com/reference/configuration-reference.html#onchange
  onChange: ({/* cookie,  */changedCategories/* , changedServices */}) => {
    if(changedCategories.includes('functionality')){

      // caso in cui si cambia l'intera categoria
      if(CookieConsent.acceptedCategory('functionality')){
        run_recaptcha();
      } else {
        disableRecaptcha();
      }

      // TODO caso in cui si cambia il solo recaptcha (se ce ne fossero anche altri)
      // console.log(cookie);
      // console.log(changedServices);
      // console.log(CookieConsent.acceptedService('_GRECAPTCHA', 'functionality'));

      // if(changedServices['functionality'].includes('Google Analytics')){
      //   if(CookieConsent.acceptedService('Google Analytics', 'analytics')){
      //     // Google Analytics was just enabled
      //   }else{
      //     // Google Analytics was just disabled
      //   }
      // }

    }
  }
});

