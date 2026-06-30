// TODO rivedere, uso anche al di fuori di cookie consent?
// TODO spostare nella dir recaptcha


import { recaptcha_key } from '@src/pages/recaptcha-params.js';

const form_wrapper = document.querySelector('.recaptcha-form-wrapper');

export function addRecaptchaScript(callback) {

  if (!document.head.querySelector('script.recaptcha')) {
    const script = document.createElement('script');

    if(callback != null && typeof callback === 'function') {
      script.onload = callback;
    }

    script.async = true;
    script.defer = true;
    script.className = 'recaptcha';
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptcha_key}`;
    document.head.appendChild(script);
  }

}

// imposta lo script analytics GA4 (se l'utente ha dato il consenso)
export function run_recaptcha() {

  if(recaptcha_key) {
    addRecaptchaScript(() => form_wrapper.classList.remove('disabled'));
  }

}

export function disableRecaptcha() {
  document.head.querySelector('script.recaptcha')?.remove();
  form_wrapper?.classList.add('disabled');
}

// funzione da richiamare al submit del form con recaptcha
/*

loadRecaptchaAsync('TUO_SITE_KEY', () => {

  grecaptcha.ready(function() {
    grecaptcha.execute('TUO_SITE_KEY', {action: 'submit'}).then(function(token) {
      // Usa il token
    });
  });
});
*/

export function loadRecaptchaAsync(siteKey, callback) {

  function waitForGrecaptcha(cb) {

    if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
      window.grecaptcha.ready(cb);
    } else {
      setTimeout(() => waitForGrecaptcha(cb), 100);
    }
  }

  if (document.querySelector('script.recaptcha')) {
    waitForGrecaptcha(callback);
    return;
  }

  addRecaptchaScript(() => waitForGrecaptcha(callback));
}
