# Ricerca e ordinamento

[↰ Indice](../json-table-docs.md)

I parametri da usare dipendono dalla modalità: in client-side il componente elabora tutti i dati in locale, in server-side riceve solo la pagina corrente e ricerca e ordinamento spettano al server.

| Parametro | Livello | Client-side | Server-side |
|---|---|---|---|
| `searchable` | colonna | sì | sì |
| `sortable` | colonna | sì | sì |
| `searchValue` | colonna | sì | ignorato, con avviso |
| `sortValue` | colonna | sì | ignorato, con avviso |
| `searchFields` | tabella | ignorato, con avviso | sì |
| `searchKeys` | colonna | ignorato, con avviso | sì |
| `sortKeys` | colonna | ignorato, con avviso | sì |

La [modalità jQuery DataTables](server-side.md#modalità-jquery-datatables) è mantenuta solo per compatibilità: `searchFields`, `searchKeys` e `sortKeys` non sono disponibili e vengono ignorati con un avviso.

## Client-side

### Ricerca

Ogni parola del termine di ricerca, senza distinzione tra maiuscole e minuscole, deve comparire nel testo di ricerca della riga. Il testo è composto dai valori delle colonne con `searchable: true`, scelti in quest'ordine:

1. `searchValue` della colonna (valore o funzione `row => valore`)
2. `searchValue` del tipo di dato
3. valore della cella (il risultato di `parse`, se definito, altrimenti il valore grezzo)

Per cercare su un campo non visibile basta includerlo nel `searchValue` di una colonna visibile:

```javascript
{ key: 'nome', searchValue: row => `${row.nome} ${row.codiceInterno}` }
```

Una colonna con `condition: false`, invece, viene eliminata e non partecipa alla ricerca.

### Ordinamento

Il valore di confronto di una colonna con `sortable: true` viene scelto in quest'ordine:

1. `sortValue` della colonna (valore o funzione `row => valore`)
2. `sortValue` del tipo di dato
3. valore della cella (il risultato di `parse`, se definito, altrimenti il valore grezzo)

I valori vuoti (`null`, `''`, `NaN`) vanno sempre in coda, i numeri vengono confrontati numericamente e il resto con `localeCompare`. La funzione può contenere una condizione, perché viene eseguita su tutte le righe:

```javascript
{
  key: 'nominativo',
  sortValue: row => row.personaGiuridica ? row.denominazioneSociale : row.cognome
}
```

## Server-side

Il server riceve solo i nomi dei campi, non i valori calcolati dal client.

### Ricerca

A ogni ricerca vengono inviati il termine e l'elenco dei campi:

```
GET /api/clienti?…&search=rossi&searchFields=codice,citta
```

L'elenco contiene la `key` delle colonne con `searchable: true` e i campi indicati con i parametri descritti di seguito. Il nome del parametro di query si cambia con `serverParams.searchFields`, e `null` lo omette.

#### `searchFields`

È il modo preferibile per indicare i campi di ricerca: si definisce una sola volta per la tabella e aggiunge i campi indicati a quelli delle colonne ricercabili, anche se non sono visualizzati. Sono ammessi i nomi nella forma `tabella.campo`, ma le tabelle devono essere già in join nella query del server.

```javascript
jtable.init({
  serverSide: true,
  searchFields: ['clienti.denominazione_sociale', 'clienti.nome', 'clienti.cognome', 'comuni.nome'],
  cols: [
    { key: 'nominativo', title: 'Nome / Denominazione sociale', searchable: false },
    { key: 'codice' }
  ]
});
```

```
?search=rossi&searchFields=codice,clienti.denominazione_sociale,clienti.nome,clienti.cognome,comuni.nome
```

Un valore diverso da un array di stringhe non vuote viene ignorato con un avviso in console.

**Campi già presenti in `cols`.** Ogni campo viene inviato una sola volta:

| Colonne ricercabili | `searchFields` | Campi inviati | Regola |
|---|---|---|---|
| `cognome` | `['cognome']` | `cognome` | I duplicati vengono eliminati |
| `cognome` | `['clienti.cognome']` | `clienti.cognome` | Prevale il nome con la tabella |
| `nome` | `['clienti.nome', 'comuni.nome']` | `clienti.nome,comuni.nome` | Prevalgono tutti i nomi con la tabella |
| `nome` | `['comuni.nome']` | `comuni.nome` | Va indicato anche `clienti.nome`, se serve |
| nessuna (`cognome` con `searchable: false`) | `['cognome']` | `cognome` | `searchFields` vale anche per le colonne non ricercabili |

Nell'ultimo esempio `searchable: false` esclude la `key` dall'elenco, ma non il campo indicato esplicitamente.

**Quando usare `searchable: false`.** Non sempre la `key` di una colonna è un campo su cui il database può cercare. In questi casi va messo `searchable: false` sulla colonna e il campo reale in `searchFields`:

- alias calcolati, come `nominativo`, che in genere non sono utilizzabili nel `WHERE`
- nomi diversi dal database, come `denominazioneSociale` e `denominazione_sociale`

Nella `key` il punto indica un valore annidato del JSON (`owner.name`), quindi non può indicare una tabella: per i campi presenti in più tabelle si usa `searchFields`.

#### `searchKeys`

Sostituisce la `key` di una singola colonna nell'elenco dei campi, ed è comodo quando i campi dipendono da poche colonne. In genere è preferibile `searchFields`, che raccoglie tutta la configurazione in un solo punto.

```javascript
{ key: 'nominativo', searchKeys: ['denominazione_sociale', 'nome', 'cognome'] }
```

Può essere usato insieme a `searchFields`, ma non ha effetto sulle colonne con `searchable: false`.

### Ordinamento

Al clic sull'intestazione vengono inviati la `key` della colonna e la direzione:

```
GET /api/clienti?…&sort=codice&dir=asc
```

#### `sortKeys`

Sostituisce la `key` nel parametro `sort`, separando le chiavi con una virgola; `dir` vale per tutte. Serve quando la `key` è diversa dal campo da ordinare, oppure per ordinare su più campi in sequenza:

```javascript
{ key: 'cognome', sortKeys: ['clienti.cognome', 'clienti.nome'] }
// → sort=clienti.cognome,clienti.nome
```

#### Valori calcolati o condizionali

Il client non può esprimere una condizione da valutare riga per riga, perché ha solo la pagina corrente: la condizione va scritta sul server, esponendo un campo con un nome dedicato.

```javascript
{
  key: 'nominativo', // campo del JSON: denominazione sociale oppure cognome e nome
  title: 'Nome / Denominazione sociale',
  searchable: false
}
```

```php
$sortMap = ['nominativo' => "COALESCE(NULLIF(denominazione_sociale, ''), cognome)"];
```

Più chiavi in `sortKeys` non equivalgono a un valore condizionale: `ORDER BY denominazione_sociale, cognome` tiene separati i record con e senza denominazione.

Lo stesso vale per [`parse`](parametri-colonne.md#parse): il valore viene calcolato dopo la risposta del server, che ordina in base alla `key` e può ignorarla se non corrisponde a un campo previsto. Il componente non può sapere se il server gestisce la `key`: con `debug` attivo, le colonne ordinabili con `parse` generano quindi un avviso in console, a meno che `sortKeys` non indichi il campo da usare (anche la `key` stessa, se il server la gestisce):

```javascript
{
  key: 'dueDate',
  dataType: 'date',
  parse: row => calcDueDate(row),
  sortKeys: ['due_date'] // oppure sortable: false, se il server non può ordinare questo valore
}
```

### Cosa deve fare il server

**Accettare solo campi previsti.** `sort` e `searchFields` arrivano dal client e possono essere modificati da chiunque, quindi il server deve confrontarli con una whitelist. I nomi di campo non si possono passare come parametri di un prepared statement e finirebbero direttamente nell'SQL. Anche controllandone il formato, una richiesta come `search=abc&searchFields=utenti.password` permetterebbe di dedurre il contenuto di un campo riservato dal valore di `filteredRec`.

La whitelist può essere unica per l'intera query, mentre il client sceglie quali campi usare per ogni tabella:

```php
$allowed = ['clienti.nome', 'clienti.cognome', 'clienti.denominazione_sociale', 'comuni.nome', 'codice'];
$fields = array_intersect(explode(',', $_GET['searchFields'] ?? ''), $allowed);
```

**Cercare ogni parola su tutti i campi.** Per ottenere lo stesso risultato della modalità client-side il server deve dividere il termine di ricerca e cercare ogni parola su tutti i campi: `LIKE '%mario rossi%'` non trova nulla se nome e cognome sono in campi separati.

[↰ Indice](../json-table-docs.md)
