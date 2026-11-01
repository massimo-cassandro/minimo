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
  searchFields: 'searchFields' // campi di ricerca, solo se definiti con `searchKeys`
}
```

Un valore `null` omette il parametro (es. `serverParams: { start: null }` per inviare solo `page`).
Richiesta di esempio, seconda pagina ordinata per nome con ricerca attiva:

```
GET /api/rows.json?page=2&start=25&perPage=25&sort=name&dir=desc&search=mar
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

### Ordinamento e ricerca su campi diversi dalla `key`

In questa modalità `sortValue` e `searchValue` non hanno effetto e vengono segnalati con un avviso in console: il client ha solo la pagina corrente, quindi l'ordinamento e la ricerca sull'intero set di dati spettano al server. Le alternative sono queste.

**Valori calcolati o condizionali.** La condizione va scritta sul server, esponendo un campo con un nome dedicato. Il caso più semplice è usarlo direttamente come `key`:

```javascript
{
  key: 'nominativo', // campo del JSON: denominazione sociale oppure cognome e nome
  title: 'Nome / Denominazione sociale',
  searchKeys: ['denominazione_sociale', 'nome', 'cognome']
}
```

```
GET /api/clienti?…&sort=nominativo&dir=asc&search=rossi&searchFields=denominazione_sociale,nome,cognome
```

```php
$sortMap = ['nominativo' => "COALESCE(NULLIF(denominazione_sociale, ''), cognome)"];
```

**`sortKeys`.** Sostituisce la `key` nel parametro `sort`, separando le chiavi con una virgola; `dir` vale per tutte. Serve quando la `key` deve restare diversa dal criterio di ordinamento, oppure per ordinare su più campi in sequenza: `sortKeys: ['cognome', 'nome']` invia `sort=cognome,nome`. Più chiavi non equivalgono a un valore condizionale: `ORDER BY denominazione_sociale, cognome` tiene separati i record con e senza denominazione.

**`searchKeys`.** Elenca i campi di ricerca della colonna, anche se non sono visualizzati: è il modo per cercare su campi nascosti. Se almeno una colonna ricercabile lo definisce, insieme a `search` viene inviato `searchFields`, con l'unione senza duplicati dei `searchKeys` e della `key` delle altre colonne ricercabili. Altrimenti `searchFields` non viene inviato e i campi di ricerca sono decisi dal server.

**Sicurezza.** `sort` e `searchFields` arrivano dal client e possono essere modificati da chiunque. Il server deve accettare solo valori presenti in una whitelist e non inserirli mai direttamente nella query, per evitare SQL injection e ricerche su campi riservati.

**Ricerca su più parole.** In modalità client-side ogni termine deve comparire nel testo della riga. Per ottenere lo stesso risultato il server deve dividere il termine di ricerca e cercare ogni parola su tutti i campi: `LIKE '%mario rossi%'` non trova nulla se nome e cognome sono in campi separati.

### Modalità jQuery DataTables

Con `jqDatatableMode: true` (o l'attributo `jqdatatablemode="true"`) i default dei parametri server-side diventano quelli del formato di jQuery DataTables, utile per riutilizzare endpoint già esistenti:

| Parametro | Default con `jqDatatableMode` |
|---|---|
| `filteredRecField` | `'recordsFiltered'` |
| `jsonDataField` | `'data'` |
| `serverParams` | `{ page: null, start: 'start', perPage: 'length', sort: 'order[0][column]', dir: 'order[0][dir]', search: 'search[value]', searchFields: 'searchFields' }` |
| `serverSide` | `true` |
| `totRecField` | `'recordsTotal'` |

Precedenza: `init()` > attributo HTML > `JsonTable.setDefaults()` > modalità jQuery DataTables > default predefiniti. Ogni parametro può quindi essere sovrascritto singolarmente, e `serverParams` viene unito chiave per chiave.

Oltre ai `serverParams`, in questa modalità vengono inviati anche `draw=1` e, per ogni colonna visualizzata, `columns[i][name]` (i `sortKeys` uniti da virgola, se definiti, altrimenti la `key`), `columns[i][searchable]` e `columns[i][orderable]`. `order[0][column]` riceve l'**indice** della colonna ordinata (tra quelle visualizzate), non la chiave. `searchFields` non fa parte del formato di jQuery DataTables e viene inviato con le stesse regole della modalità standard. È previsto un solo criterio di ordinamento (`order[0]`).

```html
<json-table jsonurl="/api/rows" jqdatatablemode="true" cols='[{"key":"id"},{"key":"name"}]'></json-table>
```

```
GET /api/rows?draw=1&columns[0][name]=id&columns[0][searchable]=true&columns[0][orderable]=true&columns[1][name]=name&…&start=25&length=25&order[0][column]=1&order[0][dir]=desc&search[value]=mar
```

[↰ Indice](../json-table-docs.md)
