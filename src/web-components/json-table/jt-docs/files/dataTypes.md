# Tipi di dato – `dataTypes

[↰ Indice](../json-table-docs.md)

```javascript
cols: [
  {
    //...
    dataType: ...  
  },
  {
    //...
    type: ... // alias di dataType
  },
  // ...
]
```

Ogni colonna ha un tipo di dato (`dataType`, default `string`) che ne definisce classi, rendering
e valori di ordinamento/ricerca. Tipi predefiniti:

| Tipo | Descrizione | Classi di default  delle celle |
|---|---|---|
| `string` | valore così com'è | – |
| `num` | numero formattato con `numbersLocaleOpts` | `textEnd numeric nowrap` |
| `id` | id numerico: valore grezzo, allineato a destra, non ricercabile | `textEnd numeric` |
| `perc` | percentuale in scala 0–100, `currPercLocaleOpts` + `%` | `textEnd numeric nowrap` |
| `percDecimal` | percentuale in scala 0–1 (moltiplicata per 100) | `textEnd numeric nowrap` |
| `currency` | formato valuta `Intl` con `currency` | `textEnd numeric nowrap` |
| `euro` | come `currency`, EUR forzato | `textEnd numeric nowrap` |
| `date` | elemento `<time>`, `datesLocaleOpts`; accetta stringhe ISO, timestamp, `Date` e oggetti data Symfony | `textEnd nowrap` |
| `datetime` | come `date`, con la parte ora (`timesLocaleOpts`): `<time><span class="[nowrap]">data</span> <small>ora</small></time>` | `textEnd nowrap` |
| `bool` | icone `boolTrueIcon`/`boolFalseIcon` (accetta anche `1`/`0`, `'true'`/`'false'`); `null` → `renderNullAs`; ordinabile, non ricercabile | stili interni delle icone |
| `boolTrueOnly` | come `bool`, ma mostra solo `boolTrueIcon`: le celle con valore `false` o `null` restano vuote | stili interni delle icone |
| `email` | andate a capo facoltative attorno alla `@` | – |

I tipi numerici applicano `renderNaNAs` ai valori non numerici e `renderZeroAs` (se impostato)
agli zeri. I valori `null`/`undefined` vengono resi come `renderNullAs`, salvo i tipi che definiscono
`nullContent` (tra i predefiniti, `boolTrueOnly`).

### Tipi personalizzati

Il parametro `dataTypes` è unito ai tipi predefiniti: una chiave già esistente sovrascrive solo
le proprietà indicate, una chiave nuova può estendere un tipo esistente con `inheritsFrom`.

```javascript
dataTypes: {
  // modifica solo le classi del tipo predefinito `num`
  num: { cellClass: 'text-end fw-bold' },

  // nuovo tipo basato su `num` (stesse classi, ordinamento, ricerca e gestione NaN/zero)
  km: {
    inheritsFrom: 'num',
    render: (value, row, params) => `${value.toLocaleString(params.locale)} km`
  }
}
```

Proprietà di un tipo di dato (tutte facoltative):

```javascript
{
  headerClass,        // string – classi di default del <th>
  cellClass,          // string – classi di default delle celle
  internalCellClass,  // (value, row, params) => string – classi aggiunte sempre alle celle,
                      // indipendentemente da `cellClass` (usato dal tipo `bool` per le icone)
  render,             // (value, row, params) => contenuto – non invocato per i valori null
  nullContent,        // string – contenuto delle celle con valore null, al posto di `renderNullAs`
                      // (usato dal tipo `boolTrueOnly` per lasciarle vuote)
  sortValue,          // (value, row, params) => valore per l'ordinamento
  searchValue,        // (value, row, params) => stringa per la ricerca
  colDefaults,        // Object – default forzati per le colonne di questo tipo
                      // (es. { sortable: false }), comunque sovrascrivibili nella colonna
  inheritsFrom        // string – solo tipi nuovi: tipo predefinito da estendere
}
```

A differenza del `render` di colonna (`(row, tr, td)`), il `render` del tipo di dato riceve per
primo il **valore** della cella, perché il tipo è generico rispetto al campo.

[↰ Indice](../json-table-docs.md)
