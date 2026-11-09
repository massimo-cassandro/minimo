import './cookie-consent.css';
import * as CookieConsent from 'vanilla-cookieconsent';
import { guiOptions } from './src/defaults.js';
import { itTranslation } from './src/it-translation.js';
import { buildSections, resolveConfig } from './src/resolve-config.js';

/**
 * @typedef {'cookie'|'localStorage'|'sessionStorage'|'servizio di terzi'} RowType
 */

/**
 * @typedef {Object} CookieRow - Riga dell'elenco dei cookie (o di altri strumenti di memorizzazione e servizi)
 * @property {string} name - Nome del cookie, della chiave di storage o del servizio
 * @property {RowType|string} [type] - Tipo di riga; se almeno una riga lo indica compare la colonna "Tipo" (default: "cookie")
 * @property {string} domain - Dominio che imposta il cookie (es. "Questo sito", "google.com")
 * @property {string} description - Descrizione (può contenere `<br>`)
 * @property {string} [expiration] - Durata (default: "")
 */

/**
 * @typedef {Object} CookieTableHeaders - Intestazioni della tabella dei cookie (l'ordine delle colonne è fisso)
 * @property {string} [name] - (default: "Cookie", oppure "Nome" se compare la colonna "Tipo")
 * @property {string} [type] - Indicandola, la colonna "Tipo" compare sempre (default: "Tipo")
 * @property {string} [domain] - (default: "Impostato da")
 * @property {string} [description] - (default: "Descrizione")
 * @property {string} [expiration] - (default: "Durata")
 */

/**
 * @typedef {'necessary'|'functionality'|'analytics'} CategoryKey
 */

/**
 * @typedef {Object} CategoryOptions - Opzioni di una categoria
 * @property {string} [title] - Titolo (sovrascrive quello di default)
 * @property {string} [description] - Descrizione (sovrascrive quella di default)
 * @property {boolean} [show] - Mostra la categoria anche senza righe né servizi (default: false)
 * @property {boolean} [reloadOnRevoke] - Ricarica la pagina alla revoca del consenso, per gli script di terzi
 *   già caricati che non si possono scaricare, es. Google Maps (default: false)
 */

/**
 * @typedef {Object} CustomService - Servizio personalizzato, registrato come servizio di vanilla-cookieconsent
 * @property {'functionality'|'analytics'} [category] - Categoria di appartenenza (default: "functionality")
 * @property {string} [label] - Etichetta nel modal preferenze (default: nome del servizio)
 * @property {boolean} [enabled] - Con `false` il servizio viene ignorato (default: true)
 * @property {CookieRow[]} [cookies] - Righe aggiunte all'elenco della categoria (default: [])
 * @property {import('vanilla-cookieconsent').CookieItem[]} [autoClearCookies] - Cookie da eliminare alla revoca (default: [])
 * @property {() => void} [onAccept] - Eseguito al consenso
 * @property {() => void} [onReject] - Eseguito alla revoca di un consenso dato in precedenza
 */

/**
 * Modulo opzionale (es. reCAPTCHA, Analytics), registrato come servizio di vanilla-cookieconsent
 * all'interno della propria categoria
 * @template T
 * @typedef {Object} CookieConsentModule
 * @property {Partial<T>} defaults - Opzioni di default
 * @property {string} label - Etichetta del servizio nel modal preferenze
 * @property {(opts: T) => string|null} [validate] - Restituisce un messaggio d'errore se le opzioni non sono valide
 * @property {(opts: T) => CookieRow[]} cookies - Cookie impostati dal modulo
 * @property {(opts: T) => import('vanilla-cookieconsent').CookieItem[]} [autoClearCookies] - Cookie da eliminare alla revoca del consenso
 * @property {(opts: T) => void} [init] - Eseguito all'avvio, prima della verifica del consenso
 * @property {(opts: T) => void} [onAccept] - Eseguito al consenso
 * @property {(opts: T) => void} [onReject] - Eseguito alla revoca di un consenso dato in precedenza
 */

/**
 * @typedef {Object} CookieConsentConfig - Configurazione (vedi `cookie-consent.config.sample.mjs`)
 * @property {string} [privacyPolicyUrl] - URL della pagina Privacy e Cookie Policy (default: "/privacy-policy")
 * @property {Object} [modules] - Moduli opzionali, attivi solo con `enabled: true`
 * @property {import('./src/modules/recaptcha.js').RecaptchaModuleOptions} [modules.recaptcha] - Google reCAPTCHA v3
 * @property {import('./src/modules/analytics.js').AnalyticsModuleOptions} [modules.analytics] - Google Analytics 4
 * @property {import('./src/modules/google-maps.js').GoogleMapsModuleOptions} [modules.googleMaps] - Google Maps (solo dichiarazione del servizio)
 * @property {Record<string, CustomService>} [services] - Servizi personalizzati, per nome
 * @property {Partial<Record<CategoryKey, CookieRow[]>>} [cookies] - Righe aggiuntive del sito (cookie, storage, servizi), per categoria
 * @property {Partial<Record<CategoryKey, CategoryOptions>>} [categories] - Opzioni delle categorie
 * @property {CookieTableHeaders} [cookieTableHeaders] - Intestazioni della tabella (sovrascrivono quelle di default)
 * @property {import('vanilla-cookieconsent').GuiOptions} [guiOptions] - Opzioni grafiche, unite a quelle di default
 * @property {import('vanilla-cookieconsent').CookieConsentConfig['onConsent']} [onConsent] - Callback aggiuntivo al consenso
 * @property {import('vanilla-cookieconsent').CookieConsentConfig['onChange']} [onChange] - Callback aggiuntivo alla modifica delle preferenze
 */

/**
 * Inizializza vanilla-cookieconsent con i testi italiani e i moduli attivati nella configurazione
 * @example
 * // Tutti i parametri (valori di default dove previsti):
 * initCookieConsent({
 *   privacyPolicyUrl: '/privacy-policy', // URL pagina privacy, FAC
 *   modules: { // moduli opzionali, FAC
 *     recaptcha: { enabled: false, siteKey: '' }, // reCAPTCHA v3, FAC
 *     analytics: { enabled: false, measurementId: '' }, // GA4, FAC
 *     googleMaps: { enabled: false }, // Google Maps, FAC
 *   },
 *   services: {}, // servizi personalizzati, FAC
 *   cookies: { necessary: [], functionality: [], analytics: [] }, // righe del sito, FAC
 *   categories: {}, // testi e opzioni delle categorie, FAC
 *   cookieTableHeaders: {}, // intestazioni della tabella, FAC
 *   guiOptions: {}, // opzioni grafiche vanilla-cookieconsent, FAC
 *   onConsent: undefined, // callback al consenso, FAC
 *   onChange: undefined, // callback alla modifica, FAC
 * });
 * @param {CookieConsentConfig} [config] - Configurazione (default: {})
 * @returns {Promise<typeof CookieConsent>} - L'API di vanilla-cookieconsent (es. per `showPreferences()`)
 */
export async function initCookieConsent(config = {}) {

  const { activeServices, categories, tableHeaders } = resolveConfig(config);

  activeServices.forEach(s => s.init?.());

  /** @type {Record<string, import('vanilla-cookieconsent').Category>} */
  const ccCategories = {};

  categories.forEach(cat => {
    const autoClearCookies = cat.services.flatMap(s => s.autoClearCookies);

    ccCategories[cat.key] = {
      // le categorie non necessarie non devono essere preselezionate
      // (linee guida Garante Privacy 2021: niente consenso preimpostato)
      enabled: cat.key === 'necessary',
      readOnly: cat.key === 'necessary',
      // `reloadPage` richiede la presenza di `autoClear`, anche senza cookie da eliminare
      ...(autoClearCookies.length || cat.reloadOnRevoke
        ? { autoClear: { cookies: autoClearCookies, ...(cat.reloadOnRevoke ? { reloadPage: true } : {}) } }
        : {}
      ),
      ...(cat.services.length
        ? {
          services: Object.fromEntries(cat.services.map(s => [s.name, {
            label: s.label,
            ...(s.onAccept ? { onAccept: s.onAccept } : {}),
            ...(s.onReject ? { onReject: s.onReject } : {}),
          }]))
        }
        : {}
      ),
    };
  });

  // https://cookieconsent.orestbida.com/essential/getting-started.html
  await CookieConsent.run({
    // con `?cc-list-parser` nell'URL il modal viene mostrato anche ai bot (per gli scanner di cookie)
    hideFromBots: new URLSearchParams(document.location.search).get('cc-list-parser') === null,
    categories: ccCategories,
    guiOptions: {
      consentModal: { ...guiOptions.consentModal, ...config.guiOptions?.consentModal },
      preferencesModal: { ...guiOptions.preferencesModal, ...config.guiOptions?.preferencesModal },
    },
    language: {
      default: 'it',
      translations: {
        it: itTranslation({
          privacyPolicyUrl: config.privacyPolicyUrl ?? '/privacy-policy',
          sections: buildSections(categories, tableHeaders),
        }),
      },
    },
    onConsent: config.onConsent,
    onChange: config.onChange,
  });

  return CookieConsent;
}
