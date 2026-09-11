# `<json-table>` – tabelle HTML da dati JSON

> **Work in progress.** In questa fase il componente genera solo la **struttura esterna**
> (sezione info, input di ricerca, wrapper con `<table>` vuota e caption). Colonne (`cols`),
> rendering delle righe, ordinamento, ricerca e paginazione **non sono ancora implementati**.
> Il piano di sviluppo è in `src/web-components/TODO json-table/TODO.md`.

Sostituisce `s-datatable-component`: nessuna dipendenza esterna, custom element
light DOM (`<json-table>`).

## Installazione

Nessuna peer dependency. Basta importare il file del componente (registra il custom element):

```javascript
import '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';
// oppure, se serve la classe (es. per setDefaults):
import { JsonTable } from '@massimo-cassandro/minimo/src/web-components/json-table/json-table-component.js';
```

Il CSS (`json-table-component.module.css`) è importato dal componente stesso; le custom
properties `--jt-*` sono definite in `json-table.minimo.tokens.mjs` e compilate in
`custom-properties.css` da `build-tokens`.

## Utilizzo da markup

```html
<json-table
  jsonurl="/api/rows.json"
  caption="Utenti"
></json-table>

<!-- dati inline (JSON serializzato, utile in contesti SSR: Twig, Blade, ...) -->
<json-table
  data='[{"name":"Mario","city":"Roma"}, ...]'
  search="false"
></json-table>
```

I nomi degli attributi sono case-insensitive (`jsonurl` e `jsonUrl` sono equivalenti).
Gli attributi booleani accettano i formati HTML idiomatici: `search` (presente senza valore),
`search="true"`, `search="1"` → true; `search="false"`, `search="0"` → false.
I valori che iniziano con `[` o `{` vengono interpretati come JSON (un JSON malformato viene
segnalato in console e ignorato).

## Utilizzo da script

```javascript
const el = document.querySelector('json-table');
// oppure: const el = document.createElement('json-table');

el.init({
  jsonUrl: '/api/rows.json',
  caption: 'Utenti'
});

// dati inline al posto di jsonUrl (se presenti entrambi, `data` prevale)
el.init({
  data: [{ name: 'Mario', city: 'Roma' }, ...]
});

// se appena creato, appendere dopo init():
document.body.appendChild(el);
```

### Con `domBuilder`

```javascript
domBuilder([
  {
    tag: 'json-table',
    attrs: { caption: 'Utenti' },
    callback: el => el.init({ jsonUrl: '/api/rows.json' })
  }
], container);
```

## Utilizzo misto – attributi HTML + script

I parametri non inclusi in `init()` vengono letti dall'attributo HTML corrispondente:

```html
<json-table caption="Utenti" search="false"></json-table>
```

```javascript
el.init({ jsonUrl: '/api/rows.json' }); // jsonUrl da script, caption e search da attributo
```

**Ordine di precedenza:** `init()` > attributo HTML > `JsonTable.setDefaults()` > default interno.

Per ignorare esplicitamente un attributo e ricadere sui default, passare `null` nel config:

```javascript
el.init({ jsonUrl: '/api/rows.json', search: null }); // search → default (true)
```

## Default di progetto – `JsonTable.setDefaults()`

Imposta valori validi per tutte le istanze create successivamente, evitando di ripetere gli
stessi parametri. Da invocare una sola volta, in uno script condiviso eseguito prima degli altri.
I valori vengono uniti a quelli impostati in chiamate precedenti.

```javascript
import { JsonTable } from '.../json-table-component.js';

JsonTable.setDefaults({
  searchInputClass: 'form-control form-control-sm',
  tableClass: 'table',
  infoText: (shown, total) => `${shown} di ${total} record`
});

JsonTable.getDefaults();   // default interni + default di progetto
JsonTable.resetDefaults(); // azzera i default di progetto
```

## API dell'istanza

| Metodo | Descrizione |
|---|---|
| `init(config)` | Avvia il componente (prima o dopo l'inserimento nel DOM) |
| `reload(overrides)` | Ricarica i dati e ricostruisce la struttura, con eventuali parametri sovrascritti (`Promise`) |
| `destroy()` | Svuota il componente; `init()` può essere richiamato in seguito |

Proprietà disponibili dopo il caricamento: `params` (parametri risolti), `data` (righe grezze),
`elements` (elementi generati: `wrapper`, `infoOuter`, `info`, `resultInfo`, `searchInput`,
`tableWrapper`, `table`).

```javascript
await el.reload({ jsonUrl: '/api/rows.json?anno=2025' });
await el.reload({ data: [...] });
```

## Evento `jt:ready`

Emesso sull'elemento (con `bubbles`) al termine della costruzione; `event.detail.jsonTable`
è l'istanza. Viene emesso nel microtask successivo, quindi un listener registrato subito dopo
`init()` lo intercetta comunque.

```javascript
el.addEventListener('jt:ready', e => {
  console.log(e.detail.jsonTable.data);
});
el.init({ jsonUrl: '/api/rows.json' });
```

## Parametri

Tutti i parametri sono impostabili sia da attributo HTML che da `init()`. I valori di tipo
funzione (`caption`, `infoText`) solo da `init()`.

```javascript
{
  debug,                  // boolean – log in console di parametri, dati ed elementi generati.
                          // Default: false

  jsonUrl,                // string – URL del JSON da caricare. Ignorato se `data` è presente.
                          // Default: null

  jsonDataField,          // string|null – chiave del JSON che contiene l'array delle righe
                          // (es. 'data' per { data: [...] }); null o '' = la root del JSON è
                          // l'array stesso. Default: 'data'

  data,                   // Array<Object> – righe inline; prevale su `jsonUrl`. Da attributo va
                          // passato come stringa JSON ed è sempre inteso come array delle righe
                          // (`jsonDataField` ignorato). Default: null

  caption,                // string|Function – caption della tabella (testo o HTML), oppure
                          // funzione che restituisce stringa o Node. Default: null

  search,                 // boolean – genera l'input di ricerca. Default: true
  searchInputClass,       // string – classi dell'input di ricerca (sostituisce il default).
                          // Default: 'form-control'
  searchInputTitle,       // string – attributo title dell'input.
                          // Default: 'Filtra record: inserisci un termine per eseguire la ricerca'
  searchInputPlaceholder, // string – placeholder dell'input.
                          // Default: 'Inserisci il termine da cercare'
  searchInputAriaLabel,   // string – aria-label dell'input. Default: 'Filtra risultati'

  tableId,                // string – id del tag <table>. Default: null
  tableWrapperClass,      // string – classi del div che racchiude la tabella (sostituisce il
                          // default). Default: 'table-responsive'
  tableClass,             // string – classi del tag <table> (sostituisce il default).
                          // Default: 'table table-bordered'

  mainWrapperExtraClass,  // string – classi aggiuntive per il contenitore principale
                          // (info + tabella). Default: null
  outerInfoExtraClass,    // string – classi aggiuntive per il contenitore esterno della
                          // sezione info. Default: null
  infoExtraClass,         // string – classi aggiuntive per la sezione info. Default: null

  infoText,               // (shown, total) => string|Node – testo dell'area info (testo,
                          // stringa HTML o Node).
                          // Default: "Visualizzate N righe su M" / "Nessun record"
}
```

I parametri `*ExtraClass` si **aggiungono** alle classi interne di layout; i parametri
`*Class` (`searchInputClass`, `tableWrapperClass`, `tableClass`) **sostituiscono** interamente
il valore di default, ferme restando le eventuali classi interne di layout del componente.

### In sviluppo

`cols`, data-types, `locale` e opzioni di formattazione, icone (booleani e ordinamento),
ordinamento, ricerca, paginazione, `trCallback`, `footerRender`, `refs`: vedi il TODO del componente.

## Struttura generata

```html
<json-table>
  <section class="[wrapper] [mainWrapperExtraClass]">
    <div class="[infoOuter] [outerInfoExtraClass]">
      <div class="[info] [infoExtraClass]">
        <div class="[resultInfo]" aria-live="polite">Visualizzate <strong>N</strong> righe su <strong>M</strong></div>
        <div class="[search]">                       <!-- solo se search: true -->
          <input type="search" class="form-control" ...>
        </div>
      </div>
    </div>
    <div class="table-responsive">                   <!-- tableWrapperClass -->
      <table class="[table] table table-bordered">   <!-- tableClass -->
        <caption>...</caption>                       <!-- solo se caption -->
        <!-- thead / tbody / tfoot: in sviluppo -->
      </table>
    </div>
  </section>
</json-table>
```

Le classi tra parentesi quadre sono quelle interne del CSS module.

## Custom properties CSS

Definite in `json-table.minimo.tokens.mjs` (namespace `--jt-*`):

| Proprietà | Default (token minimo) |
|---|---|
| `--jt-wrapper-margin-block` | `{size.md}` |
| `--jt-info-gap` | `{size.sm}` |
| `--jt-info-font-size` | `{font.size.sm}` |
| `--jt-info-color` | `{text.muted}` |
| `--jt-info-outer-padding-block-end` | `{size.xs}` |
| `--jt-search-max-width` | `20rem` |
