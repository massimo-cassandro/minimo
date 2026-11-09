/**
 * Testi italiani dei modal di vanilla-cookieconsent
 * @param {Object} params
 * @param {string} params.privacyPolicyUrl - URL della pagina Privacy e Cookie Policy
 * @param {import('vanilla-cookieconsent').Section[]} params.sections - Sezioni delle categorie di cookie
 * @returns {import('vanilla-cookieconsent').Translation}
 */
export function itTranslation({ privacyPolicyUrl, sections }) {

  const privacyLink = `<a href="${privacyPolicyUrl}">Privacy e Cookie Policy</a>`;

  return {
    consentModal: {
      title: 'Utilizziamo i cookie per offrirti la migliore esperienza di navigazione ricordando le tue preferenze.',
      description: 'Scegliendo l’opzione <strong>“Accetta tutti i cookie”</strong>, acconsenti all’uso di <strong>tutti</strong> i cookie.<br>' +
        'Il pulsante <strong>“Gestisci le tue preferenze”</strong>, permette di selezionare singole categorie di cookies ed avere informazioni più dettagliate.<br>' +
        'Tieni presente che alcune funzionalità potrebbero non essere disponibili se si accettano solo i cookie essenziali.<br>' +
        `Per ulteriori informazioni vai alla pagina sulla ${privacyLink}`,
      acceptAllBtn: 'Accetta tutti i cookie',
      acceptNecessaryBtn: 'Accetta solo quelli essenziali',
      showPreferencesBtn: 'Gestisci le tue preferenze'
    },
    preferencesModal: {
      title: 'Gestisci le tue preferenze sui cookie',
      acceptAllBtn: 'Accetta tutti i cookie',
      acceptNecessaryBtn: 'Accetta solo i cookie essenziali',
      savePreferencesBtn: 'Salva le tue preferenze',
      closeIconLabel: 'Chiudi',
      sections: [
        {
          title: 'Utilizzo dei cookie',
          description: 'Questo sito web utilizza i cookie per migliorare la tua esperienza di navigazione.<br>' +
            'I cookie classificati come <em>strettamente necessari</em> vengono memorizzati nel browser in quanto sono essenziali per il funzionamento del sito.<br>' +
            'Gli altri cookie, anche di terze parti, verranno memorizzati nel tuo browser solo con il tuo consenso. ' +
            'Hai la possibilità di disattivarli, tuttavia la loro disattivazione potrebbe influire sulla tua esperienza di navigazione.'
        },
        ...sections,
        {
          title: 'Altre informazioni',
          description: `Per ulteriori informazioni, consulta la pagina relativa a ${privacyLink}`
        }
      ]
    }
  };
}
