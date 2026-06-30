// elenco da cookie nel formato utilizzato da cookie consent e da `render-cookie-list.js`
// per visualizzazione nella pagina privacy

// https://cookieconsent.orestbida.com/reference/configuration-reference.html
export const cookie_list = [
  {
    title: 'Cookie strettamente necessari',
    description: 'I cookie necessari sono indispensabili per il corretto funzionamento del sito web. Questi cookie garantiscono le funzionalità di base e le caratteristiche di sicurezza del sito web, in modo anonimo.',
    linkedCategory: 'necessary',
    cookieTable: {
      headers: {
        name: 'Cookie',
        domain: 'Impostato da',
        description: 'Descrizione',
        expiration: 'Durata',
      },
      body: [
        {
          name: 'cc_cookie',
          domain: 'Questo sito',
          description: 'Registra la tua scelta sui cookie',
          expiration: '6 mesi'
        },
        {
          name: 'PHPSESSID',
          domain: 'Questo sito',
          description: 'Identifica la sessione corrente in modo anonimo in modo di poter eseguire alcune azioni.',
          expiration: 'sessione'
        },

      ]
    }
  },
  {
    title: 'Cookie per funzionalità aggiuntive',
    description: 'Questi cookie sono necessari per l’abilitazione di alcune funzionalità aggiuntive. In mancanza della loro attivazione, alcune funzionalità non saranno disponibili',
    linkedCategory: 'functionality',
    cookieTable: {
      headers: {
        name: 'Cookie',
        domain: 'Impostato da',
        description: 'Descrizione',
        expiration: 'Durata',
      },
      body: [
        {
          name: '_GRECAPTCHA',
          domain: 'google.com',
          description: 'Questo cookie è impostato dal servizio recaptcha di Google per identificare i bot e proteggere il sito da attacchi di spam dannosi.<br>'+
            'Se questa opzione viene disattivata non sarà possibile utilizzare il form di contatto a fondo pagina',
          expiration: 'Circa 6 mesi'
        },

      ]
    }
  },
  // {
  //   title: 'Cookie analitici',
  //   description: 'I cookie analitici vengono utilizzati per capire come i visitatori interagiscono con il sito web. Questi cookie aiutano a fornire informazioni sulle metriche del numero di visitatori, frequenza di rimbalzo, fonte di traffico, ecc.',
  //   linkedCategory: 'analytics',
  //   cookieTable: {
  //     headers: {
  //       name: 'Cookie',
  //       domain: 'Impostato da',
  //       description: 'Descrizione',
  //       expiration: 'Durata',
  //     },
  //     body: [
  //       {
  //         name: '_ga',
  //         domain: 'Questo sito',
  //         description: 'Cookie utilizzato da Google Analytics',
  //         expiration: '2 anni'
  //       },
  //       {
  //         name: '_ga_NBCMZ18740',
  //         domain: 'Questo sito',
  //         description: 'Cookie utilizzato da Google Analytics',
  //         expiration: '1 minuto'
  //       },

  //     ]
  //   }
  // }
];
