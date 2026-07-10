# TODO — @massimo-cassandro/minimo

Riferimento centralizzato dei prossimi interventi. Le dir con prefisso `TODO ` in `src/` indicano codice già spostato da `_wrk/` in attesa di integrazione.

---

## da completare / rivedere

* [x] `src/components/slide-up-down-toggle/`
* [ ] aggiungre dir dev-tools (anche in files di package-json) e aggiungere `dev-updater`, `create-favicons` e `svg-tools`
* [ ] `src/components/TODO form-multiselect/`
* [ ] `src/web-components/TODO json-table/`
* [ ] `src/components/TODO vanilla-cookie-consent/`
* [ ] `src/components/autocomplete/`

****

**problema con domBuilder callback:**
al momento della chiamata il campo non è ancora attaccato al document — e autoComplete.js lo cerca con document.querySelector.
In dom-builder.js:177 i children vengono costruiti (e i loro callback eseguiti, riga 199) prima che l'elemento radice del blocco venga appeso a params.root (riga 194 della chiamata esterna). Quindi quando scatta il callback su #ac-dest, l'input esiste ma vive in un sottoalbero staccato dal documento. Il TODO a dom-builder.js:198 accenna proprio ai limiti di timing dei callback.
autocompleteEngine non passa l'elemento ad autoComplete.js, ma un selettore stringa: selector: '#' + params.autocomplete_field.id (autocomplete-engine.js:178).
In autoComplete.js, select() fa document.querySelector(selector) → restituisce null perché l'elemento non è nel documento. Poi create(this.input, {'aria-controls': …}) esegue key in el su null → ecco il TypeError: Cannot use 'in' operator to search for 'aria-controls' in null.

Risolvibile spostando la chiamata ad autocomplete dopo l'esexuione di dombuilder

**Fix strutturale nel pacchetto autocomplete:**
autoComplete.js accetta anche una funzione come selector (e come resultsList.destination): in autocomplete-engine.js potresti usare selector: () => params.autocomplete_field e destination: () => params.autocomplete_field, rendendo l'engine indipendente dal fatto che il campo sia già nel DOM. È una modifica al pacchetto @massimo-cassandro/autocomplete, quindi va fatta lì e ripubblicata — ma risolverebbe il problema per tutti i casi d'uso con domBuilder.

prevedere possibilità utilizzo anche senza framework minimo

Valutare autocomplete indipendente 

*****

* [ ] `src/components/modal-alert/` unificare con `_wrk/popup-page`?
* [ ] `src/components/unsplash-page/` (eliminare breakpoints, usare sizes, vedi ict) controllora corretto uso parametro `fm` imgix (non `fmt`)
* [ ] `src/components/snackbar/`
* [ ] includere e riscrivere `js-file-uploader` come web-component
* [ ] includere anche stylelint ed eslint config??
* [ ] includere e successivamente archiviare `auto-datatables-bs5` e `ckeditor-utilities`
* [ ] Includere layout-tools? è adattabile a minimo?
* [ ] starter kit: prevedere merge tra package json esistente e tpl, se chiavi esistono già, aggiungerle con `_` in modo di non sovrascrivere nulla
* [ ] nuovo componente che combini la parte di gestione del submit del form in un unico componente. Da valutare. In caso positivo valutare se marcare come @deprecated le vecchie funzioni, ma manternerle per compatubilità (in una nuova dir `deprecated`?) (vedi commento in validation-error-class). Considerare che `disableBtnsOnSubmit` ha senso in tutte le situazioni in cui non sia necessario un listener submit ad hoc

## da completare quando necessario

* Charts (vedi anche `_wrk/charts`)


## completare e sistemare

- [ ] Aggiungere `@tarekraafat/autocomplete.js` a `peerDependenciesMeta` come opzionale
- [x] `jsconfig.json` — abilitare `"checkJs": true` e verificare/aggiungere JSDoc mancanti
- [ ] css: `visibility.css:21` — da rivedere
- [ ] css: `alerts.css:75` — links da completare
- [ ] css: `grid.css` — unificare regole comuni con `flex.css`
- [ ] css: `anchors.css` — rivedere e completare; sostituire colori con custom props specifiche
- [ ] css: `table.css:10` — aggiungere opzione alternate row color
- [ ] css: `text.css:7` — rivedere
- [ ] css: `margin-padding.css` — generare utilities in automatico; anche versione con naming Bootstrap
- [ ] css: `forms/fieldset.css:2` — da verificare
- [ ] css: `forms/forms.css` — separare file; radio/checkbox groups; multiselect; `.form-grid`; customizable select; form-check come flex
- [ ] css: `buttons/status-buttons.css` — rivedere tutto
- [ ] css: `buttons/buttons.css` — dividere per variante; button solo-icona da completare o eliminare
- [ ] css: `buttons/btn-close.css:6` — controllare allineamento `×` interna
- [ ] `dom-builder/dom-builder.js:4-5` — sintassi stringa multi-riga e nidificazione con indent
- [ ] `dom-builder/dom-builder.js:169` — callback con azioni su children potrebbero non essere eseguiti in assenza di parent
- [ ] design tokens: `btn-color-themes.minimo.tokens.mjs` — aggiungere temi `neutral` e `accent`
- [ ] design tokens: `form.minimo.tokens.mjs:292` — importazione automatica SVG (problemi con svgo)
- [ ] unsplash page: Aggiungere `blurhash` come `peerDependency` opzionale (cfr. `_wrk/TODO.md`)
- [ ] capire come organizzare la dir snippet-and-utilities, recupero di quanto utile da `_wrk/__snippets`
- [ ] completare readme
- [ ] docs -> build with jsDoc
- [ ] spinner vedi anche `_wrk/spinner`
- [ ] `_wrk/create-blurhash-canvas.js`
- [ ] `_wrk/img-viewer-dom-builder.js`
- [ ] `_wrk/print-icon.js`
- [ ] `_wrk/alert-autoclose.js`
- [ ] `_wrk/print-icon.js` eliminare???
- [ ] rimozione `_wrk`, spostare autodatatable (anche il repo, da deprecare) in `archived`


## Create favicons
* Rivedere calcolo percorsi
* Rivedere meccanismo parametri cli (fare come svg-icons-tools)
* Opzione calcolo percorso file nello snippet, in base alla sua posizione

## js-file-uplaoder
* rifattorizzare (vedi todo nel repo)
* prevedere possibilità di uso anche senza framework minimo


## Ottimizzazioni
 Miglioramenti perfomances e verifica componenti con css per far sì che possano essere usati anche frameowrk diversi da minimo

 
