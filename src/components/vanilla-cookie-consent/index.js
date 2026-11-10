// entry point di vanilla-cookie-consent, esposto come `@massimo-cassandro/minimo/vanilla-cookie-consent`
// (non incluso in `src/index.js`: richiede la peer dependency opzionale `vanilla-cookieconsent`)

export { initCookieConsent } from './cookie-consent.js';
export { getCookieList } from './get-cookie-list.js';
export { loadRecaptchaAsync } from './src/modules/recaptcha.js';
export { isAccepted, acceptCategoryKeepingOthers, onCategoryAccepted } from './src/helpers.js';
