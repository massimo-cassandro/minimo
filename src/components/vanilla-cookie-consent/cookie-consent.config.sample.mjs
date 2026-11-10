/*
  Configurazione di esempio di cookie-consent.
  Copiare questo file nel progetto (es. `src/cookie-consent.config.mjs`), compilarlo e passarlo
  a `initCookieConsent()` (e, se serve, a `getCookieList()` per la pagina della privacy policy):

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

  // in alternativa, URL passato dal server (es. da Twig: `<html data-privacy-url="{{ path('privacy') }}">`)
  // invece di scriverlo a mano:
  // privacyPolicyUrl: document.documentElement.dataset.privacyUrl ?? '/privacy-policy',

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

    // Google Maps: non carica nulla, dichiara solo il servizio e la riga descrittiva.
    // Il caricamento della mappa resta a cura del progetto (vedi `onCategoryAccepted()` nel README).
    // Con `categories.functionality.reloadOnRevoke: true` la revoca ricarica la pagina
    // (lo script di Google Maps, una volta caricato, non si può scaricare)
    googleMaps: {
      enabled: false,
      // category: 'functionality',
      // label: 'Google Maps',
      // description: 'testo che sostituisce la descrizione di default',
      // onAccept: () => {},
      // onReject: () => {},
    },
  },

  // Servizi personalizzati, registrati come servizi di vanilla-cookieconsent nella categoria indicata:
  // l'utente può attivarli singolarmente dal modal delle preferenze.
  // Le righe di `cookies` vengono aggiunte all'elenco della categoria
  // services: {
  //   youtube: {
  //     category: 'functionality', // functionality (default) o analytics
  //     label: 'Video YouTube',
  //     cookies: [
  //       {
  //         name: 'YouTube',
  //         type: 'servizio di terzi',
  //         domain: 'youtube.com',
  //         description: 'Riproduzione dei video incorporati. YouTube può impostare cookie sui propri domini.',
  //       },
  //     ],
  //     // autoClearCookies: [{ name: /^yt_/ }], // cookie da eliminare alla revoca
  //     onAccept: () => {}, // es. sostituire i segnaposto con i video
  //     onReject: () => {},
  //   },
  // },

  // Righe aggiuntive dell'elenco, per categoria: cookie, ma anche localStorage, sessionStorage
  // e servizi di terzi (campo `type`, facoltativo; se presente in almeno una riga compare la colonna "Tipo").
  // `cc_cookie` (scelta dell'utente) è sempre aggiunto tra i necessari
  cookies: {
    necessary: [
      {
        name: 'PHPSESSID',
        domain: 'Questo sito',
        description: 'Identifica la sessione corrente in modo anonimo in modo di poter eseguire alcune azioni.',
        expiration: 'sessione'
      },
      // {
      //   name: 'theme-preference',
      //   type: 'localStorage', // cookie (default), localStorage, sessionStorage, servizio di terzi
      //   domain: 'Questo sito',
      //   description: 'Memorizza il tema chiaro/scuro scelto dall’utente.',
      //   expiration: 'fino alla cancellazione',
      // },
    ],
    // functionality: [],
    // analytics: [],
  },

  // Opzioni delle categorie: titolo e descrizione sovrascrivono quelli di default.
  // Le categorie non necessarie compaiono solo se hanno righe o servizi, oppure con `show: true`
  // categories: {
  //   functionality: {
  //     title: 'Contenuti di terze parti',
  //     description: 'Mappe e video forniti da servizi esterni, caricati solo con il tuo consenso.',
  //     // show: true,
  //     // reloadOnRevoke: true, // ricarica la pagina alla revoca (script di terzi non scaricabili)
  //   },
  // },

  // Intestazioni della tabella dei cookie (sovrascrivono quelle di default).
  // Indicando `type` la colonna "Tipo" compare sempre
  // cookieTableHeaders: {
  //   name: 'Nome',
  //   type: 'Tipo',
  //   domain: 'Impostato da',
  //   description: 'Descrizione',
  //   expiration: 'Durata',
  // },

  // Opzioni grafiche di vanilla-cookieconsent (unite a quelle di default)
  // https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions
  // guiOptions: {
  //   consentModal: { layout: 'box', position: 'bottom right' },
  // },

  // Callback aggiuntivi di vanilla-cookieconsent
  // onConsent: ({ cookie }) => {},
  // onChange: ({ cookie, changedCategories, changedServices }) => {},
};
