# Tabelle con `rowspan`

[↰ Indice](../json-table-docs.md)

Con `rowspan` un record occupa più `<tr>`: è il caso tipico di un record con un subarray, come un ordine con i suoi articoli. Le regole del parametro sono in [Parametri colonne](parametri-colonne.md#rowspan), questa pagina raccoglie gli accorgimenti da adottare in fase di configurazione.

Tutti gli esempi usano questi dati:

```javascript
{
  id: 70,
  cliente: 'Rossi',
  articoli: [
    { codice: 'B20', prezzo: 40 },
    { codice: 'A10', prezzo: 15 }
  ]
}
```

## `subIdx`

`subIdx` è l'indice del `<tr>` all'interno del record, quindi anche dell'elemento del subarray da mostrare in quel `<tr>`.

| Dove | Firma |
|---|---|
| `parse` | `(row, subIdx) => valore` |
| `render` | `(row, tr, td, subIdx) => contenuto` |
| `trCallback` | `(tr, row, params, subIdx) => void` |

Non è disponibile in `rowspan`, `sortValue`, `searchValue`, `sortKeys`, `searchKeys` e `tfootRender`, perché riguardano l'intero record e non un singolo `<tr>`. Nelle colonne con `rowspan` vale sempre 0, perché la cella è una sola.

```javascript
const span = row => row.articoli.length;

cols: [
  { key: 'id', dataType: 'id', rowspan: span },
  { key: 'cliente', rowspan: span },
  { key: 'articoli.codice', title: 'Codice', parse: (row, subIdx) => row.articoli[subIdx]?.codice ?? null },
  { key: 'articoli.prezzo', title: 'Prezzo', dataType: 'euro', parse: (row, subIdx) => row.articoli[subIdx]?.prezzo ?? null }
]
```

Le chiavi annidate non selezionano da sole l'elemento di un array di oggetti: senza `parse` o `render`, `articoli.codice` non produce alcun valore.

## Accorgimenti comuni

- **Subarray vuoti:** un record senza elementi occupa comunque un `<tr>`, con `subIdx` 0. Senza `?.`, `row.articoli[subIdx].codice` lancia un `TypeError`
- **`key` univoche:** due colonne con la stessa `key` si sovrascrivono i valori di ordinamento. Per questo, con più colonne sullo stesso subarray, si usano chiavi distinte come `articoli.codice` e `articoli.prezzo`
- **Paginazione e conteggi:** `perPage`, `totRec` e `filteredRec` contano i record, non i `<tr>`, quindi l'altezza delle pagine può variare
- **Identificare il record:** tutti i `<tr>` di un record hanno lo stesso `data-jt-idx`

## Client-side

Ordinamento, ricerca e aggregati del `tfoot` considerano il subarray solo in parte. Il risultato dipende dalla `key` della colonna:

| `key` della colonna | Ordinamento | Ricerca e aggregati |
|---|---|---|
| Campo array, ad es. `articoli` con `parse` | Primo elemento | Tutti gli elementi |
| Chiave annidata, ad es. `articoli.codice` con `parse` | Primo elemento | **Solo il primo elemento** |

Una chiave annidata non è un array, quindi `parse` viene invocata una sola volta, con `subIdx` 0. Per considerare tutti gli elementi vanno indicati `sortValue` e `searchValue`, che ricevono l'intero record:

```javascript
{
  key: 'articoli.codice',
  parse: (row, subIdx) => row.articoli[subIdx]?.codice ?? null,
  sortValue: row => row.articoli.map(a => a.codice).sort()[0] ?? null, // codice più basso
  searchValue: row => row.articoli.map(a => a.codice).join(' ')
}
```

`sortValue` è unico per entrambe le direzioni: a differenza dell'esempio server-side qui sotto, in ordine decrescente il confronto usa lo stesso valore.

Allo stesso modo, gli aggregati su una chiave annidata vanno calcolati con una funzione `tfootRender`:

```javascript
{
  key: 'articoli.prezzo',
  dataType: 'euro',
  parse: (row, subIdx) => row.articoli[subIdx]?.prezzo ?? null,
  tfootRender: rows => rows.flatMap(row => row.articoli).reduce((tot, a) => tot + a.prezzo, 0)
}
```

## Server-side

Il server ordina e pagina i record prima che il client calcoli i `<tr>`, quindi deve conoscere da solo il criterio da applicare a ogni colonna del subarray.

### Ordinamento

Il client invia `sort=articoli.codice&dir=asc`. Se il server non gestisce quella chiave, l'ordinamento non ha effetto e, in genere, senza alcun errore.

`sortKeys` non può selezionare un elemento del subarray: indica solo il nome del campo inviato al server. Il criterio va quindi scritto sul server. In genere ogni record si ordina in base al suo primo elemento nella direzione richiesta, cioè il minimo in ordine crescente e il massimo in decrescente:

```php
// esempio con Doctrine: `a` è un articolo, `o` l'ordine
$sortFields = array(
  'articoli.codice' => 'a.codice',
  'articoli.prezzo' => 'a.prezzo',
);

if (isset($sortFields[$sort])) {
  $qb
    ->addSelect(sprintf(
      '(SELECT %s(%s) FROM %s a WHERE a.ordine = o) AS HIDDEN articoliSort',
      $direction === 'DESC' ? 'MAX' : 'MIN',
      $sortFields[$sort],
      Articolo::class
    ))
    ->addOrderBy('articoliSort', $direction);
}
```

Va considerato che:

- **La colonna può sembrare fuori sequenza:** l'ordine riguarda i record, e gli elementi di un record restano nell'ordine in cui li restituisce il server. Un ordine con `100` e `900` precede uno con `200`
- **I campi di testo si confrontano in ordine alfabetico:** se contengono numeri, `9` viene dopo `12504126`
- **Le subquery non possono riutilizzare gli alias:** con Doctrine, gli alias devono essere diversi da quelli usati per ricerca e filtri nella stessa query
- **Se il server non può ordinare un campo:** va impostato `sortable: false`

Con `debug` attivo, le colonne ordinabili con `parse` e senza `sortKeys` generano un avviso in console. Se il server gestisce già la `key`, l'avviso si elimina indicandola in `sortKeys`:

```javascript
{ key: 'articoli.codice', parse: (row, subIdx) => row.articoli[subIdx]?.codice ?? null, sortKeys: ['articoli.codice'] }
```

L'avviso riguarda solo `parse`: una colonna che usa soltanto `render` non lo genera, ma ha lo stesso problema.

### Ricerca e filtri

Anche `searchFields` contiene solo nomi di campo. Per i campi del subarray conviene una condizione `EXISTS`, che seleziona il record senza moltiplicarne le righe:

```sql
WHERE EXISTS (SELECT 1 FROM articoli a WHERE a.ordine_id = o.id AND a.codice LIKE :search)
```

Il record trovato viene restituito con tutti i suoi elementi, non solo con quelli che corrispondono alla ricerca: se serve il contrario, va ridotto anche il subarray nella risposta.

### Recupero dei dati

Il subarray non va recuperato con una `JOIN` nella query paginata: ogni elemento diventerebbe una riga, falsando `LIMIT` e conteggi. Conviene paginare i record e recuperare gli elementi con una seconda query, filtrando sugli id della pagina:

```php
$ordini = $qb->setFirstResult($start)->setMaxResults($perPage)->getQuery()->getArrayResult();
$articoli = $this->getArticoli(array_column($ordini, 'id')); // WHERE a.ordine IN (:ids), raggruppati per ordine
```

L'ordine degli elementi nel JSON determina il `subIdx`, quindi va definito esplicitamente nella seconda query.

Il `tfoot` non è disponibile in questa modalità: vedi [Modalità server-side](server-side.md).

[↰ Indice](../json-table-docs.md)
