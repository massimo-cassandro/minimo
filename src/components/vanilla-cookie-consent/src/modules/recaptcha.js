// modulo Google reCAPTCHA v3 per cookie-consent
// lo script viene caricato solo dopo il consenso alla categoria associata (default: functionality)

/**
 * @typedef {Object} RecaptchaModuleOptions
 * @property {boolean} [enabled] - Attiva il modulo (default: false)
 * @property {string} siteKey - Chiave pubblica reCAPTCHA
 * @property {string} [category] - Categoria di cookie a cui è associato il modulo (default: "functionality")
 * @property {string} [formWrapperSelector] - Selettore degli elementi da disabilitare in assenza di consenso (default: ".recaptcha-form-wrapper")
 * @property {string} [disabledClass] - Classe aggiunta agli elementi di `formWrapperSelector` in assenza di consenso (default: "disabled")
 * @property {string} [description] - Descrizione del cookie `_GRECAPTCHA` nell'elenco dei cookie (default: testo generico)
 */

/** @type {Required<Omit<RecaptchaModuleOptions, 'siteKey'>>} */
const defaults = {
  enabled: false,
  category: 'functionality',
  formWrapperSelector: '.recaptcha-form-wrapper',
  disabledClass: 'disabled',
  description: 'Questo cookie è impostato dal servizio reCAPTCHA di Google per identificare i bot e proteggere il sito da attacchi di spam dannosi.<br>' +
    'Se questa opzione viene disattivata non sarà possibile utilizzare i form protetti da reCAPTCHA.',
};

/**
 * @param {RecaptchaModuleOptions} opts
 * @param {boolean} disabled
 */
function toggleFormWrappers(opts, disabled) {
  document.querySelectorAll(opts.formWrapperSelector)
    .forEach(el => el.classList.toggle(opts.disabledClass, disabled));
}

/**
 * Aggiunge lo script reCAPTCHA v3 al documento (se non già presente)
 * @param {string} siteKey - Chiave pubblica reCAPTCHA
 * @param {() => void} [callback] - Funzione eseguita al caricamento dello script
 */
export function addRecaptchaScript(siteKey, callback) {

  if (!document.head.querySelector('script.recaptcha')) {
    const script = document.createElement('script');

    if (typeof callback === 'function') {
      script.onload = callback;
    }

    script.async = true;
    script.defer = true;
    script.className = 'recaptcha';
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    document.head.appendChild(script);
  }
}

/**
 * Esegue `callback` quando `grecaptcha` è pronto, caricando lo script se necessario.
 * Da richiamare al submit del form (solo se l'utente ha dato il consenso).
 * @example
 * loadRecaptchaAsync('SITE_KEY', () => {
 *   grecaptcha.execute('SITE_KEY', {action: 'submit'}).then(token => {
 *     // usa il token
 *   });
 * });
 * @param {string} siteKey - Chiave pubblica reCAPTCHA
 * @param {() => void} callback - Funzione eseguita quando `grecaptcha` è pronto
 * @param {number} [timeout] - Tempo massimo di attesa in ms, poi viene sollevato un errore in console (default: 10000)
 */
export function loadRecaptchaAsync(siteKey, callback, timeout = 10000) {

  const start = Date.now();

  function waitForGrecaptcha() {
    const grecaptcha = /** @type {any} */ (window).grecaptcha;

    if (grecaptcha && typeof grecaptcha.execute === 'function') {
      grecaptcha.ready(callback);

    } else if (Date.now() - start > timeout) {
      console.error('reCAPTCHA non disponibile'); // eslint-disable-line no-console

    } else {
      setTimeout(waitForGrecaptcha, 100);
    }
  }

  if (document.querySelector('script.recaptcha')) {
    waitForGrecaptcha();
  } else {
    addRecaptchaScript(siteKey, waitForGrecaptcha);
  }
}


/** @type {import('../../cookie-consent.js').CookieConsentModule<RecaptchaModuleOptions>} */
export const recaptchaModule = {
  defaults,
  label: 'Google reCAPTCHA',

  validate: opts => opts.siteKey ? null : '`siteKey` mancante',

  cookies: opts => [
    {
      name: '_GRECAPTCHA',
      domain: 'google.com',
      description: opts.description ?? defaults.description,
      expiration: 'Circa 6 mesi'
    },
  ],

  // stato iniziale: form disabilitati finché non arriva il consenso
  init: opts => toggleFormWrappers(opts, true),

  onAccept: opts => addRecaptchaScript(opts.siteKey, () => toggleFormWrappers(opts, false)),

  // il cookie `_GRECAPTCHA` è impostato sul dominio google.com e non può essere eliminato dal sito
  onReject: opts => {
    document.head.querySelector('script.recaptcha')?.remove();
    toggleFormWrappers(opts, true);
  },
};
