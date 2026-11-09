// risolve la configurazione del consumer: moduli attivi, categorie e sezioni (con l'elenco dei cookie)
// usato sia da `initCookieConsent()` sia da `renderCookieList()`, così che modal e pagina privacy
// mostrino sempre gli stessi cookie

import { baseNecessaryCookies, categoryKeys, categoryTexts, cookieTableHeaders } from './defaults.js';
import { recaptchaModule } from './modules/recaptcha.js';
import { analyticsModule } from './modules/analytics.js';

/** @type {Record<string, import('../cookie-consent.js').CookieConsentModule<any>>} */
const availableModules = {
  recaptcha: recaptchaModule,
  analytics: analyticsModule,
};

/**
 * @typedef {Object} ActiveModule
 * @property {string} name - Nome del modulo (chiave di `config.modules`)
 * @property {import('../cookie-consent.js').CookieConsentModule<any>} module
 * @property {any} opts - Opzioni del modulo (default + config del consumer)
 */

/**
 * @typedef {Object} ResolvedCategory
 * @property {string} key - Nome della categoria (necessary, functionality, analytics)
 * @property {string} title
 * @property {string} description
 * @property {import('../cookie-consent.js').CookieRow[]} cookies - Cookie del sito e dei moduli attivi
 * @property {ActiveModule[]} modules - Moduli attivi associati alla categoria
 */

/**
 * @param {import('../cookie-consent.js').CookieConsentConfig} [config]
 * @returns {{activeModules: ActiveModule[], categories: ResolvedCategory[]}}
 */
export function resolveConfig(config = {}) {

  /** @type {ActiveModule[]} */
  const activeModules = Object.entries(config.modules ?? {})
    .filter(([, moduleConfig]) => moduleConfig?.enabled)
    .flatMap(([name, moduleConfig]) => {
      const module = availableModules[name];

      if (!module) {
        console.error(`cookie-consent: modulo "${name}" sconosciuto`); // eslint-disable-line no-console
        return [];
      }

      const opts = { ...module.defaults, ...moduleConfig },
        error = module.validate?.(opts);

      if (error) {
        console.error(`cookie-consent, modulo "${name}": ${error}`); // eslint-disable-line no-console
        return [];
      }

      return [{ name, module, opts }];
    });

  /** @type {ResolvedCategory[]} */
  const categories = categoryKeys
    .map(key => {
      const modules = activeModules.filter(m => m.opts.category === key),
        cookies = [
          ...(key === 'necessary' ? baseNecessaryCookies : []),
          ...(config.cookies?.[key] ?? []),
          ...modules.flatMap(m => m.module.cookies(m.opts)),
        ];

      return {
        key,
        ...categoryTexts[key],
        ...config.categories?.[key],
        cookies,
        modules,
      };
    })
    // le categorie non necessarie compaiono solo se contengono cookie
    .filter(cat => cat.key === 'necessary' || cat.cookies.length);

  return { activeModules, categories };
}

/**
 * Sezioni del modal preferenze di vanilla-cookieconsent
 * @param {ResolvedCategory[]} categories
 * @returns {import('vanilla-cookieconsent').Section[]}
 */
export function buildSections(categories) {
  return categories.map(cat => ({
    title: cat.title,
    description: cat.description,
    linkedCategory: cat.key,
    cookieTable: {
      headers: cookieTableHeaders,
      body: /** @type {Record<string, string>[]} */ (cat.cookies),
    },
  }));
}
