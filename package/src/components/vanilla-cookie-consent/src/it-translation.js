import { cookie_list } from './cookie-list.js';

export const it_translation = {
  'it': {
    consentModal: {
      title: 'Utilizziamo i cookie per offrirti la migliore esperienza di navigazione ricordando le tue preferenze.',
      description: 'Scegliendo l’opzione <strong>“Accetta tutti i cookie”</strong>, acconsenti all’uso di <strong>tutti</strong> i cookie.<br>' +
        'Il pulsante <strong>“Gestisci le tue preferenze”</strong>, permette di selezionare singole categorie di cookies ed avere informazioni più dettagliate.<br>' +
        'Tieni presente che alcune funzionalità potrebbero non essere disponibili se si accettano solo i cookie essenziali.<br>' +
        'Per ulteriori informazioni vai alla pagina sulla <a href="/privacy-policy">Privacy e Cookie Policy</a>',
      acceptAllBtn: 'Accetta tutti i cookie',
      acceptNecessaryBtn: 'Accetta solo quelli essenziali',
      showPreferencesBtn: 'Gestisci le tue preferenze'
    },
    preferencesModal: {
      title: 'Gestici le tue preferenze sui cookie',
      acceptAllBtn: 'Accetta tutti i cookie',
      acceptNecessaryBtn: 'Accetta solo i cookie essenziali',
      savePreferencesBtn: 'Salva le tue preferenze',
      closeIconLabel: 'Chiudi',
      sections: [
        {
          title: 'Utilizzo dei cookie',
          description: 'Questo sito web utilizza i cookie per migliorare la tua esperienza di navigazione.<br>' +
            'I cookie classificati come <em>strettamente necessari</em> vengono memorizzati nel browser in quanto sono essenziali per il funzionamento del sito.<br>' +
            'Utilizziamo anche cookie di terze parti che ci aiutano ad analizzare e capire come utilizzi il portale. Questi cookie verranno memorizzati nel tuo browser solo con il tuo consenso. '+
            'Hai la possibilità di disattivare questi cookie, tuttavia, la loro disattivazione potrebbe influire sulla tua esperienza di navigazione.'
        },
        ...cookie_list,
        {
          title: 'Altre informazioni',
          // description: 'Per ulteriori informazioni, consulta la pagina relativa a Privacy e Cookie Policy'
          description: 'Per ulteriori informazioni, consulta la pagina relativa a <button class="btn-link" data-content="privacy" type="button" aria-haspopup="dialog">Privacy e Cookie Policy</button>'
        }
      ]
    }
  }
};
