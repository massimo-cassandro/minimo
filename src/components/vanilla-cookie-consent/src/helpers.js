// helper per i progetti: permettono di interrogare e modificare il consenso
// senza importare direttamente vanilla-cookieconsent

import * as CookieConsent from 'vanilla-cookieconsent';

/**
 * Indica se la categoria è stata accettata dall'utente
 * @param {string} category - Nome della categoria (es. "functionality")
 * @returns {boolean}
 */
export function isAccepted(category) {
  return CookieConsent.acceptedCategory(category);
}

/**
 * Accetta una categoria lasciando invariate le scelte sulle altre (categorie e singoli servizi).
 * Pensata per i pulsanti "Attiva la mappa" / "Attiva il video" mostrati al posto dei contenuti bloccati.
 * Se il banner di consenso è aperto, viene chiuso (la scelta viene registrata).
 * @param {string} category - Nome della categoria (es. "functionality")
 */
export function acceptCategoryKeepingOthers(category) {

  if (CookieConsent.acceptedCategory(category)) {
    return;
  }

  const services = Object.keys(CookieConsent.getConfig('categories')?.[category]?.services ?? {});

  if (services.length) {
    // con i servizi, `acceptService` aggiorna solo questa categoria
    CookieConsent.acceptService('all', category);

  } else {
    // `acceptCategory` con un elenco esplicito riattiva tutti i servizi delle categorie accettate:
    // vengono quindi ripristinati quelli scelti in precedenza dall'utente
    const { acceptedCategories, acceptedServices } = CookieConsent.getUserPreferences();

    CookieConsent.acceptCategory([...acceptedCategories, category]);

    const newServices = CookieConsent.getUserPreferences().acceptedServices;
    acceptedCategories.forEach(cat => {
      const before = acceptedServices[cat] ?? [],
        after = newServices[cat] ?? [];

      if (before.length && (before.length !== after.length || before.some(s => !after.includes(s)))) {
        CookieConsent.acceptService(before, cat);
      }
    });
  }

  CookieConsent.hide();
}

/**
 * Esegue `callback` (una sola volta) quando la categoria risulta accettata: subito, se il consenso
 * è già stato dato, oppure quando arriva (eventi `cc:onConsent` e `cc:onChange` di vanilla-cookieconsent).
 * Utile per i moduli caricati in modo differito, avviati prima o dopo `initCookieConsent()`.
 * @param {string} category - Nome della categoria (es. "functionality")
 * @param {() => void} callback - Funzione da eseguire
 * @returns {() => void} - Funzione che annulla l'attesa
 */
export function onCategoryAccepted(category, callback) {

  const events = ['cc:onConsent', 'cc:onChange'],
    stop = () => events.forEach(e => window.removeEventListener(e, check)),
    check = () => {
      if (CookieConsent.acceptedCategory(category)) {
        stop();
        callback();
      }
    };

  events.forEach(e => window.addEventListener(e, check));
  check();

  return stop;
}
