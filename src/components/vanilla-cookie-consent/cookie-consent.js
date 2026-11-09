import './cookie-consent.css';
import * as CookieConsent from 'vanilla-cookieconsent';
import { guiOptions } from './src/defaults.js';
import { itTranslation } from './src/it-translation.js';
import { buildSections, resolveConfig } from './src/resolve-config.js';

/**
 * @typedef {Object} CookieRow - Riga dell'elenco dei cookie
 * @property {string} name - Nome del cookie
 * @property {string} domain - Dominio che imposta il cookie (es. "Questo sito", "google.com")
 * @property {string} description - Descrizione (può contenere `<br>`)
 * @property {string} expiration - Durata
 */

/**
 * @typedef {Object} CookieTableHeaders - Intestazioni della tabella dei cookie
 * @property {string} name
 * @property {string} domain
 * @property {string} description
 * @property {string} expiration
 */

/**
 * @typedef {'necessary'|'functionality'|'analytics'} CategoryKey
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
 * @property {(opts: T) => void} onAccept - Eseguito al consenso
 * @property {(opts: T) => void} onReject - Eseguito alla revoca di un consenso dato in precedenza
 */

/**
 * @typedef {Object} CookieConsentConfig - Configurazione (vedi `cookie-consent.config.sample.mjs`)
 * @property {string} [privacyPolicyUrl] - URL della pagina Privacy e Cookie Policy (default: "/privacy-policy")
 * @property {Object} [modules] - Moduli opzionali, attivi solo con `enabled: true`
 * @property {import('./src/modules/recaptcha.js').RecaptchaModuleOptions} [modules.recaptcha] - Google reCAPTCHA v3
 * @property {import('./src/modules/analytics.js').AnalyticsModuleOptions} [modules.analytics] - Google Analytics 4
 * @property {Partial<Record<CategoryKey, CookieRow[]>>} [cookies] - Cookie aggiuntivi del sito, per categoria
 * @property {Partial<Record<CategoryKey, {title?: string, description?: string}>>} [categories] - Testi delle categorie (sovrascrivono quelli di default)
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
 *   },
 *   cookies: { necessary: [], functionality: [], analytics: [] }, // cookie del sito, FAC
 *   categories: {}, // testi delle categorie, FAC
 *   guiOptions: {}, // opzioni grafiche vanilla-cookieconsent, FAC
 *   onConsent: undefined, // callback al consenso, FAC
 *   onChange: undefined, // callback alla modifica, FAC
 * });
 * @param {CookieConsentConfig} [config] - Configurazione (default: {})
 * @returns {Promise<typeof CookieConsent>} - L'API di vanilla-cookieconsent (es. per `showPreferences()`)
 */
export async function initCookieConsent(config = {}) {

  const { activeModules, categories } = resolveConfig(config);

  activeModules.forEach(m => m.module.init?.(m.opts));

  /** @type {Record<string, import('vanilla-cookieconsent').Category>} */
  const ccCategories = {};

  categories.forEach(cat => {
    const autoClearCookies = cat.modules.flatMap(m => m.module.autoClearCookies?.(m.opts) ?? []);

    ccCategories[cat.key] = {
      // le categorie non necessarie non devono essere preselezionate
      // (linee guida Garante Privacy 2021: niente consenso preimpostato)
      enabled: cat.key === 'necessary',
      readOnly: cat.key === 'necessary',
      ...(autoClearCookies.length ? { autoClear: { cookies: autoClearCookies } } : {}),
      ...(cat.modules.length
        ? {
          services: Object.fromEntries(cat.modules.map(m => [m.name, {
            label: m.module.label,
            onAccept: () => m.module.onAccept(m.opts),
            onReject: () => m.module.onReject(m.opts),
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
          sections: buildSections(categories),
        }),
      },
    },
    onConsent: config.onConsent,
    onChange: config.onChange,
  });

  return CookieConsent;
}
