# step 3 — riepilogo interventi (15/9/2026)

Risposta punto per punto a [step3.md](step3.md). Verifiche eseguite: type check con TypeScript 5.9
(`npm run checkJS`) e 7 (`npx -y -p typescript@latest tsc --noEmit -p jsconfig.json`), ESLint,
Stylelint, `npm test`, build di produzione della demo (in una cartella temporanea: `demo/build` è
tracciata in git) e rendering della pagina demo in Chrome headless (in console solo gli errori
attesi della sezione "Gestione errori" e l'avviso sul tfoot server-side). Nessun commit.

Le scelte marcate **[da confermare]** sono mie proposte, riportate anche nel TODO.md di root
(sezione JSON-TABLE).

## 1. Meccanismo di paginazione del JSON (IMPORTANTE)

`jsonMaxLength`/`jsonPaginationParams` sono stati sostituiti da due modalità distinte **[da confermare]**:

* **client-side** (default): tutti i dati in memoria (`data` o `jsonUrl`), `perPage` righe per pagina
  (default 25, `0` = nessuna paginazione), `paginationDelta` pulsanti per lato (default 2).
  Ordinamento, ricerca e tfoot lavorano sull'intero set.
* **server-side** (`serverSide: true`, richiede `jsonUrl`): una pagina per richiesta. Ogni cambio
  pagina/ordinamento/ricerca invia una GET a `jsonUrl` con i parametri di query string definiti in
  `serverParams` (default `{ page, start, perPage, sort, dir, search }`; `null` omette un parametro;
  `sort`/`dir` solo con ordinamento attivo, `search` solo se non vuoto; la query string già presente
  in `jsonUrl` è conservata). Esempio:
  `GET /api/rows.json?page=2&start=25&perPage=25&sort=name&dir=desc&search=mar`.
  Il JSON restituisce le sole righe della pagina in `jsonDataField`, il totale in `totRecField` e il
  numero di record che soddisfano la ricerca nel nuovo `filteredRecField` (default `filteredRec`;
  se assente vale il totale).

Motivazione: con chunk = pagina il problema del "cambio set a metà pagina" non esiste, e non c'è
da decidere tra aggiungere/sostituire il set. Con chunk più grandi della pagina ordinamento e
ricerca dovrebbero comunque passare dal server e invalidare il chunk: il risparmio sarebbe solo
sulla navigazione tra pagine adiacenti. Se in futuro servisse, si può aggiungere un `fetchSize`
(chunk di più pagine) senza cambiare l'API.

Dettagli: durante la richiesta il wrapper ha `aria-busy="true"` (tabella semitrasparente,
`--jt-busy-opacity`); le risposte superate da una richiesta più recente o da `reload()`/`destroy()`
vengono ignorate; se la pagina richiesta non esiste più viene richiesta l'ultima disponibile.
Aggiunto anche `initialSort: { key, dir }` (ordinamento al caricamento, inviato al server alla
prima richiesta) e `searchDebounce` (default 300 ms).

Stato (`el.state`): `totRec`, `filteredRec`, `rows`, `filtered`, `pageRows`, `searchTerm`,
`sort`, `page`, `totPages`. In server-side `rows`/`filtered`/`pageRows` contengono la sola pagina.

## 2. Posizione caption

Caption **sotto la tabella a sinistra**, navigazione pagine a destra, nella nuova barra
`tableFooter` (flex, `space-between`). La caption non è un `<caption>` **[da confermare]**: un
`<caption>` sta dentro la tabella e, se contenesse il `<nav>`, gli screen reader leggerebbero i
pulsanti come nome della tabella. È un `div` con id (`<tableId>-caption` o `jt-N-caption`) collegato
alla tabella con `aria-labelledby`: il nome accessibile è lo stesso. Nuovi slot `caption` e
`pagination` nel `template`: se collocati esplicitamente altrove vengono tolti dalla barra, che
sparisce se resta vuota. Nuove classi consumer `classes.tableFooter`, `classes.caption`,
`classes.pagination`, `classes.paginationBtn` (default `btn-reset`).

## 3. Demo 4 (colonne automatiche) rimossa, `cols` obbligatorio

`parseCols` non genera più colonne dal primo record: `cols` assente o vuoto lancia
`[json-table] parametro cols mancante o vuoto…`, l'errore va in console e la tabella non viene
costruita (come per gli altri errori di configurazione). Le colonne vengono ora parsate **prima**
del caricamento dati (serve per validare `initialSort` e comporre la prima richiesta server-side).
Readme e demo aggiornati; nella demo "Gestione errori" c'è un caso con `cols` mancante.

## 4. CSS della demo mescolati

Risolto: in `demo/routes.js` i demo script sono caricati con `import()` dinamico, quindi ogni rotta
ha il proprio chunk JS e CSS (in produzione MiniCssExtractPlugin emette un CSS per chunk, in
sviluppo style-loader inietta solo il CSS del chunk caricato). `demo/demo.js` attende la promise
del callback prima di inserire `<h1>` e link Home (altrimenti il link finirebbe sopra il contenuto).
Verificato nella build: il CSS di json-table è in un chunk separato dal CSS globale.

## 5. `perPage` mancante e navigazione pagine

Implementati `perPage` (attributo `perpage` convertito in numero: gli attributi con default
numerico ora vengono parsati), `paginationDelta` e la navigazione:
`nav[aria-label] > ul > li > button[data-page]` con precedente/successivo (icone
`paginationPrevIcon`/`paginationNextIcon`, default `caret-left`/`caret-right`, disabilitati ai
bordi), prima e ultima pagina, `paginationDelta` pagine per lato, puntini per le pagine omesse
(se l'omissione riguarda una sola pagina viene mostrata la pagina), pagina corrente con
`aria-current="page"`. Il `<nav>` è nascosto con una sola pagina. Dopo un click il focus resta sul
pulsante equivalente (o sulla pagina corrente se quello è diventato disabilitato).
Etichette: `labels.paginationAriaLabel`, `prevPage`, `nextPage`, `pageTitle`, `currentPage`
(segnaposto `{page}`). Testo info: nuovi segnaposto `{page}` e `{totPages}`; `{start}`/`{end}`
riflettono la pagina; la funzione `infoText` riceve anche `page, totPages`.

API nuove: `goToPage(page)`, `setSort(key, dir|null)`, `setSearch(term)`; evento `jt:update`
(`detail.reason`: `page` | `sort` | `search`). `reload()` azzera ricerca, ordinamento e pagina
**[da confermare]**.

Ripasso di TODO.md, step2.md e step3.md: `perPage` non era mai stato elencato tra i parametri del
piano (solo citato). Restano fuori, volutamente: `refs` (step 4), `hidden`/`show: false`
(campo solo per la ricerca) e `_collapseKey` di s-datatable (da decidere), popup VSCode sul tag
(richiederebbe HTML custom data), script di migrazione da s-datatable.

## 6. Tipo `JsonTable` per gli script consumer

In `types/global.d.ts` (pubblicato su npm) aggiunti l'alias globale `JsonTable` e
`interface HTMLElementTagNameMap { 'json-table': JsonTable }`: `document.querySelector('json-table')`
e `createElement('json-table')` sono tipizzati senza cast né import. Il consumer deve includere il
file nel proprio jsconfig (`node_modules/@massimo-cassandro/minimo/types/global.d.ts`), come
documentato nel readme. Stessa aggiunta (più l'alias `DomBuilderItem`) in `demo/declarations.d.ts`.
Nel `<callback>` di domBuilder il cast resta necessario (l'elemento è tipizzato `HTMLElement`).

Corretta anche la dichiarazione di `Element.setHTML/getHTML` (da opzionale a obbligatoria) per
compatibilità con le versioni di lib.dom che già le includono (errore TS2386).

## 7. Aggregati nel readme

Aggiunta la tabella degli aggregati `@sum`, `@avg`, `@min`, `@max`, `@count` con la regola di
formattazione (tipo di dato della colonna, `@count` solo con `locale`) e il comportamento con
aggregato sconosciuto. Non esiste un `@svg`: interpretato come refuso di `@avg`.

## 8. Classe `nowrap` non applicata sullo `<span>` del datetime

Causa verificata in Chrome 152 (headless): il sanitizer di `Element.setHTML()` con configurazione
di default rimuove `class`, `id`, `style` e `data-*` (mantiene `title`, `datetime`, ecc.).
Fix: `setHTML(text, { sanitizer: {} })` sia in `content-utils.js` (json-table) sia in
`dom-builder.js`. La configurazione vuota conserva tutti gli attributi non pericolosi; la baseline
di sicurezza resta attiva (verificato: `<script>`, `onclick`, `onerror` e `href="javascript:"`
vengono comunque rimossi). L'intervento su domBuilder è fuori da json-table ma ha la stessa causa:
senza di esso qualunque stringa HTML con classi passata a `content` (caption, titoli di colonna,
contenuti di snackbar ecc.) perdeva le classi. Il test esistente di domBuilder continua a passare.
Da verificare in Firefox/Safari quando supporteranno l'API (annotato nel TODO.md).
Il pattern di rendering è rimasto quello modificato dall'utente
(`<time datetime><span class="[nowrap]">data</span> <small>ora</small></time>`), documentato nel readme.

## 9. TODO su sfTime/sfDatetime

Ignorato come richiesto, resta nel codice (segnalato tra i punti aperti in TODO.md).

## 10. Errori TS in data-types.js

Con TypeScript 5.9 (`npm run checkJS`) non c'erano errori; compaiono con **TypeScript 7**, che è
verosimilmente quello in uso in VSCode. Due cause:
* il typedef di `dom-builder.js` usava la sintassi Closure `function(HTMLElement|Text): void` per
  `callback`, non più parsata da TS 7: la proprietà spariva dal tipo `DomBuilderItem` e generava
  decine di errori a cascata in json-table (`callback` sconosciuto, `el` implicitamente `any`).
  Corretta in `((el: HTMLElement|Text) => void)`. Lo stesso problema resta in
  `src/utilities/dom-builder-helpers/form-tags.js` e `TODO table-tag.js` (annotato nel TODO.md);
* le proprietà di `JsonTableParams` erano tutte opzionali (`[classes]` ecc.) mentre i parametri
  risolti hanno sempre un valore: ora sono obbligatorie, `Partial<JsonTableParams>` resta per
  `init()`/`setDefaults()`. Sistemati anche `getNestedValue`, `update-info.js`, `TemplateItem`
  (ora unione tra item domBuilder e `{ slot }`) e `ColRender` (può restituire `void`).

Risultato: zero errori su json-table con TS 5.9 e TS 7 (root e demo).

## 11. Ordinamento colonne

Implementato. Pulsante nel `th` con ciclo nessuno → asc → desc → nessuno, un solo ordinamento
attivo, `aria-sort` e icona sulla colonna ordinata, `title`/`aria-label` che descrivono il click
successivo; il thead non viene ricostruito, quindi il focus resta sul pulsante. Il cambio di
ordinamento riporta alla prima pagina. Lato client: confronto sui `sortValues` precalcolati, stabile,
vuoti (`null`, `''`, `NaN`) sempre in coda in entrambe le direzioni, numeri e stringhe numeriche
confrontati numericamente, il resto con `localeCompare(locale, { numeric: true, sensitivity: 'base' })`.
Lato server: parametri `sort` (chiave colonna) e `dir` (`asc`/`desc`) nella richiesta.

Implementata anche la **ricerca**, prevista dal piano per lo step 3: listener sull'input con
debounce, ogni parola del termine deve essere contenuta nel `searchText` della riga (case-insensitive),
ritorno alla prima pagina; lato server parametro `search`.

## 12. CSS

Solo l'essenziale: barra footer (flex), lista pulsanti paginazione (bordi, raggio, stato corrente,
hover, disabilitato), stato `aria-busy`. Nuovi token `--jt-table-footer-*`, `--jt-caption-*`,
`--jt-pagination-*`, `--jt-busy-opacity` in `json-table.minimo.tokens.mjs` (riferiti a token
generici di minimo: `table.*`, `radius.xxs`, `font.size.sm`, `text.muted`);
`src/custom-properties.css` rigenerato con `npm run build-tokens`.

## 13. tfoot solo con dati non paginati (IMPORTANTE)

Interpretato come "non paginati **dal server**": con `serverSide: true` `tfoot` viene ignorato con
avviso in console (`_validateParams`), perché gli aggregati sarebbero calcolati sulla sola pagina.
Con la paginazione client-side il tfoot resta disponibile (`updateFooterOnPageChange` decide se
totale o subtotale di pagina). Da confermare se invece si intendeva escluderlo anche in quel caso.

## Altro

* `serverSide` con `data` inline (o senza `jsonUrl`) viene ignorato con avviso; `perPage` e
  `paginationDelta` non validi ricadono sul default.
* Demo (`demo/demo-files/json-table/json-table-demo.js`): 1) attributi HTML con `perpage="5"` e
  `initialsort`; 2) `jsonUrl` con `perPage: 0`; 3) template con ricerca e paginazione sopra la tabella,
  150 record, subtotali di pagina, pulsanti per `goToPage`/`setSort`/`setSearch`; 4) server-side su
  `/demo-api/json-table`, endpoint simulato dal middleware del devServer
  `demo/webpack-modules/json-table-dev-api.mjs` (circa 1.000 record, ritardo 300 ms, solo in
  sviluppo); 5) errori.
* `demo/webpack.config.mjs`: aggiunto `setupMiddlewares` per il middleware.
* Readme riscritto senza note di stato intermedio.
* Nuovi moduli: `src/sorting.js`, `src/search.js`, `src/pagination.js`.
* TODO.md di root: sezione JSON-TABLE aggiornata con scelte da confermare e punti aperti.

## File toccati fuori da json-table

| File | Motivo |
|---|---|
| `src/utilities/dom-builder/dom-builder.js` | typedef `callback` (TS 7) e `setHTML(content, { sanitizer: {} })` |
| `types/global.d.ts` | alias `JsonTable`, `HTMLElementTagNameMap`, `setHTML/getHTML` obbligatori |
| `demo/declarations.d.ts` | idem per la demo, più alias `DomBuilderItem` |
| `demo/routes.js`, `demo/demo.js` | import dinamici per rotta |
| `demo/webpack.config.mjs`, `demo/webpack-modules/json-table-dev-api.mjs` | endpoint server-side simulato |
| `src/custom-properties.css`, `design-tokens/jsonc-build/json-table.minimo.tokens.jsonc` | rigenerati da `build-tokens` |
| `TODO.md` | sezione JSON-TABLE |
