// modulo Google Analytics 4 per cookie-consent
// lo script viene caricato solo dopo il consenso alla categoria associata (default: analytics)

/**
 * @typedef {Object} AnalyticsModuleOptions
 * @property {boolean} [enabled] - Attiva il modulo (default: false)
 * @property {string} measurementId - ID di misurazione GA4 (es. "G-XXXXXXXXXX")
 * @property {string} [category] - Categoria di cookie a cui è associato il modulo (default: "analytics")
 */

/** @type {Required<Omit<AnalyticsModuleOptions, 'measurementId'>>} */
const defaults = {
  enabled: false,
  category: 'analytics',
};

/**
 * Carica gtag.js e definisce `window.gtag` (globale, utilizzabile per eventi successivi)
 * @param {string} measurementId - ID di misurazione GA4
 */
function loadAnalytics(measurementId) {
  const w = /** @type {any} */ (window);

  // GA4 opt-out: riattiva il tracciamento se in precedenza era stato disattivato
  w[`ga-disable-${measurementId}`] = false;

  if (document.head.querySelector('script.ga')) {
    return;
  }

  w.dataLayer = w.dataLayer || [];
  w.gtag = function() {
    w.dataLayer.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.classList.add('ga');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}


/** @type {import('../../cookie-consent.js').CookieConsentModule<AnalyticsModuleOptions>} */
export const analyticsModule = {
  defaults,
  label: 'Google Analytics',

  validate: opts => opts.measurementId ? null : '`measurementId` mancante',

  cookies: opts => [
    {
      name: '_ga',
      domain: 'Questo sito',
      description: 'Cookie utilizzato da Google Analytics per distinguere i visitatori',
      expiration: '2 anni'
    },
    {
      name: `_ga_${opts.measurementId.replace(/^G-/, '')}`,
      domain: 'Questo sito',
      description: 'Cookie utilizzato da Google Analytics per mantenere lo stato della sessione',
      expiration: '2 anni'
    },
  ],

  // cookie eliminati da vanilla-cookieconsent alla revoca del consenso
  autoClearCookies: () => [{ name: /^_ga/ }],

  onAccept: opts => loadAnalytics(opts.measurementId),

  // gtag.js non può essere scaricato: si usa l'opt-out ufficiale di GA4
  onReject: opts => {
    /** @type {any} */ (window)[`ga-disable-${opts.measurementId}`] = true;
  },
};
