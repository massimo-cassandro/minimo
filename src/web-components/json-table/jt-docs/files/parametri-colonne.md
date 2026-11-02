

# Parametri `cols` (colonne)

[↰ Indice](../json-table-docs.md)

Parametro **obbligatorio**: array di oggetti, uno per colonna:

```javascript
cols: [
  {/* ...col1... */},
  {/* ...col...  */},
]
```

| Key | Tipo | Default | Descrizione |
|---|---|---|---|
| `cellClass` | string | `null` (classi del tipo di dato) | Classi delle celle body/tfoot, in sostituzione di quelle del tipo. Se solo una tra `headerClass` e `cellClass` è presente, l'altra assume lo stesso valore |
| `condition` | boolean o `params => boolean` | `true` | Se `false` la colonna non viene renderizzata |
| `dataType` | string | `'string'` | Tipo di dato, una delle chiavi di `dataTypes`; `type` è un alias equivalente. Vedi [dataTypes](dataTypes.md) |
| `headerClass` | string | `null` (classi del tipo di dato) | Classi del `<th>`, in sostituzione di quelle del tipo di dato |
| `key` | string | – | **OBBLIGATORIO**: chiave dell'oggetto riga (ammessa la notazione con punto per valori annidati, es. `'owner.name'`) |
| `parse` | `(row, subIdx) => valore` | `null` | Preelabora il valore della cella prima del tipo di dato, vedi sotto |
| `render` | `(row, tr, td, subIdx) => contenuto` o stringa mustache-like | `null` | Vedi sotto |
| `rowHeading` | boolean | `false` | Se `true` la cella è un'intestazione di riga (`th[scope=row]`) |
| `rowspan` | number o `row => number` | `null` | Numero di `<tr>` occupati dal record, vedi sotto |
| `searchable` | boolean | `true` | Abilita la ricerca sulla colonna |
| `searchKeys` | array di stringhe | `null` | Solo server-side: campi di ricerca della colonna, al posto di `key`. In genere è preferibile il parametro [`searchFields`](ricerca-ordinamento.md#searchfields) della tabella |
| `searchValue` | valore o `row => valore` | non impostato (tipo di dato / valore grezzo) | Valore usato per la ricerca; prevale su quello del tipo di dato |
| `sortable` | boolean | `true` | Abilita l'ordinamento sulla colonna |
| `sortKeys` | array di stringhe | `null` | Solo server-side: chiavi inviate in `sort` al posto di `key`, vedi [Ricerca e ordinamento](ricerca-ordinamento.md#sortkeys) |
| `sortValue` | valore o `row => valore` | non impostato (tipo di dato / valore grezzo) | Valore usato per l'ordinamento; prevale su quello del tipo di dato |
| `tfootRender` | `(rows, td) => contenuto`, aggregato `'@…'` o stringa statica | `null` | Contenuto della cella del tfoot (solo se `tfoot` è `true`). `null` = cella vuota |
| `title` | testo, HTML, Node, array domBuilder o funzione | la chiave | Contenuto del `<th>`. Nelle colonne ordinabili è il testo del pulsante |


## Ricerca e ordinamento

`sortValue` e `searchValue` agiscono solo in modalità client-side, `sortKeys` e `searchKeys` solo in modalità server-side: nella modalità sbagliata vengono ignorati con un avviso in console. Vedi [Ricerca e ordinamento](ricerca-ordinamento.md).

## `parse`

Preelabora il valore della cella, che viene poi formattato dal tipo di dato della colonna: evita di scrivere un `render` che duplicherebbe la formattazione standard. Riceve l'oggetto dati della riga e `subIdx`, l'indice del `<tr>` all'interno del record (sempre 0 se nessuna colonna usa [`rowspan`](#rowspan)), e restituisce un valore invece del contenuto della cella.

```javascript
// data di scadenza calcolata, formattata dal tipo `date`
{
  key: 'dueDate',
  dataType: 'date',
  parse: row => {
    const date = new Date(row.issueDate);
    date.setDate(date.getDate() + row.paymentDays);
    return date.toISOString();
  }
}
```

- `key` può indicare un campo non presente nei dati: resta l'identificatore della colonna
- `undefined` (nessun `return`) lascia il valore grezzo, mentre `null` viene trattato come un valore nullo (`nullContent` del tipo di dato o `renderNullAs`)
- il valore restituito viene usato anche per ordinamento, ricerca, classi interne del tipo di dato e aggregati del `tfoot`. `sortValue` e `searchValue` della colonna, se definiti, continuano ad avere la precedenza
- la funzione può essere invocata più volte per la stessa cella e non deve quindi avere effetti collaterali; per decorare la cella va usato [`render`](#render)
- `row` non viene modificato: un `render` che restituisce un contenuto prevale su `parse` e riceve i dati originali, così come le stringhe mustache-like
- con [`rowspan`](#rowspan), nelle colonne senza `rowspan` il valore grezzo non viene passato alla funzione: l'elemento corrispondente si ottiene con `subIdx`, ad es. `(row, subIdx) => row.prices[subIdx] * 2`. Ricerca e aggregati invocano la funzione per ogni elemento solo se il campo `key` contiene un array
- in modalità server-side agisce solo sulla visualizzazione: ordinamento e ricerca restano a carico del server, che non conosce il valore calcolato
- non è utilizzabile da attributo HTML, che non può contenere funzioni: un valore diverso da una funzione genera un errore

## `render`

Funzione con argomenti posizionali, tutti facoltativi:

```javascript
render: (row, tr, td, subIdx) => contenuto
```

- `row` – l'oggetto dati della riga
- `tr` – l'elemento `<tr>` della riga
- `td` – l'elemento della cella (`<td>` o `<th scope="row">`)
- `subIdx` – l'indice del `<tr>` all'interno del record (sempre 0 se nessuna colonna usa [`rowspan`](#rowspan))

Il valore restituito è il contenuto della cella: testo, stringa HTML, numero, Node o array
domBuilder. Casi particolari:

- `undefined` (nessun `return`): la cella viene renderizzata dal tipo di dato, come se `render`
  non fosse definito. Utile per decorare soltanto `td`/`tr` (classi, attributi, `title`):

  ```javascript
  render: (row, tr, td) => { if (row.amount < 0) td.classList.add('text-danger'); }
  ```

- `null`: viene mostrato `renderNullAs`

Da attributo HTML (o da script, per i casi semplici) `render` può essere una stringa
mustache-like: ogni segnaposto `[[key]]` viene sostituito con il valore corrispondente della
riga (chiavi annidate ammesse; i valori null diventano `renderNullAs`):

```javascript
render: '<a href="/users/[[id]]">[[owner.name]]</a>'
```

Le stringhe HTML vengono inserite tramite la Sanitizer API (`Element.setHTML`, dove supportata):
script, attributi handler di eventi e URL `javascript:` vengono rimossi, mentre `class`, `id`,
`style` e `data-*` sono conservati.

## `rowspan`

Permette di distribuire un record su più `<tr>`: le colonne con `rowspan` generano una sola cella con l'attributo `rowspan`, nel primo `<tr>` del record, mentre le altre generano una cella per ogni `<tr>`.

```javascript
data: [{ key1: 'aaa', key2: 'bbb', key3: ['riga1', 'riga2', 'riga3'] }],
cols: [
  { key: 'key1', rowspan: row => row.key3.length },
  { key: 'key2', rowspan: row => row.key3.length },
  { key: 'key3' }
]
```

```html
<tr data-jt-idx="0"><td rowspan="3" data-key="key1">aaa</td><td rowspan="3" data-key="key2">bbb</td><td data-key="key3">riga1</td></tr>
<tr data-jt-idx="0"><td data-key="key3">riga2</td></tr>
<tr data-jt-idx="0"><td data-key="key3">riga3</td></tr>
```

Regole:

- almeno una delle colonne visibili deve essere priva di `rowspan`, altrimenti viene lanciato un errore
- il numero di `<tr>` è il valore più alto restituito dalle colonne del record: tutte le celle con `rowspan` assumono questo valore. I valori non numerici o minori di 1 contano come 1
- nelle colonne senza `rowspan`, un valore array fornisce un elemento per ogni `<tr>` (gli elementi mancanti vengono resi come i valori `null`), mentre un valore non array viene ripetuto su ogni `<tr>`
- nelle colonne senza `rowspan` non sono ammesse le stringhe mustache-like per `render`: viene lanciato un errore, perché non possono selezionare l'elemento corrispondente al `<tr>`. Restano ammesse nelle colonne con `rowspan`, che hanno una sola cella
- con gli array di oggetti le chiavi annidate (`items.name`) non selezionano l'elemento: va usata una funzione `render`, dove `subIdx` indica l'elemento del `<tr>` corrente, ad es. `(row, tr, td, subIdx) => row.items[subIdx].name`
- la configurazione da attributo è sconsigliata: non può contenere funzioni, quindi `rowspan` può essere solo un numero fisso, uguale per tutti i record
- ordinamento, paginazione e conteggi operano sui record, non sui `<tr>`. Le colonne con valore array vengono ordinate in base al primo elemento, mentre la ricerca e gli aggregati del `tfoot` li considerano tutti

## `tfootRender`

Con `tfoot: true` ogni colonna produce una cella nel footer, il cui contenuto è dato da
`tfootRender`:

- funzione `(rows, td) => contenuto`, dove `rows` è l'intero set filtrato (oppure i soli record
  della pagina corrente se `updateFooterOnPageChange` è true)
- uno degli aggregati predefiniti (vedi sotto)
- qualsiasi altra stringa: contenuto statico (es. l'etichetta `'Totale'`)
- `null`: cella vuota

Aggregati predefiniti, calcolati sui valori **numerici** della colonna (i valori non numerici
vengono ignorati) e, tranne `@count`, formattati dal tipo di dato della colonna (es. come valuta
per `euro`, con `%` per `perc`):

| Aggregato | Valore |
|---|---|
| `'@avg'` | media aritmetica |
| `'@count'` | numero di valori numerici (formattato con `locale`, senza il tipo di dato) |
| `'@max'` | massimo |
| `'@min'` | minimo |
| `'@sum'` | somma |

Un aggregato non riconosciuto viene segnalato in console e produce una cella vuota. Le celle del
footer ricevono le stesse classi (`cellClass`) delle celle del body.

Il `tfoot` non è disponibile in modalità server-side (il componente riceve solo la pagina
corrente, gli aggregati sarebbero parziali): se richiesto viene ignorato con un avviso in console.

[↰ Indice](../json-table-docs.md)
