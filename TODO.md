# TODO — @massimo-cassandro/minimo

Riferimento centralizzato dei prossimi interventi. Le dir con prefisso `TODO ` in `src/` indicano codice già spostato da `_wrk/` in attesa di integrazione.

---

## da completare / rivedere

* [x] `src/components/slide-up-down-toggle/`
* [ ] `src/components/TODO form-multiselect/`
* [ ] `src/web-components/TODO json-table/`
* [ ] `src/components/TODO vanilla-cookie-consent/`
* [ ] `src/components/autocomplete/`
* [ ] `src/components/modal-alert/` unificare con `_wrk/popup-page`?
* [ ] `src/components/unsplash-page/`
* [ ] `src/components/snackbar/`


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
- [ ] `dom-builder/parseDomString.js:40` — **FIX**: non funziona con `<TAG>.<CLASSE>#<ID>` (l'id deve precedere le classi)
- [ ] `dom-builder/dom-builder.js:4-5` — sintassi stringa multi-riga e nidificazione con indent
- [ ] `dom-builder/dom-builder.js:169` — callback con azioni su children potrebbero non essere eseguiti in assenza di parent
- [ ] design tokens: `btn-color-themes.minimo.tokens.mjs` — aggiungere temi `neutral` e `accent`
- [ ] design tokens: `form.minimo.tokens.mjs:292` — importazione automatica SVG (problemi con svgo)
- [ ] unsplash page: Aggiungere `blurhash` come `peerDependency` opzionale (cfr. `_wrk/TODO.md`)
- [ ] capire come organizzare la dir snippet-and-utilities, recupero di quanto utile da `_wrk/__snippets`
- [ ] completare readme
- [ ] docs
- [ ] spinner vedi anche `_wrk/spinner`
- [ ] `_wrk/create-blurhash-canvas.js`
- [ ] `_wrk/img-viewer-dom-builder.js`
- [ ] `_wrk/print-icon.js`
- [ ] `_wrk/alert-autoclose.js`
- [ ] `_wrk/print-icon.js` eliminare???
- [ ] rimozione `_wrk`, spostare autodatatable (anche il repo, da deprecare) in `archived`
