# minimo TODO

Interventi di carattere generale o che riguardano più parti di `src/`. I TODO specifici di un componente o di uno strumento stanno nella rispettiva cartella (`TODO.md`, `TODO-refactoring.md`) o come commento `TODO` nel codice.

---

## Da valutare
  * integrazione con https://github.com/amiryxe/easy-number-separator

## V2
  * vedi TODO con `epic=v2`
  * vedi inclusione eslint-config in [dev-tools/TODO-eslint.md](../dev-tools/TODO-eslint.md) se non già eseguita (stylelint-config già incorporato)
  * aggiungi sezione `breaking changes` nel readme per documentare cosa va aggiornato nel passare da v1 a v2

## CUSTOM PROPERTIES
  * aggiungere prefisso (`mm-`) a tutte le custom properties **generiche/base** di minimo (`--size-*`, `--color-*`, `--radius-*`, `--text-color`, `--body-background-color`, `--z-index-*`, ...), per evitare collisioni con custom properties di progetti che integrano minimo. Non serve invece sui token già namespaced per componente (`--malert-*`, `--sf-macro-*`, `--up-*`, ...), poco a rischio di collisione. Breaking change: in versione 2. Da accompagnare con uno script di migrazione (find/replace sui nomi noti delle custom properties) per i progetti esistenti.

  * fare in modo di aggiungere all'inizio di ogni gruppo di proprietà di un componente un commento con il nome del componente stesso

## MINIMO
  * includere e successivamente archiviare `ckeditor-utilities` (`auto-datatables-bs5` sarà sostituito da json-table + `dt-legacy.js`, vedi [json-table/TODO.md](web-components/json-table/TODO.md))

  * completare readme

  * docs -> build con JSDoc

  * capire come organizzare la dir `snippets`, recupero di quanto utile da `_wrk/__snippets`

  * analisi di `src/components` e `src/utilities` (esclusi i sotto-dir con prefisso `TODO` e `vanilla-cookie-consent`, non ancora in uno stato stabile)

  * inserire info per uso con html-css-class-completion: https://marketplace.visualstudio.com/items?itemName=Zignd.html-css-class-completion

## FORM
  * nuovo componente che combini la gestione del submit del form (`disable-btns-on-submit`, `enable-submit-btns`, `validation-error-class`, `form-reset-submit`) in un unico componente. Da valutare. In caso positivo valutare se marcare come `@deprecated` le vecchie funzioni, ma mantenerle per compatibilità (in una nuova dir `deprecated`?) (vedi commento in `validation-error-class`). Considerare che `disableBtnsOnSubmit` ha senso in tutte le situazioni in cui non sia necessario un listener submit ad hoc

## UTILITIES
  * `utilities/relative-date.js` — `new Intl.RelativeTimeFormat('it', ...)` è hardcoded a `'it'` invece di usare `opts.locale` (che invece viene usato correttamente per `toLocaleString`): bug di correttezza oltre che micro-perf (nessun riuso dell'istanza tra chiamate/tick del `setInterval`)

  * `utilities/generate-pwd.js` — usa `Math.random()` (non crittograficamente sicuro) invece di `crypto.getRandomValues`, a differenza di `utilities/random-id.js` che lo fa correttamente. Trattandosi di generazione password, andrebbe allineato

  * `utilities/dom-builder-helpers/form-tags.js` — usa ancora la sintassi JSDoc `function(...)`, non supportata da TypeScript 7: applicare la stessa correzione già fatta in `dom-builder.js`

## CSS
  * `table.css` — ricontrollare uso custom props, aumentare personalizzazione

  * `forms/form-control.css` — abbreviare prefisso custom props
