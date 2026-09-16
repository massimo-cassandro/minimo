# json-table step 4

Ultima sessione di sviluppo, dopo di questa, che in realtà è più il chiarimento di alcuni punti, **eliminerò la cartella TODO** e inizierò delle sessioni di debug, completerò il css, ecc...

Come nello step precedente rispondi punto per punto facendo riferimento alle varie domande:

1. nella demo server-side fai rifertimento a `/demo-api/json-table`: cos'è? come vien gestita?
2. Oltre a sostituire s-datatable, json-table sostituirà man mano moltissime implementazioni di jquery-datatables (https://datatables.net/). In questi caso, viene usato uno schema ricorrente per la parte server-side che vorrei lasciare totalmente inalterata, e la modifica della parte front-end ridotta al minimo o quasi. Queste implementazioni utilizzano al 90% una configurazione tramite attributi su un noimale `div` con uno script che interpreta glio attributi e produce il datatable (in maniera analoga a quanto fatto qui). Le domande al riguardo sono:
   * La parte server side,(url e json restituito, vedi esempi dopo) sono compatibili con quanto fatto finora o richiederebbero aggiustamenti?
   * La parte client-side può essere pre-elaborata e adattata a json-table in modo automatico?
La mia idea sarebbe di creare una opzione ad hoc `dt-legacy`, default false. Se true, viene caricato un modulo on-demand (che quindi non peserebbe sul compomnente standard, a meno che non sia di dimensioni ininfluenti) che possa fare gli adattaemti necessari per server e client. Fattibile?

Allego:

a. esempio di url utilizzato per richiamare il json in jquery-datatable:

```
https://my-url.php?filtro_agenzie%5Bstatus%5D%5B%5D=30&filtro_agenzie%5BgestitoAda%5D=1&draw=1&columns%5B0%5D%5Bdata%5D=id&columns%5B0%5D%5Bname%5D=id&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=function&columns%5B1%5D%5Bname%5D=agenzia&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=function&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=comune&columns%5B3%5D%5Bname%5D=comune&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=provinciaId&columns%5B4%5D%5Bname%5D=provinciaId&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=network&columns%5B5%5D%5Bname%5D=network&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=brand&columns%5B6%5D%5Bname%5D=brand&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=function&columns%5B7%5D%5Bname%5D=tipoContratto&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=function&columns%5B8%5D%5Bname%5D=umRatingAmministrativoId&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=umRatingAmministrativoDescrizione&columns%5B9%5D%5Bname%5D=umRatingAmministrativoDescrizione&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=zona&columns%5B10%5D%5Bname%5D=zona&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=true&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=status&columns%5B11%5D%5Bname%5D=status&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=true&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B12%5D%5Bdata%5D=function&columns%5B12%5D%5Bname%5D=elitePunteggio&columns%5B12%5D%5Bsearchable%5D=true&columns%5B12%5D%5Borderable%5D=true&columns%5B12%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B12%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B13%5D%5Bdata%5D=function&columns%5B13%5D%5Bname%5D=apcTimestamp&columns%5B13%5D%5Bsearchable%5D=true&columns%5B13%5D%5Borderable%5D=true&columns%5B13%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B13%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=1&order%5B0%5D%5Bdir%5D=asc&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1789544883675
```

b. json restituito

```javascript
{
  "draw": 1,
  "recordsTotal": 880,
  "recordsFiltered": 880,
  "data": [
    {
        "id": 517,
        "nome": "Concerto Gigi d'Alessio Inalpi Arena Torino",
        "data": {
            "date": "2026-12-23 20:00:00.000000",
            "timezone_type": 3,
            "timezone": "Europe/Rome"
        },
        "tipologiaLabel": "In presenza",
        "categoriaLabel": "Evento",
        "operatoriLabel": "Gruppo Alpitour",
        "soloInviti": true,
        "network": "Bluvacanze",
        "numAdvInvitate": 0,
        "punteggio": 5,
        "pubblica": false,
        "dataAperturaIscrizioni": {
            "date": "2025-10-13 14:50:00.000000",
            "timezone_type": 3,
            "timezone": "Europe/Rome"
        },
        "dataChiusuraIscrizioni": {
            "date": "2026-12-22 17:00:00.000000",
            "timezone_type": 3,
            "timezone": "Europe/Rome"
        },
        "totIscritti": 8,
        "totPartecipanti": 0
    },
    ...
  ]
}
```

NB: nota il formato delle date, molto spesso generate come array da symfony: sarà oggetto di uno step futuro, per ora non ce ne occupiamo


c. Esempio client (twig)

```twig
<div class="dt-container"
    data-cdt_options="{{ {
      dtRender: {
        bindToForm: 'f_ricerca'
      },
      datatable_options : {
        order: [[1,'desc']]
      }
    }|json_encode|e('html_attr') }}"
    data-dt_columns="{{ [
      {
        dtRender  : { type: 'id' }
      },
      {
        title     : 'Data',
        name      : 'data',
        className : "text-right",
        dtRender  : { type: 'sf_date' }
      },
      {
        title     : 'Titolo documento',
        name      : 'titolo',
        dtRender  : {
          type        : 'tpl',
          sf_base_url : path('contenuti_scheda', { id: null }),
          tpl         : '<a href="[[sf_base_url]][[id]]">[[titolo]]</a>' ~
                        '<br>' ~
                        '<small class="font-italic">[[abstract]]</small>'
        }
      },
      {
        title     : 'Abstract',
        data      : 'abstract',
        name      : 'abstract',
        searchable: true,
        visible   : false
      },
      {
        title     : '<abbr title="Anteprima agenzie">Ant.</abbr>',
        dtRender  : {
          type        : 'tpl',
          sf_base_url : path('contenuti_view', { id: null }),
          tpl         : '<a href="[[sf_base_url]][[id]]" data-modal-iframe title="Anteprima documento">' ~
                        '<svg class="icona"><use xlink:href="' ~ glob_vars.icon_file ~ '#lente"></use></svg>' ~
                        '</a>'
        },
        className: 'text-center',
        orderable: false,
        searchable: false
      },
      {
        title     : 'Categoria',
        data      : 'categoria',
        name      : 'categoria'
      },
      {
        title     : 'Tags',
        data      : 'tags',
        name      : 'tags',
        className : 'small'
      },
      {
        title     : 'Brands',
        data      : 'network',
        name      : 'network',
        className : 'small'
      },
      {
        title     : 'Altri Vincoli',
        name      : 'altriVincoli',
        className : "text-center",
        dtRender  : {
          type       : 'bool_icons'
        },
        searchable: false
      },
      {
        title     : '<abbr title="Numero di utenti che hanno letto questo notizia">Lett. utenti</abbr>',
        data      : 'letture',
        name      : 'letture',
        className : 'text-center',
        searchable: false
      },
      {
        title     : 'Pubblicato',
        name      : 'pubblica',
        className : "text-center",
        dtRender  : {
          type       : 'bool_icons'
        },
        searchable: false
      }
    ]|json_encode|e('html_attr') }}"
  ></div>
```


1. la nuova classe json-table vorrei fosse aggiunta al file index principale (index.js). Con s-datatable, non è stato fatto, sua per la provvisorietà dello script ma soprattutto perché c'erano problemi con il css collegato, tanto che ho dovuto aggiungere una regola ad hoc nel `sideEffects` del `package.json`. Gli altri componenti, pur usando css non hanno di questi problemi. Verifica e proponi 
