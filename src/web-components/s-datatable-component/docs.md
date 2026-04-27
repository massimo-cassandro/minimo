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
