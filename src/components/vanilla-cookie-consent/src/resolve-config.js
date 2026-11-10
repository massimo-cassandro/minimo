// risolve la configurazione del consumer: servizi attivi (moduli interni e servizi personalizzati),
// categorie e sezioni (con l'elenco dei cookie)
// usato sia da `initCookieConsent()` sia da `getCookieList()`, così che modal e pagina privacy
// mostrino sempre gli stessi cookie

import { baseNecessaryCookies, categoryKeys, categoryTexts, cookieTableHeaders, typeColumnHeaders } from './defaults.js';
import { recaptchaModule } from './modules/recaptcha.js';
import { analyticsModule } from './modules/analytics.js';
import { googleMapsModule } from './modules/google-maps.js';

/** @type {Record<string, import('../cookie-consent.js').CookieConsentModule<any>>} */
const availableModules = {
  recaptcha: recaptchaModule,
  analytics: analyticsModule,
  googleMaps: googleMapsModule,
};

/**
 * Servizio risolto (da un modulo interno o da `config.services`), registrato come servizio
 * di vanilla-cookieconsent nella propria categoria
 * @typedef {Object} ActiveService
 * @property {string} name - Nome del servizio (chiave di `config.modules` o di `config.services`)
 * @property {string} label - Etichetta nel modal preferenze
 * @property {string} category - Categoria di appartenenza
 * @property {import('../cookie-consent.js').CookieRow[]} cookies - Righe dell'elenco
 * @property {import('vanilla-cookieconsent').CookieItem[]} autoClearCookies - Cookie da eliminare alla revoca
 * @property {() => void} [init] - Eseguito all'avvio
 * @property {() => void} [onAccept] - Eseguito al consenso
 * @property {() => void} [onReject] - Eseguito alla revoca
 */

/**
 * @typedef {Object} ResolvedCategory
 * @property {string} key - Nome della categoria (necessary, functionality, analytics)
 * @property {string} title
 * @property {string} description
 * @property {boolean} reloadOnRevoke - Ricarica la pagina alla revoca del consenso
 * @property {import('../cookie-consent.js').CookieRow[]} cookies - Righe del sito e dei servizi attivi
 * @property {ActiveService[]} services - Servizi attivi associati alla categoria
 */

/**
 * @param {string} msg
 */
function logError(msg) {
  console.error(`cookie-consent: ${msg}`); // eslint-disable-line no-console
}

/**
 * Moduli interni attivi, convertiti in servizi
 * @param {import('../cookie-consent.js').CookieConsentConfig} config
 * @returns {ActiveService[]}
 */
function resolveModules(config) {
  return Object.entries(config.modules ?? {})
    .filter(([, moduleConfig]) => moduleConfig?.enabled)
    .flatMap(([name, moduleConfig]) => {
      const module = availableModules[name];

      if (!module) {
        logError(`modulo "${name}" sconosciuto`);
        return [];
      }

      const opts = /** @type {any} */ ({ ...module.defaults, ...moduleConfig }),
        error = module.validate?.(opts);

      if (error) {
        logError(`modulo "${name}": ${error}`);
        return [];
      }

      return [{
        name,
        label: opts.label ?? module.label,
        category: opts.category,
        cookies: module.cookies(opts),
        autoClearCookies: module.autoClearCookies?.(opts) ?? [],
        init: module.init ? () => module.init?.(opts) : undefined,
        onAccept: module.onAccept ? () => module.onAccept?.(opts) : undefined,
        onReject: module.onReject ? () => module.onReject?.(opts) : undefined,
      }];
    });
}

/**
 * Servizi personalizzati dichiarati in `config.services`
 * @param {import('../cookie-consent.js').CookieConsentConfig} config
 * @returns {ActiveService[]}
 */
function resolveCustomServices(config) {
  return Object.entries(config.services ?? {})
    .filter(([, service]) => service && service.enabled !== false)
    .flatMap(([name, service]) => {
      const category = /** @type {string} */ (service.category ?? 'functionality');

      if (!(/** @type {readonly string[]} */ (categoryKeys)).includes(category) || category === 'necessary') {
        logError(`servizio "${name}": categoria "${category}" non valida (usare functionality o analytics)`);
        return [];
      }

      return [{
        name,
        label: service.label ?? name,
        category,
        cookies: service.cookies ?? [],
        autoClearCookies: service.autoClearCookies ?? [],
        onAccept: service.onAccept,
        onReject: service.onReject,
      }];
    });
}

/**
 * @param {import('../cookie-consent.js').CookieConsentConfig} [config]
 * @returns {{activeServices: ActiveService[], categories: ResolvedCategory[], tableHeaders: Record<string, string>}}
 */
export function resolveConfig(config = {}) {

  /** @type {ActiveService[]} */
  const activeServices = [];

  [...resolveModules(config), ...resolveCustomServices(config)].forEach(service => {
    if (activeServices.some(s => s.name === service.name && s.category === service.category)) {
      logError(`servizio "${service.name}" duplicato nella categoria "${service.category}", ignorato`);
    } else {
      activeServices.push(service);
    }
  });

  /** @type {ResolvedCategory[]} */
  const categories = categoryKeys
    .map(key => {
      const services = activeServices.filter(s => s.category === key),
        { show, reloadOnRevoke, ...texts } = config.categories?.[key] ?? {},
        cookies = [
          ...(key === 'necessary' ? baseNecessaryCookies : []),
          ...(config.cookies?.[key] ?? []),
          ...services.flatMap(s => s.cookies),
        ];

      return {
        key,
        ...categoryTexts[key],
        ...texts,
        reloadOnRevoke: !!reloadOnRevoke,
        cookies,
        services,
        show: key === 'necessary' || !!show || cookies.length > 0 || services.length > 0,
      };
    })
    // le categorie non necessarie compaiono solo se hanno righe o servizi, oppure con `show: true`
    .filter(cat => cat.show)
    .map(({ show, ...cat }) => cat); // eslint-disable-line no-unused-vars

  // la colonna "Tipo" compare solo se almeno una riga ha `type`, o se la sua intestazione è indicata in config
  const hasTypeColumn = !!config.cookieTableHeaders?.type || categories.some(cat => cat.cookies.some(row => row.type)),
    /** @type {Record<string, string>} */
    tableHeaders = {
      ...cookieTableHeaders,
      ...(hasTypeColumn ? typeColumnHeaders : {}),
      ...config.cookieTableHeaders,
    };

  if (!hasTypeColumn) {
    delete tableHeaders.type;
  }

  return { activeServices, categories, tableHeaders };
}

/**
 * Righe della tabella dei cookie, con i campi facoltativi valorizzati
 * @param {import('../cookie-consent.js').CookieRow[]} rows
 * @param {Record<string, string>} tableHeaders
 * @returns {Record<string, string>[]}
 */
export function normalizeRows(rows, tableHeaders) {
  return rows.map(row => ({
    ...row,
    expiration: row.expiration ?? '',
    ...('type' in tableHeaders ? { type: row.type ?? 'cookie' } : {}),
  }));
}

/**
 * Sezioni del modal preferenze di vanilla-cookieconsent
 * @param {ResolvedCategory[]} categories
 * @param {Record<string, string>} tableHeaders
 * @returns {import('vanilla-cookieconsent').Section[]}
 */
export function buildSections(categories, tableHeaders) {
  return categories.map(cat => ({
    title: cat.title,
    description: cat.description,
    linkedCategory: cat.key,
    ...(cat.cookies.length
      ? { cookieTable: { headers: tableHeaders, body: normalizeRows(cat.cookies, tableHeaders) } }
      : {}
    ),
  }));
}
