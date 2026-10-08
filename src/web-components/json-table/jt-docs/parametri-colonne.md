

# Parametri Colonne – `cols`

Parametro **obbligatorio**: array di oggetti, uno per colonna:

```javascript
cols: [
  {
    key,          // string – OBBLIGATORIO: chiave dell'oggetto riga (ammessa la notazione con
                  // punto per valori annidati, es. 'owner.name')
    title,        // contenuto del <th>: testo, HTML, Node, array domBuilder o funzione.
                  // Nelle colonne ordinabili è il testo del pulsante. Default: la chiave
    dataType,     // string – tipo di dato, una delle chiavi di `dataTypes`; `type` è un alias
                  // equivalente. Default: 'string'
    render,       // (row, tr, td) => contenuto | stringa mustache-like – vedi sotto. Default: null
    tfootRender,  // (rows, td) => contenuto | aggregato '@…' | stringa statica – contenuto della
                  // cella del tfoot (solo se `tfoot` è true). null = cella vuota. Default: null
    rowHeading,   // boolean – se true la cella è un'intestazione di riga (th[scope=row]).
                  // Default: false
    searchable,   // boolean – abilita la ricerca sulla colonna. Default: true
    sortable,     // boolean – abilita l'ordinamento sulla colonna. Default: true
    sortValue,    // valore | row => valore – valore usato per l'ordinamento; prevale su quello
                  // del tipo di dato. Default: non impostato (tipo di dato / valore grezzo)
    searchValue,  // idem, per la ricerca. Default: non impostato
    condition,    // boolean | params => boolean – se false la colonna non viene renderizzata.
                  // Default: true
    headerClass,  // string – classi del <th>, in sostituzione di quelle del tipo di dato
    cellClass     // string – classi delle celle body/tfoot, in sostituzione di quelle del tipo.
                  // Se solo una tra `headerClass` e `cellClass` è presente, l'altra assume lo
                  // stesso valore. Default: null (classi del tipo di dato)
  },
  ...
]
```

## `render`

Funzione con argomenti posizionali, tutti facoltativi:

```javascript
render: (row, tr, td) => contenuto
```

- `row` – l'oggetto dati della riga
- `tr` – l'elemento `<tr>` della riga
- `td` – l'elemento della cella (`<td>` o `<th scope="row">`)

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
| `'@sum'` | somma |
| `'@avg'` | media aritmetica |
| `'@min'` | minimo |
| `'@max'` | massimo |
| `'@count'` | numero di valori numerici (formattato con `locale`, senza il tipo di dato) |

Un aggregato non riconosciuto viene segnalato in console e produce una cella vuota. Le celle del
footer ricevono le stesse classi (`cellClass`) delle celle del body.

Il `tfoot` non è disponibile in modalità server-side (il componente riceve solo la pagina
corrente, gli aggregati sarebbero parziali): se richiesto viene ignorato con un avviso in console.
