/*
  Configurazione di esempio di cookie-consent.
  Copiare questo file nel progetto (es. `src/cookie-consent.config.mjs`), compilarlo e passarlo
  a `initCookieConsent()` (e, se serve, a `renderCookieList()` nella pagina della privacy policy):

    import { initCookieConsent } from '@massimo-cassandro/minimo/vanilla-cookie-consent';
    import config from './cookie-consent.config.mjs';

    initCookieConsent(config);

  Tutte le proprietà sono facoltative: quelle omesse assumono i valori di default
  (vedi `src/defaults.js`).
*/

/** @type {import('./cookie-consent.js').CookieConsentConfig} */
export default {

  // URL della pagina Privacy e Cookie Policy, linkata nei testi dei modal
  privacyPolicyUrl: '/privacy-policy',

  // Moduli opzionali: ogni modulo viene attivato solo se presente e con `enabled: true`.
  // I cookie dei moduli attivi vengono aggiunti automaticamente all'elenco della relativa categoria
  modules: {

    // Google reCAPTCHA v3, caricato solo dopo il consenso.
    // Gli elementi indicati da `formWrapperSelector` ricevono `disabledClass`
    // finché reCAPTCHA non viene caricato (o se il consenso viene revocato)
    recaptcha: {
      enabled: false,
      siteKey: '', // chiave pubblica reCAPTCHA, obbligatoria se il modulo è attivo
      // category: 'functionality',
      // formWrapperSelector: '.recaptcha-form-wrapper',
      // disabledClass: 'disabled',
      // description: 'testo che sostituisce la descrizione di default del cookie _GRECAPTCHA',
    },

    // Google Analytics 4, caricato solo dopo il consenso
    analytics: {
      enabled: false,
      measurementId: '', // es. 'G-XXXXXXXXXX', obbligatorio se il modulo è attivo
      // category: 'analytics',
    },
  },

  // Cookie aggiuntivi impostati dal sito, per categoria.
  // `cc_cookie` (scelta dell'utente) è sempre aggiunto tra i necessari
  cookies: {
    necessary: [
      {
        name: 'PHPSESSID',
        domain: 'Questo sito',
        description: 'Identifica la sessione corrente in modo anonimo in modo di poter eseguire alcune azioni.',
        expiration: 'sessione'
      },
    ],
    // functionality: [],
    // analytics: [],
  },

  // Titoli e descrizioni delle categorie (sovrascrivono quelli di default)
  // categories: {
  //   functionality: {
  //     title: 'Cookie per funzionalità aggiuntive',
  //     description: '...'
  //   },
  // },

  // Opzioni grafiche di vanilla-cookieconsent (unite a quelle di default)
  // https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions
  // guiOptions: {
  //   consentModal: { layout: 'box', position: 'bottom right' },
  // },

  // Callback aggiuntivi, eseguiti dopo la gestione dei moduli
  // onConsent: ({ cookie }) => {},
  // onChange: ({ cookie, changedCategories, changedServices }) => {},
};
