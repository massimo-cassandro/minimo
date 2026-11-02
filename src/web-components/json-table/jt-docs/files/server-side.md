# Modalità server-side

[↰ Indice](../json-table-docs.md)

Con `serverSide: true` il componente non elabora i dati in locale: a ogni cambio pagina,
ordinamento o ricerca invia una nuova richiesta GET a `jsonUrl`, aggiungendo alla query string i
parametri definiti in `serverParams` (quelli già presenti in `jsonUrl` vengono conservati):

```javascript
serverParams: {
  page: 'page',        // pagina richiesta (da 1)
  start: 'start',      // indice (da 0) del primo record richiesto = (page - 1) * perPage,
                       // comodo per `LIMIT start, perPage`
  perPage: 'perPage',  // record per pagina
  sort: 'sort',        // chiave della colonna ordinata, o i suoi `sortKeys` (omesso senza ordinamento)
  dir: 'dir',          // 'asc' | 'desc' (omesso senza ordinamento)
  search: 'search',    // termine di ricerca (omesso se vuoto)
  searchFields: 'searchFields' // campi su cui cercare (omesso senza termine di ricerca)
}
```

Un valore `null` omette il parametro (es. `serverParams: { start: null }` per inviare solo `page`).
Richiesta di esempio, seconda pagina ordinata per nome con ricerca attiva:

```
GET /api/rows.json?page=2&start=25&perPage=25&sort=name&dir=desc&search=mar&searchFields=name,city
```

Il JSON di risposta deve contenere le **sole righe della pagina richiesta** in `jsonDataField`,
il totale dei record in `totRecField` e il numero di record che soddisfano la ricerca in
`filteredRecField` (se assente vale il totale):

```json
{ "data": [ ...25 righe... ], "totRec": 1500, "filteredRec": 40 }
```

Durante la richiesta il contenitore principale ha `aria-busy="true"` (la tabella viene resa
semitrasparente); le risposte superate da una richiesta più recente vengono ignorate. Se la
pagina richiesta non esiste più (il set di dati si è ridotto), viene richiesta l'ultima
disponibile. In questa modalità `data`, `filtered` e `pageRows` dello stato contengono solo la
pagina corrente e il `tfoot` non è disponibile. `serverSide` richiede `jsonUrl`: con `data` inline
viene ignorato con un avviso in console.

### Ordinamento e ricerca

`sortValue` e `searchValue` non hanno effetto in questa modalità. Per indicare al server i campi da usare sono disponibili `searchFields`, `searchKeys` e `sortKeys`: vedi [Ricerca e ordinamento](ricerca-ordinamento.md).

### Modalità jQuery DataTables

Con `jqDatatableMode: true` (o l'attributo `jqdatatablemode="true"`) i default dei parametri server-side diventano quelli del formato di jQuery DataTables, utile per riutilizzare endpoint già esistenti:

| Parametro | Default con `jqDatatableMode` |
|---|---|
| `filteredRecField` | `'recordsFiltered'` |
| `jsonDataField` | `'data'` |
| `serverParams` | `{ page: null, start: 'start', perPage: 'length', sort: 'order[0][column]', dir: 'order[0][dir]', search: 'search[value]' }` |
| `serverSide` | `true` |
| `totRecField` | `'recordsTotal'` |

Precedenza: `init()` > attributo HTML > `JsonTable.setDefaults()` > modalità jQuery DataTables > default predefiniti. Ogni parametro può quindi essere sovrascritto singolarmente, e `serverParams` viene unito chiave per chiave.

Oltre ai `serverParams`, in questa modalità vengono inviati anche `draw=1` e, per ogni colonna visualizzata, `columns[i][name]` (la `key`), `columns[i][searchable]` e `columns[i][orderable]`. `order[0][column]` riceve l'**indice** della colonna ordinata (tra quelle visualizzate), non la chiave. È previsto un solo criterio di ordinamento (`order[0]`).

Questa modalità è mantenuta solo per compatibilità: `sortKeys`, `searchKeys` e `searchFields` non sono disponibili e vengono ignorati con un avviso in console.

```html
<json-table jsonurl="/api/rows" jqdatatablemode="true" cols='[{"key":"id"},{"key":"name"}]'></json-table>
```

```
GET /api/rows?draw=1&columns[0][name]=id&columns[0][searchable]=true&columns[0][orderable]=true&columns[1][name]=name&…&start=25&length=25&order[0][column]=1&order[0][dir]=desc&search[value]=mar
```

[↰ Indice](../json-table-docs.md)
