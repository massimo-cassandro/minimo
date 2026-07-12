# TODO — @massimo-cassandro/minimo

Riferimento centralizzato dei prossimi interventi. Le dir con prefisso `TODO ` in `src/` indicano codice già spostato da `_wrk/` in attesa di integrazione.

Numerazione progressiva (`N`, `N.N`, `N.N.N`...) per riferimento rapido ai singoli punti.

---

## 1. da completare / rivedere

- [ ] **1.2.** aggiungre dir dev-tools (anche in files di package-json) e aggiungere `dev-updater`, `create-favicons` e `svg-tools`
- [ ] **1.3.** `src/components/TODO form-multiselect/`
- [ ] **1.4.** `src/web-components/TODO json-table/`
- [ ] **1.5.** `src/components/TODO vanilla-cookie-consent/`
- [ ] **1.6.** `src/components/autocomplete/`
  - **1.6.1.** **Problema con domBuilder callback:** al momento della chiamata il campo non è ancora attaccato al document — e autoComplete.js lo cerca con document.querySelector. In dom-builder.js:177 i children vengono costruiti (e i loro callback eseguiti, riga 199) prima che l'elemento radice del blocco venga appeso a params.root (riga 194 della chiamata esterna). Quindi quando scatta il callback su #ac-dest, l'input esiste ma vive in un sottoalbero staccato dal documento. Il TODO a dom-builder.js:198 accenna proprio ai limiti di timing dei callback. autocompleteEngine non passa l'elemento ad autoComplete.js, ma un selettore stringa: selector: '#' + params.autocomplete_field.id (autocomplete-engine.js:178). In autoComplete.js, select() fa document.querySelector(selector) → restituisce null perché l'elemento non è nel documento. Poi create(this.input, {'aria-controls': …}) esegue key in el su null → ecco il TypeError: Cannot use 'in' operator to search for 'aria-controls' in null.
  - **1.6.2.** Risolvibile spostando la chiamata ad autocomplete dopo l'esexuione di dombuilder
  - **1.6.3.** **Fix strutturale nel pacchetto autocomplete:** autoComplete.js accetta anche una funzione come selector (e come resultsList.destination): in autocomplete-engine.js potresti usare selector: () => params.autocomplete_field e destination: () => params.autocomplete_field, rendendo l'engine indipendente dal fatto che il campo sia già nel DOM. È una modifica al pacchetto @massimo-cassandro/autocomplete, quindi va fatta lì e ripubblicata — ma risolverebbe il problema per tutti i casi d'uso con domBuilder.
  - **1.6.4.** prevedere possibilità utilizzo anche senza framework minimo
  - **1.6.5.** Valutare autocomplete indipendente
- [ ] **1.7.** `src/components/modal-alert/` unificare con `_wrk/popup-page`?
- [ ] **1.8.** `src/components/unsplash-page/` (eliminare breakpoints, usare sizes, vedi ict) controllora corretto uso parametro `fm` imgix (non `fmt`)
- [ ] **1.9.** `src/components/snackbar/`
- [ ] **1.10.** includere e riscrivere `js-file-uploader` come web-component
- [ ] **1.11.** includere anche stylelint ed eslint config??
- [ ] **1.12.** includere e successivamente archiviare `auto-datatables-bs5` e `ckeditor-utilities`
- [ ] **1.13.** Includere layout-tools? è adattabile a minimo?
- [ ] **1.14.** starter kit: prevedere merge tra package json esistente e tpl, se chiavi esistono già, aggiungerle con `_` in modo di non sovrascrivere nulla
- [ ] **1.15.** nuovo componente che combini la parte di gestione del submit del form in un unico componente. Da valutare. In caso positivo valutare se marcare come @deprecated le vecchie funzioni, ma manternerle per compatubilità (in una nuova dir `deprecated`?) (vedi commento in validation-error-class). Considerare che `disableBtnsOnSubmit` ha senso in tutte le situazioni in cui non sia necessario un listener submit ad hoc

## 2. da completare quando necessario

- **2.1.** Charts (vedi anche `_wrk/charts`)

## 3. completare e sistemare

- [ ] **3.1.** Aggiungere `@tarekraafat/autocomplete.js` a `peerDependenciesMeta` come opzionale
- [ ] **3.3.** css: `visibility.css:21` — da rivedere
- [ ] **3.4.** css: `alerts.css:75` — links da completare
- [ ] **3.5.** css: `grid.css` — unificare regole comuni con `flex.css`
- [ ] **3.6.** css: `anchors.css` — rivedere e completare; sostituire colori con custom props specifiche
- [ ] **3.7.** css: `table.css:10` — aggiungere opzione alternate row color
- [ ] **3.8.** css: `text.css:7` — rivedere
- [ ] **3.9.** css: `margin-padding.css` — generare utilities in automatico; anche versione con naming Bootstrap
- [ ] **3.10.** css: `forms/fieldset.css:2` — da verificare
- [ ] **3.11.** css: `forms/forms.css` — separare file; radio/checkbox groups; multiselect; `.form-grid`; customizable select; form-check come flex
- [ ] **3.12.** css: `buttons/status-buttons.css` — rivedere tutto
- [ ] **3.13.** css: `buttons/buttons.css` — dividere per variante; button solo-icona da completare o eliminare
- [ ] **3.14.** css: `buttons/btn-close.css:6` — controllare allineamento `×` interna
- [ ] **3.15.** `dom-builder/dom-builder.js:4-5` — sintassi stringa multi-riga e nidificazione con indent
- [ ] **3.16.** `dom-builder/dom-builder.js:169` — callback con azioni su children potrebbero non essere eseguiti in assenza di parent
- [ ] **3.17.** design tokens: `btn-color-themes.minimo.tokens.mjs` — aggiungere temi `neutral` e `accent`
- [ ] **3.18.** design tokens: `form.minimo.tokens.mjs:292` — importazione automatica SVG (problemi con svgo)
- [ ] **3.19.** unsplash page: Aggiungere `blurhash` come `peerDependency` opzionale (cfr. `_wrk/TODO.md`)
- [ ] **3.20.** capire come organizzare la dir snippet-and-utilities, recupero di quanto utile da `_wrk/__snippets`
- [ ] **3.21.** completare readme
- [ ] **3.22.** docs -> build with jsDoc
- [ ] **3.23.** spinner vedi anche `_wrk/spinner`
- [ ] **3.24.** `_wrk/create-blurhash-canvas.js`
- [ ] **3.25.** `_wrk/img-viewer-dom-builder.js`
- [ ] **3.26.** `_wrk/print-icon.js`
- [ ] **3.27.** `_wrk/alert-autoclose.js`
- [ ] **3.28.** `_wrk/print-icon.js` eliminare???
- [ ] **3.29.** rimozione `_wrk`, spostare autodatatable (anche il repo, da deprecare) in `archived`

## 4. Create favicons

- **4.1.** Rivedere calcolo percorsi
- **4.2.** Rivedere meccanismo parametri cli (fare come svg-icons-tools)
- **4.3.** Opzione calcolo percorso file nello snippet, in base alla sua posizione

## 5. js-file-uplaoder

- **5.1.** rifattorizzare (vedi todo nel repo)
- **5.2.** prevedere possibilità di uso anche senza framework minimo

## 6. Ottimizzazioni

Miglioramenti perfomances e verifica componenti con css per far sì che possano essere usati anche frameowrk diversi da minimo.

Analisi di `src/components` e `src/utilities` (esclusi i sotto-dir con prefisso `TODO ` — `form-multiselect`, `vanilla-cookie-consent` — già tracciati sopra come da integrare, non ancora in uno stato stabile).

### 6.1. Performance

- [ ] **6.1.2.** `utilities/relative-date.js:85` — `new Intl.RelativeTimeFormat('it', ...)` è hardcoded a `'it'` invece di usare `opts.locale` (che invece viene usato correttamente per `toLocaleString`): bug di correttezza oltre che micro-perf (nessun riuso dell'istanza tra chiamate/tick del `setInterval`).
- [ ] **6.1.3.** `utilities/generate-pwd.js:16` — usa `Math.random()` (non crittograficamente sicuro) invece di `crypto.getRandomValues`, a differenza di `utilities/random-id.js` che lo fa correttamente. Trattandosi di generazione password, andrebbe allineato.
- [ ] **6.1.5.** `components/unsplash-page/unsplash-page.js` — costruzione di `<picture>` via `insertAdjacentHTML` con `map().join('')` annidati (7 breakpoint × 3 formati); non è un problema di perf reale (gira una volta per pagina) ma è l'unico componente rimasto che non usa `domBuilder` per costruire markup, disallineato dal resto del framework.
- [ ] **6.1.6.** `components/spinner/spinner.js:11` — ritorna una stringa HTML con classe `.spinner` hardcoded (non passa dal CSS module `styles`), mentre `spinnerWrapper` sì: incoerenza nella stessa funzione tra classi scoped e globali (vedi anche **3.23**).

### 6.2. Compatibilità con framework diversi da minimo (CSS)

Verificato se il CSS dei componenti è utilizzabile senza il resto di minimo. Il discriminante è se le `var(--...)` hanno un **fallback**: se sì, il componente è davvero standalone; se no, richiede comunque che sia caricato `custom-properties.css` (i design token) di minimo, anche senza usarne il resto.

- [ ] **6.2.1.** **Standalone già oggi (var con fallback ovunque, buon riferimento per gli altri):** `modal-alert/modal-alert.css`, `slide-up-down-toggle/slide-up-down-toggle.module.css`, `unsplash-page/unsplash-page.module.css` (quasi completo — due colori hardcoded senza var: `.upContainer` `background-color: #333` e `.unsplashPhotoLink a` colori, righe ~67 e ~241-242: solo un limite di personalizzazione, non di portabilità).
- [ ] **6.2.2.** **Richiedono i design token di minimo (var senza fallback), da decidere se documentare come dipendenza minima o rendere standalone aggiungendo fallback:**
  - **6.2.2.1.** `inner-nav/inner-nav.css` (`--size-lg`, `--size-base`)
  - **6.2.2.2.** `overlay/overlay.css` (`--z-index-overlay`, `--text-color`, `--body-background-color` — senza token l'overlay diventa invisibile ma resta nel DOM, fallimento silenzioso)
  - **6.2.2.3.** `sf-macro/sf-macro.css` (tutte le `--sf-macro-*`)
  - **6.2.2.4.** `modal-popup/modal-popup.module.css` (`--body-background-color`, `--modal-popup-*`, `--size-*`)
  - **6.2.2.5.** `snackbar/snackbar.module.css` (`--size-*`, `--snackbar-*`, `--z-index-snackbar`)
  - **6.2.2.6.** `autocomplete/autocomplete.css` (`--secondary-100`, `--text-muted`, righe 16 e 83 — il resto del file usa colori hardcoded locali, quindi è parzialmente portabile)
  - **6.2.2.7.** `spinner/spinner-circle-basic.css` (`--spinner-size`, `--spinner-color`, `--spinner-stroke-width`)
- [ ] **6.2.3.** `components/autocomplete/autocomplete-engine.js:111` — il markup di default per i badge usa classi Bootstrap (`badge rounded-pill text-bg-secondary`) invece della classe `.badge` di minimo stesso (`src/css/badge.css`): incoerente sia se usato dentro minimo (badge non stilato secondo i suoi token) sia fuori (dipende comunque da Bootstrap non dichiarato). Da allineare a `.badge` di minimo o rendere il default neutro.

### 6.3. Extra — trovati incidentalmente durante l'analisi (non richiesti esplicitamente, ma da valutare)

- [ ] **6.3.1.** Pattern XSS via `innerHTML`/`insertAdjacentHTML` non sanificato su contenuti potenzialmente non fidati, stesso problema già risolto in `dom-builder.js` (v1.11.0, vedi punto **6.1** e sopra "textContent/setHTML"):
  - **6.3.1.1.** `components/autocomplete/autocomplete-engine.js:218` — il messaggio "nessun risultato" reinietta `data.query` (l'input dell'utente) via `innerHTML` senza escape.
  - **6.3.1.2.** `components/autocomplete/autocomplete-engine.js:111,254` — `badges_builder` di default interpola `result_obj.val` senza escape nel markup del badge.
  - **6.3.1.3.** `components/modal-alert/modal-alert.js:102-123` — `params.title` e `params.mes` iniettati via `insertAdjacentHTML` senza sanificazione (il refactor già previsto in modal-alert.js:7 "rewrite using domBuilder" risolverebbe anche questo).
  - **6.3.1.4.** `components/unsplash-page/unsplash-page.js:130-154` — `settings.title`/`text`/`backLink` e diversi campi `photo.*` (dati Unsplash) iniettati via `insertAdjacentHTML` senza escape.
