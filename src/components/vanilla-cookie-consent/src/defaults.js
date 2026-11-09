// valori di default di cookie-consent (vedi `cookie-consent.config.sample.mjs`)

/** @type {import('../cookie-consent.js').CookieTableHeaders} */
export const cookieTableHeaders = {
  name: 'Cookie',
  domain: 'Impostato da',
  description: 'Descrizione',
  expiration: 'Durata',
};

// ordine di visualizzazione delle categorie
export const categoryKeys = /** @type {const} */ (['necessary', 'functionality', 'analytics']);

/** @type {Record<string, {title: string, description: string}>} */
export const categoryTexts = {
  necessary: {
    title: 'Cookie strettamente necessari',
    description: 'I cookie necessari sono indispensabili per il corretto funzionamento del sito web. ' +
      'Questi cookie garantiscono le funzionalità di base e le caratteristiche di sicurezza del sito web, in modo anonimo.',
  },
  functionality: {
    title: 'Cookie per funzionalità aggiuntive',
    description: 'Questi cookie sono necessari per l’abilitazione di alcune funzionalità aggiuntive. ' +
      'In mancanza della loro attivazione, alcune funzionalità non saranno disponibili.',
  },
  analytics: {
    title: 'Cookie analitici',
    description: 'I cookie analitici vengono utilizzati per capire come i visitatori interagiscono con il sito web. ' +
      'Questi cookie aiutano a fornire informazioni sulle metriche del numero di visitatori, frequenza di rimbalzo, fonte di traffico, ecc.',
  },
};

// cookie sempre presenti (impostati da vanilla-cookieconsent stesso)
/** @type {import('../cookie-consent.js').CookieRow[]} */
export const baseNecessaryCookies = [
  {
    name: 'cc_cookie',
    domain: 'Questo sito',
    description: 'Registra la tua scelta sui cookie',
    expiration: '6 mesi'
  },
];

// https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions
/** @type {import('vanilla-cookieconsent').GuiOptions} */
export const guiOptions = {
  consentModal: {
    layout: 'box',
    position: 'bottom right',
    flipButtons: false,
    equalWeightButtons: false
  },
  preferencesModal: {
    layout: 'box',
    flipButtons: false,
    equalWeightButtons: true
  },
};
