# `s-datatable` web-component for simple-datatatble

</https://fiduswriter.github.io/simple-datatables/documentation/>


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
 
## Utilizzo da script

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

I parametri non inclusi in init() vengono letti dall'attributo HTML corrispondente. Si possono quindi separare configurazione statica (`cols`, `perPage`) nel markup e dati dinamici (json) nello script:

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

Il componente ascolta tre CustomEvent che altri componenti possono emettere sul `document` (o su qualsiasi antenato del componente nel DOM):
 
### `datatable:search`

Applica una ricerca su una o più colonne.

`detail: { term: string, columns?: number[] }`

Esempio – ricerca globale:

```javascript
document.dispatchEvent(new CustomEvent('datatable:search', {
  detail: { term: 'mario' }
}));
```

Esempio – ricerca su colonna 0 e 2:

```javascript
  document.dispatchEvent(new CustomEvent('datatable:search', {
    detail: { term: 'mario', columns: [0, 2] }
  }));
```

### `datatable:multisearch`
     
Applica più filtri contemporaneamente (uno per colonna).

`detail: { queries: Array<{ terms: string[], columns?: number[] }> }`
 
Esempio – filtra colonna 1 per "mario" E colonna 3 per "roma":

```javascript
document.dispatchEvent(new CustomEvent('datatable:multisearch', {
  detail: {
    queries: [
      { terms: ['gino'], columns: [1] },
      { terms: ['roma'],  columns: [3] }
    ]
  }
}));
```
 
### `datatable:reload`

Ricarica i dati da un nuovo URL JSON (o dallo stesso URL originale se json è omesso), opzionalmente con nuove colonne o dati inline.

`detail: { json?: string, data?: Array, cols?: Array }`

Esempio – reload stesso URL:

```javascript
document.dispatchEvent(new CustomEvent('datatable:reload', {
  detail: {}
}));
```

Esempio – nuovo endpoint + nuove colonne:


```javascript
document.dispatchEvent(new CustomEvent('datatable:reload', {
  detail: {
    json: '/api/data-filtered.json',
    cols: [{ _heading: 'Nome', _field: 'name' }]
  }
}));
```

Esempio – dati inline (senza fetch):

```javascript
document.dispatchEvent(new CustomEvent('datatable:reload', {
  detail: {
    data: [{ name: 'Mario', city: 'Roma' }],
    cols: [{ _heading: 'Nome', _field: 'name' }]
  }
}));
```
 

## Targeting – se nella pagina ci sono più istanze di s-datatable


Aggiungere l'attributo `id` al componente e includere `target` nel detail:
 
`<s-datatable id="table-utenti" ...></s-datatable>`
 
```javascript
document.dispatchEvent(new CustomEvent('datatable:search', {
  detail: { term: 'mario', target: 'table-utenti' }
}));
```

Se `target` è assente, l'evento viene raccolto da TUTTE le istanze.

## Esempio parametro `cols`

```javascript
{

  cols: [
    {
      _field         // chiave campo json (anche composta es: `key1.key2`),
      _heading       // testo th
      _title         // testo `title` del `th`
      _renderMode    // preset rendering predefiniti
      _renderTpl     // stringa mustache-like per la composizione della cella (chiavi indicate forma `[[chiave]]`)
      type           // parametri simple-datatable (senza `_`)
      searchable     // ...
      sortable       // ...
      // ...
    }
  ]
}
