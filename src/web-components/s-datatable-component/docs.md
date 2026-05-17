# `s-datatable` web-component per simple-datatables

<https://fiduswriter.github.io/simple-datatables/documentation/>


## Utilizzo da markup

```html
<s-datatable
  json="/api/data.json"
  cols='[{"_heading":"Nome","_field":"name"}, ...]'
  perPage="10"
></s-datatable>

<!-- Alternativa: dati inline via attributo (utile per SSR/Twig/Blade).
     Se presenti entrambi, `data` ha la precedenza su `json`. -->
<s-datatable
  data='[{"name":"Mario","city":"Roma"}, ...]'
  cols='[{"_heading":"Nome","_field":"name"}, ...]'
  perPage="10"
></s-datatable>
```

## Utilizzo da script

```javascript
const el = document.querySelector('s-datatable');
// oppure: const el = document.createElement('s-datatable');

el.init({
  json: '/api/data.json',
  cols: [{ _heading: 'Nome', _field: 'name' }, ...],
  perPage: 10
});

// Alternativa: dati inline (array di oggetti) al posto di json
el.init({
  data: [{ name: 'Mario', city: 'Roma' }, ...],
  cols: [{ _heading: 'Nome', _field: 'name' }, ...],
});
// Se presenti entrambi, `data` ha la precedenza su `json`.

// Se appena creato, appendere dopo init():
document.body.appendChild(el);
```

## Utilizzo misto – attributi HTML + script

I parametri non inclusi in `init()` vengono letti dall'attributo HTML corrispondente.
Si possono quindi separare configurazione statica (`cols`, `perPage`) nel markup
e dati dinamici (`json`) nello script:

```html
<s-datatable
  id="table-utenti"
  cols='[{"_heading":"Nome","_field":"name"},{"_heading":"Città","_field":"city"}]'
  perPage="20"
></s-datatable>
```

```javascript
el.init({ json: '/api/utenti.json' }); // → json da script, cols e perPage da attributo
```

Ordine di precedenza: config (script) > attributo HTML > default interno.

Per ignorare esplicitamente un attributo e ricadere sul default, passare `null` nel config:

```javascript
el.init({ json: '/api/data.json', cols: null }); // → cols = null, l'attributo viene saltato
```

## Reazione ad eventi esterni

Il componente ascolta tre CustomEvent che altri componenti possono emettere
sul `document` (o su qualsiasi antenato del componente nel DOM):

### `datatable:search`

Applica una ricerca su una o più colonne.

`detail: { term: string, columns?: number[] }`

```javascript
// Ricerca globale
document.dispatchEvent(new CustomEvent('datatable:search', {
  detail: { term: 'mario' }
}));

// Ricerca su colonna 0 e 2
document.dispatchEvent(new CustomEvent('datatable:search', {
  detail: { term: 'mario', columns: [0, 2] }
}));
```

### `datatable:multisearch`

Applica più filtri contemporaneamente (uno per colonna).

`detail: { queries: Array<{ terms: string[], columns?: number[] }> }`

```javascript
// Filtra colonna 1 per "mario" E colonna 3 per "roma"
document.dispatchEvent(new CustomEvent('datatable:multisearch', {
  detail: {
    queries: [
      { terms: ['mario'], columns: [1] },
      { terms: ['roma'],  columns: [3] }
    ]
  }
}));
```

### `datatable:reload`

Ricarica i dati da un nuovo URL JSON (o dallo stesso URL originale se `json` è omesso),
opzionalmente con nuove colonne, dati inline e/o un filtro da applicare al termine del
caricamento.

`detail: { json?: string, data?: Array, cols?: Array, search?: object }`

Il campo `search` permette di combinare reload e filtro in un unico evento, evitando
race condition tra il fetch e la ricerca. Formati supportati:

- `{ term, columns? }` → ricerca semplice
- `{ queries: [{terms, columns?}] }` → ricerca multipla

```javascript
// Reload stesso URL
document.dispatchEvent(new CustomEvent('datatable:reload', { detail: {} }));

// Nuovo endpoint + nuove colonne
document.dispatchEvent(new CustomEvent('datatable:reload', {
  detail: {
    json: '/api/data-filtered.json',
    cols: [{ _heading: 'Nome', _field: 'name' }]
  }
}));

// Dati inline (senza fetch)
document.dispatchEvent(new CustomEvent('datatable:reload', {
  detail: {
    data: [{ name: 'Mario', city: 'Roma' }],
  }
}));

// Reload + filtro contestuale applicato dopo il render
document.dispatchEvent(new CustomEvent('datatable:reload', {
  detail: {
    json: '/api/utenti?anno=2024',
    search: { term: 'mario', columns: [0] }
  }
}));
```

## Targeting – più istanze nella stessa pagina

Aggiungere `id` al componente e `target` nel detail. Se `target` è assente,
l'evento viene raccolto da **tutte** le istanze.

```html
<s-datatable id="table-utenti" ...></s-datatable>
```

```javascript
document.dispatchEvent(new CustomEvent('datatable:search', {
  detail: { term: 'mario', target: 'table-utenti' }
}));
```

## Parametro `cols`

Array di oggetti di configurazione delle colonne. Le chiavi con prefisso `_` sono
proprietà del componente; le restanti vengono passate direttamente a simple-datatables
(es. `sortable`, `searchable`, `type`, `hidden`, …).

```javascript
cols: [
  {
    // ── Proprietà del componente (prefisso _) ─────────────────────────────

    _field,        // Chiave del campo JSON. Obbligatorio.
                   // Supporta notazione punto per valori annidati: 'owner.cognome'

    _heading,      // Testo dell'intestazione di colonna (contenuto del <th>). Obbligatorio.

    _title,        // Testo del tooltip sull'intestazione (attributo `title` dell'<abbr>).

    _render,       // Template HTML per il contenuto della cella.
                   // Accetta:
                   //   - stringa mustache-like: i segnaposto [[chiave]] vengono sostituiti
                   //     con i valori della riga (notazione punto: [[owner.nome]]).
                   //     I segnaposto null usano _renderNullAs; se il padre dell'oggetto è
                   //     null (es. Symfony restituisce owner: null) non viene emesso alcun
                   //     warning (il dato è semplicemente assente, non un errore di config).
                   //   - funzione (row) => string

    _renderMode,   // Preset di visualizzazione predefiniti. Valori disponibili:
                   //   'id'          – colonna numerica, non ricercabile, allineata a destra
                   //   'email'       – va a capo prima e dopo la @
                   //   'boolean'     – icona spunta/croce con colore semantico
                   //   'sf_datetime' – data/ora da oggetto Symfony ({ date, timezone })

    _sortValue,    // Percorso del campo da usare per l'ORDINAMENTO al posto del contenuto
                   // visualizzato. Utile quando la cella contiene HTML composto (_render).
                   // Supporta notazione punto.
                   // Implementato tramite l'attributo data-order sulla cella, letto
                   // nativamente da simple-datatables.
                   //
                   // Esempio: cella con '[[owner.nome]] [[owner.cognome]]'
                   //   _sortValue: 'owner.cognome'  → ordina per cognome

    _searchValue,  // Percorso/i del campo da usare per la RICERCA al posto del contenuto
                   // visualizzato. Accetta uno o più percorsi separati da spazio.
                   // Supporta notazione punto.
                   // Implementato tramite searchMethod di colonna (API simple-datatables)
                   // e attributo data-search sulla cella.
                   // La ricerca è di tipo AND: tutti i termini digitati devono essere
                   // presenti nel valore del campo (o dei campi) indicati.
                   //
                   // Esempio: _searchValue: 'owner.cognome owner.nome'
                   //   cerca su entrambi i campi concatenati; "rossi mario" trova solo
                   //   le righe che contengono entrambe le parole, in qualsiasi ordine.

    _footerRender, // Callback o stringa per il contenuto della cella nel <tfoot>.
                   // Il <tfoot> (una sola riga) viene aggiunto automaticamente se
                   // almeno una colonna definisce questa proprietà; le colonne senza
                   // _footerRender producono una <td> vuota.
                   //
                   // Accetta:
                   //   - funzione (data) => string
                   //     `data` è l'array dei record da considerare per il calcolo.
                   //     Il contenuto di `data` dipende dall'opzione `updateFooterOnPageChange`
                   //     del componente (default false = dataset filtrato completo,
                   //     indipendente dalla pagina corrente).
                   //   - stringa statica (es. etichetta fissa "Totale:")
                   //
                   // La cella eredita le classi CSS di allineamento della colonna
                   // (cellClass / headerClass), in modo da risultare visivamente coerente.
                   //
                   // Aggiornamenti automatici:
                   //   - sempre: al cambio di filtro (ricerca / multisearch)
                   //   - solo se updateFooterOnPageChange: true: al cambio di pagina
                   //
                   // Esempio – somma di una colonna numerica:
                   //   _footerRender: (data) => {
                   //     const tot = data.reduce((s, r) => s + (r.importo ?? 0), 0);
                   //     return `<strong>${tot.toLocaleString('it-IT')} €</strong>`;
                   //   }

    // ── Proprietà native simple-datatables (senza prefisso _) ────────────

    type,          // Tipo di dato: 'string' | 'number' | 'date' | 'boolean' | 'html' | 'other'
    sortable,      // false per disabilitare l'ordinamento sulla colonna
    searchable,    // false per escludere la colonna dalla ricerca globale
    hidden,        // true per nascondere la colonna (esclusa anche dalla ricerca)
    sort,          // 'asc' | 'desc' per ordinamento iniziale (solo su colonna singola)
    // ... tutte le altre opzioni columns di simple-datatables
  }
]
```

### Esempio completo con valori annidati

```javascript
const cols = [
  {
    _field: 'commessa',
    _heading: 'Commessa / fornitore',
    _render: '[[commessa]]<br><small class="text-muted">[[fornitore]]</small>',
  },
  {
    _field: 'owner.cognome',
    _heading: 'Owner',
    _render: '[[owner.nome]] [[owner.cognome]]',
    _sortValue: 'owner.cognome',              // ordina per cognome
    _searchValue: 'owner.cognome owner.nome', // cerca su cognome e nome (AND)
  },
  {
    _field: 'importi.0.importo',   // valore annidato con indice array
    _heading: 'Importo',
    type: 'number',
  }
];
```

### Esempio con tfoot – somma e conteggio

```javascript
// updateFooterOnPageChange: false (default) – il footer mostra il totale del set filtrato,
// indipendente dalla pagina. Non si aggiorna al cambio pagina.
const el = document.querySelector('s-datatable');
el.init({
  json: '/api/commesse.json',
  cols: [
    {
      _field: 'commessa',
      _heading: 'Commessa',
      _footerRender: '<strong>Totale:</strong>',   // etichetta fissa
    },
    {
      _field: 'importo',
      _heading: 'Importo',
      type: 'number',
      cellClass: 'text-end',
      headerClass: 'text-end',
      // data = tutti i record filtrati (intera ricerca, non solo la pagina corrente)
      _footerRender: (data) => {
        const tot = data.reduce((s, r) => s + (r.importo ?? 0), 0);
        return `<strong>${tot.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</strong>`;
      },
    },
    {
      _field: 'stato',
      _heading: 'Stato',
      _footerRender: (data) => `${data.length} record`,
    },
  ],
});

// updateFooterOnPageChange: true – il footer mostra il subtotale della sola pagina corrente.
// Si aggiorna sia al cambio filtro sia al cambio pagina.
el.init({
  json: '/api/commesse.json',
  updateFooterOnPageChange: true,
  cols: [ /* stesse colonne di sopra */ ],
});
```

Il `<tfoot>` viene aggiunto solo se almeno una colonna definisce `_footerRender`.

Con `updateFooterOnPageChange: false` (default) la callback riceve l'intero set filtrato: i totali
non cambiano navigando tra le pagine e si aggiornano solo quando cambia la ricerca.

Con `updateFooterOnPageChange: true` la callback riceve i record della pagina corrente: utile per
subtotali di pagina; il footer si aggiorna sia al cambio filtro sia al cambio pagina.

## Testo info

Il componente sovrascrive il testo dell'area informativa (in basso a sinistra) per includere
sempre il numero totale assoluto di record, distinto dal conteggio filtrato.

Senza ricerca attiva:

> Stai visualizzando le righe da 1 a 25, su un totale di 100.

Con ricerca attiva:

> Stai visualizzando le righe da 1 a 25 dei 50 record filtrati, su un totale di 100.

Ricerca senza risultati:

> Nessun risultato per la ricerca corrente (totale record: 100).

Il testo si aggiorna automaticamente ad ogni cambio pagina, ricerca e multisearch.

## Parametri `topSlot` e `showInfoAtTop`

Entrambi occupano l'area in alto a sinistra del datatable — lo spazio normalmente
riservato al selettore "righe per pagina" (qui disabilitato). I due parametri si
escludono: se `showInfoAtTop` è `true` (default), `topSlot` viene ignorato.

### `showInfoAtTop`

Replica nell'area superiore lo stesso testo dell'area `.info` in basso,
mantenuto in sincronia ad ogni cambio pagina o filtro. Il nodo viene nascosto
automaticamente quando non ci sono record o la ricerca non produce risultati
(evita di mostrare "Nessun risultato…" in due posti).

```javascript
el.init({
  json: '/api/data.json',
  cols: [...],
  showInfoAtTop: true,
});
```

### `topSlot`

Inserisce un elemento DOM o markup HTML arbitrario, avvolto in un
`<div class="datatable-top-slot">`. Accetta sia una stringa HTML che un `Element`
già costruito (utile per mantenere un riferimento al nodo e aggiungervi listener).
Non è leggibile da attributo HTML, solo via `init()`.

```javascript
// Stringa HTML
el.init({
  json: '/api/data.json',
  cols: [...],
  topSlot: '<button class="btn btn-sm btn-primary">Esporta CSV</button>',
});

// Elemento DOM
const btn = document.createElement('button');
btn.className = 'btn btn-sm btn-outline-secondary';
btn.textContent = 'Nuova commessa';
btn.addEventListener('click', () => { /* … */ });

el.init({
  json: '/api/commesse.json',
  cols: [...],
  topSlot: btn,
});
```
