// entry point di vanilla-cookie-consent, esposto come `@massimo-cassandro/minimo/vanilla-cookie-consent`
// (non incluso in `src/index.js`: richiede la peer dependency opzionale `vanilla-cookieconsent`)

export { initCookieConsent } from './cookie-consent.js';
export { renderCookieList } from './render-cookie-list.js';
export { loadRecaptchaAsync } from './src/modules/recaptcha.js';
