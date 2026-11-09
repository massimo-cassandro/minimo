// modulo Google Maps per cookie-consent
// non carica nulla da sé: dichiara il servizio e la riga descrittiva, il caricamento delle mappe
// resta a cura del progetto (es. con `onCategoryAccepted()` o con i callback `onAccept`/`onReject`)

/**
 * @typedef {Object} GoogleMapsModuleOptions
 * @property {boolean} [enabled] - Attiva il modulo (default: false)
 * @property {string} [category] - Categoria di cookie a cui è associato il modulo (default: "functionality")
 * @property {string} [label] - Etichetta del servizio nel modal preferenze (default: "Google Maps")
 * @property {string} [description] - Descrizione nell'elenco dei cookie (default: testo generico)
 * @property {() => void} [onAccept] - Eseguito al consenso
 * @property {() => void} [onReject] - Eseguito alla revoca di un consenso dato in precedenza
 */

/** @type {GoogleMapsModuleOptions} */
const defaults = {
  enabled: false,
  category: 'functionality',
  label: 'Google Maps',
  description: 'Mappe interattive fornite da Google. Al caricamento della mappa Google può impostare cookie ' +
    'e raccogliere dati di navigazione sui propri domini, secondo la propria informativa privacy.',
};

/** @type {import('../../cookie-consent.js').CookieConsentModule<GoogleMapsModuleOptions>} */
export const googleMapsModule = {
  defaults,
  label: 'Google Maps',

  cookies: opts => [
    {
      name: 'Google Maps',
      type: 'servizio di terzi',
      domain: 'google.com',
      description: opts.description ?? defaults.description ?? '',
      expiration: '—',
    },
  ],

  onAccept: opts => opts.onAccept?.(),
  onReject: opts => opts.onReject?.(),
};
